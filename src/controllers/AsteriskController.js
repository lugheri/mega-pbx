import Asterisk from '../models/Asterisk';
import User from '../models/User';
import util from 'util';
import fs from 'fs';
import Discador from '../models/Discador';
import Cronometro from '../models/Cronometro';
import moment from 'moment';
//const asteriskServer = 'http://35.202.102.245:8088'
//const asteriskServer = 'asterisk'
//const asteriskServer = 'localhost'
import http from 'http';

class AsteriskController{
    //Funcoes automaticas dialplan do asterisk
    async setRecord(req,res){
        const empresa = req.body.empresa
        const data = req.body.date
        const hora = req.body.time
        const ramal = req.body.ramal
        const uniqueid = req.body.uniqueid  
        const numero = req.body.numero   
        const server = await Asterisk.setRecord(empresa,data,hora,ramal,uniqueid,numero)
        res.json(server[0].ip) 
    }

    async agi(req,res){
        const action = req.params.action
        const dados = req.body
        if(action=='voz'){
            const empresa = dados.empresa
            const numero = dados.numero
            const voz = await Discador.saudadacao(empresa,numero)

            const hora = moment().format("HH")
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
            const r = await Asterisk.machine(dados)
            console.log('agi:machine',`Empresa: ${dados.empresa},numero:${dados.numero},status:${dados.status}, saida: ${r}`)
            res.json(r);
        }
        if(action=='set_queue'){//Quando reconhece a voz humana
            const empresa = dados.empresa
            const numero = dados.numero 
            const dadosAtendimento = await Discador.setaRegistroNaFila(empresa,numero)
            if(dadosAtendimento===false){
                res.json(false) 
                return false
            }
            //recupera dados da campanhas           
            const idCampanha = dadosAtendimento[0].id_campanha
            const idMailing = dadosAtendimento[0].id_mailing
            const idRegistro = dadosAtendimento[0].id_registro
            await Cronometro.entrouNaFila(empresa,idCampanha,idMailing,idRegistro,numero)

            console.log('agi:set_queue',`Empresa: ${empresa},numero: ${numero}, saida: ${dadosAtendimento}`)
            res.json(true)            
        }
        
        if(action=='answer'){//Quando ligacao eh atendida pelo agente
            const empresa = dados.empresa
            const uniqueid = dados.numero 
            const numero = dados.numero
            const tipoChamada = dados.tipoChamada
            let ch = dados.ramal;
            ch = ch.split("-");
            ch = ch[0].split("/")
            const ramal = ch[1]

            if(tipoChamada=="manual"){
                await Discador.alterarEstadoAgente(empresa,ramal,3,0)
            }else{               
                const r = await Asterisk.answer(empresa,uniqueid,numero,ramal)
                console.log('agi:answer',`Empresa: ${empresa},numero: ${numero},uniqueid:${uniqueid},ramal:${ramal}, saida: ${r}`)
                await Cronometro.saiuDaFila(empresa,numero)
                const dadosAtendimento = await Discador.dadosAtendimento_byNumero(empresa,numero)
                if(dadosAtendimento.length==0){
                    res.json(false);
                    return false
                }
                const idCampanha = dadosAtendimento[0].id_campanha
                const idMailing = dadosAtendimento[0].id_mailing
                const idRegistro = dadosAtendimento[0].id_registro 
                const uniqueid_Reg = dadosAtendimento[0].uniqueid  
            

                await Discador.alterarEstadoAgente(empresa,ramal,3,0)
                await Discador.atendeChamada(empresa,ramal)
                //atualizando ramal na chamada simultanea
                
                //iniciou chamada
                await Cronometro.iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,numero,ramal,uniqueid_Reg)
                res.json(true);
            }
        } 
        
        if(action=='desligou'){//Quando abandona fila  
            const empresa = dados.empresa          
            const numero = dados.numero
            const motivo = dados.motivo
            const abandonada = dados.abandonada
            const chamada = await Discador.dadosAtendimento_byNumero(empresa,numero)
            console.log('agi:desligou',`Empresa: ${empresa},numero: ${numero},motivo:${motivo}, saida: ${chamada}`)
            if(chamada.length==0){
                res.json(false);
                return false    
            }
            const fila = chamada[0].na_fila
            if(fila==1){
                const idAtendimento =chamada[0].id          
                const idRegistro=chamada[0].id_registro
                const idNumero=chamada[0].id_numero
                const idCampanha=chamada[0].id_campanha
                const idMailing=chamada[0].id_mailing
                const ramal=chamada[0].ramal
                const protocolo=chamada[0].protocolo
                const tabulacao = 0
                const contatado = 'N'
                const produtivo = 0
                const uniqueid=chamada[0].uniqueid
                const tipo_ligacao=chamada[0].tipo_ligacao
                const observacoes = motivo
                const removeNumero =0

                //retira da fila e registra como abandonou fila
                await Cronometro.saiuDaFila(empresa,numero)
                //Registra histórico de chamada
                await Discador.registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,idRegistro,idNumero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado)
                //Tabula registro
                await Discador.tabulaChamada(empresa.idAtendimento,contatado,tabulacao,observacoes,produtivo,ramal,idNumero,removeNumero)
                //Removendo ligacao do historico de chamadas_simultaneas
                await Discador.clearCallbyId(empresa,idAtendimento)    
                if(abandonada==true){
                    await Discador.removeChamadaSimultanea(empresa,idAtendimento)
                }
                res.json(true);
            }else{
                await Discador.desligaChamadaNumero(empresa,numero)
                res.json(true);
            }

           
        }
    }


    /////////////////////// testes ////////////////////////////////
    
    channelDump(req,res){
        Asterisk.channelDump((e,r)=>{
        console.log('channel dump')
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

    listarRamais(req,res){
      Asterisk.listarRamais((e,r)=>{
        if(e) throw e;

        res.json(r);
      })
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

        fs.writeFile(file, data, (erro)=>{
            if(erro) throw erro;        
            console.log("Arquivo salvo");
        });
    } 
    
    
}

export default new AsteriskController();