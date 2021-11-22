'use strict';
import connect from '../Config/dbConnection';
import ari from 'ari-client';
import util from 'util';
import AmiIo from 'ami-io';
import Tabulacoes from '../models/Tabulacoes';
import moment from 'moment';
import Campanhas from './Campanhas';
import Discador from './Discador';
import Cronometro from './Cronometro';
import Clients from './Clients';
import Redis from '../Config/Redis'

class Asterisk{
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err){ 
                    console.error({"errorCode":err.code,"message":err.message,"stack":err.stack, "sql":sql}) 
                    resolve(false);
                }
                resolve(rows)
            })
        })
    }
    
    async getDomain(empresa){//Ip/dominio do servidor onde o asterisk esta instalado
        const domainWebRTC = await Redis.getter(`${empresa}:domainWebRTC`)
        if(domainWebRTC!==null){
            return domainWebRTC
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT ip 
                               FROM ${empresa}_dados.servidor_webrtc 
                              WHERE status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 202',err)
                })
                await Redis.setter(`${empresa}:domainWebRTC`,rows,360)
                resolve(rows) 
            })
        })        
    }

    async servidorWebRTC(empresa){//Ip da maquina onde o asterisk esta instalado
        const servidorWebRTC = await Redis.getter(`${empresa}:servidorWebRTC`)
       
        if(servidorWebRTC!==null){
            return servidorWebRTC
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                               FROM ${empresa}_dados.servidor_webrtc 
                              WHERE status=1`
                const rows = this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 218',err)
                })
                await Redis.setter(`${empresa}:servidorWebRTC`,rows,360)
                resolve(rows) 
            })
        })        
    }

    ariConnect(server,user,pass,callback){
        ari.connect(server, user, pass, callback)
    } 

    //######################Funções de suporte ao AGI do Asterisk######################
    //Trata a ligação em caso de Máquina ou Não Atendida    
    async machine(dados){       
        //Dados recebidos pelo AGI do asterisk
        const empresa = dados.empresa
        const idAtendimento = dados.idAtendimento
        const observacoes = dados.status
        //Verificando se o numero ja consta em alguma chamada simultanea
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if((chamadasSimultaneas===null)||(chamadasSimultaneas.length==0)){
            return false
        }
        const dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.idAtendimento == idAtendimento)  
        console.log('Dados do Atendimento',dadosChamada)      
        if(dadosChamada.length!=0){     
            const id_numero=dadosChamada[0].id_numero
            console.log('id_numero',dadosChamada[0].id_numero)     
            const idCampanha = dadosChamada[0].id_campanha
            const idMailing = dadosChamada[0].id_mailing
            const idRegistro = dadosChamada[0].id_registro
            const tabela_numeros = dadosChamada[0].tabela_numeros
            const tipo_ligacao = dadosChamada[0].tipo
            const numero = dadosChamada[0].numero
            //Status de tabulacao referente ao nao atendido
            const contatado = 'N'
            const produtivo = 0
            const status_tabulacao = 0
            await Discador.autoTabulacao(empresa,0,idCampanha,idMailing,idRegistro,id_numero,0,0,numero,status_tabulacao,observacoes,contatado,produtivo,tipo_ligacao,tabela_numeros)
            chamadasSimultaneas.splice(chamadasSimultaneas.findIndex(atendimento => atendimento.idAtendimento == idAtendimento),1)
            console.log('chamadasSimultaneas apos',chamadasSimultaneas)
            await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasSimultaneas)
            return true
        }
        return false
    }
    //Atualiza registros em uma fila de espera
    async setaRegistroNaFila(dados){   
        const empresa = dados.empresa
        const idAtendimento = dados.idAtendimento
        const observacoes = dados.status
        //Verificando se o numero ja consta em alguma chamada simultanea
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        console.log("\n","Dados das chamadas",chamadasSimultaneas)
        if((chamadasSimultaneas===null)||(chamadasSimultaneas.length==0)){
            return false
        }
        console.log("\n","INICIAR SEPARAÇÃO DE REGISTRO")
        const dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.idAtendimento == idAtendimento)  
        console.log("\n","Dados do Atendimento",dadosChamada)
        console.log("\n","Atualizando registro na fila")
        dadosChamada[0].event_na_fila = 1
        console.log("\n","Registro Atualizado",dadosChamada)
        const outrosAtendimentos = chamadasSimultaneas.filter(atendimento => atendimento.idAtendimento != idAtendimento)
        const concatenarAtendimentos=outrosAtendimentos.concat(dadosChamada)
        console.log("\n","Todos atendimentos",concatenarAtendimentos)
        await Redis.setter(`${empresa}:chamadasSimultaneas`,concatenarAtendimentos)
        const info = {}
              info['id_campanha']=dadosChamada[0].id_campanha
              info['id_mailing']=dadosChamada[0].id_mailing
              info['id_registro']=dadosChamada[0].id_registro
        return info
    }
    //Desliga chamada 
    async desligaChamada(dados){
        const empresa = dados.empresa
        const idAtendimento = dados.idAtendimento
        const numero = dados.numero
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if((chamadasSimultaneas===null)||(chamadasSimultaneas.length==0)){
            return false
        }        
        let dadosChamada=[]
        if(idAtendimento==0){
            dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.numero == numero)
        }else{
            dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.idAtendimento == idAtendimento)
        }
        if(dadosChamada[0].tipo_discador=='manual'){
            await Cronometro.saiuLigacao(empresa,0,numero,dadosChamada[0].ramal)
            return true
        }

        if(dadosChamada[0].event_na_fila==1){
            const idRegistro=dadosChamada[0].id_registro
            const uniqueid=dadosChamada[0].uniqueid
            const idNumero=dadosChamada[0].id_numero
            const idCampanha=dadosChamada[0].id_campanha
            const tipo_ligacao=dadosChamada[0].tipo_ligacao
            const idMailing=dadosChamada[0].id_mailing
            const ramal=dadosChamada[0].ramal
            const protocolo=dadosChamada[0].protocolo
            const tabulacao = 0
            const contatado = 'N'
            const produtivo = 0
            const tabela_numeros = dadosChamada[0].tabela_numeros
            let observacoes = motivo
            if(abandonada==true){
                observacoes="ABANDONADA";
            }
            const removeNumero =0
            //retira da fila e registra como abandonou fila
            await Cronometro.saiuDaFila(empresa,numero)
            //Registra histórico de chamada
            await Discador.autoTabulacao(empresa,protocolo,idCampanha,idMailing,idRegistro,idNumero,ramal,uniqueid,numero,tabulacao,observacoes,contatado,produtivo,tipo_ligacao,tabela_numeros)
            //remove chamada simultanea
            if(idAtendimento==0){
                chamadasSimultaneas.splice(chamadasSimultaneas.findIndex(atendimento => atendimento.numero == numero),1)
            }else{
                chamadasSimultaneas.splice(chamadasSimultaneas.findIndex(atendimento => atendimento.idAtendimento == idAtendimento),1)
            }
            await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasSimultaneas)   
            return true         
        }else{
            const chamadasEmAtendimento = await Redis.getter(`${empresa}:chamadasEmAtendimento`)
            if((chamadasEmAtendimento===null)||(chamadasEmAtendimento.length==0)){
                return false
            }   
            let dadosAtendimento=[]
            let outrosAtendimentos=[]
            if(idAtendimento==0){
                dadosAtendimento = chamadasEmAtendimento.filter(atendimento => atendimento.numero == numero)
            }else{
                dadosAtendimento = chamadasEmAtendimento.filter(atendimento => atendimento.idAtendimento == idAtendimento)
            }
            console.log("\n","Dados do Atendimento",dadosAtendimento)
            console.log("\n","Atualizando registro como desligado")
            dadosAtendimento[0].event_desligada = 1
            console.log("\n","Registro Atualizado",dadosAtendimento)
            if(idAtendimento==0){
                outrosAtendimentos = chamadasEmAtendimento.filter(atendimento => atendimento.numero != numero)
            }else{
                outrosAtendimentos = chamadasEmAtendimento.filter(atendimento => atendimento.idAtendimento != idAtendimento)
            }
            const concatenarAtendimentos=outrosAtendimentos.concat(dadosAtendimento)
            console.log("\n","Todos atendimentos",concatenarAtendimentos)
            await Redis.setter(`${empresa}:chamadasEmAtendimento`,concatenarAtendimentos)
            return true
        } 
    }


























    //######################Configuração do Asterisk######################








//REFATORAÇÃO REDIS























    async setRecord(empresa,data,hora,ramal,uniqueid,numero,callfilename){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                
                const sql = `INSERT INTO ${empresa}_dados.records
                                        (date,date_record,time_record,ramal,uniqueid,numero,callfilename)
                                VALUES (now(),'${data}','${hora}','${ramal}','${uniqueid}','${numero}','${callfilename}')`
                await this.querySync(conn,sql)
                const rows = await this.servidorWebRTC(empresa)     
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 157',err)
                })
                resolve(rows) 
            })
        })           
    }

    
    





   














    
    //######################Configuração das filas######################
    
    //Adiciona membros na fila
    async addMembroFila(empresa,queue_name,queue_interface,membername,state_interface,penalty){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const check = await this.checkAgenteFila(empresa,queue_name,membername)
                if(check){
                    pool.end((err)=>{
                        if(err) console.log('Asterisk.js 75',err)
                    })
                    resolve(false) 
                    return false;
                }

                const sql = `INSERT INTO asterisk.queue_members 
                                        (queue_name,interface,membername,state_interface,penalty,paused) 
                                VALUES ('${queue_name}','${queue_interface}','${membername}','${state_interface}','${penalty}',0)`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 83',err)
                })
                resolve(true) 
            })
        })        
    }
    //Lista os membros da fila
    async listarMembrosFila(nomeFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM asterisk.queue_members 
                            WHERE queue_name = ${nomeFila}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 102',err)
                })
                resolve(rows) 
            })
        })        
    }
    //Remove os membros da fila
    async removeMembroFila(empresa,nomeFila,membro){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `DELETE FROM asterisk.queue_members 
                            WHERE queue_name='${nomeFila}' AND membername='${membro}'`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 117',err)
                })
                resolve(true) 
            })
        })        
    }
    async checkAgenteFila(empresa,queue_name,membername){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT uniqueid 
                            FROM asterisk.queue_members 
                            WHERE queue_name='${queue_name}' AND membername='${membername}'`
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 132',err)
                })
                resolve(r.length) 
            })
        })        
    }

   /* delMembroFila(uniqueid,callback){
        const sql = `DELETE FROM queue_members WHERE uniqueid='${uniqueid}'`
        connect.asterisk.query(sql,callback)
    }*/


    

    

    

    

    //Atendente atendeu chamada da fila
    async answer(empresa,uniqueid,idAtendimento,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //Dados recebidos pelo AGI       
                //console.log(`RAMAL DO AGENTE: ${ramal}`)
                //dados da campanha
                const sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                                SET uniqueid='${uniqueid}',ramal='${ramal}', na_fila=0, atendido=1
                            WHERE id='${idAtendimento}'`// AND na_fila=1`  
                           
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 270',err)
                })
                resolve(rows) 
            })
        })        
    }   

    async manualAnswer(empresa,uniqueid,idAtendimento,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //Dados recebidos pelo AGI       
                //console.log(`RAMAL DO AGENTE: ${ramal}`)
                //dados da campanha
                const sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                                SET uniqueid='${uniqueid}',ramal='${ramal}', na_fila=0, atendido=1, falando=1 
                            WHERE id='${idAtendimento}'`// AND na_fila=1`  
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 289',err)
                })
                resolve(rows) 
            })
        })        
    }   

    async serverAri(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                
                const sql=`SELECT * 
                             FROM ${empresa}_dados.asterisk_ari 
                            WHERE active=1`; 
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Asterisk.js 279',err)
                })
                resolve(rows) 
            })
        }) 
    }

    async statusChannel(empresa,channel_Id){
        const asterisk_server = await this.serverAri(empresa)
        const server = asterisk_server[0].server
        const user =  asterisk_server[0].user
        const pass =  asterisk_server[0].pass

        return new Promise (async (resolve,reject)=>{ 
            ari.connect(server, user, pass, async (err,client)=>{
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //console.log('CHANNEL ID',channel_Id)
                const options = { "channelId":`${channel_Id}`}
                client.channels.get(options,(err,infoChannel)=>{
                    if(err){
                        resolve(false)
                        return //console.error(err) 
                    } 

                    const statusChannel={}
                          statusChannel['state']=infoChannel['state']
                          statusChannel['App']=infoChannel['dialplan'].app_name
                                             
                    resolve(statusChannel)
                }) 
            })
        })
    }

    /*async chamadasSimultaneas(empresa,idCampanha){
        const asterisk_server = await this.serverAri(empresa)
        const server = asterisk_server[0].server
        const user =  asterisk_server[0].user
        const pass =  asterisk_server[0].pass
        await Redis.delete(`${empresa}:Asterisk_chamadasSimultaneasCampanha:${idCampanha}:atendidas`)
        await Redis.delete(`${empresa}:Asterisk_chamadasSimultaneasCampanha:${idCampanha}:chamando`)

        return new Promise (async (resolve,reject)=>{ 
            ari.connect(server, user, pass, async (err,client)=>{
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //client.channels.get() 
                client.channels.list(async (e,calls)=>{
                    if(e) console.error(e) 
                    const atendidas = []
                    const chamando = []
                    for(let c=0;c<calls.length; c++){
                        const chamada={}      
                                 
                        chamada['id']=calls[c].id
                        chamada['state']=calls[c].state
                        chamada['context']=calls[c].dialplan['context']
                        chamada['priority']=calls[c].dialplan['priority']
                        
                        if((chamada['state']=='Up')&&(chamada['priority']==1)){
                            atendidas.push(chamada)
                        }else{
                            chamando.push(chamada)
                        }                        
                    }
                    await Redis.setter(`${empresa}:Asterisk_chamadasSimultaneas:${idCampanha}:chamando`,chamando,20)
                    await Redis.setter(`${empresa}:Asterisk_chamadasSimultaneas:${idCampanha}:atendidas`,atendidas,20)
                    resolve(calls)
                })
            })
        })
    }*/  

    //######################DISCAR######################                 
    async discar(empresa,fila,idAtendimento,saudacao,aguarde,server,user,pass,modo,ramal,numero,idCampanha,callback){
        const accountId = await Clients.accountId(empresa)
        ari.connect(server, user, pass, async (err,client)=>{
          if(err) throw err         

          //Extension
          let context
          let endpoint
          const trunk = await Clients.getTrunk(empresa)
          const prefix = trunk[0].tech_prefix         
          const tronco = trunk[0].trunk
          const type_dial = trunk[0].type_dial
          if(modo=='discador'){
            context = 'dialer'
            endpoint = `PJSIP/${prefix}${type_dial}${numero}@${tronco}`
          }else{
            context = 'external'
            endpoint = `PJSIP/${tronco}/` 
          }
          const options = {            
            "endpoint"       : `${endpoint}`,
            "extension"      : `${numero}`,
            "context"        : `${context}`,
            "priority"       : 1,
            "app"            : "",
            "variables"      : {
                                "EMPRESA":`${empresa}`,
                                "FILA":`${fila}`,
                                "ID_ATENDIMENTO":`${idAtendimento}`,
                                "SAUDACAO":`${saudacao}`,
                                "AGUARDE":`${aguarde}`
                               },
            "Async"          : true,
            "appArgs"        : "",
            "callerid"       : '',//numero,
            "timeout"        : 20, 
            /*"channelId"      : `${accountId}.${idCampanha}.${idAtendimento}`,
            "otherChannelId" : ""*/
          }          
          client.channels.originate(options,callback)
        })  
    }
}

export default new Asterisk();