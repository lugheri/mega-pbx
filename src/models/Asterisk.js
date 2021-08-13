'use strict';

import connect from '../Config/dbConnection';
import ari from 'ari-client';
import util from 'util';
import AmiIo from 'ami-io';
import Tabulacoes from '../models/Tabulacoes';
import moment from 'moment';
import Campanhas from './Campanhas';
import Discador from './Discador';

class Asterisk{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    //######################Configuração das filas######################
    
    //Adiciona membros na fila
    async addMembroFila(queue_name,queue_interface,membername,state_interface,penalty){
        const check = await this.checkAgenteFila(queue_name,membername)
        if(check){
            return false;
        }
        const sql = `INSERT INTO asterisk.queue_members (queue_name,interface,membername,state_interface,penalty) VALUES ('${queue_name}','${queue_interface}','${membername}','${state_interface}','${penalty}')`
        await this.querySync(sql)
        return true
    }
    //Lista os membros da fila
    listarMembrosFila(nomeFila,callback){
        const sql = `SELECT * FROM queue_members WHERE queue_name = ?`
        connect.asterisk.query(sql,nomeFila,callback)
    }
    //Remove os membros da fila
    async removeMembroFila(nomeFila,membro){
        const sql = `DELETE FROM asterisk.queue_members WHERE queue_name='${nomeFila}' AND membername='${membro}'`
        await this.querySync(sql)
        return true
    }
    async checkAgenteFila(queue_name,membername){
        const sql = `SELECT uniqueid FROM asterisk.queue_members WHERE queue_name='${queue_name}' AND membername='${membername}'`
        const r = await this.querySync(sql)
        return r.length
    }

   /* delMembroFila(uniqueid,callback){
        const sql = `DELETE FROM queue_members WHERE uniqueid='${uniqueid}'`
        connect.asterisk.query(sql,callback)
    }*/


