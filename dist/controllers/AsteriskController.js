"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _util = require('util'); var _util2 = _interopRequireDefault(_util);
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
//const asteriskServer = 'http://35.202.102.245:8088'
//const asteriskServer = 'asterisk'
//const asteriskServer = 'localhost'
var _http = require('http'); var _http2 = _interopRequireDefault(_http);

class AsteriskController{
    //Funcoes automaticas dialplan do asterisk
    async setRecord(req,res){
        const empresa = req.body.empresa
        const data = req.body.date
        const hora = req.body.time
        let ch = req.body.channel;
                ch = ch.split("-");
                ch = ch[0].split("/")
        let user_ramal = ch[1]   
        
        if((user_ramal==undefined)||(user_ramal=="undefined")||(user_ramal===false)){
            let rm = req.body.ramal;
                rm = rm.split("-");
                rm = rm[0].split("/")
                user_ramal = rm[1]
        }
        
        const uniqueid = req.body.uniqueid  
        const numero = req.body.numero   
        const callfilename = req.body.callfilename  
        const server = await _Asterisk2.default.setRecord(empresa,data,hora,user_ramal,uniqueid,numero,callfilename)
        res.json(server[0].ip) 
    }

    async agi(req,res){
        const action = req.params.action
        const dados = req.body
        if(action=='voz'){
            const empresa = dados.empresa
            const numero = dados.numero
            const voz = await _Discador2.default.saudadacao(empresa,numero)

            const hora = _moment2.default.call(void 0, ).format("HH")
            let periodo='bom-dia'
            if(hora<=12){
                periodo='bom-dia'
            }else if(hora<=18){
                periodo='boa-tarde'
            }else{  
                periodo='boa-noite'
            }
            const saudacao=`${voz}-${periodo}`


            console.log('agi:voz',`Empresa: ${empresa},numero: ${numero}, saida: ${saudacao}`)
            res.json(saudacao)   
        }
        if(action=='machine'){//Quando cai na caixa postal
            const r = await _Asterisk2.default.machine(dados)
            console.log('agi:machine',`Empresa: ${dados.empresa},numero:${dados.numero},status:${dados.status}, saida: ${r}`)
            res.json(r);
        }
        if(action=='set_queue'){//Quando reconhece a voz humana
            const empresa = dados.empresa
            const idAtendimento= dados.idAtendimento
            const numero = dados.numero 
            const dadosAtendimento = await _Discador2.default.setaRegistroNaFila(empresa,idAtendimento)
            if(dadosAtendimento===false){
                res.json(false) 
                return false
            }
            //recupera dados da campanhas           
            const idCampanha = dadosAtendimento[0].id_campanha
            const idMailing = dadosAtendimento[0].id_mailing
            const idRegistro = dadosAtendimento[0].id_registro
            await _Cronometro2.default.entrouNaFila(empresa,idCampanha,idMailing,idRegistro,numero)

            console.log('agi:set_queue',`Empresa: ${empresa},numero: ${numero}, saida: ${dadosAtendimento}`)
            res.json(true)            
        }
        
        if(action=='answer'){//Quando ligacao eh atendida pelo agente
            const empresa = dados.empresa            
            const uniqueid = dados.uniqueid 
            const numero = dados.numero
            const tipoChamada = dados.tipoChamada           
            
            let ch = dados.ramal;
            ch = ch.split("-");
            ch = ch[0].split("/")
            const ramal = ch[1]

            if(tipoChamada=="manual"){
                //insere dados na chamada simultanea 
                await _Discador2.default.registraChamada(empresa,ramal,0,'manual',tipoChamada,0,0,0,0,0,numero,0,1,1)       
                await _Discador2.default.alterarEstadoAgente(empresa,ramal,6,0)
                await _Cronometro2.default.iniciouAtendimento(empresa,0,0,0,tipoChamada,numero,ramal,uniqueid)
            }else{   
                let idAtendimento
                if(tipoChamada=="POWER"){
                    idAtendimento = dados.idAtendimento
                }else{                
                    const da = await _Discador2.default.dadosAtendimento_byNumero(empresa,numero);
                    idAtendimento = da[0].id;
                }            
                const r = await _Asterisk2.default.answer(empresa,uniqueid,idAtendimento,ramal)
                console.log('agi:answer',`Empresa: ${empresa},idAtendimento: ${idAtendimento}, numero: ${numero},uniqueid:${uniqueid},ramal:${ramal}, saida: ${r}`)
                await _Cronometro2.default.saiuDaFila(empresa,numero)
                const dadosAtendimento = await _Discador2.default.dadosAtendimento(empresa,idAtendimento)
                if(dadosAtendimento.length==0){
                    res.json(false);
                    return false
                }
                const idCampanha = dadosAtendimento[0].id_campanha
                const idMailing = dadosAtendimento[0].id_mailing
                const idRegistro = dadosAtendimento[0].id_registro 
                const uniqueid_Reg = dadosAtendimento[0].uniqueid  
            

                await _Discador2.default.alterarEstadoAgente(empresa,ramal,3,0)
                await _Discador2.default.atendeChamada(empresa,ramal)
                //atualizando ramal na chamada simultanea
                
                //iniciou chamada
                await _Cronometro2.default.iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,tipoChamada,numero,ramal,uniqueid_Reg)
                
            }
            res.json(true);
        } 
        
