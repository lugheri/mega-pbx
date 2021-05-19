"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _util = require('util'); var _util2 = _interopRequireDefault(_util);
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _jssip = require('jssip'); var _jssip2 = _interopRequireDefault(_jssip);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
//const asteriskServer = 'http://35.202.102.245:8088'
//const asteriskServer = 'asterisk'
//const asteriskServer = 'localhost'

class AsteriskController{

    //Funcoes automaticas dialplan do asterisk

    agi_test(req,res){
        const dados = req.body
        
        _Asterisk2.default.agi_test(dados,(e,r)=>{
            if(e) throw e

            res.json(r) 
        })
    }

    setRecord(req,res){
        const data = req.body.date
        const hora = req.body.time
        const ramal = req.body.ramal
        const uniqueid = req.body.uniqueid
       
        _Asterisk2.default.setRecord(data,hora,ramal,uniqueid,(e,server)=>{
            if(e) throw e

            res.json(server[0].ip) 
        })
    }

    agi(req,res){
        const action = req.params.action
        const dados = req.body

        if(action=='machine'){//Quando cai na caixa postal
            _Asterisk2.default.machine(dados,(e,r)=>{
                if(e) throw e
                
                res.json(r);
            })
        }
        if(action=='get_queue'){//Quando reconhece a voz humana
            const numero = req.body.numero
            
            _Campanhas2.default.getQueueByNumber(numero,(e,queue)=>{
                if(e) throw e

                if(queue.length==0){
                    console.log('Sem filas disponivel')
                    res.json("")
                }else{
                    const fila = queue[0].Fila
                    const idRegistro = queue[0].id
                    _Campanhas2.default.atualizaStatusRegistro(idRegistro)

                    res.json(fila)
                }
            })
        }
        if(action=='answer'){//Quando ligacao eh atendida pelo agente
            _Asterisk2.default.answer(dados,(e,r)=>{
                if(e) throw e
                console.log('chamada atendida')
                res.json(r);
            })
        }
        if(action=='handcall'){//Chamada manual
            _Asterisk2.default.handcall(dados,(e,r)=>{
                if(e) throw e
                console.log('chamada manual')
                res.json(r);
            })
        }
        if(action=='abandon'){//Quando abandona fila

        } 
        if(action=='fail'){//Quando nao atende

        }
        if(action=='abandon'){//Quando abandona fila

        }        
    }

    //Acoes do discador
    atenderChamada(req,res){
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        _Campanhas2.default.atualizaEstadoAgente(ramal,estado,pausa,(e,r)=>{
            if(e) throw e

            _Asterisk2.default.dadosChamada(ramal,(e,calldata)=>{
                if(e) throw e
              
                res.json(calldata);
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

        _Campanhas2.default.atualizaEstadoAgente(ramal,estado,pausaTabulacao,(e,r)=>{
            if(e) throw e

            _Asterisk2.default.desligaChamada(idAtendimento,ramal,numeroDiscado,(e,r)=>{
                if(e) throw e
            
                res.json(r);
            })
        })
    }

    tabularChamada(req,res){
        const dados = req.body;
        _Asterisk2.default.tabularChamada(dados,(e,r)=>{
            if(e) throw e
          
            res.json(r);
        })

    }

  
    



  channelDump(req,res){
    _Asterisk2.default.channelDump((e,r)=>{
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
        
        _Asterisk2.default.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }
    
    removerFila(req,res){
        const nomeFila = req.params.nomeFila
        _Asterisk2.default.removerFila(nomeFila,(err,result)=>{
            if(err) throw err;

            res.json(true)
        })
    }

    dadosFila(req,res){
        const nomeFila = req.params.nomeFila
        _Asterisk2.default.dadosFila(nomeFila,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    listarFilas(req,res){
        _Asterisk2.default.listarFilas((err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    editarFila(req,res){
        const nomeFila = req.params.nomeFila
        const dados = req.body;
        _Asterisk2.default.editarFila(nomeFila,dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }

    addMembroFila(req,res){      
        const dados = req.body;
        _Asterisk2.default.addMembroFila(dados,(err,result)=>{
            if(err) throw err;

            res.json(result)
        })
    }
    
    listarMembrosFila(req,res){ 
        const nomeFila = req.params.nomeFila
        _Asterisk2.default.listarMembrosFila(nomeFila,(err,result)=>{
            if(err) throw err;

            res.json(result)    
        })
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

    servidorWebRTC(req,res){
      _Asterisk2.default.servidorWebRTC((e,r)=>{
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

        _Asterisk2.default.testLigacao(numero,ramal,(e,r)=>{
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

        _fs2.default.writeFile(file, data, (erro)=>{
            if(erro) throw erro;        
            console.log("Arquivo salvo");
        });
    } 
    
    
}

exports. default = new AsteriskController();