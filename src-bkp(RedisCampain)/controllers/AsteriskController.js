import Asterisk from '../models/Asterisk';
import Clients from '../models/Clients';
import User from '../models/User';
import util from 'util';
import logs from '../Config/logs';
import fs from 'fs';
import Discador from '../models/Discador';
import Agente from '../models/Agente';
import Cronometro from '../models/Cronometro';
import moment from 'moment';
import Redis from '../Config/Redis'
//const asteriskServer = 'http://35.202.102.245:8088'
//const asteriskServer = 'asterisk'
//const asteriskServer = 'localhost'
import http from 'http';

class AsteriskController{
    async agi(req,res){
        //console.log('Iniciando AGI',req.body,'Action',req.params.action)
        const action = req.params.action
        const dados = req.body        
        if(action=='get_trunk'){
            console.log('\n[❗] AGI -> GET TRUNK')
            const empresa = dados.empresa
            const register=[]
            const trunk = await Clients.getTrunk(empresa)
            res.json(trunk[0])   
        }
        if(action=='machine'){//Quando cai na caixa postal
            const r = await Asterisk.machine(dados)
            //console.log('agi:machine',`Empresa: ${dados.empresa},numero:${dados.numero},status:${dados.status}, saida: ${r}`)
            res.json(r);
        }
        if(action=='set_queue'){//Quando reconhece a voz humana
            console.log('\n[❗] AGI -> SET QUEUE')
            const empresa = dados.empresa
            const dadosAtendimento = await Asterisk.setaRegistroNaFila(dados)
             if(dadosAtendimento==false){
                 res.json(false) 
                 return false
             }
             //recupera dados da campanhas           
             const idCampanha = dadosAtendimento['id_campanha']
             const idMailing = dadosAtendimento['id_mailing']
             const idRegistro = dadosAtendimento['id_registro']
             const numero = dados.numero
             await Cronometro.entrouNaFila(empresa,idCampanha,idMailing,idRegistro,numero) 
             //console.log('agi:set_queue',`Empresa: ${empresa},numero: ${numero}, saida: ${dadosAtendimento}`)
             res.json(true)            
        }        
        if(action=='desligou'){//Quando abandona fila 
            console.log('\n[❗] AGI -> DESLIGOU')
            const r = await Asterisk.desligaChamada(dados)
            res.json(r);
        }
        if(action=='set_call'){
            console.log('\n[❗] AGI -> SET CALL')
            let ch = dados.ramal;
                ch = ch.split("-");
                ch = ch[0].split("/")
            const ramal = ch[1]
            const empresa = dados.empresa
            let chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
            if(chamadasSimultaneas===null){
                chamadasSimultaneas=[]
            }
           
            const novaChamada={}
                  novaChamada['idAtendimento'] = dados.idAtendimento
                  novaChamada['uniqueid'] =  dados.uniqueid
                  novaChamada['ramal'] = ramal
                  novaChamada['numero'] = dados.numero
                  novaChamada['status'] = 'Chamando ...'
                  novaChamada['horario'] = moment().format("HH:mm:ss")
                  novaChamada['tipo_discador'] = dados.tipoDiscador

            if(dados.tipoDiscador=="manual"){                
                novaChamada['id_campanha'] =  0
                novaChamada['id_mailing'] =  0
                novaChamada['tabela_dados'] = ''
                novaChamada['tabela_numeros'] = ''
                novaChamada['id_registro'] = 0
                novaChamada['id_numero'] = 0
                novaChamada['tipo'] = 'manual'  
                const statusRamal = await Agente.statusRamal(empresa,ramal)
                if(statusRamal['estado']==2){
                    const pausas = await Agente.infoPausaAgente(empresa,ramal)
                    novaChamada['idPausa']=pausas[0].idPausa
                }
                novaChamada['estadoAnterior']=statusRamal['estado']
                await Agente.alterarEstadoAgente(empresa,ramal,6,0)              
            }else{
                const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
                if((dadosAtendimento===null)||(dadosAtendimento==[])){
                    await Agente.alterarEstadoAgente(empresa,ramal,1,0) 
                    res.json(true);
                    return false
                }
                //const chamadasEmAtendimento = await Redis.getter(`${empresa}:chamadasEmAtendimento`)
                //const dadosAtendimento = chamadasEmAtendimento.filter(atendimento => atendimento.numero == dados.numero)
                novaChamada['id_campanha'] =  dadosAtendimento['id_campanha']
                novaChamada['id_mailing'] =  dadosAtendimento['id_mailing']
                novaChamada['tabela_dados'] = dadosAtendimento['tabela_dados']
                novaChamada['tabela_numeros'] = dadosAtendimento['tabela_numeros']
                novaChamada['id_registro'] = dadosAtendimento['id_registro']
                novaChamada['id_numero'] = dadosAtendimento['id_numero']
                novaChamada['tipo'] = 'Discador'
            }
            novaChamada['event_chamando']=1
            novaChamada['event_na_fila']=0
            novaChamada['event_em_atendimento']=0

            chamadasSimultaneas.push(novaChamada)

            //console.log('\n','##########################################################','Chamada Simultanea',novaChamada,'##########################################################','\n')
            await Redis.setter(`${empresa}:chamadasSimultaneas`,chamadasSimultaneas,43200)
            const chave =  await Redis.getter(`${empresa}:chamadasSimultaneas`)
            //console.log('Chamada Simultanea',`${empresa}:chamadasSimultaneas`,chave)
            res.json(true);

        }

        if(action=='answer'){//Quando ligacao eh atendida pelo agente.
            console.log('\n[❗] AGI -> ANSWER')
            const empresa = dados.empresa            
            const uniqueid = dados.uniqueid 
            const idAtendimento = dados.idAtendimento
            const numero = dados.numero
            const tipoChamada = dados.tipoChamada       
            
            //console.log('\n \n','>>>>>>tipoChamada<<<<<<<<<',tipoChamada,'\n \n')
            let ch = dados.ramal;
                ch = ch.split("-");
                ch = ch[0].split("/")
            const ramal = ch[1]

            //console.log('ramal - >',ramal)
            //console.log('>>>>>>>>>>>>>>>>>>>>>>>ATENDEU CHAMADA',tipoChamada)
            const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
            if((chamadasSimultaneas==null)||(chamadasSimultaneas.length==0)){
                return false
            }

            //console.log('tipoChamada - >',tipoChamada)
            if(tipoChamada=="manual"){
                //console.log("\n","INICIAR SEPARAÇÃO DE REGISTRO")
                const dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.numero == numero)  
                //console.log("\n","Dados do Atendimento",dadosChamada)
                //console.log("\n","Atualizando registro na fila")
                dadosChamada[0].event_chamando=0                
                dadosChamada[0].event_em_atendimento = 1
                //console.log("\n","Registro Atualizado",dadosChamada)
                const outrosAtendimentos = chamadasSimultaneas.filter(atendimento => atendimento.numero != numero)
                const concatenarAtendimentos=outrosAtendimentos.concat(dadosChamada)
                //console.log("\n","Todos atendimentos",concatenarAtendimentos)
                await Redis.setter(`${empresa}:chamadasSimultaneas`,concatenarAtendimentos)
                
                const idCampanha = 0
                const tipoDiscador = 'manual'
                const idMailing = 0
                const id_reg = 0
                const id_numero = 0    
                const protocolo=0
                const tabulacao=0
                const observacoes=""
                const contatado=0                   
           
                await Discador.registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,id_reg,id_numero,ramal,uniqueid,tipoDiscador,numero,tabulacao,observacoes,contatado)
                await Cronometro.iniciouAtendimento(empresa,0,0,0,tipoChamada,numero,ramal,uniqueid)
            
            }else if(tipoChamada=="POWER"){  
                console.log("IdAtendimento do POWER",idAtendimento)
                console.log("chamadasSimultaneas",chamadasSimultaneas)
                const dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.numero == numero)    
                console.log("dadosChamada",dadosChamada)            
               