        if(action=='desligou'){//Quando abandona fila  
            const empresa = dados.empresa    
            let idAtendimento = dados.idAtendimento      
            const numero = dados.numero
            const motivo = dados.motivo
            const abandonada = dados.abandonada

            console.log('empresa',empresa)
            console.log('idAtendimento',idAtendimento)
            console.log('numero',numero)
            console.log('motivo',motivo)
            console.log('abandonada',abandonada)

            if(idAtendimento==0){
                const da = await _Discador2.default.dadosAtendimento_byNumero(empresa,numero);
                if(da.length!=0){
                    idAtendimento = da[0].id;
                }
            }
            //console.log('idAtendimento',idAtendimento)
            const chamada = await _Discador2.default.dadosAtendimento(empresa,idAtendimento)
            console.log('agi:desligou',`Empresa: ${empresa},numero: ${numero},motivo:${motivo}, saida: ${chamada}`)
            if(chamada.length==0){
                res.json(false);
                return false    
            }
            const fila = chamada[0].na_fila
            console.log('tipo_discador',chamada[0].tipo_discador)
            if(chamada[0].tipo_discador=='manual'){
                await _Discador2.default.removeChamadaSimultaneas(empresa,idAtendimento)
                await _Cronometro2.default.saiuLigacao(empresa,0,numero,chamada[0].ramal)
                res.json(true);
                return false 
            }  
            if(fila==1){
                const idRegistro=chamada[0].id_registro
                const idNumero=chamada[0].id_numero
                const idCampanha=chamada[0].id_campanha
                const tipoChamado=chamada[0].tipo_discador
                const idMailing=chamada[0].id_mailing
                const ramal=chamada[0].ramal
                const protocolo=chamada[0].protocolo
                const tabulacao = 0
                const contatado = 'N'
                const produtivo = 0
                const uniqueid=chamada[0].uniqueid
                const tipo_ligacao=chamada[0].tipo_ligacao
                let observacoes = motivo
                if(abandonada==true){
                    observacoes="ABANDONADA";
                }
                
                const removeNumero =0

                //retira da fila e registra como abandonou fila
                await _Cronometro2.default.saiuDaFila(empresa,numero)
                //Registra histórico de chamada
               
                await _Discador2.default.registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,idRegistro,idNumero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado)
                //Tabula registro
                await _Discador2.default.tabulaChamada(empresa.idAtendimento,contatado,tabulacao,observacoes,produtivo,ramal,idNumero,removeNumero)
                
                //Removendo ligacao do historico de chamadas_simultaneas
               await _Discador2.default.clearCallbyId(empresa,idAtendimento)    

                if(abandonada==true){
                    await _Discador2.default.removeChamadaSimultaneasAbandonadas(empresa,idAtendimento)
                }
                res.json(true);
            }else{
                await _Discador2.default.desligaChamadaNumero(empresa,dadosAtendimento[0].id_campanha,numero,chamada[0].ramal)
                res.json(true);
            }

           
        }
    }


    /////////////////////// testes ////////////////////////////////
    
    channelDump(req,res){
        _Asterisk2.default.channelDump((e,r)=>{
        console.log('channel dump')
        })
    } 
   

    addMembroFila(req,res){      
        const dados = req.body;
        _Asterisk2.default.addMembroFila(dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }
    
    async listarMembrosFila(req,res){ 
        const nomeFila = req.params.nomeFila
        const agentes = await _Asterisk2.default.listarMembrosFila(nomeFila)
        res.json(agentes)           
    }

    delMembroFila(req,res){
        const uniqueid = parseInt(req.params.uniqueid)
        _Asterisk2.default.delMembroFila(uniqueid,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
        
    }
    
    async criarRamal(req,res){
        const dados = req.body;
        await _Asterisk2.default.criarRamal(dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    listarRamais(req,res){
      _Asterisk2.default.listarRamais((e,r)=>{
        if(e) throw e;

        res.json(r);
      })
    }

    async servidorWebRTC(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const s = await _Asterisk2.default.servidorWebRTC(empresa)
        const resp = {
          "endereco":`${s[0].protocolo}://${s[0].ip}:${s[0].porta}/ws`,
          "ip":s[0].ip
        };
        res.json(resp)
    }  

   
    testLigacao(req,res){
        const numero = parseInt(req.params.numero)
        const ramal = '1001'

        _Asterisk2.default.testLigacao(numero,ramal,res)      
             
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
          
          var req = _http2.default.request(options, function(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              console.log('BODY: ' + chunk);
            });
          });
          
          req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
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

        _fs2.default.writeFile(file, data, (erro)=>{
            if(erro) throw erro;        
            console.log("Arquivo salvo");
        });
    } 
    
    
}

exports. default = new AsteriskController();