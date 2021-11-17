import connect from '../Config/dbConnection';
import Asterisk from './Asterisk';
import Campanhas from './Campanhas';
import Mailing from './Mailing';
import Cronometro from './Cronometro';
import Filas from './Filas';
import moment from 'moment';
import Redis from '../Config/Redis'


class Discador{
    async debug(title="",msg="",empresa){
        //const debug=await this.mode(empresa)       
        // if(debug==1){
            //console.log(`${title}`,msg)
        // }
        return false
    }
   
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
    
    async mode(empresa){      
        return 0
    }
    /* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    * INFORMAÇÕES DO DISCADOR / AGENTES
    * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    */  

    //INFORMACOES DO AGENTE
    async agentesLogados(empresa){
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
                resolve(ul[0].logados) 
            })
        })                
    }
    
    async listarAgentesLogados(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"arquivo":"listarAgentesLogados.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT u.id,u.nome,u.usuario,r.estado
                            FROM ${empresa}_dados.users AS u
                            JOIN ${empresa}_dados.user_ramal AS r ON u.id=r.userId
                            WHERE r.estado>=1 ORDER BY r.datetime_estado DESC
                            LIMIT 5;`
                const q = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(q) 
            })
        })        
    }    

    async agentesPorEstado(empresa,estado){
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
                resolve(ul[0].agentes) 
            })
        })        
    }  
    
    async campanhasAtivasAgente(empresa,agente){
        const redis_campanhasAtivasAgente = await Redis.getter(`${empresa}:campanhasAtivasAgente:${agente}`)
        
        if(redis_campanhasAtivasAgente!==null){
            return redis_campanhasAtivasAgente
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
                await Redis.setter(`${empresa}:campanhasAtivasAgente:${agente}`,campanhasAtivasAgente)
                resolve(campanhasAtivasAgente) 
            })
        })              
    }

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

    async chamadasProdutividade_CampanhasAtivas_dia(empresa,statusProdutividade){
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

    async chamadasProdutividade_porCampanha(empresa,idCampanha,statusProdutividade,idMailing){
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
                resolve(p[0].produtivas) 
            })
        })       
    }

    async chamadasProdutividade_porMailing(empresa,statusProdutividade,idMailing){
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

    async chamadasAbandonadas_CampanhasAtivas(empresa){
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
                resolve(a[0].abandonadas) 
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

    async chamadasPorContato_dia(empresa,statusContatado){
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
                resolve(c[0].contatados) 
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


    async totalChamadas_CampanhasAtivas_dia(empresa){
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
                resolve(p[0].chamadas) 
            })
        })       
    }

    async chamadasEmAtendimento(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:chamadasEmAtendimento","message":err.message,"stack":err.stack});

                const sql = `SELECT COUNT(id) AS chamadas
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE falando=1`
                const c=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(c[0].chamadas) 
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



    async diaAtual(){
        const dia = moment().format("DD")
        const m =  moment().format("M")-1
        const meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']                
        return `${dia} de ${meses[m]}`
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
                resolve(a[0].atendimentos) 
            })
        })       

    }

    async chamadasManuais_Agente(empresa,idAgente){
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
                resolve(a[0].manuais) 
            })
        })       

    }
    
    async tempoFaladoAgente(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:tempoFaladoAgente","message":err.message,"stack":err.stack});

                const hoje = moment().format("Y-MM-DD")
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
                
                resolve(t[0].tempoFalado) 
            })
        })       
    }   
     
   /* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    * FUNCOES DO DISCADOOR
    * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    */      
     
   /** 
    *  PASSO 1 - VERIFICAÇÃO
    **/
    //Registrando chamadas simultaneas atuais no log 
    async registrarChamadasSimultaneas(empresa){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - registrarChamadasSimultaneas','Empresa nao recebida')
            return false
        }       
        
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`);
        if(chamadasSimultaneas===null){
            chamadasSimultaneas = []
        }

        console.log('Chamadas Simultaneas',chamadasSimultaneas)
        console.log('Totao de Chamadas Simultaneas',chamadasSimultaneas.length)       

        const chamando = chamadasSimultaneas.filter(chamadas => chamadas.event_chamando == 1)
        const emFila = chamadasSimultaneas.filter(chamadas => chamadas.event_na_fila == 1)
        const atendidas = chamadasSimultaneas.filter(chamadas => chamadas.event_em_atendimento == 1)

        const totalChamadasSimultaneas = {}
              totalChamadasSimultaneas['chamadasSimultaneas']=chamando.length+emFila.length
              totalChamadasSimultaneas['chamadasConectadas']=atendidas.length
              
        await Redis.setter(`${empresa}:totalChamadasSimultaneas`,totalChamadasSimultaneas,60)                
    }

    

    //Conta as chamadas simultaneas
    async chamadasSimultaneas(empresa,parametro){        
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - chamadasSimultaneas','Empresa nao recebida')
            return false
        }

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


     //Remove Chamadas presas nas chamadas simultaneas
    //Remove apenas as chamadas nao tratadas do power dentro da regra de limite disponivel
    /*async clearCalls(empresa){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - clearCalls','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:clearCalls","message":err.message, "stack":err.stack});
               
                const limitTime = 25 //tempo limite para aguardar atendimento (em segundos)
                let sql = `SELECT id,id_campanha,id_mailing,id_registro,id_numero,numero 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE tipo_discador='power'                      
                            AND TIMESTAMPDIFF(SECOND,data,NOW())>${limitTime}
                            AND (tratado=0 OR ramal=0) 
                        LIMIT 1`
                        
                const r = await this.querySync(conn,sql)
                if(r.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false)
                    return
                }
                const idChamada = r[0].id
                const idCampanha = r[0].id_campanha
                const idMailing  = r[0].id_mailing
                const idRegistro = r[0].id_registro
                const id_numero = r[0].id_numero        
                const infoMailing = await Mailing.infoMailing(empresa,idMailing)
                const tabela_numeros = infoMailing[0].tabela_numeros
                const numero = r[0].numero
                //atualizando campanhas_tabulacoes
                const contatado='N'
                const observacoes = 'Não Atendida'
                const tabulacao = 0
                const tipo_ligacao='discador'
                sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
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
                //removendo chamada simultanea
                sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                        WHERE id=${idChamada}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })    
                
    }*/

    async clearCallsCampanhas(empresa,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - clearCallsCampanhas','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:clearCallsCampanhas","message":err.message,"stack":err.stack});


                let sql = `SELECT id_campanha,tabela_numeros,id_numero,id_mailing
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id_campanha=${idCampanha} AND tipo_discador='power'`
                const infoChamada = await this.querySync(conn,sql)

                for(let i=0; i<infoChamada.length; i++){
                    const idCampanha = infoChamada[i].id_campanha
                    const idNumero = infoChamada[i].id_numero
                    const tabelaNumeros = infoChamada[i].tabela_numeros
                    const idMailing = infoChamada[i].id_mailing
                    //verifica tabulacao da campanha
                    sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
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
                }

                sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                        WHERE id_campanha=${idCampanha} AND falando=0 AND tipo_discador='power'`
                await this.querySync(conn,sql)
                sql = `UPDATE ${empresa}_dados.campanhas_status
                        SET mensagem="..." 
                        WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(true)
            })
        })       
    }

    async clearCallsAgent(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - clearCallsAgent','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:clearCallsAgent","message":err.message,"stack":err.stack});

                let sql = `SELECT id_campanha,tabela_numeros,id_numero,id_mailing
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE ramal=${ramal}`
                const infoChamada = await this.querySync(conn,sql)
                if(infoChamada.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false)
                    return
                }        
                const idCampanha = infoChamada[0].id_campanha
                const idNumero = infoChamada[0].id_numero
                const tabelaNumeros = infoChamada[0].tabela_numeros
                const idMailing = infoChamada[0].id_mailing

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

                //Remove o numero da chamada simultanea
                sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE ramal=${ramal}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(true)
               
            })
        })       
    }

    async clearCallbyId(empresa,idAtendimento){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - clearCallbyId','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:clearCallbyId","message":err.message,"stack":err.stack});


                let sql = `SELECT id_campanha,tabela_numeros,id_numero,id_mailing
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id=${idAtendimento}`
                const infoChamada = await this.querySync(conn,sql)
                if(infoChamada.length==0){
                return false
                }
                const idCampanha = infoChamada[0].id_campanha
                const idNumero = infoChamada[0].id_numero
                const tabelaNumeros = infoChamada[0].tabela_numeros
                const idMailing = infoChamada[0].id_mailing

                //verifica tabulacao da campanha
                sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                        SET estado=0, desc_estado='Disponivel'
                        WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} 
                        AND idNumero=${idNumero} AND produtivo <> 1`
                await this.querySync(conn,sql)

                if(tabelaNumeros!=0){
                    //Libera numero na base de numeros
                    sql = `UPDATE ${empresa}_mailings.${tabelaNumeros} 
                            SET discando=0   
                        WHERE id=${idNumero}`                
                    await this.querySync(conn,sql)
                }

                sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                        WHERE id=${idAtendimento}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(true)
            })
        })       
    }

    //Verifica se existem campanhas ativas
    async campanhasAtivas(empresa){   
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - campanhasAtivas','Empresa nao recebida')
            return false
        }

        const redis_campanhasAtivas = await Redis.getter(`${empresa}:campanhasAtivas`)
        if(redis_campanhasAtivas!==null){           
            return redis_campanhasAtivas
        }else{
            return new Promise (async (resolve,reject)=>{ 
                const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
                pool.getConnection(async (err,conn)=>{ 
                    if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});                

                    await this.debug(' . PASSO 1.3','Verificando Campanhas Ativas',empresa)     
                    const sql = `SELECT c.id,f.idFila,f.nomeFila,mc.idMailing,ml.tabela_dados,ml.tabela_numeros,d.tipo_discador,d.agressividade,d.tipo_discagem,d.ordem_discagem,d.modo_atendimento,d.saudacao
                                FROM ${empresa}_dados.campanhas AS c
                                JOIN ${empresa}_dados.campanhas_filas AS f ON c.id=f.idCampanha
                                JOIN ${empresa}_dados.campanhas_mailing AS mc ON mc.idCampanha=c.id
                                JOIN ${empresa}_dados.mailings AS ml ON ml.id=mc.idMailing
                                JOIN ${empresa}_dados.campanhas_discador AS d ON c.id=d.idCampanha
                                WHERE c.tipo='a' AND c.status=1 AND c.estado=1`
                                
                    const q = await this.querySync(conn,sql)
                    const rows = await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    await Redis.setter(`${empresa}:campanhasAtivas`,rows,7200)
                    resolve(rows) 
                })
            })      
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
    //Verifica se a campanha possui Agendamento
    async agendamentoCampanha(empresa,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - agendamentoCampanha','Empresa nao recebida')
            return false
        }
              
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . PASSO 1.7',`Verifica se existe mailing possui Agendamento`,empresa)
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
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - agendamentoCampanha_data','Empresa nao recebida')
            return false
        }

        const redis_dataCampanha = await Redis.getter(`${empresa}:dataCampanha:${idCampanha}`)
        if(redis_dataCampanha!==null){
            return redis_dataCampanha
        }
      
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . . PASSO 1.8',`Verifica se a campanha esta dentro da data de agendamento`,empresa)
                /*const sql = `SELECT id,inicio,termino
                               FROM ${empresa}_dados.campanhas_horarios 
                              WHERE id_campanha=${idCampanha}
                                AND inicio<='${hoje}' 
                                AND termino>='${hoje}'`;*/
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
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - agendamentoCampanha_data','Empresa nao recebida')
            return false
        }

        const redis_horarioCampanha = await Redis.getter(`${empresa}:horarioCampanha:${idCampanha}`)
        if(redis_horarioCampanha!==null){
            return redis_horarioCampanha
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . . . PASSO 1.8.1',`Verifica se a campanha esta dentro do horario de agendamento`,empresa)                                
                /*const sql = `SELECT id 
                            FROM ${empresa}_dados.campanhas_horarios 
                            WHERE id_campanha=${idCampanha} AND hora_inicio<='${hora}' AND hora_termino>='${hora}'`;*/
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

    

    

    

    /** 
    *  PASSO 2 - PREPARAÇÃO DO DISCADOR
    **/
    //Verificando se existem agentes na fila
    async agentesNaFila(empresa,idFila){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - agentesNaFila','Empresa nao recebida')
            return false
        }

        const redis_agentesNaFila = await Redis.getter(`${empresa}:agentesNaFila:${idFila}`)
        if(redis_agentesNaFila!==null){
            return redis_agentesNaFila
        }        

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . . . PASSO 2.1 - Verificando se existem agentes na fila','',empresa) 
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
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - agentesDisponiveis','Empresa nao recebida')
            return false
        }
        const redis_agentesDisponiveis = await Redis.getter(`${empresa}:agentesDisponiveis:${idFila}`)
        if(redis_agentesDisponiveis!==null){
            return redis_agentesDisponiveis
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . . . . PASSO 2.2 - Verificando se os agentes estao logados e disponiveis','',empresa) 
                /*const sql = `SELECT ramal 
                            FROM ${empresa}_dados.agentes_filas 
                            WHERE fila='${idFila}'
                                AND estado!=4 
                                AND estado!=0 
                                AND estado!=5
                                AND estado!=2`*/
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

    async totalChamadasSimultaneas(empresa,idCampanha){
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`) 
        if(chamadasSimultaneas===null){
            chamadasSimultaneas = []
        }

        const chamadasSimultaneasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha == idCampanha)
        console.log('chamadas Simultaneas Campanha',chamadasSimultaneasCampanha)
        //Percorre anteriores 
        for(let c=0;c<chamadasSimultaneasCampanha.length;c++){
            const statusChannel = await Asterisk.statusChannel(empresa,chamadasSimultaneasCampanha[c].id)
            
            if(statusChannel===false){
                //Removendo a chamada caso o canal nao exista    
                await this.removeChamadaSimultanea(empresa,chamadasSimultaneasCampanha[c])            
                chamadasSimultaneasCampanha.splice(c,1)
            }else{
                if(statusChannel['state']=='Down'){
                    chamadasSimultaneasCampanha[c].status='Chamando . . .'
                }
                if(statusChannel['state']=='Up'){
                   // console.log('>>>>>>>>>>>>>>>>>>>>>>> STATUS DE UP <<<<<<<<<<<<<<<<<<<')
                    if(statusChannel['App']=='AMD'){
                      //  console.log('>>>>>>>>>>>>>>>>>>>>>>> APP AMD <<<<<<<<<<<<<<<<<<<')
                        chamadasSimultaneasCampanha[c].status='Analisando'
                    }else if(statusChannel['App']=='Queue'){
                      //  console.log('>>>>>>>>>>>>>>>>>>>>>>> APP QUEUE <<<<<<<<<<<<<<<<<<<')
                        chamadasSimultaneasCampanha[c].status='Na Fila'
                    }
                }
                if(statusChannel['state']=='Ringing'){
                    if((statusChannel['App']=='Queue')||(statusChannel['App']=='AppQueue')){
                        chamadasSimultaneasCampanha[c].status='Na Fila'
                    }else if(statusChannel['App']=='AMD'){
                        chamadasSimultaneasCampanha[c].status='Analisando'
                    }else{
                        chamadasSimultaneasCampanha[c].status='Chamando . .'
                    }
                }                
            }
        }

        const chamadasSimultaneasOutrasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha != idCampanha)
        const chamadasSimultaneas_todasCampanhas = chamadasSimultaneasOutrasCampanha.concat(chamadasSimultaneasCampanha)
        await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasSimultaneas_todasCampanhas)

        return chamadasSimultaneasCampanha.length
       
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
    }


    

    //Modo novo de filtragem que adiciona os ids dos registros na tabela de tabulacao a medida que forem sendo trabalhados
    async filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - filtrarRegistro','Empresa nao recebida')
            return false
        }

        //console.log('tipoDiscador recebido',tipoDiscador)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

        
                let limit=limitRegistros;
                //console.log(empresa,"limit",limit)
                if(limitRegistros<0){
                    limit=0
                }else if(limitRegistros>10){
                    limit=10
                }
                //console.log(empresa,"limit",limit)

                if(tipoDiscador!="power"){
                    limit=1
                }

                /*REGRA PROVISÓRIA DE LIMITAÇÃO
                if(limit>5){
                    limit=5
                }*/
                //console.log(empresa,"limit",limit)
       
                await this.debug(' . . . . . . . . . . . PASSO 2.5 - Verificando se existem registros disponíveis','',empresa)
                //Estados do registro
                //0 - Disponivel
                //1 - Discando
                //2 - Na Fila
                //3 - Atendido
                //4 - Já Trabalhado 
                //filtrando
                //let filtro = await this.filtrosDiscagem(empresa,idCampanha,idMailing)   
        
                let sql 
                //VERIFICANDO NUMEROS NOVOS
                sql = `SELECT id as idNumero,id_registro,numero 
                        FROM ${empresa}_mailings.${tabela_numeros}
                        WHERE valido=1 AND discando=0 AND campanha_${idCampanha}>0
                    ORDER BY selecionado ASC, campanha_${idCampanha} ASC, id ${ordemDiscagem},RAND() 
                       LIMIT ${limit}`

                //console.log(empresa,'filtra reg',sql)
                    
                const n = await this.querySync(conn,sql)
                //console.log('--->Registros filtrados',n.length)
                for(let i=0;i<n.length;i++){
                    const idNumero   = n[i].idNumero
                    const idRegistro = n[i].id_registro
                    const numero     = n[i].numero       
                    //atualiza o numero como discando
                    sql = `UPDATE ${empresa}_mailings.${tabela_numeros} SET selecionado=selecionado+1 WHERE id=${idNumero}`
                    await this.querySync(conn,sql)

                    //CHECA SE O MESMO JA FOI TRABALHADO
                    sql = `SELECT id,max_tent_status
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing
                            WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} AND idNumero=${idNumero} LIMIT 1`
                    const r = await this.querySync(conn,sql)
                    //CASO NAO, INSERE O MESMO NO REGISTRO DE TABULACAO DA CAMPANHA
                    
                    if(r.length==0){
                        sql = `INSERT INTO ${empresa}_mailings.campanhas_tabulacao_mailing
                                            (data,idCampanha,idMailing,idRegistro,selecoes_registro,idNumero,selecoes_numero,numeroDiscado,estado,desc_estado,max_tent_status,tentativas) 
                                    VALUES (now(),${idCampanha},${idMailing},${idRegistro},0,${idNumero},0,'${numero}',0,'pre selecao',1,0)`
                        await this.querySync(conn,sql)
                    }
                    pool.end((err)=>{
                        if(err) console.error(err)
                    }) 
                    resolve(n) 
                    return                
                }      

                //FILTRA REGISTRO PARA DISCAGEM
                sql = `SELECT n.id as idNumero,n.id_registro,n.numero 
                        FROM ${empresa}_mailings.${tabela_numeros} AS n 
                    LEFT JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS t ON n.id=t.idNumero
                        WHERE idMailing=${idMailing} 
                        AND idCampanha=${idCampanha}
                        AND estado=0 
                        AND t.tentativas <= t.max_tent_status 
                        AND TIMESTAMPDIFF (MINUTE, data, NOW()) >= max_time_retry
                    ORDER BY t.tentativas ASC, n.id ${ordemDiscagem}
                        LIMIT ${limit}`
                        //console.log(empresa,'filtra reg 2',sql)
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
    })             
                
    }

    async checaNumeroOcupado(empresa,idCampanha,numero){ 
        let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`) 
        if(chamadasSimultaneas===null){
            chamadasSimultaneas = []
        }
        const chamadasSimultaneasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha == idCampanha)
        const numero = chamadasSimultaneasCampanha.filter(chamadas => chamadas.numero == numero)
        if(numero.length>0){
            return true
        }
        return false
    }

    async checandoRegistro(empresa,idRegistro){
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



    /** 
    *  PASSO 3 - DISCAGEM
    **/
    async registraNumero(empresa,idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - registraNumero','Empresa nao recebida')
            return false
        }
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
    }

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

    //Registra chamada simultanea
    async registraChamada(empresa,ramal,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,id_reg,id_numero,numero,fila){
        let tipo = 'discador'
        if(tipoDiscador=="manual"){
            tipo = 'manual'
        }  
        let atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`);
        if(atendimentoAgente===null){
            atendimentoAgente = {}
        }

        const hoje = moment().format("YYYY-MM-DD")
        const hora = moment().format("HH:mm:ss")
        const datetime = moment().format("YMMDDHHmmss")
        const protocolo = datetime+'0'+ramal

        const novaChamada = {}
              novaChamada['data']=hoje
              novaChamada['hora']=hora
              novaChamada['ramal']=ramal
              novaChamada['protocolo']=protocolo
              novaChamada['tipo_ligacao']=tipo
              novaChamada['tipo_discador']=tipoDiscador
              novaChamada['retorno']=0
              novaChamada['modo_atendimento']=modoAtendimento
              novaChamada['id_campanha']=idCampanha
              novaChamada['id_mailing']=idMailing
              novaChamada['tabela_dados']=tabela_dados
              novaChamada['tabela_numeros']=tabela_numeros
              novaChamada['id_registro']=id_reg
              novaChamada['id_numero']=id_numero
              novaChamada['numero']=numero
              novaChamada['fila']=fila
        atendimentoAgente.push(novaChamada)
        await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,atendimentoAgente,43200)
    }   

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

    //Busca a fila da campanha atendida
   /* async getQueueByNumber(empresa,numero){
        const sql = `SELECT id,fila AS Fila 
                       FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                      WHERE numero='${numero}' ORDER BY id DESC LIMIT 1`
        return await this.querySync(conn,sql)
    }*/
    //Atualiza registros em uma fila de espera
    async setaRegistroNaFila(empresa,idAtendimento){   
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - setaRegistroNaFila','Empresa nao recebida')
            return false
        }    
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT id,id_campanha,id_mailing,id_registro
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id='${idAtendimento}' 
                            ORDER BY id DESC LIMIT 1`
                const dadosAtendimento = await this.querySync(conn,sql)
                if(dadosAtendimento.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false) 
                    return 
                }       
                sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                        SET na_fila=1, tratado=1 
                            WHERE id=${idAtendimento}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(dadosAtendimento) 
            })
        })        
    }

    async saudadacao(empresa,numero){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - saudacao','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let saudacao = 'masculino'
                let sql = `SELECT id_campanha 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE numero='${numero}' ORDER BY id DESC LIMIT 1`
                const ch = await this.querySync(conn,sql)
                
                if(ch.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(saudacao) 
                    return ;
                }

                const idCampanha = ch[0].id_campanha
                sql = `SELECT saudacao 
                        FROM ${empresa}_dados.campanhas_discador
                        WHERE idCampanha='${idCampanha}'`        
                const s = await this.querySync(conn,sql)
                if((s[0].saudacao=="")||
                (s[0].saudacao==null)||
                (s[0].saudacao=="undefined")||
                (s[0].saudacao==undefined)){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(saudacao) 
                    return ;
                }
                saudacao=s[0].saudacao
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(saudacao) 
            })
        })        
    }
    
   /** 
    *  ATUALIZACAO DE STATUS E INFORMAÇÕES DO DISCADOR
    **/
    async atualizaStatus(empresa,idCampanha,msg,estado){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - atualizaStatus','Empresa nao recebida')
            return false
        }
        //console.log('!',msg,` -Empresa: ${empresa}  -Campanha: ${idCampanha}`)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //verificando se a campanha ja possui status
                const statusCampanha = await this.statusCampanha(empresa,idCampanha)                

                if(statusCampanha.length==0){
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
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })        
    }
    //Status atual de uma campanha 
    async statusCampanha(empresa,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - statusCampanha','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql =`SELECT * 
                            FROM ${empresa}_dados.campanhas_status 
                            WHERE idCampanha = ${idCampanha}`
                          //console.log(sql)
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    
                resolve(rows) 
            })
        })              
    }

    
    /*DISCAR*/
    async discar(empresa,ramal,numero,fila,saudacao,aguarde,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - discar','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                await this.debug(' . . . . . . . . . . . . . . PASSO 3.4 - Discando','',empresa)
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
                Asterisk.discar(empresa,fila,saudacao,aguarde,server,user,pass,modo,ramal,numero,idCampanha,async (e,call)=>{
                    if(e) throw e 
                    let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
                    if(chamadasSimultaneas===null){
                        chamadasSimultaneas=[]
                    }
                    console.log('UNIQUEID',call['id'])
                    const uniqueid = call['id']
                    const novaChamada={}
                          novaChamada['id'] = uniqueid
                          novaChamada['id_campanha'] = idCampanha
                          novaChamada['tipo'] = 'Discador'
                          novaChamada['tipo_discador'] = 'power'
                          novaChamada['ramal'] = ramal
                          novaChamada['numero'] = numero
                          novaChamada['status'] = 'Chamando ...'
                          novaChamada['horario'] = moment().format("HH:mm:ss")
                    console.log('dados chamada', novaChamada)
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

   /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FIM DAS FUNCOES DO DISCADOR
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */

   /*Funcoes auxiliares do dicador******************************************************************************/
    //Registra o histórico de atendimento de uma chamada
    async registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,id_registro,id_numero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - registrarHistoricoAtendimento','Empresa nao recebida')
            return false
        }
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

    async agendandoRetorno(empresa,ramal,campanha,mailing,id_numero,id_registro,numero,data,hora){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - tabulaChamada','Empresa nao recebida')
            return false
        }
        await Redis.delete(`${empresa}:retornos`)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

        
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

    async checaAgendamento(empresa,data,hora){
        const redis_agendaRetornos = await Redis.getter(`${empresa}:retornos`)
        if(redis_agendaRetornos!==null){
            return redis_agendaRetornos
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT a.id 
                               FROM ${empresa}_dados.campanhas_agendamentos AS a 
                               JOIN ${empresa}_dados.user_ramal AS u ON u.ramal=a.ramal 
                              WHERE u.estado=1 AND a.data_retorno <= '${data}' AND a.hora_retorno<='${hora}' AND a.tratado=0
                           ORDER BY id ASC
                              LIMIT 1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.setter(`${empresa}:retornos`,rows)
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

                let atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`);
                if(atendimentoAgente===null){
                    atendimentoAgente = {}
                }
                const ramal=a[0].ramal
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
                const tabela_dados = infoMailing[0].tabela_dados
                const tabela_numeros = infoMailing[0].tabela_numeros
                const id_registro=a[0].id_registro
                const id_numero=a[0].id_numero
                const numero=a[0].numero
                const fila='0'
        
                const novoRetorno = {}
                      novoRetorno['data']=hoje
                      novoRetorno['hora']=hora
                      novoRetorno['ramal']=ramal
                      novoRetorno['protocolo']=protocolo
                      novoRetorno['tipo_ligacao']=tipo_ligacao
                      novoRetorno['tipo_discador']=tipo_discador
                      novoRetorno['retorno']=1
                      novoRetorno['modo_atendimento']=modo_atendimento
                      novoRetorno['id_campanha']=id_campanha
                      novoRetorno['id_mailing']=id_mailing
                      novoRetorno['tabela_dados']=tabela_dados
                      novoRetorno['tabela_numeros']=tabela_numeros
                      novoRetorno['id_registro']=id_registro
                      novoRetorno['id_numero']=id_numero
                      novoRetorno['numero']=numero
                      novoRetorno['fila']=fila
                atendimentoAgente.push(novoRetorno)
                await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,atendimentoAgente,43200)

                await this.alterarEstadoAgente(empresa,ramal,3,0)

                sql = `UPDATE ${empresa}_dados.campanhas_agendamentos 
                          SET tratado=1 
                        WHERE id=${idAgendamento}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                await Redis.delete(`${empresa}:retornos`)
                resolve(true)
                return  
            })
        })         
    }   
                        
    async tabulaChamada(empresa,idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal,idNumero,removeNumero){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - tabulaChamada','Empresa nao recebida')
            return false
        }  
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{                 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

        
                const dadosAtendimento = await this.dadosAtendimento(empresa,idAtendimento)
                if(dadosAtendimento.length === 0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false) 
                    return false
                }

                //Dados do atendimento
                const tabelaNumero = dadosAtendimento[0].tabela_numeros
                const tabelaDados = dadosAtendimento[0].tabela_dados
                const idRegistro = dadosAtendimento[0].id_registro
                const idMailing = dadosAtendimento[0].id_mailing
                const idCampanha = dadosAtendimento[0].id_campanha
                const protocolo = dadosAtendimento[0].protocolo
                const uniqueid = dadosAtendimento[0].uniqueid
                const tipo_ligacao = dadosAtendimento[0].tipo_ligacao

                    
                let sql = `SELECT numero 
                        FROM ${empresa}_mailings.${tabelaNumero} 
                        WHERE id=${idNumero}`
                
                const nd = await this.querySync(conn,sql)
                const numero = nd[0].numero

                const nome_registro=await this.campoNomeRegistro(empresa,idMailing,idRegistro,tabelaDados);

            

                let estado =0
                let desc_estado  =""
                if(produtivo==1){
                    estado=4
                    desc_estado='Já Trabalhado'
                

                    //console.log(`estado produtivo`,estado)
                    //Verifica se todos os numeros do registro ja estao marcados na tabulacao
                    sql = `SELECT id,numero 
                            FROM ${empresa}_mailings.${tabelaNumero} 
                            WHERE id_registro=${idRegistro}`
                    const numbers = await this.querySync(conn,sql)
                
                    for(let i = 0; i < numbers.length; i++){
                        sql = `SELECT id
                                FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                                WHERE idRegistro=${idRegistro} AND idMailing=${idMailing} AND idCampanha=${idCampanha} AND idNumero=${numbers[i].id}`
                        const n = await this.querySync(conn,sql)


                        
                        if(n.length==0){
                            sql = `INSERT INTO ${empresa}_mailings.campanhas_tabulacao_mailing 
                                            (data,numeroDiscado,agente,estado,desc_estado,contatado,tabulacao,produtivo,observacao,tentativas,max_time_retry,idRegistro,idMailing,idCampanha,idNumero)
                                    VALUES (now(),'${numero}','${ramal}','${estado}','${desc_estado}','${contatado}',${status_tabulacao},'${produtivo}','${observacao}',1,0,${idRegistro},${idMailing},${idCampanha},${numbers[i].id})` 
                            
                            await this.querySync(conn,sql)
                        }
                    }

                    //Grava tabulacao na tabela do numero atualizando todos numeros do registro
                    sql = `UPDATE ${empresa}_mailings.${tabelaNumero} 
                                SET tentativas=tentativas+1, 
                                    contatado='${contatado}', 
                                    status_tabulacao=${status_tabulacao}, 
                                    produtivo='${produtivo}', 
                                    discando=0,
                                    campanha_${idCampanha}=-1
                                WHERE id_registro = ${idRegistro}`
                    await this.querySync(conn,sql)
                }else{
                    estado=0
                    desc_estado='Disponivel'
                    if(removeNumero==1){
                        sql = `UPDATE ${empresa}_mailings.${tabelaNumero} 
                                SET valido=0, erro='Numero descartado na tabulacao'
                                WHERE id = ${idNumero}`
                        await this.querySync(conn,sql)
                    }

                
                    
                    //Grava tabulacao na tabela do numero
                    sql = `UPDATE ${empresa}_mailings.${tabelaNumero} 
                            SET tentativas=tentativas+1, 
                                contatado='${contatado}', 
                                status_tabulacao=${status_tabulacao}, 
                                produtivo='${produtivo}', 
                                discando=0
                            WHERE id = ${idNumero}`
                    await this.querySync(conn,sql)
                }  

                
                Cronometro.encerrouTabulacao(empresa,idCampanha,numero,ramal,status_tabulacao)
            

                //Tempo de volta do registro 
                let tempo=0
                sql=`SELECT tempoRetorno,maxTentativas
                        FROM ${empresa}_dados.tabulacoes_status 
                    WHERE id=${status_tabulacao}` 
                const st = await this.querySync(conn,sql)    
                let maxTentativas = 1
                if(st.length!=0){     
                    maxTentativas   = st[0].maxTentativas         
                    const horario = st[0].tempoRetorno;
                    let time = horario.split(':');
                    let horas = parseInt(time[0]*60)
                    let minutos = parseInt(time[1])
                    let segundos = parseInt(time[2]/60)
                    tempo = parseInt(horas+minutos+segundos)
                }         


                
                
                //Marca chamada simultanea como tabulada
                sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                        SET data=now(), 
                            numeroDiscado='${numero}', 
                            agente='${ramal}', 
                            estado='${estado}', 
                            desc_estado='${desc_estado}', 
                            contatado='${contatado}', 
                            tabulacao=${status_tabulacao}, 
                            max_tent_status=${maxTentativas},
                            max_time_retry=${tempo},
                            produtivo='${produtivo}', 
                            observacao='${observacao}', 
                            tentativas=tentativas+1 
                        WHERE idRegistro=${idRegistro} 
                        AND idMailing=${idMailing} 
                        AND idCampanha=${idCampanha} 
                        AND idNumero=${idNumero}`      
                
                await this.querySync(conn,sql)   

                //Deixa indisponiveis todos os produtivos
                sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                        SET estado=4, desc_estado='Já trabalhado'
                        WHERE produtivo=1`
                await this.querySync(conn,sql)  
                
                await Redis.delete(`${empresa}:historicoChamadas:${ramal}`)
                //Grava informações no histórico de chamadas
                sql = `INSERT INTO ${empresa}_dados.historico_atendimento 
                                    (data,hora,campanha,mailing,id_registro,id_numero,nome_registro,agente,protocolo,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado,produtivo) 
                            VALUES (now(),now(),${idCampanha},${idMailing},${idRegistro},${idNumero},'${nome_registro}',${ramal},'${protocolo}','${uniqueid}','${tipo_ligacao}','${numero}',${status_tabulacao},'${observacao}','${contatado}',${produtivo}) `
                await this.querySync(conn,sql)

            
                
                //Verifica se a chamada ja foi desligada 
                if(dadosAtendimento[0].desligada==1){
                    //Remove chamada simultanea 
                    await this.clearCallsAgent(empresa,ramal);
                    //Atualiza estado do agente para disponivel
                    await this.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
                }else{          
                    //Atualiza a tabela da chamada simultanea como tabulando
                    sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                            SET tabulado=1
                            WHERE id=${idAtendimento}`
                    await this.querySync(conn,sql)
                }
                
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })         
    }

   
    //Muda o status do agente
    async alterarEstadoAgente(empresa,agente,estado,pausa){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - alterarEstadoAgente','Empresa nao recebida')
            return false
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
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //Recuperando estado anterior do agente
                const estadoAnterior = await this.infoEstadoAgente(empresa,agente)
                const horaAtual = moment().format("YYYY-MM-DD HH:mm:ss")
                const estadoAgente={}
                //Removendo informação anterior do Redis
                await Redis.delete(`${agente}:estadoRamal`)

                //zerando cronometro do estado anterior


                let sql
                //REMOVENDO AGENTE DE PAUSA
                if(estadoAnterior==2){//Caso o agente venha de uma pausa    
                    //Remove o agente da lista dos agentes pausados
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
                                if(err) console.log('Discador.js 1998', err)
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
                                if(err) console.log('Discador.js 2028', err )
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
                                    if(err) console.log('Discador.js 2053', err )
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
                                    if(err) console.log('Discador.js ...', err )
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
                            if(err) console.log('Discador.js ...', err )
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
                           if(err) console.log('Discador.js ...', err )
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
                                   if(err) console.log('Discador.js ...', err )
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
                            if(err) console.log('Discador.js ...', err )
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
                                   if(err) console.log('Discador.js ...', err )
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

    //Retorna o status de pausa do agente
    async infoEstadoAgente(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - infoEstadoAgente','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT * 
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

    //Desliga Chamada
    async desligaChamada(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - desligaChamada','Empresa nao recebida')
            return false
        }        
        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE ramal=${ramal}`
                const infoChamada = await this.querySync(conn,sql)
                if(infoChamada.length==0){
                    pool.end((err)=>{
                        if(err) console.error(err)
                        }) 
                    resolve(false)
                    return false
                }
                const idAtendimento = infoChamada[0].id
                const idCampanha = infoChamada[0].id_campanha
                //removendo das chamadas simultaneas
                let chamadasAtendidas = await Redis.getter(`${empresa}:chamadasSimultaneasCampanha:${idCampanha}:atendidas`) 
                for(let c=0;c<chamadasAtendidas.length;c++){
                    if(chamadasAtendidas[c].idAtendimento==idAtendimento){
                        chamadasAtendidas.splice(c,1)
                    }
                }
                await Redis.setter(`${empresa}:chamadasSimultaneasCampanha:${idCampanha}:atendidas`,chamadasAtendidas)

                sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                        SET desligada=1 
                        WHERE id=${idAtendimento}`
                await this.querySync(conn,sql)               

                //Para cronometro do atendimento
                await Cronometro.saiuLigacao(empresa,infoChamada[0].id_campanha,infoChamada[0].numero,ramal)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(infoChamada) 
            })
        })         

    }

    //Desliga Chamada
    async desligaChamadaNumero(empresa,idcampanha,numero,ramal){      
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - desligaChamadaNumero','Empresa nao recebida')
            return false
        }

        //removendo das chamadas simultaneas
        let chamadasAtendidas = await Redis.getter(`${empresa}:chamadasSimultaneasCampanha:${idcampanha}:atendidas`) 
        for(let c=0;c<chamadasAtendidas.length;c++){
            if(chamadasAtendidas[c].numero==numero){
                chamadasAtendidas.splice(c,1)
            }
        }
        await Redis.setter(`${empresa}:chamadasSimultaneasCampanha:${idcampanha}:atendidas`,chamadasAtendidas)

        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                        SET desligada=1
                        WHERE numero=${numero}`
                await this.querySync(conn,sql)

                //Para cronometro do atendimento
                await Cronometro.saiuLigacao(empresa,idcampanha,numero,ramal)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })         
    }

    //Desliga Chamada
    async removeChamadaSimultaneasAbandonadas(empresa,idAtendimento){     
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - removeChamadaSimultanea','Empresa nao recebida')
            return false
        } 
        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id=${idAtendimento} AND ramal=0`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })         
    }

    async removeChamadaSimultaneas(empresa,idAtendimento,idCampanha){     
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - removeChamadaSimultanea','Empresa nao recebida')
            return false
        } 
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                
                //removendo das chamadas simultaneas
                let chamadasAtendidas = await Redis.getter(`${empresa}:chamadasSimultaneasCampanha:${idCampanha}:atendidas`) 
                for(let c=0;c<chamadasAtendidas.length;c++){
                    if(chamadasAtendidas[c].idAtendimento==idAtendimento){
                        chamadasAtendidas.splice(c,1)
                    }
                }
                await Redis.setter(`${empresa}:chamadasSimultaneasCampanha:${idCampanha}:atendidas`,chamadasAtendidas)


                const sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id=${idAtendimento}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true) 
            })
        })         
    }




    



    /*Funcoes de resposta aos scripts do Asterisk******************************************************************/
    //Retorna as informações da chamada pelo número discador
    async dadosAtendimento_byNumero(empresa,numero){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - dadosAtendimento_byNumero','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //Separando a campanha que o agente pertence
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE numero='${numero}'`
                            //console.log(sql)
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })         
    }

    //Retorna as informações da chamada pelo id de atendimento
    async dadosAtendimento(empresa,idAtendimento){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - dadosAtendimento','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //Separando a campanha que o agente pertence
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id='${idAtendimento}'`
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

    //Retorna o estado atual do agente
    async statusRamal(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - statusRamal','Empresa nao recebida')
            return false
        }
        const redis_estadoRamal = await Redis.getter(`${ramal}:estadoRamal`)
        if(redis_estadoRamal!==null){
            return redis_estadoRamal
        }


        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`mysql`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //console.log(empresa,ramal)
                const sql = `SELECT estado, datetime_estado as tempo
                            FROM ${empresa}_dados.user_ramal 
                            WHERE ramal=${ramal}
                            LIMIT 1`        
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                const horaAtual = moment().format("YYYY-MM-DD HH:mm:ss")
                const estadoAgente = {}
                      estadoAgente['estado']=rows[0].estado
                      estadoAgente['hora']=rows[0].tempo                    
                await Redis.setter(`${ramal}:estadoRamal`,estadoAgente)

                resolve(estadoAgente) 
            })
        })         
       

    }

    //Status de pausa do agente
    async infoPausaAgente(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - infoPausaAgente','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

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


    //Recupera o tipo de idAtendimento
    async modoAtendimento(empresa,ramal){
        const atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if(atendimentoAgente===null){
            return false
        }

        const modo_atendimento = atendimentoAgente['modo_atendimento']
        return modo_atendimento
    }
       
    //Informações da chamada a ser atendida
    async infoChamada_byDialNumber(empresa,idMailing,idCampanha){       
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});
                //Seleciona os campos de acordo com a configuração da tela do agente
                //CAMPOS DE DADOS
                let sql = `SELECT cd.id,cd.campo,cd.apelido
                             FROM ${empresa}_dados.mailing_tipo_campo AS cd
                             JOIN ${empresa}_dados.campanhas_campos_tela_agente as cc ON cd.id=cc.idCampo
                            WHERE cc.idMailing=${idMailing}
                              AND cc.idCampanha=${idCampanha}
                              AND (cd.tipo='dados' OR cd.tipo='nome' OR cd.tipo='cpf')
                         ORDER BY cc.ordem ASC`;
                const campos_dados = await this.querySync(conn,sql)
                const info = {}
                //montando a query de busca dos dados
                for(let i=0; i<campos_dados.length; i++){
                    let apelido=''
                    if(campos_dados[i].apelido === null){
                        apelido=campos_dados[i].campo
                    }else{
                        apelido=campos_dados[i].apelido
                    }  
                    //console.log('Info Chamada - Valor do Campo',campos_dados[i].campo)
                    let nomeCampo = campos_dados[i].campo.toString().replace(" ", "_").replace("/", "_").normalize("NFD").replace(/[^a-zA-Z0-9]/g, "");
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
        })   
    }

    async tabulacoesNumero(empresa,id,numero){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - tabulacoesNumero','Empresa nao recebida')
            return false
        }
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

    //Retorna o valor do campo nome do registro caso exista
    async campoNomeRegistro(empresa,idMailing,idRegistro,tabelaDados){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - campoNomeRegistro','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT campo 
                            FROM ${empresa}_dados.mailing_tipo_campo 
                            WHERE idMailing=${idMailing}
                            AND tipo='nome'`
                const campoNome = await this.querySync(conn,sql)
                if(campoNome.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false)
                    return 
                }
                const campo = campoNome[0].campo
                sql = `SELECT ${campo} as nome
                        FROM ${empresa}_mailings.${tabelaDados}
                        WHERE id_key_base=${idRegistro}`
                        //console.log(sql)
                const nome = await this.querySync(conn,sql)
                if(nome.length==0){
                    resolve('sem nome')
                    return false
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                   
                resolve(nome[0].nome) 
            })
        })         
    }

    async campoCpfRegistro(empresa,idMailing,idRegistro,tabelaDados){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - campoNomeRegistro','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT campo 
                            FROM ${empresa}_dados.mailing_tipo_campo 
                            WHERE idMailing=${idMailing}
                            AND tipo='cpf'`
                const campoNome = await this.querySync(conn,sql)
                if(campoNome.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false)
                    return 
                }
                const campo = campoNome[0].campo
                sql = `SELECT ${campo} as cpf
                        FROM ${empresa}_mailings.${tabelaDados}
                        WHERE id_key_base=${idRegistro}`
                const nome = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(nome[0].cpf) 
            })
        })         
    }

    //Informações da chamada a ser atendida
    async infoChamada_byRamal(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - infoChamada_byRamal','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //Separando a campanha que o agente pertence
                let sql = `SELECT id,
                                protocolo,
                                tipo_discador,
                                id_registro,
                                id_campanha,
                                id_mailing,
                                numero,
                                tabela_dados,
                                tabela_numeros
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE ramal='${ramal}' AND falando=1`
                const calldata = await this.querySync(conn,sql)
                if(calldata.length==0){
                    pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(false)
                    return false
                }
                const tipo_discador = calldata[0].tipo_discador
                const idMailing = calldata[0].id_mailing
                const idReg = calldata[0].id_registro
                const tabela_dados = calldata[0].tabela_dados
                const tabela_numeros = calldata[0].tabela_numeros
                const idCampanha = calldata[0].id_campanha
                const protocolo = calldata[0].protocolo
                const numero = calldata[0].numero

                //Seleciona os campos de acordo com a configuração da tela do agente
                //CAMPOS DE DADOS
                sql = `SELECT id,campo,apelido
                        FROM ${empresa}_dados.mailing_tipo_campo 
                        WHERE idMailing=${idMailing}
                        AND (tipo='dados' OR tipo='nome')
                    ORDER BY ordem ASC`;
            
                const campos_dados = await this.querySync(conn,sql)
                //montando a query de busca dos dados
                const info = {};
                    info['tipo_discador']=tipo_discador
                    info['idAtendimento']=calldata[0].id
                    info['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(empresa,idCampanha)
                    info['idMailing']=idMailing
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
                    //console.log('Valor do Campo',campos_dados[i].campo)
                    let nomeCampo = campos_dados[i].campo.replace(" ", "_").replace("/", "_").normalize("NFD").replace(/[^a-zA-Z0-9]/g, "");
                    sql = `SELECT ${nomeCampo} AS 'valor' 
                            FROM ${empresa}_mailings.${tabela_dados} 
                        WHERE id_key_base='${idReg}'` 
                    let value = await this.querySync(conn,sql)
                    info['campos'][apelido]=value[0].valor
                }        
            
                info['numeros']=[]
                //CAMPOS DE TELEFONE
                sql = `SELECT numero
                            FROM ${empresa}_mailings.${tabela_numeros}
                            WHERE id_registro='${idReg}'
                        ORDER BY id ASC`;
                const campos_numeros = await this.querySync(conn,sql)
                for(let i=0; i<campos_numeros.length; i++){
                    info['numeros'].push(`${campos_numeros[i].numero}`);
                }
                info['numeros_discado']=numero
                sql = `SELECT id,nome,descricao 
                        FROM ${empresa}_dados.campanhas 
                        WHERE id=${idCampanha}`
                const dadosCampanha = await this.querySync(conn,sql)
                
                info['dadosCampanha']=dadosCampanha
                
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(info) 
            })
        })         
    } 

    //Atende a chamada, atualiza a chamada simultanea e retorna os dados da mesma com os históricos do registro
    async atendeChamada(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - atendeChamada','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //Separando a campanha que o agente pertence
                let sql = `SELECT id 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE ramal='${ramal}' AND tratado=1`
                const calldata = await this.querySync(conn,sql)
                if(calldata.length==0){
                    return "Chamada interna"
                }
                const idAtendimento = calldata[0].id
                //Atualiza chamada simultanea com o status de falando
                sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                        SET atendido=0, 
                            falando=1 
                        WHERE id='${idAtendimento}'`;
                await this.querySync(conn,sql)        
                const rows = await this.infoChamada_byIdAtendimento(empresa,idAtendimento)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })         
    }

    async dadosChamadaAtendida(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - dadosChamadaAtendida','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:dadosChamadaAtendida","message":err.message,"stack":err.stack});
                     
                //Separando a campanha que o agente pertence
                let sql = `SELECT id 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE ramal='${ramal}' 
                            AND (tipo_ligacao='discador' OR tipo_ligacao='retorno' OR tipo_ligacao='manual')`
                            //discador='power' OR tipo_discador='preview' OR tipo_discador='clicktocall')`
                const calldata = await this.querySync(conn,sql)
                if(calldata.length==0){
                    
                    resolve({"sistemcall":false,"dialcall":false})
                    return 
                }
                const idAtendimento = calldata[0].id           
                const rows = await this.infoChamada_byIdAtendimento(empresa,idAtendimento)  
                pool.end((err)=>{
                    if(err) console.error(err)
                }) 
                resolve(rows) 
            })
        })         
    }

    async infoChamada(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - infoChamada','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql = `SELECT *
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE ramal='${ramal}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })         
    }

    //Dados do Agente
    async infoAgente(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - infoAgente','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                const sql = `SELECT id as ramal, nome 
                            FROM ${empresa}_dados.users 
                            WHERE id=${ramal}`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(rows) 
            })
        })              
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

    //Retorna o histórico de atendimento do registro
    async historicoRegistro(empresa,idMailing,idReg){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - historicoRegistro','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});


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
                resolve(historico) 
            })
        })         
    }

    async historicoRegistroChamadaManual(empresa,numero,agente){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - historicoRegistro','Empresa nao recebida')
            return false
        }    
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{     
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

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
                resolve(dados) 
            })
        })          
    }

    //Retorna o histórico de atendimento do agente
    async historicoChamadas(empresa,ramal){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - historicoChamadas','Empresa nao recebida')
            return false
        }


        //Checa se existem chamadas no redis
        let historico = await Redis.getter(`${empresa}:historicoChamadas:${ramal}`)
        if(historico!==null){
            console.log(`Retornando historico de chamadas do ramal ${ramal} do redis`)
            return historico
        }


        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

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

    async gravaDadosChamadaManual(empresa,numero,nome,observacoes){
        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

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

    async tentativasChamadasManuais(empresa,tipo,data){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                let sql
                if(tipo=="clicks"){
                    sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE tipo='manual' AND data='${data}'`
                }
                if(tipo=="chamadas"){
                    sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_dados.tempo_ligacao
                            WHERE tipoDiscador='manual' AND entrada>='${data} 00:00:00' AND saida<='${data} 23:59:59'`
                }
                const t = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(t[0].total)
            })
        }) 
    }

    async voltaRegistro(empresa,idHistorico){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

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
                sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                    WHERE ramal='${ramal}'`
                //console.log('sql delete',sql)
                await this.querySync(conn,sql)
                //console.log(h[0].mailing)
                const infoMailing = await Mailing.infoMailing(empresa,h[0].mailing)
                let tabela_dados = ''
                let tabela_numeros = ''
                if(infoMailing.length>0){
                    tabela_dados = infoMailing[0].tabela_dados
                    tabela_numeros = infoMailing[0].tabela_numeros
                }               

                sql = `INSERT INTO ${empresa}_dados.campanhas_chamadas_simultaneas 
                                            (data,ramal,protocolo,tipo_ligacao,tipo_discador,retorno,modo_atendimento,
                                            id_campanha,
                                            id_mailing,
                                            tabela_dados,
                                            tabela_numeros,
                                            id_registro,
                                            id_numero,
                                            numero,
                                            fila,
                                            tratado,
                                            atendido,
                                            na_fila,
                                            falando) 
                                    VALUES (now(),
                                            '${ramal}',
                                            '${h[0].protocolo}',
                                            'discador',
                                            'clicktocall',
                                            0,
                                            'manual',
                                            '${h[0].campanha}',
                                            '${h[0].mailing}',
                                            '${tabela_dados}',
                                            '${tabela_numeros}',
                                            ${h[0].id_registro},
                                            ${h[0].id_numero},
                                            ${h[0].numero_discado},
                                            '',
                                            1,
                                            0,
                                            0,
                                            0)`
                                        //  //console.log('sql insert',sql)                        
                    await this.querySync(conn,sql)

                    await this.alterarEstadoAgente(empresa,ramal,5,0)
                    //console.log(estado)
                
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(true)
            })
        }) 
    }

    

    //Verifica Lista de tabulacao da campanha
    async tabulacoesCampanha(empresa,nome,idCampanha){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - tabulacoesCampanha','Empresa nao recebida')
            return false
        }
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
                    return tabulacoes
                }
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(false)
            })
        }) 
    }
    //Atualiza a chamada como tabulando
    async preparaRegistroParaTabulacao(empresa,idAtendimento){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - preparaRegistroParaTabulacao','Empresa nao recebida')
            return false
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados',`${empresa}_dados`)
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"arquivo":"Discador.js:","message":err.message,"stack":err.stack});

                //Atualiza Chamada como tabulando 
                const sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas
                                SET falando=1, tabulando=1 
                            WHERE id='${idAtendimento}'`;
                await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                    resolve(true) 
            })
        }) 
    }


    //INTEGRAÇÕES
    async integracoes(empresa,numeroDiscado,idCampanha,ramal){
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
                    }) 
                    resolve({"status":false})
                    return 
                }

                sql = `SELECT *
                        FROM ${empresa}_dados.campanhas_integracoes_disponiveis 
                        WHERE id=${i[0].idIntegracao}` 
                const info = await this.querySync(conn,sql)
                let url = await this.trataUrlIntegracao(empresa,numeroDiscado,ramal,info[0].url)

                const  infoInt={}
                    infoInt['status']=true
                    infoInt['modo']=info[0].modoAbertura
                    infoInt['link']=url
                pool.end((err)=>{
                    if(err) console.error(err)
                    }) 
                resolve(infoInt)
            })
        }) 
    }   

    async trataUrlIntegracao(empresa,numeroDiscado,ramal,url){
        const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        const idMailing = dadosAtendimento['id_mailing']
        const idRegistro = dadosAtendimento['id_registro']
        const idCampanha = dadosAtendimento['id_campanha']
        const tabelaDados = dadosAtendimento['tabela_dados']

        const cpf = await this.campoCpfRegistro(empresa,idMailing,idRegistro,tabelaDados)
        const nomeCliente = await this.campoNomeRegistro(empresa,idMailing,idRegistro,tabelaDados)
        const link = url.replace('{CPF}',cpf)
                        .replace('{RAMAL}',ramal)
                        .replace('{NUMERO_DISCADO}',numeroDiscado)
                        .replace('{ID_CAMPANHA}',idCampanha)
                        .replace('{NOME_CLIENTE}',nomeCliente)
        return(link)
    }






    
    

    
    //EM REFATORACAO
    

   
    
    
    
    

    /*discarCB(ramal,numero,callback){
        //Recuperando dados do asterisk
        const sql=`SELECT * FROM asterisk_ari WHERE active=1`;
        connect.banco.query(sql,(e,asterisk_server)=>{
            if(e) throw e;
            
            const modo='discador'
            const server = asterisk_server[0].server
            const user =  asterisk_server[0].user
            const pass =  asterisk_server[0].pass
            
            //Asterisk.discar(server,user,pass,modo,ramal,numero,callback)          
        })
    }*/


    //FUNCOES DE APOIO AO ASTERISK
    

   

    

   

    //######################Funções do atendente######################
   
   

    //CAMPOS DE DADOS
    /*camposChamada(empresa,idAtendimento,idReg,tabela,numero,idCampanha,protocolo,callback){
        const sql = `SELECT c.id,c.campo,c.apelido 
                      FROM ${empresa}_dados.mailing_tipo_campo AS c 
                      JOIN ${empresa}_dados.campanhas_campos_tela_agente AS s ON c.id=s.idCampo
                      WHERE c.tipo='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} 
                      ORDER BY s.ordem ASC`;
        connect.banco.query(sql,(e,campos_dados)=>{
            if(e) throw e

            //montando a query de busca dos dados
            let campos = '';
            for(let i=0; i<campos_dados.length; i++){
                let apelido=''
                if(campos_dados[i].apelido === null){
                    apelido=campos_dados[i].campo
                }else{
                    apelido=campos_dados[i].apelido
                }
                campos += `${campos_dados[i].campo} as ${apelido}, `
            }
            campos += 'id_key_base'

            const sql = `SELECT ${campos} FROM ${empresa}_dados.${tabela} WHERE id_key_base=${idReg}`
            connect.mailings.query(sql,(e,dados)=>{
                if(e) throw e
                
                //CAMPOS DE TELEFONE
                const sql = `SELECT c.id,c.campo,c.apelido 
                              FROM ${empresa}_dados.mailing_tipo_campo AS c 
                              JOIN ${empresa}_dados.campanhas_campos_tela_agente AS s ON c.id=s.idCampo 
                              WHERE c.tipo!='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
                connect.banco.query(sql,(e,campos_numeros)=>{
                    if(e) throw e

                    //montando a query de busca dos numeros
                    let campos = '';
                    for(let i=0; i<campos_numeros.length; i++){
                        let apelido=''
                        if(campos_numeros[i].apelido === null){
                            apelido=campos_numeros[i].campo
                        }else{
                            apelido=campos_numeros[i].apelido
                        }
                        campos += `${campos_numeros[i].campo} as ${apelido}, `
                    }
                    campos += 'id_key_base'
     
                    const sql = `SELECT ${campos} FROM ${empresa}_dados.${tabela} WHERE id_key_base=${idReg}`
                    connect.mailings.query(sql,(e,numeros)=>{
                        if(e) throw e
                               
                        let camposRegistro = '{"campos":{"dados":'+JSON.stringify(dados)+',' 
                        camposRegistro += '"numeros":'+JSON.stringify(numeros)+'},'
                        //Numero Discado
                        camposRegistro += `"numero_discado":{"protocolo":"${protocolo}","telefone":"${numero}","id_atendimento":${idAtendimento}},`;
                                    
                        //Informações da campanha
                        Campanhas.dadosCampanha(idCampanha,(e,dadosCampanha)=>{
                            if(e) throw e

                            camposRegistro += `"info_campanha":{"idCampanha":"${idCampanha}","nome":"${dadosCampanha[0].nome}","descricao":"${dadosCampanha[0].descricao}"}}`;
                            //console.log(camposRegistro)
                            callback(false,JSON.parse(camposRegistro))
                        })
                    })
                })
            })
        }) 
    }*/

    

   

    

     

    

       

    

    


       

    
   


    //FUNCOES DO AGENTE
   

    
    
   
    

       

    async log_chamadasSimultaneas(empresa,limit,tipo){
        if((empresa==undefined)||(empresa==null)||(empresa==0)||(empresa=='')){
            //console.log('{[(!)]} - log_chamadasSimultaneas','Empresa nao recebida')
            return false
        }
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