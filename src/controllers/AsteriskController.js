import Asterisk from '../models/Asterisk';
import util from 'util';
import fs from 'fs';
import Discador from '../models/Discador';
import Cronometro from '../models/Cronometro';
//const asteriskServer = 'http://35.202.102.245:8088'
//const asteriskServer = 'asterisk'
//const asteriskServer = 'localhost'

class AsteriskController{
    //Funcoes automaticas dialplan do asterisk
    agi_test(req,res){
        const dados = req.body        
        Asterisk.agi_test(dados,(e,r)=>{
            if(e) throw e

            res.json(r) 
        })
    }

    setRecord(req,res){
        const data = req.body.date
        const hora = req.body.time
        const ramal = req.body.ramal
        const uniqueid = req.body.uniqueid       
        Asterisk.setRecord(data,hora,ramal,uniqueid,(e,server)=>{
            if(e) throw e

            res.json(server[0].ip) 
        })
    }

    async agi(req,res){
        const action = req.params.action
        const dados = req.body
        if(action=='machine'){//Quando cai na caixa postal
            const r = await Asterisk.machine(dados)
            res.json(r);
        }
        if(action=='get_queue'){//Quando reconhece a voz humana
            const numero = req.body.numero
            const queue = await Discador.getQueueByNumber(numero)
            if(queue.length==0){
                res.json("")
                return false
            }
            const fila = queue[0].Fila
            const idAtendimento = queue[0].id
            console.log('idAtendimento',idAtendimento)
            await Discador.setaRegistroNaFila(idAtendimento)
            //recupera dados da campanhas
            const dadosAtendimento = await Discador.dadosAtendimento(idAtendimento)
            console.log('dadosAtendimento',dadosAtendimento)
            const idCampanha = dadosAtendimento[0].id_campanha
            const idMailing = dadosAtendimento[0].id_mailing
            const idRegistro = dadosAtendimento[0].id_registro
            await Cronometro.entrouNaFila(idCampanha,idMailing,idRegistro,numero)
            res.json(fila)            
        }
        if(action=='answer'){//Quando ligacao eh atendida pelo agente
            const r = await Asterisk.answer(dados)
            await Cronometro.saiuDaFila(dados.numero)
            const dadosAtendimento = await Discador.dadosAtendimento_byNumero(dados.numero)
            const idCampanha = dadosAtendimento[0].id_campanha
            const idMailing = dadosAtendimento[0].id_mailing
            const idRegistro = dadosAtendimento[0].id_registro 
            const uniqueid = dadosAtendimento[0].uniqueid  
            let ch = dados.ramal;
                ch = ch.split("-");
                ch = ch[0].split("/")
            const ramal = ch[1]                      
            //iniciou chamada
            await Cronometro.iniciouAtendimento(idCampanha,idMailing,idRegistro,dados.numero,ramal,uniqueid)
            res.json(true);
        } 
        
        if(action=='abandon'){//Quando abandona fila
            const numero = dados.numero
            const chamada = await Discador.dadosAtendimento_byNumero(dados.numero)
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
                const observacoes = 'Abandonou Fila'

                //retira da fila e registra como abandonou fila
                await Cronometro.saiuDaFila(dados.numero)
                //Registra histórico de chamada
                await Discador.registraHistoricoAtendimento(protocolo,idCampanha,idMailing,idRegistro,idNumero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado)
                //Tabula registro
                await Discador.tabulandoContato(idAtendimento,contatado,tabulacao,observacoes,produtivo,ramal)
                res.json(true);
            }
        } 
        if(action=='fail'){//Quando nao atende

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
    
    listarMembrosFila(req,res){ 
        const nomeFila = req.params.nomeFila
        Asterisk.listarMembrosFila(nomeFila,(err,result)=>{
            if(err) throw err;

            res.json(result)    
        })
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

    servidorWebRTC(req,res){
      Asterisk.servidorWebRTC((e,r)=>{
        if(e) throw e;

        const resp = {
          "endereco":`${r[0].protocolo}://${r[0].ip}:${r[0].porta}/ws`,
          "ip":r[0].ip
        };

        res.json(resp)
      
      })
    }  

    /*testLigacao(req,res){
      const numero = parseInt(req.params.numero)
      const ramal = '9878'

      Asterisk.testLigacao(numero,ramal,(e,r)=>{
        if(e) throw e

        res.json(true)
      })     
     
    }*//////////
    testLigacao(req,res){
        const numero = parseInt(req.params.numero)
        const ramal = '1001'

        Asterisk.testLigacao(numero,ramal,res)      
             
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