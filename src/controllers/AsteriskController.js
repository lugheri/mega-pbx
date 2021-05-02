import Asterisk from '../models/Asterisk';
import util from 'util';
import fs from 'fs';
import JsSIP from 'jssip';
import Campanhas from '../models/Campanhas';
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

    agi(req,res){
        const action = req.params.action
        const dados = req.body

        if(action=='machine'){//Quando cai na caixa postal
            Asterisk.machine(dados,(e,r)=>{
                if(e) throw e
                
                res.json(r);
            })
        }
        if(action=='get_queue'){//Quando reconhece a voz humana
            const numero = req.body.numero
            
            Campanhas.getQueueByNumber(numero,(e,queue)=>{
                if(e) throw e

                if(queue.length==0){
                    console.log('Sem filas disponivel')
                    res.json("")
                }else{
                    const fila = queue[0].Fila
                    const idRegistro = queue[0].id
                    Campanhas.atualizaStatusRegistro(idRegistro)

                    res.json(fila)
                }
            })
        }
        if(action=='answer'){//Quando ligacao eh atendida pelo agente
            Asterisk.answer(dados,(e,r)=>{
                if(e) throw e
                console.log('chamada atendida')
                res.json(r);
            })
        }
        if(action=='fail'){//Quando nao atende

        }
        if(action=='abandon'){//Quando abandona fila

        }        
    }

    //Acoes do discador
    atenderChamada(req,res){
        const ramal = req.params.ramal
        const estado = 3
        //atualiza para falando
        Campanhas.atualizaEstadoAgente(ramal,estado,0,(e,r)=>{
            if(e) throw e

            Asterisk.dadosChamada(ramal,(e,r)=>{
                if(e) throw e
              
                res.json(r);
            });
        })
        

    }

    desligarChamada(req,res){
        const idAtendimento =  req.body.idAtendimento
        const ramal  =  req.body.ramal
        const numeroDiscado =  req.body.numeroDiscado

        //Verifica se existe regra de tabulacao obrigatória

        
        const estado = 2
        const pausaTabulacao = 0//Id de pausa tabulacao
         //atualiza para disponivel ou tabulando

        Campanhas.atualizaEstadoAgente(ramal,estado,pausaTabulacao,(e,r)=>{
            if(e) throw e

            Asterisk.desligaChamada(idAtendimento,ramal,numeroDiscado,(e,r)=>{
                if(e) throw e
            
                res.json(r);
            })
        })
    }

    tabularChamada(req,res){
        const dados = req.body;
        Asterisk.tabularChamada(dados,(e,r)=>{
            if(e) throw e
          
            res.json(r);
        })

    }













  channelDump(req,res){
    Asterisk.channelDump((e,r)=>{
      console.log('channel dump')
    })
  }
  /////////////////////// testes ////////////////////////////////
    criarFila(req,res){
        const name = req.body.name
        const musiconhold = req.body.musiconhold
        const strategy = req.body.strategy
        const timeout = req.body.timeout
        const retry = req.body.retry
        const autopause = req.body.autopause
        const maxlen = req.body.maxlen
        
        Asterisk.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }
    
    removerFila(req,res){
        const nomeFila = req.params.nomeFila
        Asterisk.removerFila(nomeFila,(err,result)=>{
            if(err) throw err;

            res.json(true)
        })
    }

    dadosFila(req,res){
        const nomeFila = req.params.nomeFila
        Asterisk.dadosFila(nomeFila,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    listarFilas(req,res){
        Asterisk.listarFilas((err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    editarFila(req,res){
        const nomeFila = req.params.nomeFila
        const dados = req.body;
        Asterisk.editarFila(nomeFila,dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
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
        const ramal = '9878'

        Asterisk.testLigacao(numero,ramal,(e,r)=>{
            if(e) throw e

            res.json(true)
        })      
             
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