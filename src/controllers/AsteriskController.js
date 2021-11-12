import Asterisk from '../models/Asterisk';
import Clients from '../models/Clients';
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
        const server = await Asterisk.setRecord(empresa,data,hora,user_ramal,uniqueid,numero,callfilename)
        res.json(server[0].ip) 
    }

    async agi(req,res){
        console.log('Iniciando AGI',req.body)
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
        if(action=='get_trunk'){
            const empresa = dados.empresa
            const register=[]
            const trunk = await Clients.getTrunk(empresa)
            res.json(trunk[0])   
        }
        if(action=='machine'){//Quando cai na caixa postal
            const r = await Asterisk.machine(dados)
            console.log('agi:machine',`Empresa: ${dados.empresa},numero:${dados.numero},status:${dados.status}, saida: ${r}`)

            
            res.json(r);
        }
        if(action=='set_queue'){//Quando reconhece a voz humana
           // console.log('Setando Queue',`Empresa: ${empresa},numero: ${numero}, saida: ${dadosAtendimento}`)
            const empresa = dados.empresa
            const idAtendimento= dados.idAtendimento
            const numero = dados.numero 
            const dadosAtendimento = await Discador.setaRegistroNaFila(empresa,idAtendimento)
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
        if(action=='handcall'){//Quando ligacao eh manual, preview ou click-to-call
            const empresa = dados.empresa            
            const uniqueid = dados.uniqueid 
            const numero = dados.numero
            let ch = dados.ramal;
            ch = ch.split("-");
            ch = ch[0].split("/")
            const ramal = ch[1]
            const tipoDiscador = dados.tipoDiscador
            const estadoAgente = dados.estadoAgente

            const idCampanha = 0
            const modoAtendimento = 'manual'
            const idMailing = 0
            const tabela_dados = 0
            const tabela_numeros = 0
            const id_reg = 0
            const id_numero = 0
            const fila = 0
            const tratado = 1
            const atendido = 0

            const protocolo=0
            const tabulacao=0
            const observacoes=""
            const contatado=0
            
            const r = await Discador.registraChamada(empresa,ramal,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,id_reg,id_numero,numero,fila,tratado,atendido)
            await Discador.alterarEstadoAgente(empresa,ramal,6,0)
            await Discador.registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,id_reg,id_numero,ramal,uniqueid,tipoDiscador,numero,tabulacao,observacoes,contatado)
                                
            res.json(r['insertId'])
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
                let idAtendimento = dados.idAtendimento
               
                if((idAtendimento==false)||(idAtendimento==0)||(idAtendimento=="")||(idAtendimento==undefined)){
                    const da = await Discador.dadosAtendimento_byNumero(empresa,numero);
                    idAtendimento = da[0].id;
                }
                const r = await Asterisk.manualAnswer(empresa,uniqueid,idAtendimento,ramal)    
                //await Discador.alterarEstadoAgente(empresa,ramal,7,0)
                await Cronometro.iniciouAtendimento(empresa,0,0,0,tipoChamada,numero,ramal,uniqueid)
            }else{   
                let idAtendimento
                if(tipoChamada=="POWER"){
                    idAtendimento = dados.idAtendimento
                    if(idAtendimento==undefined){
                        const da = await Discador.dadosAtendimento_byNumero(empresa,numero);
                        idAtendimento = da[0].id;
                    }
                }else{                
                    const da = await Discador.dadosAtendimento_byNumero(empresa,numero);
                    idAtendimento = da[0].id;
                }         
                
                const r = await Asterisk.answer(empresa,uniqueid,idAtendimento,ramal)
                await Cronometro.saiuDaFila(empresa,numero)
                const dadosAtendimento = await Discador.dadosAtendimento(empresa,idAtendimento)
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
                await Cronometro.iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,tipoChamada,numero,ramal,uniqueid_Reg)
                
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
                const da = await Discador.dadosAtendimento_byNumero(empresa,numero);
                if(da.length!=0){
                    idAtendimento = da[0].id;
                }
            }
            //console.log('idAtendimento',idAtendimento)
            const chamada = await Discador.dadosAtendimento(empresa,idAtendimento)
            console.log('agi:desligou',`Empresa: ${empresa},numero: ${numero},motivo:${motivo}, saida: ${chamada}`)
            if(chamada.length==0){
                res.json(false);
                return false    
            }
            const fila = chamada[0].na_fila
            console.log('tipo_discador',chamada[0].tipo_discador)
            if(chamada[0].tipo_discador=='manual'){
                await Discador.removeChamadaSimultaneas(empresa,idAtendimento)
                await Cronometro.saiuLigacao(empresa,0,numero,chamada[0].ramal)
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
                await Cronometro.saiuDaFila(empresa,numero)
                //Registra histórico de chamada
               
                await Discador.registraHistoricoAtendimento(empresa,protocolo,idCampanha,idMailing,idRegistro,idNumero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado)
                //Tabula registro
                await Discador.tabulaChamada(empresa.idAtendimento,contatado,tabulacao,observacoes,produtivo,ramal,idNumero,removeNumero)
                
                //Removendo ligacao do historico de chamadas_simultaneas
               await Discador.clearCallbyId(empresa,idAtendimento)    

                if(abandonada==true){
                    await Discador.removeChamadaSimultaneasAbandonadas(empresa,idAtendimento)
                }
                res.json(true);
            }else{
                await Discador.desligaChamadaNumero(empresa,chamada[0].id_campanha,numero,chamada[0].ramal)
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