                if(dadosChamada.length==0){
                    console.log("Sem dados de chamada do Power")
                    res.json(true)
                    return false
                }
                //console.log('dados Chamada Asterisk',dadosChamada)
                //console.log('ramal',ramal)
                dadosChamada[0].status = 'Em Atendimento'
                dadosChamada[0].ramal = ramal
                dadosChamada[0].event_chamando = 0
                dadosChamada[0].event_na_fila=0
                dadosChamada[0].event_em_atendimento = 1
                const outrosAtendimentos = chamadasSimultaneas.filter(atendimento => atendimento.numero != numero)
                const concatenarAtendimentos=outrosAtendimentos.concat(dadosChamada)
                await Redis.setter(`${empresa}:chamadasSimultaneas`,concatenarAtendimentos)

                const idCampanha = dadosChamada[0].id_campanha
                const idMailing = dadosChamada[0].id_mailing
                const idRegistro = dadosChamada[0].id_registro
                const modoAtendimento = dadosChamada[0].modoAtendimento
                const tipoDiscador="power"
                const tabela_dados = dadosChamada[0].tabela_dados
                const tabela_numeros = dadosChamada[0].tabela_numeros
                const idNumero = dadosChamada[0].id_numero
                const nomeFila = dadosChamada[0].nomeFila
                console.log('Registrando Chamada')
                await Discador.registraChamada(empresa,ramal,idAtendimento,uniqueid,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numero,nomeFila,1)
                await Agente.alterarEstadoAgente(empresa,ramal,3,0)
                await Cronometro.saiuDaFila(empresa,numero)
                console.log('Iniciou Atendimento',uniqueid,dadosChamada[0].uniqueid)                                                   
                await Cronometro.iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,tipoChamada,numero,ramal,dadosChamada[0].uniqueid)

                

            }else{  /*DISCADORES POSSIVEIS: click-to-call, preview*/
                const dadosChamada = chamadasSimultaneas.filter(atendimento => atendimento.numero == numero)  
                dadosChamada[0].event_chamando = 0
                dadosChamada[0].event_em_atendimento = 1
                const outrasChamadas = chamadasSimultaneas.filter(atendimento => atendimento.numero != numero)
                const concatenarChamadas=outrasChamadas.concat(dadosChamada)
                await Redis.setter(`${empresa}:chamadasSimultaneas`,concatenarChamadas)

                const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
                if(dadosChamada[0].uniqueid==undefined){
                    dadosAtendimento['uniqueid'] = 0
                }else{
                    dadosAtendimento['uniqueid']=dadosChamada[0].uniqueid 
                }
                dadosAtendimento['event_falando'] = 1
                await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,dadosAtendimento) 
            }   
            res.json(true);
        }
    }
    async setRecord(req,res){
        const empresa = req.body.empresa
        const data = req.body.date
        const hora = req.body.time
        let ch = req.body.channel;
            ch = ch.split("-");
            ch = ch[0].split("/")
        let user_ramal = ch[1]   

        //console.log(req.body)
        
        if((user_ramal==undefined)||(user_ramal=="undefined")||(user_ramal===false)){
            let rm = req.body.ramal;
                rm = rm.split("-");
                rm = rm[0].split("/")
                user_ramal = rm[1]
        }
        
        const uniqueid = req.body.uniqueid  
        const numero = req.body.numero   
        const callfilename = req.body.callfilename  
        const server = await Asterisk.setRecord(empresa,data,hora,user_ramal,uniqueid,numero,callfilename)
       
        res.json(server[0].ip) 
    }