    //######################Configuração do Asterisk######################
    setRecord(data,hora,ramal,uniqueid,callback){
        const sql = `INSERT INTO records (date,date_record,time_record,ramal,uniqueid) VALUES (now(),'${data}','${hora}','${ramal}','${uniqueid}')`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e
            this.servidorWebRTC(callback)
        })
    }

    getDomain(callback){//Ip/dominio do servidor onde o asterisk esta instalado
        const sql = "SELECT ip FROM servidor_webrtc WHERE status=1"
        connect.banco.query(sql,callback)
    }

    servidorWebRTC(callback){//Ip da maquina onde o asterisk esta instalado
        const sql = "SELECT * FROM servidor_webrtc WHERE status=1"
        connect.banco.query(sql,callback)
    }

    ariConnect(server,user,pass,callback){
        ari.connect(server, user, pass, callback)
    } 

    //######################Funções de suporte ao AGI do Asterisk######################
    //Trata a ligação em caso de Máquina ou Não Atendida    
    async machine(dados){
        //Dados recebidos pelo AGI do asterisk
        const numero = dados.numero
        const observacoes = dados.status

        //Verificando se o numero ja consta em alguma chamada simultanea
        const chamada = await Discador.dadosAtendimento_byNumero(numero)
        
        if(chamada.length!=0){     
            const idAtendimento =chamada[0].id          
            const id_registro=chamada[0].id_registro
            const id_numero=chamada[0].id_numero
            const tabela_dados=chamada[0].tabela_dados
            const tabela_numeros=chamada[0].tabela_numeros
            const idCampanha=chamada[0].id_campanha
            const idMailing=chamada[0].id_mailing
            const ramal=chamada[0].ramal
            const protocolo=chamada[0].protocolo
            //Status de tabulacao referente ao nao atendido
            const tabulacao = 0
            const contatado = 'N'
            const produtivo = 0
            const uniqueid=chamada[0].uniqueid
            const tipo_ligacao=chamada[0].tipo_ligacao
            //Tabula registro
            const status_tabulacao = 0
            await Discador.tabulandoContato(idAtendimento,contatado,status_tabulacao,observacoes,produtivo,ramal)
            return true
        }
        return false
    }

    //Atendente atendeu chamada da fila
    async answer(dados){
        //Dados recebidos pelo AGI
        const uniqueid = dados.uniqueid;
        const numero = dados.numero;
        let ch = dados.ramal;
        ch = ch.split("-");
        ch = ch[0].split("/")
        const ramal = ch[1]
        //console.log(`RAMAL DO AGENTE: ${ramal}`)
        //dados da campanha
        const sql = `UPDATE campanhas_chamadas_simultaneas 
                        SET uniqueid='${uniqueid}',ramal='${ramal}', na_fila=0, atendido=1
                      WHERE numero='${numero}' AND na_fila=1`  
        return await this.querySync(sql)
    }

    //Chamada Manual
    handcall(dados,callback){       
    }    

     //######################DISCAR######################
    discar(server,user,pass,modo,ramal,numero,callback){
        console.log(`recebendo ligacao ${numero}`)
        console.log(`ramal ${ramal}`)
        ari.connect(server, user, pass, (err,client)=>{
          if(err) throw err         

          //Extension
          let context
          let endpoint
          if(modo=='discador'){
            context = 'dialer'
            endpoint = `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`
          }else{
            context = 'external'
            endpoint = `PJSIP/megatrunk/` 
          }
          console.log(`context: ${context}`)
          console.log(`endpoint: ${endpoint}`)
          console.log(`numero recebido: ${numero}`)
          console.log(`Servidor: ${server}`)

          const options = {            
            "endpoint"       : `${endpoint}`,
            "extension"      : `0${numero}`,
            "context"        : `${context}`,
            "priority"       : 1,
            "app"            : "",
            "appArgs"        : "",
            "Callerid"       : `0${numero}`,//numero,
            "timeout"        : -1, 
            //"channelId"      : '324234', 
            "otherChannelId" : ""
          }
          client.channels.originate(options,callback)
          //client.channel
        })  
    }

   
  

    
    
    
    //######################Funções do atendente######################
    
    
    

    

    

    

   

    
               
    


    
    
    //OLD
    /*
    ligar(server,user,pass,modo,ramal,numero,callback){
        console.log(`recebendo ligacao ${numero}`)
        console.log(`ramal ${ramal}`)
        ari.connect(server, user, pass, (err,client)=>{
          if(err) throw err         

          //Extension
          let context
          let endpoint
          if(modo=='discador'){
            context = 'dialer'
            endpoint = `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`
          }else{
            context = 'external'
            endpoint = `PJSIP/megatrunk/` 
          }
          console.log(`context: ${context}`)
          console.log(`endpoint: ${endpoint}`)
          console.log(`numero recebido: ${numero}`)
          console.log(`Servidor: ${server}`)

          const options = {            
            "endpoint"       : `${endpoint}`,
            "extension"      : `0${numero}`,
            "context"        : `${context}`,
            "priority"       : 1,
            "app"            : "",
            "appArgs"        : "",
            "Callerid"       : `0${numero}`,//numero,
            "timeout"        : -1, 
            //"channelId"      : '324234', 
            "otherChannelId" : ""
          }
          client.channels.originate(options,callback)
          //client.channel
        })  
    }
*/



    




    ///////////////////////Funcoes de tabulacao automatica - AGI
    


  



   

    

    

    




    

     ///////////////////////////////////TESTES/////////////////////////////////////////////////////
     agi_test(dados,callback){
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

    ligarTeste(server,user,pass,modo,ramal,numero,res){
        console.log(`recebendo ligacao de teste ${numero}`)
        console.log(`ramal ${ramal}`)
        console.log(`modo ${modo}`)
        ari.connect(server, user, pass, (err,client)=>{
          if(err) throw err         
          console.log(err)

          //console.log(client)

          //Extension
          let context
          let endpoint
          if(modo=='discador'){
            context = 'dialer'
            endpoint = `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`
          }else{
            context = 'external'
            endpoint = `PJSIP/megatrunk/` 
          }
          console.log(`context: ${context}`)
          console.log(`endpoint: ${endpoint}`)
          console.log(`numero recebido: ${numero}`)
          console.log(`Servidor: ${server}`)

          const options = {            
            "endpoint"       : `${endpoint}`,
            "extension"      : `0${numero}`,
            "context"        : `${context}`,
            "priority"       : 1,
            "app"            : "",
            "appArgs"        : "",
            "Callerid"       : `0${numero}`,//numero,
            "timeout"        : -1, 
            //"channelId"      : '324234', 
            "otherChannelId" : ""
          }
          client.channels.originate(options,(e,r)=>{
            if(e) throw e
                res.json(r)
            })
          //client.channel
        })  
    }
    
    /*testLigacao(numero,ramal,callback){
        const options = {port:5038, host:'35.239.60.116', login:'mega', password:'1234abc@', encoding: 'ascii'}
        const amiio = AmiIo.createClient(options)
        amiio.on('incorrectServer', function () {
            console.log("Invalid AMI welcome message. Are you sure if this is AMI?");
            process.exit();
        });
        amiio.on('connectionRefused', function(){
            console.log("Connection refused.");
            process.exit();
        });
        amiio.on('incorrectLogin', function () {
            console.log("Incorrect login or password.");
            process.exit();
        });
        amiio.on('event', function(event){
            console.log('event:'+ event);
        });
        amiio.connect();
        amiio.on('connected', function(){
            console.log('connected');
            
            const action = new amiio.Action.Originate();

            
            action.Channel = 'PJSIP/megatrunk/sip:011930224168@35.199.98.221:5060'
            action.Context='external'
            action.Exten='011930224168'
            action.Priority=1
            action.Async=true
            action.WaitEvent=true
    
            amiioClient.send(action,(e,data)=>{
                if(e) throw e 
    
                console.log(data)
            })

            setTimeout(function(){
                amiio.disconnect();
                amiio.on('disconnected', process.exit());
            },30000);
        });
        
        /*
        const options = {port:5038, host:'35.239.60.116', login:'mega', password:'1234abc@', encoding: 'ascii'}
        const cliente = amiio.createClient(options)
        console.log(cliente)
        */
       //amiio.createClient() = amiio.createClient({port:8088, host:'35.239.60.116', login:'mega', password:'1234abc@', encoding: 'ascii'})
        //console.log(amiio.createClient())
        /*
        const action = new amiio.Action.originate();
        action.Channel = 'PJSIP/megatrunk/sip:011930224168@35.199.98.221:5060'
        action.Context='external'
        action.Exten='011930224168'
        action.Priority=1
        action.Async=true
        action.WaitEvent=true

        amiioClient.send(action,(e,data)=>{
            if(e) throw e

            console.log(data)
        })*/


        /*const sql = `SELECT * FROM asterisk_ari WHERE active=1`;
        connect.banco.query(sql,(e,r)=>{
          if(e) throw e

            console.log(`Iniciando teste de ligacao para o nº ${numero} no ramal ${ramal}`)
            
            ari.connect(r[0].server, r[0].user, r[0].pass, (err,client)=>{
              if(err) console.log(err)
              
              console.log(`numero recebido: ${numero}`)
              console.log(`Servidor: ${r[0].server}`)
    
              const options = {
                "endpoint"       : `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`,
                "extension"      : `0${numero}`,
                "context"        : 'external',
                "priority"       : 1,
                "app"            : "",
                "appArgs"        : "",
                "callerid"       : `0${numero}`,//numero,
                "timeout"        : -1,                 
                //"channelId"      : '324234', 
                "otherChannelId" : ""
              }
              client.channels.originate(options,(err,result)=>{
                if(err) throw err;
                console.log({
                    "id":result.id,
                    "name":result.name,
                    "state":result.state,
                    "caller":result.caller,
                    "accountcode":result.accountcode, 
                    "dialplan":result.dialplan,
                    "creationtime":result.creationtime,
                    "language":result.language 
                  })
              })
            })
      
        })*/
        /*
    }*/

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