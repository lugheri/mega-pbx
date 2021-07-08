"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _util = require('util'); var _util2 = _interopRequireDefault(_util);
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
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
            
            _Discador2.default.getQueueByNumber(numero,(e,queue)=>{
                if(e) throw e

                if(queue.length==0){
                    console.log('Sem filas disponivel')
                    res.json("")
                }else{
                
                    const fila = queue[0].Fila
                    const idAtendimento = queue[0].id
                    _Discador2.default.setaRegistroNaFila(idAtendimento,(e,r)=>{
                        if(e) throw e
                        console.log(`1 Com filas ${fila}`)

                        //recupera dados da campanhas
                        _Discador2.default.dadosAtendimento(idAtendimento, (e,dadosAtendimento)=>{
                            if(e) throw e
                           
                            const idCampanha = dadosAtendimento[0].id_campanha
                            const idMailing = dadosAtendimento[0].id_mailing
                            const idRegistro = dadosAtendimento[0].id_reg

                            _Cronometro2.default.entrouNaFila(idCampanha,idMailing,idRegistro,numero,(e,r)=>{
                                if(e) throw e
                                //inicia contagem do tempo da fila

                                console.log(`idAtendimento ${idAtendimento}`)
                                res.json(fila)
                            })                            
                        })                        
                    })                   
                }
            })
        }
        if(action=='answer'){//Quando ligacao eh atendida pelo agente
            _Asterisk2.default.answer(dados,(e,r)=>{
                if(e) throw e

                _Cronometro2.default.saiuDaFila(dados.numero,(e,r)=>{
                    console.log('chamada atendida')
                   
                    _Discador2.default.dadosAtendimento_byNumero(dados.numero, (e,dadosAtendimento)=>{
                        if(e) throw e
                       
                        const idCampanha = dadosAtendimento[0].id_campanha
                        const idMailing = dadosAtendimento[0].id_mailing
                        const idRegistro = dadosAtendimento[0].id_reg  
                        const uniqueid = dadosAtendimento[0].uniqueid  
                        let ch = dados.ramal;
                        ch = ch.split("-");
                        ch = ch[0].split("/")
                        const ramal = ch[1]                      
                        //iniciou chamada
                        _Cronometro2.default.iniciouAtendimento(idCampanha,idMailing,idRegistro,dados.numero,ramal,uniqueid,(e,r)=>{
                            if(e) throw e

                            res.json(true);
                        })
                    })
                })  
            })
        }        
        if(action=='handcall'){//Chamada manual
            
        }
        if(action=='abandon'){//Quando abandona fila
            const numero = dados.numero
            _Discador2.default.dadosAtendimento_byNumero(numero, (e,chamada)=>{
                if(e) throw e
                //Verifica se a chamada esta na fila
                if(chamada.length==0){
                    res.json(false);
                }else{
                    const fila = chamada[0].na_fila
                    console.log(numero,fila)

                    if(fila==1){
                        const idAtendimento =chamada[0].id          
                        const id_reg=chamada[0].id_reg
                        const tabela=chamada[0].tabela_mailing
                        const idCampanha=chamada[0].id_campanha
                        const idMailing=chamada[0].id_mailing
                        const ramal=chamada[0].ramal
                        const protocolo=chamada[0].protocolo
                        //console.log(`protocolo ${protocolo}`)
                        //Status de tabulacao referente ao nao atendido
                        const tabulacao = 0
                        const contatado = 'N'
                        const produtivo = 0
                        const uniqueid=chamada[0].uniqueid
                        const tipo_ligacao=chamada[0].tipo_ligacao
                        const observacoes = 'ABANDONOU FILA'

                        //retira da fila e registra como abandonou fila
                        _Cronometro2.default.saiuDaFila(dados.numero,(e,r)=>{
                            if(e) throw e

                            //Registra histórico de chamada
                            _Discador2.default.registraHistoricoAtendimento(protocolo,idCampanha,idMailing,id_reg,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado,(e,r)=>{
                                if(e) throw e
                                //Tabula registro
                                _Discador2.default.tabulandoContato(idAtendimento,tabela,contatado,tabulacao,observacoes,produtivo,numero,ramal,id_reg,idMailing,idCampanha,(e,r)=>{
                                    if(e) throw e
                                    
                                    res.json(true);
                                })
                            }) 
                        })
                    }else{
                        res.json(false);
                    }
                }
                              
            })
        } 
        if(action=='fail'){//Quando nao atende

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
        const ramal = '1001'

        _Asterisk2.default.testLigacao(numero,ramal,res)      
             
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