//REFATORAÇÃO REDIS


    
    
    
       
        
       
       
        
       
        
        




























    //Funcoes automaticas dialplan do asterisk
   

   

   


    /////////////////////// testes ////////////////////////////////
    
    channelDump(req,res){
        Asterisk.channelDump((e,r)=>{
        //console.log('channel dump')
        })
    } 
   
    addMembroFila(req,res){      
        const dados = req.body;
        Asterisk.addMembroFila(dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }
    
    async listarMembrosFila(req,res){ 
        const nomeFila = req.params.nomeFila
        const agentes = await Asterisk.listarMembrosFila(nomeFila)
        res.json(agentes)           
    }

    delMembroFila(req,res){
        const uniqueid = parseInt(req.params.uniqueid)
        Asterisk.delMembroFila(uniqueid,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
        
    }
    
    async criarRamal(req,res){
        const dados = req.body;
        await Asterisk.criarRamal(dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    async listarRamais(req,res){
      const ramais = await Asterisk.listarRamais()
      res.json(ramais);
      
    }

    async servidorWebRTC(req,res){
        const empresa = await User.getEmpresa(req)
        const s = await Asterisk.servidorWebRTC(empresa)
        const resp = {
          "endereco":`${s[0].protocolo}://${s[0].ip}:${s[0].porta}/ws`,
          "ip":s[0].ip
        };
        res.json(resp)
    }  

   
    testLigacao(req,res){
        const numero = parseInt(req.params.numero)
        const ramal = '1001'

        Asterisk.testLigacao(numero,ramal,res)      
             
    }

    ligarHttp(req,res){
        const numero = parseInt(req.params.numero)
        const ramal = req.params.ramal

        let username = 'mega-user-ari';
        let password = '1234abc@';
        let auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');


        let options = {
            protocol:'http:',
            host: '35.239.60.116',
            auth : `${username}:${password}`,
            port: 8088,
            path: '/ari/sounds',
            method: 'POST'           
          };
          
          var req = http.request(options, function(res) {
            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
            });
          });
          
          req.on('error', function(e) {
            //console.log('problem with request: ' + e.message);
          });
          
          // write data to request body
          req.write('data\n');
          req.write('data\n');
          req.end();
    }
    

    dialer(req,res){
        const numero = req.params.numero
        const ramal = req.params.ramal
        const path = 'asterisk/var/spool/outgoing'
        const filename = `${numero}.call`
        const file = `${path}/${filename}`

        const data = `Channel: PJSIP/${numero}\nCallerid: <${ramal}>\nMaxRetries: 2\nRetryTime: 60\nWaitTime: 30\nContext: from-dialer\nExtension: ${ramal}\nPriority: 1\nArchive: Yes\n`;

        fs.writeFile(file, data, (erro)=>{
            if(erro) throw erro;        
            //console.log("Arquivo salvo");
        });
    }   
}

export default new AsteriskController();