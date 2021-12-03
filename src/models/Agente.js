import connect from '../Config/dbConnection';
import Redis from '../Config/Redis'

import Filas from './Filas'
import Cronometro from './Cronometro';
import Mailing from './Mailing';

import moment from 'moment'


class Agente{
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.execute(sql, (err,rows)=>{
                if(err){ 
                    console.error({"errorCode":err.code,"arquivo":"Agente.js:querySync","message":err.message,"stack":err.stack, "sql":sql}) 
                    resolve(false);
                }
                resolve(rows)
            })
        })
    } 
    //Retorna o estado atual do agente
    async statusRamal(empresa,ramal){
        const redis_estadoRamal = await Redis.getter(`${ramal}:estadoRamal`)
       
        if(redis_estadoRamal!==null){
            return redis_estadoRamal
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`mysql`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});
                console.log(`\n ❗  ${empresa} Status Ramal . . . . . . . . . . . . \n`) 
                console.log(empresa,ramal)
                const sql = `SELECT estado, datetime_estado as tempo
                               FROM ${empresa}_dados.user_ramal 
                              WHERE ramal=${ramal}
                              LIMIT 1`  
                console.log(`\n ❗  Query . . . . . . . . . . . .`,sql,` \n`)       
                const rows = await this.querySync(conn,sql)


                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                const horaAtual = moment().format("YYYY-MM-DD HH:mm:ss")
                const estadoAgente = {}
                      estadoAgente['estado']=rows[0].estado
                      estadoAgente['hora']=rows[0].tempo                    
                await Redis.setter(`${ramal}:estadoRamal`,estadoAgente,60)

                resolve(estadoAgente) 
            })
        }) 
    }
    //Muda o status do agente
    async alterarEstadoAgente(empresa,agente,estado,pausa){
        //Removendo caches do redis
        await Redis.delete(`${empresa}:agentesLogados`)
        await Redis.delete(`${agente}:estadoRamal`)
        await Redis.delete(`${empresa}:agentesPorEstado:0`)
        await Redis.delete(`${empresa}:agentesPorEstado:1`)
        await Redis.delete(`${empresa}:agentesPorEstado:2`)
        await Redis.delete(`${empresa}:agentesPorEstado:3`)
        await Redis.delete(`${empresa}:agentesPorEstado:5`)
        await Redis.delete(`${empresa}:agentesPorEstado:6`)
        await Redis.delete(`${empresa}:listarAgentesLogados`)
        await Redis.delete(`${empresa}:agentesFalando`)
        await Redis.delete(`${empresa}:agentesEmPausa`)
        await Redis.delete(`${empresa}:agentesDisponiveis`)
        await Redis.delete(`${empresa}:listarAgentesLogados`)        
        if(estado>0){
            await Redis.setter(`${agente}:logado`,true,90)
        }
        //Lista as filas do agente 
        const filasAgente = await Filas.filasAgente(empresa,agente)
        for(let i=0;i<filasAgente.length;i++){
            //reseta o cache de agentes disponiveis
            await Redis.delete(`${empresa}:agentesDisponiveis:${filasAgente[i].fila}`)
        }
        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});

                //Recuperando estado anterior do agente
                const estadoAnterior = await this.infoEstadoAgente(empresa,agente)
                const horaAtual = moment().format("YYYY-MM-DD HH:mm:ss")
                const estadoAgente={}
               
                

                //zerando cronometro do estado anterior
                let sql
                if(estadoAnterior==2){//Caso o agente venha de uma pausa   
                    //REMOVENDO AGENTE DE PAUSA                
                    sql = `DELETE FROM ${empresa}_dados.agentes_pausados 
                            WHERE ramal='${agente}'`
                    await this.querySync(conn,sql)

                    //Atualiza Log
                    sql = `UPDATE ${empresa}_dados.log_pausas 
                            SET termino=now(), ativa=0 
                            WHERE ramal='${agente}' AND ativa=1`
                    await this.querySync(conn,sql)
                    await Cronometro.saiuDaPausa(empresa,agente)    
                }

                //MUDANDO O STATUS PARA DISPONIVEL
                if(estado==1){//disponibiliza o ramal do agente no asterisk
                    //Remove qualquer chamada anterior presa com o agente
                    this.clearCallsAgent(empresa,agente)           

                    //verifica se o agente tinha solicidado saida do discador em ligacao
                    sql = `SELECT deslogado 
                            FROM ${empresa}_dados.user_ramal 
                            WHERE ramal=${agente}`
                    const user = await this.querySync(conn,sql)

                    let deslogar=0
                    if(user.length>=1){
                        deslogar = user[0].deslogado
                    }

                    //Caso o agente tenha solicitado o logout
                    if(deslogar==1){
                        const poolAsterisk = await connect.pool(empresa,'asterisk')
                        poolAsterisk.getConnection(async (err,connAst)=>{ 
                            //Atualiza o status do agente como indisponivel no asterisk
                            sql = `UPDATE asterisk.queue_members 
                                    SET paused=1 
                                    WHERE membername=${agente}`
                            await this.querySync(connAst,sql) 
                            poolAsterisk.end((err)=>{
                                if(err) console.log('Agente.js 1998', err)
                            })
                        })
                        //Atualizando o novo estado do agente como        
                        sql = `UPDATE ${empresa}_dados.agentes_filas 
                                  SET estado=4, idPausa=0 
                                WHERE ramal=${agente}` 
                        await this.querySync(conn,sql)
                        sql = `UPDATE ${empresa}_dados.user_ramal 
                                  SET estado=4, deslogado=0, datetime_estado=NOW() 
                                WHERE userId=${agente}`
                        await this.querySync(conn,sql)

                        estadoAgente['estado']=4
                        estadoAgente['hora']=horaAtual                    
                        await Redis.setter(`${agente}:estadoRamal`,estadoAgente)

                        Cronometro.pararOciosidade(empresa,agente)
                        pool.end((err)=>{
                            if(err) console.error(err)
                        }) 
                        resolve(false) 
                        return ;
                    }
            
                    //Caso o agente venha de uma pausa dentro da valicadao do novo status 1
                    if(estadoAnterior==2){ //Remove a pausa do agente no asterisk 
                        const poolAsterisk = await connect.pool(empresa,'asterisk')
                        poolAsterisk.getConnection(async (err,connAst)=>{   
                            sql = `UPDATE asterisk.queue_members 
                                      SET paused=0 
                                    WHERE membername=${agente}`
                            await this.querySync(connAst,sql) 
                            poolAsterisk.end((err)=>{
                                if(err) console.log('Agente.js 2028', err )
                            }) 
                        })
                        Cronometro.iniciaOciosidade(empresa,agente)
                    }else{
                        sql = `SELECT idPausa 
                                 FROM ${empresa}_dados.agentes_filas 
                                WHERE ramal=${agente} 
                             ORDER BY idPausa DESC
                                LIMIT 1` 
                        const r = await this.querySync(conn,sql)
                        let statusPausa=0
                        if(r.length==1){
                            statusPausa=r[0].idPausa
                        }

                        //Caso nenhuma pausa tenha sido pré setada
                        if((statusPausa==0)||(statusPausa==null)){//Disponibiliza o agente no ASTERISK
                            const poolAsterisk = await connect.pool(empresa,'asterisk')
                            poolAsterisk.getConnection(async (err,connAst)=>{ 
                                sql = `UPDATE asterisk.queue_members 
                                          SET paused=0 
                                        WHERE membername=${agente}`
                                await this.querySync(connAst,sql) 
                                poolAsterisk.end((err)=>{
                                    if(err) console.log('Agente.js 2053', err )
                                }) 
                            })
                            Cronometro.iniciaOciosidade(empresa,agente)
                        }else{//Caso contrário, pausa o mesmo                         
                            sql = `SELECT * 
                                    FROM ${empresa}_dados.pausas 
                                    WHERE id=${statusPausa}`
                            const infoPausa = await this.querySync(conn,sql)
                            const idPausa = infoPausa[0].id
                            const nomePausa = infoPausa[0].nome
                            const descricaoPausa = infoPausa[0].descricao
                            const tempo = infoPausa[0].tempo
                            const poolAsterisk = await connect.pool(empresa,'asterisk')
                            poolAsterisk.getConnection(async (err,connAst)=>{ 
                                //pausa agente no asterisk
                                sql = `UPDATE asterisk.queue_members 
                                        SET paused=1 
                                        WHERE membername='${agente}'`    
                                await this.querySync(connAst,sql) 
                                poolAsterisk.end((err)=>{
                                    if(err) console.log('Agente.js ...', err )
                                }) 
                            })  
                            let agora = moment().format("HH:mm:ss")
                            let resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                            //insere na lista dos agentes pausados
                            sql = `INSERT INTO ${empresa}_dados.agentes_pausados
                                            (data,ramal,inicio,termino,idPausa,nome,descricao)
                                        VALUES (now(),'${agente}',now(),'${resultado}',${idPausa},'${nomePausa}','${descricaoPausa}')`
                            await this.querySync(conn,sql)
                            agora = moment().format("HH:mm:ss")
                            resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                            sql = `INSERT INTO ${empresa}_dados.log_pausas 
                                            (ramal,idPausa,data,inicio,ativa) 
                                    VALUES ('${agente}',${idPausa},now(),now(),1)`
                            await this.querySync(conn,sql)
                            //Atualizando o novo estado do agente        
                            sql = `UPDATE ${empresa}_dados.agentes_filas 
                                    SET estado=2,
                                        idPausa=${pausa} 
                                    WHERE ramal=${agente}` 
                            await this.querySync(conn,sql)
                            
                            sql = `UPDATE ${empresa}_dados.user_ramal 
                                    SET estado=2, datetime_estado=NOW() 
                                    WHERE userId=${agente}`
                            await this.querySync(conn,sql)

                            estadoAgente['estado']=2
                            estadoAgente['hora']=horaAtual                    
                            await Redis.setter(`${agente}:estadoRamal`,estadoAgente)

                            Cronometro.pararOciosidade(empresa,agente)
                            Cronometro.entrouEmPausa(empresa,idPausa,agente)
                            pool.end((err)=>{
                                if(err) console.error(err)
                            }) 
                            resolve(false) 
                            return 
                        }
                    }           
                }


                if(estado==2){//Caso o agente va para uma pausa
                //Caso o agente solicite uma pausa durante um atendimento (estado 3)
                    if(estadoAnterior==3){
                        //Mantem o estado 3 do agente, porem registra a pausa na fila do agente 
                        sql = `UPDATE ${empresa}_dados.agentes_filas 
                                SET estado=${estadoAnterior}, 
                                    idPausa=${pausa}
                                WHERE ramal=${agente}` 
                        await this.querySync(conn,sql) 

                        sql = `UPDATE ${empresa}_dados.user_ramal
                                SET estado=${estadoAnterior}, datetime_estado=NOW()
                                WHERE userId=${agente}`
                        await this.querySync(conn,sql)
                        
                        estadoAgente['estado']=estadoAnterior
                        estadoAgente['hora']=horaAtual                    
                        await Redis.setter(`${agente}:estadoRamal`,estadoAgente)

                        pool.end((err)=>{
                            if(err) console.error(err)
                        }) 
                        resolve(false)
                        return 
                    }   
                    
                    //Limpa as chamadas presas com o agente caso existam
                    this.clearCallsAgent(empresa,agente)

                    //dados da pausa
                    sql = `SELECT * 
                            FROM ${empresa}_dados.pausas
                            WHERE id=${pausa}`
                    const infoPausa = await this.querySync(conn,sql)
                    const idPausa = infoPausa[0].id
                    const nomePausa = infoPausa[0].nome
                    const descricaoPausa = infoPausa[0].descricao
                    const tempo = infoPausa[0].tempo

                    const poolAsterisk = await connect.pool(empresa,'asterisk')
                    poolAsterisk.getConnection(async (err,connAst)=>{
                        //pausa agente no asterisk
                        sql = `UPDATE asterisk.queue_members 
                                SET paused=1 
                                WHERE membername='${agente}'`    
                        await this.querySync(connAst,sql) 
                        poolAsterisk.end((err)=>{
                            if(err) console.log('Agente.js ...', err )
                        }) 
                    })  

                    let agora = moment().format("HH:mm:ss")
                    let resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                    
                    //insere na lista dos agentes pausados
                    sql = `INSERT INTO ${empresa}_dados.agentes_pausados 
                                    (data,ramal,inicio,termino,idPausa,nome,descricao)
                                VALUES (now(),'${agente}',now(),'${resultado}',${idPausa},'${nomePausa}','${descricaoPausa}')`
                    await this.querySync(conn,sql)
                    agora = moment().format("HH:mm:ss")
                    resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                    sql = `INSERT INTO ${empresa}_dados.log_pausas
                                    (ramal,idPausa,data,inicio,ativa)
                                VALUES ('${agente}',${idPausa},now(),now(),1)`
                    await this.querySync(conn,sql)
                    Cronometro.pararOciosidade(empresa,agente)
                    Cronometro.entrouEmPausa(empresa,idPausa,agente)
                }

                if(estado==3){
                    //Retira o agente do asterisk quando o mesmo esta em ligacao
                    const poolAsterisk = await connect.pool(empresa,'asterisk')
                    poolAsterisk.getConnection(async (err,connAst)=>{
                        sql = `UPDATE asterisk.queue_members
                            SET paused=1 
                            WHERE membername=${agente}`
                            await this.querySync(connAst,sql) 
                        poolAsterisk.end((err)=>{
                           if(err) console.log('Agente.js ...', err )
                        }) 
                    })   
                    Cronometro.pararOciosidade(empresa,agente)
                }

                if(estado==4){
                    const poolAsterisk = await connect.pool(empresa,'asterisk')
                    poolAsterisk.getConnection(async (err,connAst)=>{
                        //teste de remover agente do asterisk quando deslogado
                        sql = `UPDATE asterisk.queue_members
                                SET paused=1 
                                WHERE membername=${agente}`
                        await this.querySync(connAst,sql) 
                        poolAsterisk.end((err)=>{
                            if(err) console.log('Agente.js ...', err )
                        }) 
                    })     
                    if(estadoAnterior==3){
                        //Atualizando o novo estado do agente        
                        sql = `UPDATE ${empresa}_dados.user_ramal 
                                  SET deslogado=1, datetime_estado=NOW() 
                                WHERE ramal=${agente}`
                        await this.querySync(conn,sql)    
                        pool.end((err)=>{
                            if(err) console.error(err)
                        }) 
                        resolve(false)
                        return 
                    }
                    Cronometro.pararOciosidade(empresa,agente)
                    this.clearCallsAgent(empresa,agente)
                }  

                if(estado==5){
                    const poolAsterisk = await connect.pool(empresa,'asterisk')
                    poolAsterisk.getConnection(async (err,connAst)=>{
                        //teste de remover agente do asterisk quando deslogado
                        sql = `UPDATE asterisk.queue_members
                                  SET paused=1 
                                WHERE membername=${agente}`
                        await this.querySync(connAst,sql) 
                        poolAsterisk.end((err)=>{
                            if(err) console.log('Agente.js ...', err )
                        }) 
                    })     
                }

                if(estado==6){
                    const poolAsterisk = await connect.pool(empresa,'asterisk')
                    poolAsterisk.getConnection(async (err,connAst)=>{
                        //teste de remover agente do asterisk quando deslogado
                        sql = `UPDATE asterisk.queue_members
                                SET paused=1 
                                WHERE membername=${agente}`
                        await this.querySync(connAst,sql) 
                        poolAsterisk.end((err)=>{
                            if(err) console.log('Agente.js ...', err )
                        }) 
                    })                    
                }               
                
                //Atualizando o novo estado do agente        
                sql = `UPDATE ${empresa}_dados.agentes_filas 
                        SET estado=${estado}, 
                            idPausa=${pausa} 
                        WHERE ramal=${agente}` 
                await this.querySync(conn,sql)
                sql = `UPDATE ${empresa}_dados.user_ramal 
                        SET estado=${estado}, datetime_estado=NOW() 
                        WHERE userId=${agente}`
                await this.querySync(conn,sql)

                estadoAgente['estado']=estado
                estadoAgente['hora']=horaAtual                    
                await Redis.setter(`${agente}:estadoRamal`,estadoAgente)              

                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true) 
            })
        }) 
    }
    async infoEstadoAgente(empresa,ramal){
        const estadoAgente = await Redis.getter(`${ramal}:estadoRamal`)
        if(estadoAgente!==null){
            return estadoAgente['estado']
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});
                const sql = `SELECT estado 
                               FROM ${empresa}_dados.user_ramal 
                              WHERE ramal='${ramal}'`
                const rows = await this.querySync(conn,sql)
                if(rows.length==0){
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(0) 
                    return
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(rows[0].estado) 
            })
        })         
    }
    //Dados do Agente
    async infoAgente(empresa,ramal){
        const infoAgente = await Redis.getter(`${ramal}:infoAgente`)
        if(infoAgente!==null){
            return infoAgente
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});
                const sql = `SELECT id as ramal, nome 
                               FROM ${empresa}_dados.users 
                              WHERE id=${ramal}`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 

                await Redis.setter(`${ramal}:infoAgente`,rows,240)
                resolve(rows) 
            })
        })              
    }
    //Desliga Chamada
    async desligaChamada(empresa,ramal){
        const atendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if((atendimento===null)||(atendimento.length==0)){
            return false
        }
        atendimento['event_desligada']=1
        await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,atendimento,43200)
        //Para cronometro do atendimento
        await Cronometro.saiuLigacao(empresa,atendimento['id_campanha'],atendimento['numero'],ramal)
        return(atendimento) 
    }




























   
    

    

    

    

    //Retorna o histórico de atendimento do registro
    async historicoRegistro(empresa,idMailing,idReg){
        const historicoRegistro = await Redis.getter(`${empresa}:historicoRegistro:${idReg}:idMailing:${idMailing}`)
        if(historicoRegistro!==null){
            return historicoRegistro
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});
                //Caso o mailing seja 0 sera considerado como um historico de chamada manual
                let sql
                let fNumeros=''
                const historico=[]
                if(idMailing==0){           
                    const numero = idReg
                    fNumeros+=` AND numero_discado LIKE '%${numero}'`
                }else{
                    //recuperando numero 
                    const infoMailing = await Mailing.infoMailing(empresa,idMailing)
                    if(infoMailing.length==0){
                        pool.end((err)=>{
                            if(err) console.error(err)
                        }) 
                        resolve(false) 
                        return false
                    }
                    const tabela = infoMailing[0].tabela_numeros
                    //Listando todos os numeros do historico
                    sql = `SELECT numero 
                                FROM ${empresa}_mailings.${tabela} 
                                WHERE id_registro=${idReg}`
                    const n = await this.querySync(conn,sql)            
                    for(let num=0; num<n.length; num++){
                        fNumeros+=` AND numero_discado='${n[num].numero}'`
                    }
                }
                sql = `SELECT nome_registro,
                            numero_discado,
                            agente,
                            protocolo,
                            DATE_FORMAT (data,'%d/%m/%Y') AS dia,
                            DATE_FORMAT (hora,'%H:%i') AS horario,
                            t.tabulacao,
                            obs_tabulacao,
                            h.contatado,
                            h.produtivo
                        FROM ${empresa}_dados.historico_atendimento AS h 
                    LEFT JOIN ${empresa}_dados.tabulacoes_status AS t ON t.id=h.status_tabulacao 
                        WHERE 1=1 ${fNumeros} 
                    ORDER BY h.id DESC 
                        LIMIT 10`
                const dados = await this.querySync(conn,sql)
                for(let i=0; i<dados.length; i++){      
                    const registro={}
                        registro['dadosAtendimento']={}
                        registro['dadosAtendimento']['protocolo']=dados[i].protocolo
                        registro['dadosAtendimento']['data']=dados[i].dia
                        registro['dadosAtendimento']['hora']=dados[i].horario
                        registro['dadosAtendimento']['contatado']=dados[i].contatado
                        registro['dadosAtendimento']['produtivo']=dados[i].produtivo
                        registro['dadosAtendimento']['tabulacao']=dados[i].tabulacao
                        registro['dadosAtendimento']['observacoes']=dados[i].obs_tabulacao      
                        
                        //console.log('dados do agente',dados[i].agente)
                            
                    const agente = await this.infoAgente(empresa,dados[i].agente)
                            
                        registro['informacoesAtendente']={}
                        registro['informacoesAtendente'] = agente[0]

                        registro['dadosRegistro']={}
                        registro['dadosRegistro']['nome']=dados[i].nome_registro
                        registro['dadosRegistro']['numeroDiscado']=dados[i].numero_discado
                    historico.push(registro)
                }
                  
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:historicoRegistro:${idReg}:idMailing:${idMailing}`,historico,120)
                resolve(historico) 
            })
        })         
    }

    async historicoRegistroChamadaManual(empresa,numero,agente){
        const historicoRegistroChamadaManual = await Redis.getter(`${empresa}:historicoRegistroChamadaManual:${numero}:agente:${agente}`)
        if(historicoRegistroChamadaManual!==null){
            return historicoRegistroChamadaManual
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{     
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT nome_registro,numero_discado,agente,                    
                            DATE_FORMAT (data,'%d/%m/%Y') AS dia,
                            DATE_FORMAT (hora,'%H:%i') AS horario,
                            obs_tabulacao
                        FROM ${empresa}_dados.historico_atendimento AS h 
                    LEFT JOIN ${empresa}_dados.tabulacoes_status AS t ON t.id=h.status_tabulacao 
                        WHERE agente=${agente} AND numero_discado LIKE '%${numero}'
                    ORDER BY h.id DESC 
                        LIMIT 20`
                const dados = await this.querySync(conn,sql)
                if(dados.length==0){
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve([]) 
                    return 
                }
             
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:historicoRegistroChamadaManual:${numero}:agente:${agente}`,dados,120)
                resolve(dados) 
            })
        })          
    }

    //Retorna o histórico de atendimento do agente
    async historicoChamadas(empresa,ramal){
        //Checa se existem chamadas no redis
        let historico = await Redis.getter(`${empresa}:historicoChamadas:${ramal}`)
        if(historico!==null){
            //console.log(`Retornando historico de chamadas do ramal ${ramal} do redis`)
            return historico
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT h.id,
                                    nome_registro,
                                    numero_discado,
                                    agente,
                                    protocolo,
                                    h.tipo,
                                    DATE_FORMAT (data,'%d/%m/%Y') AS dia,
                                    DATE_FORMAT (hora,'%H:%i:%s') AS horario,
                                    h.contatado,
                                    h.produtivo,
                                    t.tabulacao,
                                    obs_tabulacao 
                            FROM ${empresa}_dados.historico_atendimento AS h 
                        LEFT JOIN ${empresa}_dados.tabulacoes_status AS t ON t.id=h.status_tabulacao
                            WHERE agente='${ramal}' 
                        ORDER BY h.id DESC
                            LIMIT 15`
                            
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                await Redis.setter(`${empresa}:historicoChamadas:${ramal}`,rows)
                resolve(rows) 
            })
        })         
    }

    async gravaDadosChamadaManual(empresa,numero,nome,observacoes){        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});
                let sql = `SELECT id 
                             FROM ${empresa}_dados.historico_atendimento 
                            WHERE numero_discado LIKE '%${numero}'
                         ORDER BY id DESC
                            LIMIT 1`
                const h =  await this.querySync(conn,sql)
                if(h.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false)
                    return false
                }
                if(nome!=""){
                    sql = `UPDATE ${empresa}_dados.historico_atendimento  
                            SET nome_registro='${nome}'
                            WHERE id=${h[0].id}`
                    await this.querySync(conn,sql)
                }
                if(observacoes!=""){
                    sql = `UPDATE ${empresa}_dados.historico_atendimento  
                            SET obs_tabulacao='${observacoes}'
                            WHERE id=${h[0].id}`
                    await this.querySync(conn,sql)
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })
    } 

    async voltaRegistro(empresa,idHistorico){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT *
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE id='${idHistorico}'`
                const h = await this.querySync(conn,sql)
                if(h.length==0){
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(true)
                    return true
                }            
                const ramal=h[0].agente
                //verifica se o agente nao esta em atendimento
                const estadoRamal = await this.statusRamal(empresa,ramal)
                const estado = estadoRamal['estado']
                //console.log('ramal',ramal)
                //console.log(estado)
                if(estado==3){
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(false)
                    return false
                }
                //Removendo outras chamadas do agente
                await Redis.delete(`${empresa}:atendimentoAgente:${ramal}`)
                //console.log(h[0].mailing)
                const infoMailing = await Mailing.infoMailing(empresa,h[0].mailing)
                let tabela_dados = ''
                let tabela_numeros = ''
                if(infoMailing.length>0){
                    tabela_dados = infoMailing[0].tabela_dados
                    tabela_numeros = infoMailing[0].tabela_numeros
                }  
                const hoje = moment().format("YYYY-MM-DD")
                const hora = moment().format("HH:mm:ss")
                
                const novaChamada = {}
                      novaChamada['data']=hoje
                      novaChamada['hora']=hora
                      novaChamada['ramal']=ramal
                      novaChamada['protocolo']=h[0].protocolo
                      novaChamada['tipo_ligacao']='discador'
                      novaChamada['tipo_discador']='clicktocall'
                      novaChamada['retorno']=0
                      novaChamada['modo_atendimento']= 'manual'
                      novaChamada['id_campanha']=h[0].campanha
                      novaChamada['id_mailing']=h[0].mailing
                      novaChamada['tabela_dados']=tabela_dados
                      novaChamada['tabela_numeros']=tabela_numeros
                      novaChamada['id_registro']=h[0].id_registro
                      novaChamada['id_numero']=h[0].id_numero
                      novaChamada['numero']=h[0].numero_discado
                      novaChamada['fila']=''
                      novaChamada['event_tabulando']=0
                      novaChamada['event_tabulada']=0
                      novaChamada['event_desligada']=0

                await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,novaChamada,43200)
                await this.alterarEstadoAgente(empresa,ramal,5,0)
                
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true)
            })
        }) 
    }

    

    async clearCallsAgent(empresa,ramal){
        console.log('> > > > CLEAR CALLS AGENTE:',ramal)
        const atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if(atendimentoAgente == null) return false

        const idCampanha = atendimentoAgente['id_campanha']
        const idNumero = atendimentoAgente['id_numero']
        const tabelaNumeros = atendimentoAgente['tabela_numeros']
        const idMailing = atendimentoAgente['id_mailing']
        await Redis.delete(`${empresa}:atendimentoAgente:${ramal}`)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:clearCallsAgent","message":err.message,"stack":err.stack});
                let sql
                //Setando registro como disponivel na tabela de tabulacoes
                sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                        SET estado=0, desc_estado='Disponivel'
                        WHERE idCampanha=${idCampanha} AND idNumero=${idNumero} AND idMailing=${idMailing} AND produtivo <> 1`
                await this.querySync(conn,sql)

                //Atualiza o status do numero como nao discando
                sql = `UPDATE ${empresa}_mailings.${tabelaNumeros} 
                          SET discando=0   
                        WHERE id=${idNumero}`
                await this.querySync(conn,sql)

                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true)
            })
        })       
    }

     //Status de pausa do agente
     async infoPausaAgente(empresa,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT * 
                            FROM ${empresa}_dados.agentes_pausados
                            WHERE ramal='${ramal}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(rows) 
            })
        })         
    } 
    
    async agendandoRetorno(empresa,ramal,campanha,mailing,id_numero,id_registro,numero,data,hora){
        await Redis.delete(`${empresa}:agendaRetornos`)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Agente.js:","message":err.message,"stack":err.stack});        
                const sql = `INSERT INTO ${empresa}_dados.campanhas_agendamentos
                                        (data,ramal,campanha,mailing,id_numero,id_registro,numero,data_retorno,hora_retorno,tratado)
                                VALUES (NOW(),${ramal},${campanha},${mailing},${id_numero},${id_registro},${numero},'${data}','${hora}:00',0)`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(rows) 
            })
        })                
    }
}

export default new Agente();