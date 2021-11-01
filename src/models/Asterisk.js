'use strict';

import connect from '../Config/dbConnection';
import ari from 'ari-client';
import util from 'util';
import AmiIo from 'ami-io';
import Tabulacoes from '../models/Tabulacoes';
import moment from 'moment';
import Campanhas from './Campanhas';
import Discador from './Discador';
import Clients from './Clients';

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
                                        (queue_name,interface,membername,state_interface,penalty,paused,) 
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


    //######################Configuração do Asterisk######################
    async setRecord(empresa,data,hora,ramal,uniqueid,numero,callfilename){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                await this.setUniqueid(empresa,ramal,uniqueid)
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

    async setUniqueid(empresa,ramal,uniqueid){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql = `SELECT uniqueid 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE ramal='${ramal}' LIMIT 1`
                const check = await this.querySync(conn,sql)
                if(check.length==1){
                    if(check[0].uniqueid == null){
                        let sql = `UPDATE ${empresa}_dados.campanhas_chamadas_simultaneas 
                                    SET uniqueid='${uniqueid}' 
                                    WHERE ramal='${ramal}'`
                        await this.querySync(conn,sql)
                        pool.end((err)=>{
                            if(err) console.log('Asterisk.js 179',err)
                        })
                        resolve(true)
                        return true
                    }
                }
                pool.end((err)=>{
                    if(err) console.log('Asterisk.js 186',err)
                })
                resolve(false) 
            })
        })              
    }

    async getDomain(empresa){//Ip/dominio do servidor onde o asterisk esta instalado
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
                resolve(rows) 
            })
        })        
    }

    async servidorWebRTC(empresa){//Ip da maquina onde o asterisk esta instalado
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
        const chamada = await Discador.dadosAtendimento(empresa,idAtendimento)
        
        if(chamada.length!=0){     
            const id_numero=chamada[0].id_numero
            const ramal=chamada[0].ramal
            //Status de tabulacao referente ao nao atendido
            const contatado = 'N'
            const produtivo = 0
            const removeNumero=0
            //Tabula registro
            const status_tabulacao = 0
            await Discador.tabulaChamada(empresa,idAtendimento,contatado,status_tabulacao,observacoes,produtivo,ramal,id_numero,removeNumero)
            //Removendo ligacao do historico de chamadas_simultaneas
            await Discador.clearCallbyId(empresa,idAtendimento)
            return true
        }
        return false
    }

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

           

    //######################DISCAR######################
    discar(empresa,fila,idAtendimento,saudacao,aguarde,server,user,pass,modo,ramal,numero,callback){
        //console.log(`recebendo ligacao ${numero}`)
        //console.log(`ramal ${ramal}`)
        ari.connect(server, user, pass, async (err,client)=>{
          if(err) throw err         

          //Extension
          let context
          let endpoint

          const trunk = await Clients.getTrunk(empresa)

          const prefix = trunk[0].tech_prefix         
          const tronco = trunk[0].trunk
          const type_dial = trunk[0].type_dial
          //console.log(`trunk ${tronco}`)


          if(modo=='discador'){
            context = 'dialer'
            //endpoint = `PJSIP/megatrunk/sip:0${numero}@35.199.66.23:5060`
            
            endpoint = `PJSIP/${prefix}${type_dial}${numero}@${tronco}`
            //console.log(endpoint)
          }else{
            context = 'external'
            endpoint = `PJSIP/${tronco}/` 
          }
          //console.log(`context: ${context}`)
          //console.log(`endpoint: ${endpoint}`)
          //console.log(`numero recebido: ${numero}`)
          //console.log(`Servidor: ${server}`)

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
            "timeout"        : 30, 
            //"channelId"      : '324234', 
            "otherChannelId" : ""
          }
          client.channels.originate(options,callback)
          //client.channel
        })  
    }

   
  

    
    
    
    //######################Funções do atendente######################
    
    
    

    

    

    

   

    
               
    


   


    ///////////////////////Funcoes de tabulacao automatica - AGI
    


  



   

    

    

    




    

     ///////////////////////////////////TESTES/////////////////////////////////////////////////////
     /*agi_test(dados,callback){
        const sql = `INSERT INTO discador (data,obs_tabulacao,status) VALUES (now(),'${dados.obs}','${dados.status}')`
        connect.banco.query(sql,callback);
    }
    
    testLigacao(numero,ramal,callback){
        const sql = `SELECT * FROM asterisk_ari WHERE active=1`; 
        connect.banco.query(sql,(e,res)=>{
            if(e) throw e
            
            console.log(`${res[0].server}, ${res[0].user}, ${res[0].pass}, ${ramal}, ${numero}`)
            const modo='discador'
            this.ligarTeste(res[0].server,res[0].user,res[0].pass,modo,ramal,numero,callback)
        }) 
    }

    
    

    testPlayback(){

        //Pesquisando dados do servidor no banco
        const sql = `SELECT * FROM asterisk_ari WHERE active=1`;
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            //Abrindo conexao ARI
            let timers = {}
            ari.connect(r[0].server, r[0].user, r[0].pass, (err,client)=>{
                if(err) console.log(err)

                client.on('StasisStart',(event,channel)=>{
                    let playback = client.Playback();
                    channel.play({media:'sound:hello-world'},playback,(e,newPlayback)=>{
                        if(e) throw e

                        playback.on('PlaybackFinished',(event,completePlayback)=>{
                            console.log('Audio reproduzido')
                            
                            channel.hangup((e)=>{
                                if(e) throw e

                            })

                        })
                    })
                    channel.play({media:'sound:hello-world'},playback,(e,newPlayback)=>{
                        if(e) throw e

                        playback.on('PlaybackFinished',(event,completePlayback)=>{
                            console.log('Audio reproduzido')
                            
                            channel.hangup((e)=>{
                                if(e) throw e

                            })

                        })
                    })
                })

                client.on('StasisEnd',()=>{
                    console.log('Aplicativo encerrado');
                })

                client.start('channel-state')

                
            })
        })

    }

    uraTest(){
         //Pesquisando dados do servidor no banco
         const sql = `SELECT * FROM asterisk_ari WHERE active=1`;
         connect.banco.query(sql,(e,r)=>{
             if(e) throw e
 
             //Abrindo conexao ARI
             let timers = {}
             ari.connect(r[0].server, r[0].user, r[0].pass, (err,client)=>{
                if(err) console.log(err)

                const menu = {
                    //Opções validas do menu
                    options: [1,2],
                    sounds: ['sound:press-1','sound:or','sound:press-2']
                }

                let timers = {}

                client.on('StasisStart',(event,channel)=>{
                    console.log(`Canal entrou ${channel.name} na ura de teste`)

                    channel.on('ChannelDtmfReceived', dtmfReceived)
                    
                    channel.answer((e)=>{
                        if (e) throw e

                        playIntroMenu(channel)
                    })
                })

                client.on('StasisEnd',(event,channel)=>{
                    console.log(`Canal ${channel.name} deixou a ura`)
                    channel.removeListener('ChannelDtmfReceived',dtmfReceived)
                    cancelTimeout(channel);
                })

                function dtmfReceived(event,channel){
                    cancelTimeout(channel)
                    let digit = parseInt(event.digit)

                    console.log(`Canal ${channel.name} digitou ${digit}`)

                    let valid = ~menu.option.indexOf(digit)
                    if(valid){
                        handleDtmf(channel,digit)
                    }else{
                        console.log(`Canal ${channel.name} escolheu uma opção inválida`)
                    }

                    channel.play({media:'sound:option-is-invalid'},(e,playback)=>{
                        if(e) throw e

                        playIntroMenu(channel)
                    })
                }

                function playIntroMenu(channel){
                    let state = {
                        currentSound: menu.sounds[0],
                        currentPlayback: undefined,
                        done: false
                    }

                    channel.on('ChannelDtmfReceived',cancelMenu)
                    channel.on('StasisEnd',cancelMenu)
                    queueUpSound();

                   
                }

                function cancelMenu(){
                    state.done = true
                    if(state.currentPlayback){
                        state.currentPlayback.stop((e)=>{
                            if(e) throw e
                        })
                    }

                    channel.removeListener('ChannelDtmfReceived',cancelMenu)
                    channel.removeListener('StasisEnd', cancelMenu)
                }
                
                function queueUpSound(){
                    if(!state.done){
                        if(!state.currentSound){
                            let timer = setTimeout(stillThere,10*1000)
                            timers[channel.id]=timer
                        }else{
                            let playback = client.Playback()
                            state.currentPlayback = playback

                            channel.play({media: state.currentSound},playback,(e)=>{
                                if(e) throw e
                            })

                            playback.once('PlaybackFinished',(event,channel)=>{
                                queueUpSound();
                            })

                            let nextSoundIndex = menu.sounds.indexOf(state,currentSound)+1
                            state.currentSound = menu.sounds[nextSoundIndex]
                        }
                    }
                }

                function stillThere(){
                    console.log(`Canal ${channel.name} parado aguardando...`)
                    
                    channel.play({media: 'sound:are-you-still-there'},(e)=>{
                        if(e) throw e

                        playIntroMenu(channel);
                    })
                }

                function cancelTimeout(channel){
                    let timer = timers[channel.id]

                    if(timer){
                        clearTimeout(timer)
                        delete timers[channel.id]
                    }
                }

                function handleDtmf(channel,digit){
                    let parts = ['sound:you-entered',util.format('digits:%s',digit)]
                    let done = 0

                    let playback = client.Playback()
                    channel.play({media: 'sound:you-entered'}, playback,(e)=>{
                        if(e) throw e

                        channel.play({media: util.format('digits:%s',digit)}, (e)=>{
                            if(e) throw e

                            playIntroMenu(channel)
                        })
                    })
                }

                client.start('channel-state')

            })
        })
    }

    async listarRamais(){
        const sql = `SELECT * FROM ps_auths`
        return await this.querySync(conn,sql)
    }

    /*

    // handler for StasisStart event
    stasisStart_test(event, channel) {
       
        let playback = client.Playback();
        channel.play({media: 'tone:ring;tonezone=fr'},playback,(err,newPlayback)=>{
            if (err) throw err;

            setTimeout(()=>{answer}, 8000);
        })

        function answer() {
            console.log(util.format('Answering channel %s', channel.name));
            playback.stop((err) =>{
              if (err) throw err;
            });
            channel.answer((err) =>{
              if (err) throw err;
            });
            // hang up the channel in 1 seconds
            setTimeout(()=>{hangup}, 1000);
        }
       
        // callback that will hangup the channel
        function hangup() {
            console.log(util.format('Hanging up channel %s', channel.name));
            channel.hangup((err)=>{
              if (err) throw err;
            });
        }

    }
   

    

    stasisEnd_test(event, channel) {
        console.log(util.format(
            'Channel %s just left our application', channel.name));
    }

    channelStateChange(event, channel) {
        console.log(util.format('Channel %s is now: %s', channel.name, channel.state));
      }

    stasisStart(event, channel) {
        console.log(util.format(
            'Channel %s has entered the application', channel.name));
        // use keys on event since channel will also contain channel operations
        Object.keys(event.channel).forEach(function(key) {
          console.log(util.format('%s: %s', key, JSON.stringify(channel[key])));
        });
      }
      
      // handler for StasisEnd event
      stasisEnd(event, channel) {
        console.log(util.format(
            'Channel %s has left the application', channel.name));
      }

    //Ramais
    criarRamal(dados,callback){
        //criar aor
        const sql = `INSERT INTO ps_aors (id,max_contacts,remove_existing) VALUES ('${dados.aor}','1','yes')`
        connect.asterisk.query(sql,(err,r)=>{
            if(err) throw err

             //criar auth
            const sql = `INSERT INTO ps_auths (id,auth_type,password,username) VALUES ('${dados.auth}','userpass','${dados.pass}','${dados.user}')`
            connect.asterisk.query(sql,(err,r)=>{
                if(err) throw err

                //criar endpoint
                const sql = `INSERT INTO ps_endpoints (id,transport,aors,auth,context,disallow,allow) VALUES ('${dados.aor}','${dados.transport}','${dados.aor}','${dados.auth}','${dados.context}','${dados.disallow}','${dados.allow}')`
                connect.asterisk.query(sql,callback)
            })
        })        
    }

    listarRamais(callback){
        const sql = `SELECT * FROM ps_auths`
        connect.asterisk.query(sql,callback)
    }

    */


}

export default new Asterisk();