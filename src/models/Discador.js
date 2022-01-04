import connect from '../Config/dbConnection';
import Asterisk from './Asterisk';
import Campanhas from './Campanhas';
import Agente from './Agente';
import Mailing from './Mailing';
import Cronometro from './Cronometro';
import logs from '../Config/logs';

import moment from 'moment';
import Redis from '../Config/Redis'

//mongo
import mongoose from 'mongoose'
import MailingCampanha from '../database/MailingCampanha'

class Discador{
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.execute(sql, (err,rows)=>{
                if(err){ 
                    console.error({"errorCode":err.code,"arquivo":"Discador.js:querySync","message":err.message,"stack":err.stack, "sql":sql}) 
                    resolve(false);
                }
                resolve(rows)
            })
        })
    } 
    async campanhasAtivasAgente(empresa,agente){
        const campanhasAtivasAgente = await Redis.getter(`${empresa}:campanhasAtivasAgente:${agente}`)
        if((campanhasAtivasAgente)&&(campanhasAtivasAgente.length>0)){
            return campanhasAtivasAgente
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT COUNT(c.id) AS campanhasAtivas
                               FROM ${empresa}_dados.campanhas AS c
                               JOIN ${empresa}_dados.campanhas_filas AS cf ON c.id=cf.idCampanha
                               JOIN ${empresa}_dados.filas AS f ON cf.idFila=f.id
                               JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=f.id
                              WHERE c.estado=1 AND c.status=1 AND af.ramal=${agente}`
                const c = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                const campanhasAtivasAgente=c[0].campanhasAtivas
                await Redis.setter(`${empresa}:campanhasAtivasAgente:${agente}`,campanhasAtivasAgente,3600)
                resolve(campanhasAtivasAgente) 
            })
        })              
    }
    async tentativasChamadasManuais(empresa,data){
        const tentativasChamadasManuais = await Redis.getter(`${empresa}:tentativasChamadasManuais`)
        //console.log('tentativasChamadasManuais',tentativasChamadasManuais)        
        if((tentativasChamadasManuais)&&(tentativasChamadasManuais.length>0)){
            return tentativasChamadasManuais
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                //Clicks
                let sql = `SELECT COUNT(id) AS total 
                             FROM ${empresa}_dados.historico_atendimento
                            WHERE tipo='manual' AND data='${data}'`
                const cliques = await this.querySync(conn,sql)
                sql = `SELECT COUNT(id) AS total 
                         FROM ${empresa}_dados.tempo_ligacao
                        WHERE tipoDiscador='manual' AND entrada>='${data} 00:00:00' AND saida<='${data} 23:59:59'`
                const chamadas = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                const tentativasManuais = {}
                      tentativasManuais['cliques'] = cliques[0].total
                      tentativasManuais['chamadas'] = chamadas[0].total
                await Redis.setter(`${empresa}:tentativasChamadasManuais`,tentativasManuais,120)
                resolve(tentativasManuais)
            })
        }) 
    }

    async chamadasSimultaneasManuais(empresa){
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if(!chamadasSimultaneas){
            chamadasSimultaneas = []
            return 0
        }
        const chamadasSimultaneasManuais = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha == 0)
        const chamadasAtivas=[]
        //Percorre anteriores 
        for(let c=0;c<chamadasSimultaneasManuais.length;c++){
            const statusChannel = await Asterisk.statusChannel(empresa,chamadasSimultaneasManuais[c].uniqueid)
            //Caso algun status seja encontrado
            if(statusChannel!=false){
                console.log('Uniqueid',chamadasSimultaneasManuais[c].uniqueid)
                console.log('State',statusChannel['state'])
                console.log('App',statusChannel['App'])
                if(statusChannel['state']=='Down'){
                    chamadasSimultaneasManuais[c].status='Discando . . .'
                }
                if(statusChannel['state']=='Up'){
                    //console.log('>>>>>>>>>>>>>>>>>>>>>>> STATUS DE UP <<<<<<<<<<<<<<<<<<<')
                    if(statusChannel['App']=='Dial'){
                        //console.log('>>>>>>>>>>>>>>>>>>>>>>> APP AMD <<<<<<<<<<<<<<<<<<<')
                        chamadasSimultaneasManuais[c].status='Falando'
                    }
                }
                if(statusChannel['state']=='Ring'){
                    if((statusChannel['App']=='Dial')||(statusChannel['App']=='AppQueue')){
                        chamadasSimultaneasManuais[c].status='Chamando . .'
                    }
                }                 
            }else{
                chamadasSimultaneasManuais[c].status='Desligado'
            }
            chamadasAtivas.push(chamadasSimultaneasManuais[c]) 
        }
        const chamadasSimultaneasCampanhas = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha != 0)
        const todas_chamadasSimultaneas   = chamadasSimultaneasCampanhas.concat(chamadasAtivas)
        await Redis.setter(`${empresa}:chamadasSimultaneas`,todas_chamadasSimultaneas)
        return chamadasAtivas.length       
    }
    async checaAgendamento(empresa,data,hora){
        const agendaRetornos = await Redis.getter(`${empresa}:agendaRetornos`)
        if((agendaRetornos)&&(agendaRetornos.length>0)){    
            return agendaRetornos
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                const sql = `SELECT a.id 
                               FROM ${empresa}_dados.campanhas_agendamentos AS a 
                               JOIN ${empresa}_dados.user_ramal AS u ON u.ramal=a.ramal 
                              WHERE tratado=0 AND data_retorno<'${data}' 
                                 OR (data_retorno='${data}' AND hora_retorno<='${hora}' AND tratado=0)
                           ORDER BY id ASC
                              LIMIT 1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:agendaRetornos`,rows)
                resolve(rows) 
            })
        })         
    }
    async abreRegistroAgendado(empresa,idAgendamento){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                let sql = `SELECT *
                             FROM ${empresa}_dados.campanhas_agendamentos 
                            WHERE id=${idAgendamento}`
                const a = await this.querySync(conn,sql)
                const ramal=a[0].ramal
                const statusAgente = await Agente.statusRamal(empresa,ramal)
                if(statusAgente['estado']==1){
                    let atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`);
                    if(atendimentoAgente===null){
                        atendimentoAgente = {}
                    }                    
                    const protocolo=0
                    const tipo_ligacao='discador'
                    const tipo_discador='preview'
                    const modo_atendimento='auto'
                    const id_campanha=a[0].campanha
                    const id_mailing=a[0].mailing                          
                    const infoMailing = await Mailing.infoMailing(empresa,id_mailing)
                    if(infoMailing.length==0){
                        resolve(false)
                        return
                    }
                    const id_registro=a[0].id_registro
                    const id_numero=a[0].id_numero
                    const numero=a[0].numero
                    const fila='0'                    
                    const hoje = moment().format("YYYY-MM-DD")
                    const hora = moment().format("HH:mm:ss")
                    const date = moment().format("YMMDDHHmmss")
                    const idAtendimento = `${id_campanha}${date}${id_numero}`
                    const novoRetorno = {}
                          novoRetorno['idAtendimento']=idAtendimento
                          novoRetorno['data']=hoje
                          novoRetorno['hora']=hora
                          novoRetorno['ramal']=ramal
                          novoRetorno['protocolo']=protocolo
                          novoRetorno['uniqueid']=0
                          novoRetorno['tipo_ligacao']=tipo_ligacao
                          novoRetorno['tipo_discador']=tipo_discador
                          novoRetorno['retorno']=1
                          novoRetorno['modo_atendimento']=modo_atendimento
                          novoRetorno['id_campanha']=id_campanha
                          novoRetorno['id_mailing']=id_mailing
                          novoRetorno['id_registro']=id_registro
                          novoRetorno['id_numero']=id_numero
                          novoRetorno['numero']=numero
                          novoRetorno['fila']=fila
                          novoRetorno['event_falando']=0
                          novoRetorno['event_tabulando']=0
                          novoRetorno['event_tabulada']=0
                          novoRetorno['event_desligada']=0 
                    await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,novoRetorno,43200)                
                    await Agente.alterarEstadoAgente(empresa,ramal,5,0)
                    sql = `UPDATE ${empresa}_dados.campanhas_agendamentos 
                              SET tratado=1 
                            WHERE id=${idAgendamento}`
                    await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    await Redis.delete(`${empresa}:agendaRetornos`)
                    resolve(true)
                    return  
                }
                resolve(false)
                return false
            })
        })         
    } 
    //Verifica se existem campanhas ativas
    async campanhasAtivas(empresa){   
        const campanhasAtivas = await Redis.getter(`${empresa}:campanhasAtivas_comInformacoes`)
        if((campanhasAtivas)&&(campanhasAtivas.length>0)){
           return campanhasAtivas
        }        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});                
                const sql = `SELECT c.id,f.idFila,f.nomeFila,d.tipo_discador,d.agressividade,d.tipo_discagem,d.ordem_discagem,d.modo_atendimento,d.saudacao
                               FROM ${empresa}_dados.campanhas AS c
                               JOIN ${empresa}_dados.campanhas_filas AS f ON c.id=f.idCampanha
                               JOIN ${empresa}_dados.campanhas_discador AS d ON c.id=d.idCampanha
                              WHERE c.tipo='a' AND c.status=1 AND c.estado=1` 
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:campanhasAtivas_comInformacoes`,rows,7200)
                resolve(rows) 
            })
        })      
    }
    //Verifica se a campanha possui Agendamento
    async agendamentoCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
               const sql = `SELECT id 
                              FROM ${empresa}_dados.campanhas_horarios 
                             WHERE id_campanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                })
                resolve(rows) 
            })
        })       
    } 
    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    async agendamentoCampanha_data(empresa,idCampanha){
        const dataCampanha = await Redis.getter(`${empresa}:dataCampanha:${idCampanha}`)
         if(dataCampanha!==null){
             return dataCampanha
         }      
         return new Promise (async (resolve,reject)=>{ 
             const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                 const sql = `SELECT id,inicio,termino FROM ${empresa}_dados.campanhas_horarios 
                               WHERE id_campanha=${idCampanha}`;
                 const rows = await this.querySync(conn,sql)
                 pool.end((err)=>{
                     if(err) console.error(err)
                 })  
                 const dataCampanha={};
                       dataCampanha['inicio']= moment(rows[0].inicio).format("YYYY-MM-DD")
                       dataCampanha['termino']= moment(rows[0].termino).format("YYYY-MM-DD")
                 await Redis.setter(`${empresa}:dataCampanha:${idCampanha}`,dataCampanha) 
                 resolve(dataCampanha) 
             })
         })           
     }
     //Verifica se agora esta dentro do horário de agendamento de uma campanha
    async agendamentoCampanha_horario(empresa,idCampanha,hora){
        const horarioCampanha = await Redis.getter(`${empresa}:horarioCampanha:${idCampanha}`)
        if(horarioCampanha!==null){
            return horarioCampanha
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                const sql = `SELECT id,DATE_FORMAT (hora_inicio,'%H:%i:%s') AS inicio, DATE_FORMAT (hora_termino,'%H:%i:%s') AS termino  FROM ${empresa}_dados.campanhas_horarios 
                              WHERE id_campanha=${idCampanha}`;                         
                const rows = await this.querySync(conn,sql)     
                const horarioCampanha={};
                      horarioCampanha['hora_inicio']=rows[0].inicio
                      horarioCampanha['hora_termino']=rows[0].termino
                await Redis.setter(`${empresa}:horarioCampanha:${idCampanha}`,horarioCampanha)              
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(horarioCampanha) 
            })
        })       
    } 
    async totalChamadasSimultaneas(empresa,idCampanha){
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`) 
        if((!chamadasSimultaneas)||(chamadasSimultaneas.length==0)){        
            return 0
        }
        const chamadasAtivas=[]
        //Percorre anteriores
        for(let c=0;c<chamadasSimultaneas.length;c++){
            const statusChannel = await Asterisk.statusChannel(empresa,chamadasSimultaneas[c].uniqueid)
            if(!statusChannel){
                //Removendo a chamada caso o canal nao exista   
                if(chamadasSimultaneas[c].event_na_fila==1){
                   const hoje = moment().format("YYYY-MM-DD")
                   const horario = chamadasSimultaneas[c].horario
                   const dataLigacao = moment(`${hoje} ${horario}`).format("YYYY-MM-DD HH:mm:ss")
                   const now = moment(new Date());         
                   const duration = moment.duration(now.diff(dataLigacao))
                   const segundos = duration.asSeconds()
                   if(segundos<=30){
                    chamadasSimultaneas[c].status='Abandonou Fila!' 
                    // await this.removeChamadaSimultanea(empresa,chamadasSimultaneasCampanha[c])     
                    chamadasAtivas.push(chamadasSimultaneas[c])        
                    }
                }                 
            }else{         
                if(statusChannel['state']=='Down'){
                    chamadasSimultaneas[c].status='Discando . . .'
                }
                if(chamadasSimultaneas[c].event_em_atendimento==1){
                    chamadasSimultaneas[c].status='Em Atendimento'
                }else{
                    if(statusChannel['state']=='Up'){
                    //console.log('>>>>>>>>>>>>>>>>>>>>>>> STATUS DE UP <<<<<<<<<<<<<<<<<<<')
                        if(statusChannel['App']=='AMD'){
                            //console.log('>>>>>>>>>>>>>>>>>>>>>>> APP AMD <<<<<<<<<<<<<<<<<<<')
                           chamadasSimultaneas[c].status='Analisando'
                        }else if(statusChannel['App']=='Queue'){
                            //console.log('>>>>>>>>>>>>>>>>>>>>>>> APP QUEUE <<<<<<<<<<<<<<<<<<<')
                           chamadasSimultaneas[c].status='Na Fila'
                        }
                    }
                    if(statusChannel['state']=='Ringing'){
                        if((statusChannel['App']=='Queue')||(statusChannel['App']=='AppQueue')){
                            chamadasSimultaneas[c].status='Na Fila'
                        }else if(statusChannel['App']=='AMD'){
                            chamadasSimultaneas[c].status='Analisando'
                        }else{
                            chamadasSimultaneas[c].status='Chamando . .'
                        }
                    }  
                }
                chamadasAtivas.push(chamadasSimultaneas[c])          
            }
        }
        /*const chamadasSimultaneasOutrasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha != idCampanha)
        const chamadasSimultaneas_todasCampanhas = chamadasSimultaneasOutrasCampanha.concat(chamadasAtivas)*/
        await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasAtivas)
        const chamadasSimultaneasCampanha = chamadasAtivas.filter(chamadas => chamadas.id_campanha == idCampanha)
        return chamadasSimultaneasCampanha.length       
    }

    async agentesNaFila(empresa,idFila){
        const agentesNaFila = await Redis.getter(`${empresa}:agentesNaFila:${idFila}`)
        if(agentesNaFila){
            return agentesNaFila
        }        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                const sql =  `SELECT COUNT(id) AS total
                                FROM ${empresa}_dados.agentes_filas 
                               WHERE fila=${idFila}` 
                const a = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                const agentesNaFila = a[0].total                
                await Redis.setter(`${empresa}:agentesNaFila:${idFila}`,agentesNaFila,360)
                resolve(agentesNaFila) 
            })
        })       
    }
    //Verificando se existem agentes disponiveis na fila
    async agentesDisponiveis(empresa,idFila){  
        const agentesDisponiveis = await Redis.getter(`${empresa}:agentesDisponiveis:${idFila}`)
        if(agentesDisponiveis){
            return agentesDisponiveis
        }        

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});                
                const sql = `SELECT COUNT(ramal) AS total 
                               FROM ${empresa}_dados.agentes_filas 
                              WHERE fila='${idFila}'
                                AND estado=1`
                const a = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                const agentesDisponiveis = a[0].total
                
                await Redis.setter(`${empresa}:agentesDisponiveis:${idFila}`,agentesDisponiveis,360)
                resolve(agentesDisponiveis) 
            })
        })           
    }
    async atualizaStatus(empresa,idCampanha,msg,estado){      
        //console.log(`\n[❗]${msg}...................`,`📣${idCampanha}\n`)
        await Redis.delete(`${empresa}:statusCampanha:${idCampanha}`)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                //verificando se a campanha ja possui status
                let sql = `SELECT * FROM ${empresa}_dados.campanhas_status WHERE idCampanha='${idCampanha}'`
                const statusCampanha_db = await this.querySync(conn,sql)                
                
                if(statusCampanha_db.length==0){
                    //Caso nao, insere o status
                    const sql = `INSERT INTO ${empresa}_dados.campanhas_status
                                            (idCampanha,data,mensagem,estado) 
                                    VALUES (${idCampanha},now(),'${msg}',${estado})`               
                    await this.querySync(conn,sql)     
                }else{
                    //Caso sim atualiza o mesmo
                    const sql = `UPDATE ${empresa}_dados.campanhas_status
                                    SET data=now(),mensagem='${msg}',estado=${estado}
                                WHERE idCampanha=${idCampanha}` 
                    await this.querySync(conn,sql)               
                }

                sql = `SELECT * FROM ${empresa}_dados.campanhas_status WHERE idCampanha='${idCampanha}'`
                const rows = await this.querySync(conn,sql)                 
               
                await Redis.setter(`${empresa}:statusCampanha:${idCampanha}`,rows)
                //console.log('Chave',`${empresa}:statusCampanha:${idCampanha}`)
                const status = await Redis.getter(`${empresa}:statusCampanha:${idCampanha}`)
                //console.log('status',status)

                //console.log(`\n ❗  ${empresa} Campanha:${idCampanha} ${msg} . . . . . . . . . . . . \n`)

                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true) 
            })
        })        
    }
    async checandoRegistro(empresa,idRegistro,idCampanha){
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`) 
        if(chamadasSimultaneas===null){
            chamadasSimultaneas = []
        }
        const chamadasSimultaneasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha == idCampanha)
        const registro = chamadasSimultaneasCampanha.filter(chamadas => chamadas.id_registro == idRegistro)
        if(registro.length>0){
            return true
        }
        return false            
    }
    async checaNumeroOcupado(empresa,idCampanha,numero){ 
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`) 
        if(chamadasSimultaneas===null){
            chamadasSimultaneas = []
        }
        //console.log('chamadasSimultaneas',chamadasSimultaneas)
        //console.log('NUMERo',numero)
        const chamadasSimultaneasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha == idCampanha) 
        //console.log('chamadasSimultaneasCampanha',chamadasSimultaneasCampanha)
        const numeroFiltrado = chamadasSimultaneasCampanha.filter(chamadas => chamadas.numero == numero)
        //console.log('numeroFiltrado',numeroFiltrado)
        //console.log('numeroFiltrado length',numeroFiltrado.length)
        if(numeroFiltrado.length>0){
            return true
        }
        return false
    }

    //Registra chamada simultanea          
    async registraChamada(empresa,ramal,idAtendimento,uniqueid,idMailing,idCampanha,modoAtendimento,tipoDiscador,id_reg,id_numero,numero,fila,falando){
        let tipo = 'discador'
        if(tipoDiscador=="manual"){
            tipo = 'manual'
        }         
        //console.log('Registra atendimento')
        const hoje = moment().format("YYYY-MM-DD")
        const hora = moment().format("HH:mm:ss")     
        const datetime = moment().format("YYYYMMDDHHmmss")       
        const protocolo = datetime+'0'+ramal

        //Inserindo dados na chamadas simultaneas
        const novaChamada = {}
              novaChamada['idAtendimento']=idAtendimento        
              novaChamada['data']=hoje
              novaChamada['hora']=hora
              novaChamada['ramal']=ramal
              novaChamada['protocolo']=protocolo
              novaChamada['uniqueid']=uniqueid
              novaChamada['tipo_ligacao']=tipo
              novaChamada['tipo_discador']=tipoDiscador
              novaChamada['retorno']=0
              novaChamada['modo_atendimento']=modoAtendimento
              novaChamada['id_campanha']=idCampanha
              novaChamada['id_mailing']=idMailing
              novaChamada['id_registro']=id_reg
              novaChamada['id_numero']=id_numero
              novaChamada['numero']=numero
              novaChamada['fila']=fila
              novaChamada['event_falando']=falando   
              novaChamada['event_tabulando']=0
              novaChamada['event_tabulada']=0
              novaChamada['event_desligada']=0  
        console.log('\n >>>>>> Setando Chamada Agente:',ramal,'Dados da chamada:',novaChamada)
        
        //await Redis.setter(`${empresa}:chamadasEmAtendimento`,chamadasEmAtendimento,43200)
        //await Redis.delete(`${empresa}:chamadasEmAtendimento`)
        await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,novaChamada,43200)
        //const chave = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        //console.log('>>>>>>>>>>>>>>>>>>>>>> chave',`${empresa}:atendimentoAgente:${ramal}`,chave)
    } 

    async discar(empresa,ramal,idAtendimento,numero,fila,modoAtendimento,saudacao,aguarde,idCampanha,idMailing,idRegistro,idNumero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                //Recuperando dados do asterisk
                const sql=`SELECT * 
                            FROM ${empresa}_dados.asterisk_ari 
                            WHERE active=1`; 
                const asterisk_server = await this.querySync(conn,sql)  
                const modo='discador'
                const server = asterisk_server[0].server
                const user =  asterisk_server[0].user
                const pass =  asterisk_server[0].pass
                if(!fila){
                    let fila=0
                }    
                let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
                if(chamadasSimultaneas==null){
                    chamadasSimultaneas=[]
                }               
                Asterisk.discar(empresa,fila,idAtendimento,saudacao,aguarde,server,user,pass,modo,ramal,numero,idCampanha,async (e,call)=>{
                    if(e) throw e 
                    let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
                    if(chamadasSimultaneas==null){
                        chamadasSimultaneas=[]
                    }                    
                    const uniqueid = call['id']
                    const novaChamada={}
                          novaChamada['idAtendimento'] = idAtendimento
                          novaChamada['uniqueid'] = uniqueid
                          novaChamada['id_mailing'] = idMailing
                          novaChamada['id_campanha'] = idCampanha
                          novaChamada['id_registro'] = idRegistro
                          novaChamada['id_numero'] = idNumero

                          novaChamada['tipo'] = 'Discador'
                          novaChamada['tipo_discador'] = 'power'
                          novaChamada['ramal'] = ramal
                          novaChamada['numero'] = numero
                          novaChamada['status'] = 'Chamando ...'
                          novaChamada['horario'] = moment().format("HH:mm:ss")

                          novaChamada['modo_atendimento']=modoAtendimento
                          novaChamada['nomeFila']=fila

                          novaChamada['event_chamando']=1
                          novaChamada['event_na_fila']=0
                          novaChamada['event_em_atendimento']=0    
                          
                    //console.log('Discando para',numero)
                    //console.log('Nova Chamada',novaChamada)
                   
                    chamadasSimultaneas.push(novaChamada)
                    await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasSimultaneas,43200)                   
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(true)
                })             
            })
        })                  
    } 


    //INTEGRAÇÕES
    async integracoes(empresa,numeroDiscado,idCampanha,ramal,idMailing,idRegistro){
        //console.log('\n',']]]]]]]]]]]]]]]]]]]]]]]]]]]]]]','empresa',empresa,'numero',numeroDiscado,'idCampanha',idCampanha,'ramal',ramal,'idMailing',idMailing,'idReg',idRegistro,'tabela_dados',tabelaDados)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                
                //Verifica se existe integração criada
                let sql = `SELECT idIntegracao 
                             FROM ${empresa}_dados.campanhas_integracoes 
                            WHERE idCampanha=${idCampanha}`
                const i = await this.querySync(conn,sql)
                if(i.length==0){
                    pool.end((err)=>{
                        if(err) console.error(err)
                        resolve({"status":false})                       
                    }) 
                    return false
                }
                sql = `SELECT *
                         FROM ${empresa}_dados.campanhas_integracoes_disponiveis 
                        WHERE id=${i[0].idIntegracao}` 
                const info = await this.querySync(conn,sql)
                let url = await this.trataUrlIntegracao(empresa,numeroDiscado,ramal,info[0].url,idCampanha,idMailing,idRegistro)
                const  infoInt={}
                       infoInt['status']=true
                       infoInt['nome']=info[0].descricao
                       infoInt['modo']=info[0].modoAbertura
                       infoInt['link']=url
                pool.end((err)=>{
                    if(err) console.error(err)
                    resolve(infoInt)
                })
            })
        })
    }   

    async trataUrlIntegracao(empresa,numeroDiscado,ramal,url,idCampanha,idMailing,idRegistro){
        const cpf = await this.campoCPFRegistro(empresa,idMailing,idRegistro)
        const var1 = await this.valorCampoRegistro(empresa,idMailing,idRegistro,'var1')
        const var2 = await this.valorCampoRegistro(empresa,idMailing,idRegistro,'var2')
        const nomeCliente = await this.campoNomeRegistro(empresa,idMailing,idRegistro)
        const link = url.replace('{CPF}',cpf)
                        .replace('{RAMAL}',ramal)
                        .replace('{NUMERO_DISCADO}',numeroDiscado)
                        .replace('{ID_CAMPANHA}',idCampanha)
                        .replace('{NOME_CLIENTE}',nomeCliente)
                        .replace('{ID_REGISTRO}',idRegistro)
                        .replace('{VAR_1}',var1)
                        .replace('{VAR_2}',var2)
        return(link)
    }
    //Retorna o nome do cliente do idRegistro
    async campoNomeRegistro(empresa,idMailing,idRegistro){
        connect.mongoose(empresa)         
        delete mongoose.connection.models[`dadosmailing_${idMailing}`];
        const modelDadosMailing = mongoose.model(`dadosmailing_${idMailing}`,{
            id_key_base:{type:Number, index:true},
            nome:String,
            cpf:String,
            dados:Array
        })
        const dados = await modelDadosMailing.find({"id_key_base":`${idRegistro}`})
        //console.log('dados',dados) 
        return dados[0].nome      
    }
    //Retorna o nº do CPF do cliente do idRegistro
    async campoCPFRegistro(empresa,idMailing,idRegistro){
        connect.mongoose(empresa)
        delete mongoose.connection.models[`dadosmailing_${idMailing}`];
        const modelDadosMailing = mongoose.model(`dadosmailing_${idMailing}`,{
            id_key_base:{type:Number, index:true},
            nome:String,
            cpf:String,
            dados:Array
        })
        const dados = await modelDadosMailing.find({"id_key_base":`${idRegistro}`})
        return dados[0].cpf      
    }
    //Retorna um array com os dados disponiveis do cliente do idRegistro
    async dadosRegistro(empresa,idMailing,idRegistro){
        connect.mongoose(empresa)         
        delete mongoose.connection.models[`dadosmailing_${idMailing}`];
        const modelDadosMailing = mongoose.model(`dadosmailing_${idMailing}`,{
            id_key_base:{type:Number, index:true},
            nome:String,
            cpf:String,
            dados:Array
        })
        const dados = await modelDadosMailing.find({"id_key_base":`${idRegistro}`})
        return dados[0].dados      
    }
    //Retorna um array com a lista dos campos dos dados disponiveis do cliente do idRegistro
    async camposMailing(empresa,idMailing,idCampanha){
        connect.mongoose(empresa) 
        const campos_dados = await MailingCampanha.find({idCampanha:idCampanha})
        const listaCampos = campos_dados[0].camposMailing
        return listaCampos
    }
    //Busca dentro do array de dados do cliente o valor que corresponda ao tipo de dado informado do idRegistro
    async valorCampoRegistro(empresa,idMailing,idRegistro,tipo){
        const valores_dados = await this.dadosRegistro(empresa,idMailing,idReg)
        const listaCampos = await this.camposMailing(empresa,idMailing,idCampanha)

        for(let c=0;c<listaCampos.length;c++){
            if(listaCampos[c].tipo==tipo){
                const nomeCampo=listaCampos[c].nome
                return valores_dados[0][`${nomeCampo}`] 
            }
        }   
    }

    //Informações da chamada a ser atendida
    async infoChamada_byDialNumber(empresa,idMailing,idCampanha,idReg,id_numero,numero){
        connect.mongoose(empresa) 
        delete mongoose.connection.models[`numerosmailing_${idMailing}`];   
        const modelNumerosMailing = mongoose.model(`numerosmailing_${idMailing}`,{
            idNumero: Number,
            idRegistro: String,
            ddd: String,
            numero: String,
            uf:String,
            valido: Boolean,
            message: String
        })
        const info = {};
              info['numeros']=[]

        const campos_numeros = await modelNumerosMailing.find({idRegistro:idReg})
        for(let i=0; i<campos_numeros.length; i++){    
            info['numeros'].push(await this.tabulacoesNumero(empresa,campos_numeros[i].id,`${campos_numeros[i].numero}`));
        }
        info['id_numeros_discado']=id_numero
        info['numeros_discado']=numero    
        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});         
                    let sql = `SELECT id,nome,descricao 
                                 FROM ${empresa}_dados.campanhas 
                                 WHERE id=${idCampanha}`
                    const dadosCampanha = await this.querySync(conn,sql)
                    if(dadosCampanha.length != 0 ){
                        info['dadosCampanha']=dadosCampanha
                    }
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(info) 
                })
            })         
    }

    async tabulacoesNumero(empresa,id,numero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                const sql = `SELECT COUNT(produtivo) AS totalTabulacoes,
                                    SUM(produtivo) AS produtivas,
                                    COUNT(produtivo)-SUM(produtivo) AS improdutivas 
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE numero_discado='${numero}'`
                const tabs = await this.querySync(conn,sql)
                tabs[0]['idNumero']=id
                tabs[0]['numero']=numero
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(tabs[0]) 
            })
        })         
    }

    async nomeContatoHistoico_byNumber(empresa,numero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                const sql = `SELECT nome_registro 
                               FROM ${empresa}_dados.historico_atendimento 
                              WHERE numero_discado LIKE '%${numero}' 
                                AND nome_registro IS NOT NULL                      
                            ORDER BY id DESC
                            LIMIT 1`
                            //console.log(sql)
                const n = await this.querySync(conn,sql)
                if(n.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve("")
                    return false
                }
                 
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(n[0].nome_registro) 
            })
        })         
    }

     //Verifica Lista de tabulacao da campanha
     async tabulacoesCampanha(empresa,nome,idCampanha){        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT idListaTabulacao,maxTime 
                            FROM ${empresa}_dados.campanhas_listastabulacao 
                            WHERE idCampanha='${idCampanha}' AND idListaTabulacao!=0`
                const idLista = await this.querySync(conn,sql)
                if(idLista.length!=0){                
                    const tabulacoes={}
                        tabulacoes['nome']=nome
                        tabulacoes['maxTime']=idLista[0].maxTime
                    //produtivas
                    sql = `SELECT id,tabulacao,descricao,followUp,venda,contatado,removeNumero 
                            FROM ${empresa}_dados.tabulacoes_status 
                            WHERE idLista=${idLista[0].idListaTabulacao} AND tipo='produtivo' AND status=1
                            ORDER BY ordem ASC`
                    const pro = await this.querySync(conn,sql) 
                    tabulacoes['produtivas']=[]
                    for(let i = 0; i<pro.length; i++) {                
                        tabulacoes['produtivas'].push(pro[i])
                        tabulacoes['produtivas'][i]['tipo']='produtivo'
                    }
                    //improdutivas       
                    sql = `SELECT id,tabulacao,descricao,followUp,venda,contatado,removeNumero 
                            FROM ${empresa}_dados.tabulacoes_status 
                            WHERE idLista=${idLista[0].idListaTabulacao} AND tipo='improdutivo' AND status=1
                            ORDER BY ordem ASC`
                    const imp = await this.querySync(conn,sql)
                    tabulacoes['improdutivas']=[]
                    for(let i = 0; i<imp.length; i++) {
                        tabulacoes['improdutivas'].push(imp[i])
                        tabulacoes['improdutivas'][i]['tipo']='improdutivo'
                    }
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 

                    resolve(tabulacoes)
                    return 
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(false)
            })
        }) 
    }

    async campanhasTabulacaoMailing(empresa,dadosTabulacao){
        console.log('Dados Tabulacao',dadosTabulacao)
        return true
    }

    async tabulaChamada(empresa,contatado,status_tabulacao,observacao,produtivo,ramal,idNumero,removeNumero){
        console.log('> > > > TABULA CHAMADA')
        const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if(dadosAtendimento==null){            
            return false
        }
        console.log('> > > > STATUS',status_tabulacao)
        console.log('> > > > PROTOCOLO',dadosAtendimento['protocolo'])
        console.log('> > > > TIPO CHAMADA',dadosAtendimento['tipo_ligacao'])
        const idRegistro = dadosAtendimento['id_registro']
        const idMailing = dadosAtendimento['id_mailing']
        const idCampanha = dadosAtendimento['id_campanha']
        const protocolo = dadosAtendimento['protocolo']
        const uniqueid = dadosAtendimento['uniqueid']
        const tipo_ligacao = dadosAtendimento['tipo_ligacao']
        const numero = dadosAtendimento['numero']
        const nome_registro = await this.campoNomeRegistro(empresa,idMailing,idRegistro);

        const tabular = {}
              tabular['tipo']='agente'
              tabular['contatado']=contatado
              tabular['status_tabulacao']=status_tabulacao
              tabular['observacoes']=observacao
              tabular['produtivo']=produtivo
              tabular['ramal']=ramal
              tabular['id_numero']=idNumero
              tabular['removeNumero']=removeNumero
              tabular['numero']=numero
              tabular['nome_registro']=nome_registro
              tabular['idRegistro']=idRegistro
              tabular['idMailing']=idMailing
              tabular['idCampanha']=idCampanha
              tabular['protocolo']=protocolo
              tabular['uniqueid']=uniqueid
              tabular['tipo_ligacao']=tipo_ligacao   

        console.log('Tabular',tabular)
        this.campanhasTabulacaoMailing(empresa,tabular)
       
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
              
                Cronometro.encerrouTabulacao(empresa,idCampanha,numero,ramal,status_tabulacao) 
                await Redis.delete(`${empresa}:historicoChamadas:${ramal}`)
                //Grava informações no histórico de chamadas
                let sql = `INSERT INTO ${empresa}_dados.historico_atendimento 
                                    (data,hora,campanha,mailing,id_registro,id_numero,nome_registro,agente,protocolo,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado,produtivo) 
                            VALUES (now(),now(),${idCampanha},${idMailing},${idRegistro},${idNumero},'${nome_registro}',${ramal},'${protocolo}','${uniqueid}','${tipo_ligacao}','${numero}',${status_tabulacao},'${observacao}','${contatado}',${produtivo}) `
                await this.querySync(conn,sql)            
                
                //Verifica se a chamada ja foi desligada 
                console.log('Verificando dados da chamada em atendimento')
                if(dadosAtendimento['event_desligada']==1){
                    //Remove chamada simultanea 
                    await Agente.clearCallsAgent(empresa,ramal);
                    //Atualiza estado do agente para disponivel
                    await Agente.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
                }else{ 
                    dadosAtendimento['event_tabulando']=0 
                    dadosAtendimento['event_tabulada']=1
                    await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,dadosAtendimento)                    
                }                
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true)
            })
        })         
    }  

     //Tabulação automática do sistema    
     async autoTabulacao(empresa,protocolo,idCampanha,idRegistro,id_numero,ramal,uniqueid,numero,status_tabulacao,observacoes,contatado,produtivo,tipo_ligacao){
              
        const tabular = {}
              tabular['tipo']='auto'
              tabular['protocolo']=protocolo              
              tabular['idRegistro']=idRegistro
              tabular['id_numero']=id_numero
              tabular['ramal']=ramal
              tabular['uniqueid']=uniqueid
              tabular['numero']=numero
              tabular['status_tabulacao']=status_tabulacao
              tabular['observacoes']=observacoes
              tabular['contatado']=contatado
              tabular['produtivo']=produtivo
              tabular['tipo_ligacao']=tipo_ligacao    
              const idMailing = await Campanhas.idMailingCampanha(empresa,idCampanha)   
        this.campanhasTabulacaoMailing(empresa,tabular)
                                                
        await this.registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,idRegistro,id_numero,ramal,uniqueid,tipo_ligacao,numero,status_tabulacao,observacoes,contatado)
        return true
    }

    async registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,id_registro,id_numero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado){
        await Redis.delete(`${empresa}:historicoChamadas:${ramal}`)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //console.log('registra atendimento')
                const sql = `INSERT INTO ${empresa}_dados.historico_atendimento 
                                        (data,hora,protocolo,campanha,mailing,id_registro,id_numero,agente,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) 
                                VALUES (now(),now(),'${protocolo}',${idCampanha},'${idMailing}',${id_registro},${id_numero},${ramal},'${uniqueid}','${tipo_ligacao}','${numero}',${tabulacao},'${observacoes}','${contatado}')`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })                  
    }  


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////











































    
    //INFORMACOES DO AGENTE
    async agentesLogados(empresa){

        const agentesLogados = await Redis.getter(`${empresa}:agentesLogados`)
        if(agentesLogados!==null){
            return agentesLogados
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:agentesLogados","message":err.message, "line:":err.path});

                const sql = `SELECT COUNT(id) AS logados
                               FROM ${empresa}_dados.user_ramal
                              WHERE estado>=1`                            
                const ul = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                })
                await Redis.setter(`${empresa}:agentesLogados`,ul[0].logados)
                resolve(ul[0].logados) 
            })
        })                
    }
    async chamadasProdutividade_CampanhasAtivas_dia(empresa,statusProdutividade){
        const chamadasProdutivas = await Redis.getter(`${empresa}:chamadasProdutividade_CampanhasAtivas_dia:${statusProdutividade}`)
        if(chamadasProdutivas!==null){
            return chamadasProdutivas
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasProdutividade_CampanhasAtivas_dia","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }
                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS produtivas
                               FROM ${empresa}_dados.historico_atendimento
                              WHERE data='${hoje}' ${queryFilter} `;
                    
                const p=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:chamadasProdutividade_CampanhasAtivas_dia:${statusProdutividade}`,p[0].produtivas)
                resolve(p[0].produtivas) 
            })
        })       
    }
    async totalChamadas_CampanhasAtivas_dia(empresa){
        const totalChamadas_CampanhasAtivas_dia = await Redis.getter(`${empresa}:totalChamadas_CampanhasAtivas_dia`)
        if(totalChamadas_CampanhasAtivas_dia!==null){
            return totalChamadas_CampanhasAtivas_dia
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:totalChamadas_CampanhasAtivas_dia","message":err.message,"stack":err.stack});

                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}';`
                const p=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                await Redis.setter(`${empresa}:totalChamadas_CampanhasAtivas_dia`,p[0].chamadas)
                resolve(p[0].chamadas) 
            })
        })       
    }
    async agentesPorEstado(empresa,estado){
        const agentesPorEstado = await Redis.getter(`${empresa}:agentesPorEstado:${estado}`)
        if(agentesPorEstado!==null){
            return agentesPorEstado
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"agentesPorEstado.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT COUNT(id) AS agentes
                            FROM ${empresa}_dados.user_ramal
                            WHERE estado=${estado}`
                const ul = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:agentesPorEstado:${estado}`,ul[0].agentes)
                resolve(ul[0].agentes) 
            })
        })        
    }
    async chamadasAbandonadas_CampanhasAtivas(empresa){
        const chamadasAbandonadas = await Redis.getter(`${empresa}:chamadasAbandonadas_campanhasAtivas`)
        if(chamadasAbandonadas !== null) {
            return chamadasAbandonadas
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasAbandonadas_CampanhasAtivas","message":err.message,"stack":err.stack});

                const sql = `SELECT COUNT(h.id) AS abandonadas
                            FROM ${empresa}_dados.campanhas AS c
                            JOIN ${empresa}_dados.historico_atendimento AS h
                                ON c.id=h.campanha
                            WHERE c.estado=1 AND c.status=1 AND h.obs_tabulacao='ABANDONADA';`
                const a=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                })
                await Redis.setter(`${empresa}:chamadasAbandonadas_campanhasAtivas`,a[0].abandonadas) 
                resolve(a[0].abandonadas) 
            })
        })       
    }
    async chamadasPorContato_dia(empresa,statusContatado){
        const chamadasPorContato_dia = await Redis.getter(`${empresa}:chamadasPorContato_dia:${statusContatado}`)
        if(chamadasPorContato_dia !== null) {
            return chamadasPorContato_dia
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasPorContato_dia","message":err.message,"stack":err.stack});

                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS contatados
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}' AND contatado='${statusContatado}';`
                const c=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:chamadasPorContato_dia:${statusContatado}`,c[0].contatados) 
                resolve(c[0].contatados) 
            })
        })       
    }
    async chamadasEmAtendimento(empresa){
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if(chamadasSimultaneas===null){
            return 0
        }
        const chamadasEmAtendimento = chamadasSimultaneas.filter(chamadas => chamadas.event_em_atendimento==1)
        return chamadasEmAtendimento.length        
    }
     //Status atual de uma campanha 
     async statusCampanha(empresa,idCampanha){
        const statusCampanha =await Redis.getter(`${empresa}:statusCampanha:${idCampanha}`)       
        if(statusCampanha==null){
            return false
        }
        return statusCampanha
    }
    async chamadasProdutividade_porCampanha(empresa,idCampanha,statusProdutividade,idMailing){
        const chamadasProdutividade_porCampanha = await Redis.getter(`${empresa}:chamadasProdutividade_porCampanha:${idCampanha}:mailing:${idMailing}:statusProdutividade:${statusProdutividade}`)
        if(chamadasProdutividade_porCampanha===null){
            return 0
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasProdutividade_porCampanha","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }
                const sql = `SELECT COUNT(id) AS produtivas
                               FROM ${empresa}_mailings.campanhas_tabulacao_mailing
                              WHERE idCampanha=${idCampanha}                        
                                AND idMailing=${idMailing}
                                ${queryFilter};`
                const p=await this.querySync(conn,sql);
                //console.log(sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:chamadasProdutividade_porCampanha:${idCampanha}:mailing:${idMailing}:statusProdutividade:${statusProdutividade}`,p[0].produtivas,30)
                resolve(p[0].produtivas) 
            })
        })       
    }
    
    async chamadasProdutividade_porMailing(empresa,statusProdutividade,idMailing){
        const chamadasProdutividade_porMailing = await Redis.getter(`${empresa}:chamadasProdutividade_porMailing:${idMailing}:statusProdutividade:${statusProdutividade}`)
        if(chamadasProdutividade_porMailing===null){
            return 0
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasProdutividade_porMailing","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }
                const sql = `SELECT COUNT(id) AS produtivas
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing
                            WHERE idMailing=${idMailing} ${queryFilter};`
                const p=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:chamadasProdutividade_porMailing:${idMailing}:statusProdutividade:${statusProdutividade}`,p[0].produtivas,30)
                
                resolve(p[0].produtivas) 
            })
        })       
    }
    async listarAgentesLogados(empresa){
        const listarAgentesLogados = await Redis.getter(`${empresa}:listarAgentesLogados`)
        if(listarAgentesLogados!=null){          
            return listarAgentesLogados
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"listarAgentesLogados.js:","message":err.message,"stack":err.stack});
                const hoje = moment().format('YYYY-MM-DD')
                const sql = `SELECT u.id,u.nome,u.usuario,r.estado
                               FROM ${empresa}_dados.users AS u
                               JOIN ${empresa}_dados.user_ramal AS r ON u.id=r.userId
                               WHERE r.estado>=1 
                               ORDER BY r.datetime_estado DESC`
                const rows = await this.querySync(conn,sql);

               
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:listarAgentesLogados`,rows,60)
                resolve(rows) 
            })
        })        
    }   
    async totalAtendimentosAgente(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:totalAtendimentosAgente","message":err.message,"stack":err.stack});

                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS atendimentos
                            FROM ${empresa}_dados.historico_atendimento 
                            WHERE data='${hoje}' AND agente='${idAgente}'`
                const a= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(a[0].atendimentos) 
            })
        })
    }
    async chamadasProdutividade_Agente(empresa,statusProdutividade,idAgente){
        const chamadasProdutividade_Agente = await Redis.getter(`${empresa}:chamadasProdutividade_Agente:${idAgente}:status:${statusProdutividade}`)
        if(chamadasProdutividade_Agente!==null){
            return chamadasProdutividade_Agente
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasProdutividade_Agente","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }

                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS atendimentos
                            FROM ${empresa}_dados.historico_atendimento 
                            WHERE tipo!='manual' AND data='${hoje}' AND agente='${idAgente}' ${queryFilter}`
                const a= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                })
                await Redis.setter(`${empresa}:chamadasProdutividade_Agente:${idAgente}:status:${statusProdutividade}`,a[0].atendimentos)
                resolve(a[0].atendimentos) 
            })
        })
    }
    async chamadasManuais_Agente(empresa,idAgente){
        const chamadasManuais_Agente = await Redis.getter(`${empresa}:chamadasManuais_Agente:${idAgente}`)
        if(chamadasManuais_Agente!==null){
            return chamadasManuais_Agente
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_mailings`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasManuais_Agente","message":err.message,"stack":err.stack});

                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS manuais
                               FROM ${empresa}_dados.historico_atendimento 
                              WHERE tipo='manual' AND data='${hoje}' AND agente='${idAgente}'`
                const a= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:chamadasManuais_Agente:${idAgente}`,a[0].manuais)
                resolve(a[0].manuais) 
            })
        })  
    }
    async tempoFaladoAgente(empresa,idAgente){
        const tempoFaladoAgente = await Redis.getter(`${empresa}:tempoFaladoAgente:${idAgente}`)
        if(tempoFaladoAgente!==null){
            return tempoFaladoAgente
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:tempoFaladoAgente","message":err.message,"stack":err.stack});

                const hoje = moment().format("YYYY-MM-DD")
                const sql = `SELECT SUM(tempo_total) AS tempoFalado
                               FROM ${empresa}_dados.tempo_ligacao
                              WHERE idAgente = '${idAgente}'
                                AND entrada >= '${hoje} 00:00:00' 
                                AND saida <= '${hoje} 23:59:59'`; 
                const t= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                if(t[0].tempoFalado==null){
                    resolve(0) 
                    return 0
                }       
                await Redis.setter(`${empresa}:tempoFaladoAgente:${idAgente}`,t[0].tempoFalado)         
                resolve(t[0].tempoFalado) 
            })
        })       
    }
    async clearCallsCampanhas(empresa,idCampanha){
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if(chamadasSimultaneas===null){
            return false
        }        
        /*return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:clearCallsCampanhas","message":err.message,"stack":err.stack});
                for(let c=0;c<chamadasSimultaneas.length; c++){
                    if((chamadasSimultaneas[c].id_campanha==idCampanha)&&(chamadasSimultaneas[c].event_em_atendimento==0)){
                        const idNumero = chamadasSimultaneas[c].id_numero
                        const tabelaNumeros = chamadasSimultaneas[c].tabela_numeros
                        const idMailing = chamadasSimultaneas[c].id_mailing
                        //verifica tabulacao da campanha
                        let sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                                    SET estado=0, desc_estado='Disponivel'
                                    WHERE idCampanha=${idCampanha} 
                                    AND idNumero=${idNumero}
                                    AND idMailing=${idMailing}
                                    AND produtivo <> 1`
                        await this.querySync(conn,sql)
        
                        //Libera numero na base de numeros
                        sql = `UPDATE ${empresa}_mailings.${tabelaNumeros} 
                                    SET discando=0   
                                    WHERE id=${idNumero}`
                        await this.querySync(conn,sql)
                        chamadasSimultaneas.splice(c,1)
                    }                    
                }
                pool.end((err)=>{
                   if(err) console.error(err)
                }) 
                resolve(true)
                await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasSimultaneas)
            })
        })   */
        return false     
    }

    async removeChamadaSimultanea(empresa,dadosChamada){        
        const idCampanha = dadosChamada.id_campanha
        const idMailing  = dadosChamada.id_mailing
        const idRegistro = dadosChamada.id_registro
        const id_numero = dadosChamada.id_numero        
        const infoMailing = await Mailing.infoMailing(empresa,idMailing)
        const tabela_numeros = infoMailing[0].tabela_numeros
        const numero = dadosChamada.numero
        //atualizando campanhas_tabulacoes
        const contatado='N'
        const observacoes = 'Não Atendida'
        const tabulacao = 0
        const tipo_ligacao='discador'
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                            SET estado=0, 
                                desc_estado='Disponivel',
                                contatado='${contatado}', 
                                observacao='${observacoes}', 
                                tentativas=tentativas+1,
                                max_tent_status=4
                            WHERE idCampanha=${idCampanha} 
                            AND idMailing=${idMailing} 
                            AND idRegistro=${idRegistro}
                            AND (produtivo IS NULL OR produtivo=0)`
                await this.querySync(conn,sql)
                //Grava no histórico de atendimento
                
                await this.registraHistoricoAtendimento(empresa,0,idCampanha,idMailing,idRegistro,id_numero,0,0,tipo_ligacao,numero,tabulacao,observacoes,contatado)
                //Marcando numero na tabela de numeros como disponivel
                sql = `UPDATE ${empresa}_mailings.${tabela_numeros} 
                        SET discando=0 
                        WHERE id_registro=${idRegistro}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true) 
            }) 
        }) 
    }
   
       
     

    //MODO DE FILTRAGEM AVANÇADO
    async selecionaNumerosCampanha(empresa,idCampanha,limit){
        const base = await Redis.getter(`${empresa}:numerosMailingCampanha:${idCampanha}`)
        if(base==null){
            return false
        }
        let limite=limit
        if(limit>base.length){
            limite=base.length
        }
        const registrosFiltrados=[]
        for(let b=0;b<limite;b++){
            console.log(`valor b: ${b} Limit: ${limite}`)
            //checando numero Disponivel
            const filter = 1      
            const numero =base[b].numero      
            const check = await this.checkTabulacaoProdutivaNumero(empresa,numero,idCampanha)
            if((check==0)&&(filter==1)){
                const registro = {}
                    registro['idNumero'] = base[b].idNumero
                    registro['idRegistro'] = base[b].idRegistro
                    registro['numero'] = numero      
                    registrosFiltrados.push(registro)
            }else{
                b--
                console.log(`Numero ja trabalhado: ${numero} valor b: ${b}`)
            }
            base.splice(base.findIndex(registros => registros.idNumero == base[b].idNumero),1)
            await Redis.setter(`${empresa}:numerosMailingCampanha:${idCampanha}`,base)
            
            
        }
        return registrosFiltrados
    }

    async checkTabulacaoProdutivaNumero(empresa,numero,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT count(id) as total
                             FROM ${empresa}_dados.historico_atendimento
                            WHERE campanha=${idCampanha} AND numero_discado='${numero}'
                            AND produtivo=1
                            LIMIT 1`
                const total = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error(err)
                    resolve(total[0].total) 
                }) 
                
            })
        }) 
    }

    async getRegistersCache(empresa,idCampanha,limit) {
        const registrosEmCache = await Redis.getter(`${empresa}:registrosEmCache:${idCampanha}`)
        if((registrosEmCache)&&(registrosEmCache.length==0)){
            return false
        }
        const numerosFiltrados = []
        for(let i=0;i<limit;++i){
            if(registrosEmCache[i]!=undefined){
                const contato = {}
                      contato['idNumero']=registrosEmCache[i].idNumero
                      contato['id_registro']=registrosEmCache[i].id_registro
                      contato['numero']=registrosEmCache[i].numero
                numerosFiltrados.push(contato)
                registrosEmCache.splice(i,1)
            }
        }
        await Redis.setter(`${empresa}:registrosEmCache:${idCampanha}`,registrosEmCache)

            console.log('Numeros Filtrados',numerosFiltrados.length)
            console.log('Registros Restantes em cache',registrosEmCache.length)
        return (numerosFiltrados)
    }

    /*
    async registraNumero(empresa,idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                            SET data=now(), 
                                estado=1, 
                                desc_estado='Discando',
                                selecoes_registro=selecoes_registro+1,
                                selecoes_numero=selecoes_numero+1
                            WHERE idMailing=${idMailing} AND idCampanha=${idCampanha} 
                            AND idRegistro=${idRegistro} AND idNumero=${idNumero}`
                    await this.querySync(conn,sql)  
                
                //atualiza como discando 
                sql = `UPDATE ${empresa}_mailings.${tabela_numeros} 
                        SET discando=1  
                        WHERE id_registro=${idRegistro}`
                await this.querySync(conn,sql)  
                //adiciona tentativa ao numeros
                sql = `UPDATE ${empresa}_mailings.${tabela_numeros} 
                        SET campanha_${idCampanha}=campanha_${idCampanha}+1 
                        WHERE id=${idNumero}`
                await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true) 
            })
        })        
    }*/
    //Seleciona um agente disponivel
    async agenteDisponivel(empresa,idFila){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - agenteDisponivel','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT ramal 
                            FROM ${empresa}_dados.agentes_filas AS a 
                        LEFT JOIN ${empresa}_dados.tempo_espera AS t ON a.ramal=t.idAgente
                            WHERE a.fila=${idFila} 
                            AND a.estado=1 
                        ORDER BY t.tempo_total DESC 
                            LIMIT 1` 
                const r =  await this.querySync(conn,sql)    
                if(r.length==0){
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(0) 
                    return
                }
               
                pool.end((err)=>{
                    if(err) console.error(err)
                 }) 
                resolve(r[0].ramal) 
            })
        })       
    }
   
/*
    async apelidoCampo(empresa,nomeCampo,tabela_dados,idReg){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 

                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT ${nomeCampo} AS 'valor' 
                               FROM ${empresa}_mailings.${tabela_dados} 
                              WHERE id_key_base='${idReg}'` 
                const rows = await this.querySync(conn,sql) 
                resolve(rows[0].valor)
            })
        })
    }*/
    async atendeChamada(empresa,ramal){
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        const calldata = chamadasSimultaneas.filter(chamada=>chamada.ramal = ramal)

        if((calldata===null)||(calldata.length==0)){
            return({"sistemcall":false,"dialcall":false}) 
        }
        const idMailing = calldata[0].id_mailing
        const tipo_discador = calldata[0].tipo_discador
        const tipo_ligacao= calldata[0].tipo_ligacao
        const idReg = calldata[0].id_registro
        const id_numero = calldata[0].id_numero
        const tabela_dados = calldata[0].tabela_dados
        const tabela_numeros = calldata[0].tabela_numeros
        
        let modo_atendimento= 'auto'
        if(calldata[0].modo_atendimento==undefined){
             modo_atendimento= calldata[0].modo_atendimento
        }
        
        const idCampanha = calldata[0].id_campanha
        const protocolo = calldata[0].protocolo
        const numero = calldata[0].numero

        const info = {};
        //Caso a chamada nao possua id de registro
        if(idReg==0){
            return({"sistemcall":false,"dialcall":false}) 
        }

        if((calldata[0].tipo_ligacao=='discador')||(calldata[0].tipo_ligacao==='retorno')){
            info['sistemcall']=false
            info['dialcall']=true
        }else if(calldata[0].tipo_ligacao=='interna'){
             info['sistemcall']=true
            info['dialcall']=false
        }else{
            info['sistemcall']=false
            info['dialcall']=false
        }

        //Integração  
        info['integracao']=await Discador.integracoes(empresa,numero,idCampanha,ramal,idMailing,idReg)
        info['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(empresa,idCampanha)  
        info['tipo_discador']=tipo_discador
        info['retorno']=false
        info['modo_atendimento']=modo_atendimento
        info['idMailing']=idMailing  
        info['tipo_ligacao']=tipo_ligacao
        info['protocolo']=protocolo
        const nomeCliente = await Discador.campoNomeRegistro(empresa,idMailing,idReg)
        const cpfCliente = await Discador.campoCPFRegistro(empresa,idMailing,idReg)
        info['nome_registro']=nomeCliente
        info['campos']={}
        info['campos']['idRegistro']=idReg
        info['campos']['Nome']=nomeCliente
        info['campos']['CPF']=cpfCliente

        const valores_dados = await Discador.dadosRegistro(empresa,idMailing,idReg)
        const listaCampos = await Discador.camposMailing(empresa,idMailing,idCampanha)

        for(let c=0;c<listaCampos.length;c++){
            if((listaCampos[c].tipo=='dados')&&(listaCampos[c].habilitado==1)){
                const nomeCampo=listaCampos[c].nome
                const apelidoCampo=listaCampos[c].apelido
                const valor = valores_dados[0][`${nomeCampo}`] 
                info['campos'][`${apelidoCampo}`]=valor 
            }
        }      
        const numeros = await Discador.infoChamada_byDialNumber(empresa,idMailing,idCampanha,idReg,id_numero,numero)
        info['numeros'] = numeros['numeros']
        info['id_numeros_discado'] = numeros['id_numeros_discado']
        info['numeros_discado'] = numeros['numeros_discado']
        info['dadosCampanha'] = numeros['dadosCampanha']
        info['config'] = {}
        info['config']['origem']="discador"
        info['config']['modo_atendimento']=modo_atendimento

        return info

        /*
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                
                //Seleciona os campos de acordo com a configuração da tela do agente
                //CAMPOS DE DADOS
                sql = `SELECT cd.id,cd.campo,cd.apelido
                        FROM ${empresa}_dados.mailing_tipo_campo AS cd
                        JOIN ${empresa}_dados.campanhas_campos_tela_agente as cc ON cd.id=cc.idCampo
                        WHERE cc.idMailing=${idMailing}
                        AND cc.idCampanha=${idCampanha}
                        AND (cd.tipo='dados' OR cd.tipo='nome' OR cd.tipo='cpf')
                    ORDER BY cc.ordem ASC`;
            
                const campos_dados = await this.querySync(conn,sql)
                //montando a query de busca dos dados                
                
                
                info['idAtendimento']=idAtendimento
                //Integração                    
                info['integracao']=await this.integracoes(empresa,idAtendimento,idCampanha)   
                info['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(empresa,idCampanha)
                info['tipo_discador']=tipo_discador
                if(calldata[0].retorno==1){
                    info['retorno']=true
                }else{
                    info['retorno']=false
                }
                info['modo_atendimento']=modo_atendimento
                info['idMailing']=idMailing              
                info['tipo_ligacao']=tipo_ligacao
                info['protocolo']=protocolo
                info['nome_registro']=await this.campoNomeRegistro(empresa,idMailing,idReg,tabela_dados)
                info['campos']={}
                info['campos']['idRegistro']=idReg
            
                for(let i=0; i<campos_dados.length; i++){
                    let apelido=''
                    if(campos_dados[i].apelido === null){
                        apelido=campos_dados[i].campo
                    }else{
                        apelido=campos_dados[i].apelido
                    }  
                    //console.log('Info Chamada - Valor do Campo',campos_dados[i].campo)
                    let nomeCampo = campos_dados[i].campo
                    
                    sql = `SELECT ${nomeCampo} AS 'valor' 
                            FROM ${empresa}_mailings.${tabela_dados} 
                            WHERE id_key_base='${idReg}'` 
                        
                    let value = await this.querySync(conn,sql)
                    info['campos'][apelido]=value[0].valor
                }        
            
                info['numeros']=[]
                //CAMPOS DE TELEFONE
                sql = `SELECT id, numero
                         FROM ${empresa}_mailings.${tabela_numeros}
                         WHERE id_registro='${idReg}'
                      ORDER BY id ASC`;
                const campos_numeros = await this.querySync(conn,sql)
                for(let i=0; i<campos_numeros.length; i++){    
                    info['numeros'].push(await this.tabulacoesNumero(empresa,campos_numeros[i].id,`${campos_numeros[i].numero}`));
                }
                info['id_numeros_discado']=id_numero
                info['numeros_discado']=numero                
                sql = `SELECT id,nome,descricao 
                         FROM ${empresa}_dados.campanhas 
                        WHERE id=${idCampanha}`
                const dadosCampanha = await this.querySync(conn,sql)
                if(dadosCampanha.length != 0 ){
                    info['dadosCampanha']=dadosCampanha
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(info) 
            })
        })*/
    }

/*---------------------------------------------------------------------------------------------------------------------------------------------------------------*/


 
    
   


    /*
    //Registrando chamadas simultaneas atuais no log 
    async registrarChamadasSimultaneas(empresa){
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`);
        if(chamadasSimultaneas===null){
            chamadasSimultaneas = []
        }

        const chamando = chamadasSimultaneas.filter(chamadas => chamadas.event_chamando == 1)
        const emFila = chamadasSimultaneas.filter(chamadas => chamadas.event_na_fila == 1)
        const atendidas = chamadasSimultaneas.filter(chamadas => chamadas.event_em_atendimento == 1)

        const totalChamadasSimultaneas = {}
              totalChamadasSimultaneas['chamadasSimultaneas']=chamando.length+emFila.length
              totalChamadasSimultaneas['chamadasConectadas']=atendidas.length
              
        await Redis.setter(`${empresa}:totalChamadasSimultaneas`,totalChamadasSimultaneas,60)
    }*/

    
    
    async infoChamada(empresa,ramal){
        const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if(dadosAtendimento === null){
            return []
        }
        return dadosAtendimento
    }

    

   
    

    



//REFATORAÇÃO E OTIMIZAÇÃO REDIS   
   /* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    * INFORMAÇÕES DO DISCADOR / AGENTES
    * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    */
    
     

         

    async listarCampanhasAtivasAgente(empresa,agente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT c.nome AS campanhasAtivas
                            FROM ${empresa}_dados.campanhas AS c
                            JOIN ${empresa}_dados.campanhas_filas AS cf ON c.id=cf.idCampanha
                            JOIN ${empresa}_dados.filas AS f ON cf.idFila=f.id
                            JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=f.id
                            WHERE c.estado=1 AND c.status=1 AND af.ramal=${agente}`
                const ca = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                if(ca.length==0){
                    resolve("")
                }
                let campanhas=""
                for(let i = 0; i<ca.length; i++){
                    if(i>=1){
                        campanhas+=" / "
                    }
                    campanhas+=ca[i].campanhasAtivas
                }
               
                resolve(campanhas) 
            })
        })        
    }

    async chamadasProdutividadeDia_porAgente(empresa,statusProdutividade,idAgente,data){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasProdutividadeDia_porAgente","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }
                const sql = `SELECT COUNT(id) AS produtivas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${data}' AND agente=${idAgente};`
                const p = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(p[0].produtivas) 
            })
        })            
    }   

    //INFORMAÇÕES DE CAMPANHAS
    async chamadasProdutividade_CampanhasAtivas(empresa,statusProdutividade){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasProdutividade_CampanhasAtivas","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND t.produtivo=1`
                }else{
                    queryFilter=`AND (t.produtivo=0 OR t.produtivo is null)`
                }

                const sql = `SELECT COUNT(t.id) AS produtivas
                            FROM ${empresa}_dados.campanhas AS c
                            JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                                ON c.id=t.idCampanha
                            WHERE c.estado=1 AND c.status=1 ${queryFilter};`
                const p=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(p[0].produtivas) 
            })
        })       
    }

   

    async chamadas_CampanhasAtivas_dia(empresa,statusProdutividade){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadas_CampanhasAtivas_dia","message":err.message,"stack":err.stack});

                let queryFilter="";
                if(statusProdutividade==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }
                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS produtivas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}' ${queryFilter} `;
                        
                const p=await this.querySync(conn,sql);                
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(p[0].produtivas) 
            })
        })       
    }
    async chamadasPorContato_CampanhasAtivas(empresa,statusContatado){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasPorContato_CampanhasAtivas","message":err.message,"stack":err.stack});

                const sql = `SELECT COUNT(t.id) AS contatados
                            FROM ${empresa}_dados.campanhas AS c
                            JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                                ON c.id=t.idCampanha
                            WHERE c.estado=1 AND c.status=1 AND t.contatado='${statusContatado}';`
                const c=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(c[0].contatados) 
            })
        })       
    }


    async totalChamadas_CampanhasAtivas(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:totalChamadas_CampanhasAtivas","message":err.message,"stack":err.stack});

                const sql = `SELECT COUNT(t.id) AS chamadas
                            FROM ${empresa}_dados.campanhas AS c
                            JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                                ON c.id=t.idCampanha
                            WHERE c.estado=1 AND c.status=1;`
                const p=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(p[0].chamadas) 
            })
        })       
    }   

    async chamadasAbandonadas_dia(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasAbandonadas_dia","message":err.message,"stack":err.stack});

                const hoje = moment().format("Y-MM-DD")
                const sql = `SELECT COUNT(id) AS abandonadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}' AND h.obs_tabulacao='ABANDONADA';`
                const a=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(a[0].abandonadas) 
            })
        })       
    }

    
    async logChamadasSimultaneas(empresa,campo,limit){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:logChamadasSimultaneas","message":err.message,"stack":err.stack});

                let sql = `SELECT ${campo} as total 
                            FROM ${empresa}_dados.log_chamadas_simultaneas
                        ORDER BY id DESC 
                        LIMIT ${limit}`
                const c = await this.querySync(conn,sql)
                if(c.length==0){
                    resolve(0)
                    return 0
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(c[0].total) 
            })
        })       
    }  


    //Conta as chamadas simultaneas
    async chamadasSimultaneas(empresa,parametro){        
        const totalChamadasSimultaneas = await Redis.getter(`${empresa}:totalChamadasSimultaneas`)
        if(totalChamadasSimultaneas===null){
            return 0
        }
        if(parametro=="conectadas"){
            return totalChamadasSimultaneas['chamadasConectadas']
        }else{
            return totalChamadasSimultaneas['chamadasSimultaneas']
        }   
    }    
    
    //Checando se a campanha possui fila de agentes configurada
    async filasCampanha(empresa,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - filasCampanha','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . PASSO 1.4',`Verifica a fila da Campanha`,empresa)
                const sql = `SELECT idFila, nomeFila 
                            FROM ${empresa}_dados.campanhas_filas WHERE idCampanha='${idCampanha}'`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(t[0].rows) 
            })
        })            
    }
    //Verifica mailings atribuidos na campanha
    async verificaMailing(empresa,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - verificaMailing','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . PASSO 1.5',`Verifica se existe mailing adicionado`,empresa)
                const sql = `SELECT idMailing 
                            FROM ${empresa}_dados.campanhas_mailing 
                            WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })       
    }
    //Verifica se o mailing da campanha esta pronto para discar
    async mailingConfigurado(empresa,idMailing){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - mailingConfigurado','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . PASSO 1.6',`Verifica se existe mailing configurado`,empresa)
                const sql = `SELECT id,tabela_dados,tabela_numeros 
                            FROM ${empresa}_dados.mailings
                            WHERE id=${idMailing} AND configurado=1`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })       
    }
    

    /** 
    *  PASSO 2 - PREPARAÇÃO DO DISCADOR
    **/
    //Verificando se existem agentes na fila
    

    
    //Recuperando os parametros do discador
    async parametrosDiscador(empresa,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - parametrosDiscador','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . . . . . PASSO 2.3 - Verificando configuração do discador','',empresa)
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_discador WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })              
    }

    /** 
    *  PASSO 3 - DISCAGEM
    **/
    async filtrosDiscagem(empresa,idCampanha,idMailing){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - filtrosDiscagem','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT tipo,valor,regiao
                            FROM ${empresa}_dados.campanhas_mailing_filtros 
                            WHERE idCampanha=${idCampanha} 
                            AND idMailing=${idMailing}`;
                const rows = await this.querySync(conn,sql)        
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })        
    }   
    
    /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FUNCOES DA TELA DO AGENTE
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */
    //Recupera o tipo de idAtendimento
    async modoAtendimento(empresa,ramal){
        const atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if(atendimentoAgente===null){
            return false
        }
        const modo_atendimento = atendimentoAgente['modo_atendimento']
        return modo_atendimento
    }

     //Dados do Agente
     async infoRegistro(empresa,idMailing,idRegistro){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - infoRegistro','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const infoMailing = await Mailing.infoMailing(empresa,idMailing)
                //console.log(infoMailing)
                const tabela = infoMailing[0].tabela_dados
                const sql = `SELECT * 
                            FROM ${empresa}_mailings.${tabela} 
                            WHERE id_key_base=${idRegistro}`
                const rows = await this.querySync(conn,sql)     
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })            
    }
    async log_chamadasSimultaneas(empresa,limit,tipo){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT ${tipo} AS chamadas 
                            FROM ${empresa}_dados.log_chamadas_simultaneas 
                            ORDER BY id DESC LIMIT ${limit}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(p[0].produtivas) 
            })
        })       
    }
}
export default new Discador()