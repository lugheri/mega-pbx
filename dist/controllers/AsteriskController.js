"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _util = require('util'); var _util2 = _interopRequireDefault(_util);
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _jssip = require('jssip'); var _jssip2 = _interopRequireDefault(_jssip);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);
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
            
            _Campanhas2.default.getQueueByNumber(numero,(e,queue)=>{
                if(e) throw e

                if(queue.length==0){
                    console.log('Sem filas disponivel')
                    res.json("")
                }else{
                
                    const fila = queue[0].Fila
                    const idAtendimento = queue[0].id
                    _Campanhas2.default.setaRegistroNaFila(idAtendimento,(e,r)=>{
                        if(e) throw e
                        console.log(`1 Com filas ${fila}`)

                        //recupera dados da campanhas
                        _Asterisk2.default.dadosAtendimento(idAtendimento, (e,dadosAtendimento)=>{
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
                   
                    _Asterisk2.default.dadosAtendimento_byNumero(dados.numero, (e,dadosAtendimento)=>{
                        if(e) throw e
                       
                        const idCampanha = dadosAtendimento[0].id_campanha
                        const idMailing = dadosAtendimento[0].id_mailing
                        const idRegistro = dadosAtendimento[0].id_reg  
                        let ch = dados.ramal;
                        ch = ch.split("-");
                        ch = ch[0].split("/")
                        const ramal = ch[1]                      
                        //iniciou chamada
                        _Cronometro2.default.iniciouAtendimento(idCampanha,idMailing,idRegistro,dados.numero,ramal,(e,r)=>{
                            if(e) throw e

                            res.json(true);
                        })
                    })
                })  
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

    //retorna as informações da chamada recebida

    modoAtendimento(req,res){
        const ramal = req.params.ramal
        _Asterisk2.default.modoAtendimento(ramal,(e,dadosChamada)=>{
            if(e) throw e         

            if(dadosChamada.length==0){
                let dados = '{"config":{"origem":"telefone","modo_atendimento":"manual"}}'
                res.json(JSON.parse(dados))
            }else{
                const idAtendimento = dadosChamada[0].id
                const modo_atendimento = dadosChamada[0].modo_atendimento
               
                const idCampanha = dadosChamada[0].id_campanha
                let dados = ""                
                _Asterisk2.default.infoChamada_byIdAtendimento(idAtendimento,(e,infoChamada)=>{
                    if(e) throw e     

                    dados += infoChamada
                    dados += `, "config":{"origem":"discador","modo_atendimento":"${modo_atendimento}"}}`
                    console.log(dados)
                    res.json(JSON.parse(dados))
                })
            }
        })
    }


    atenderChamada(req,res){
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        _Campanhas2.default.atualizaEstadoAgente(ramal,estado,pausa,(e,r)=>{
            if(e) throw e

            _Asterisk2.default.atendeChamada(ramal,(e,calldata)=>{
                if(e) throw e
              
                res.json(calldata);
            });
        }) 
    }

    dadosChamada(req,res){
        const ramal = req.params.ramal
        _Asterisk2.default.infoChamada(ramal,(e,calldata)=>{
            if(e) throw e
              
            res.json(calldata);
        }) 
    }

    desligarChamada(req,res){
        const idAtendimento =  req.body.idAtendimento
        if(idAtendimento===false){//Chamada Manual
           const ramal  =  req.body.ramal

           const estado = 1//Atualiza estado do agente para disponivel
           const pausa = 0
           _Campanhas2.default.atualizaEstadoAgente(ramal,estado,pausa,(e,r)=>{
                if(e) throw e

                res.json(true);
           })

        }else{//Discador
            const ramal  =  req.body.ramal
            const numeroDiscado =  req.body.numero_discado

            //Verifica se existe regra de tabulacao obrigatória
            const tabular=true

            if(tabular==true){
                const estado = 3//Atualiza estado do agente para pausado 
                const tipo='tabulacao'
                //Id de pausa tabulacao

                _Pausas2.default.idPausaByTipo(tipo,(e,idPausa)=>{
                    if(e) throw e

                    let pausaTabulacao
                    if(idPausa.length==0){
                        pausaTabulacao = 0
                    }else{
                        pausaTabulacao = idPausa[0].id
                    }                     
                
                    _Campanhas2.default.atualizaEstadoAgente(ramal,estado,pausaTabulacao,(e,r)=>{
                        if(e) throw e
                        
                        //Atualiza registro como tabulando e retorna id da campanha
                        _Asterisk2.default.preparaRegistroParaTabulacao(idAtendimento,(e,campanha)=>{
                            if(e) throw e
                            
                            const idCampanha = campanha[0].id_campanha
                            //Pega os status de tabulacao da campanha
                            _Tabulacoes2.default.statusTabulacaoCampanha(idCampanha,(e,statusTabulacao)=>{
                                if(e) throw e

                                //Finaliza Ligacao e inicia a contagem da tabulacao 
                                _Cronometro2.default.saiuLigacao(idCampanha,numeroDiscado,ramal,(e,r)=>{
                                    if(e) throw e


                                    _Asterisk2.default.dadosAtendimento_byNumero(numeroDiscado, (e,dadosAtendimento)=>{
                                        if(e) throw e
                                       
                                        const idCampanha = dadosAtendimento[0].id_campanha
                                        const idMailing = dadosAtendimento[0].id_mailing
                                        const idRegistro = dadosAtendimento[0].id_reg  
                                        //Inicia contagem do tempo de tabulacao
                                        _Cronometro2.default.iniciaTabulacao(idCampanha,idMailing,idRegistro,numeroDiscado,ramal,(e,r)=>{
                                            if(e) throw e

                                            res.json(statusTabulacao)
                                        })
                                    })
                                })

                               
                            })
                        })
                    })
                })
            }else{
                //Inclui tentativa no registro e libera o agente

                const estado = 1
                const pausaTabulacao = 0
                _Campanhas2.default.atualizaEstadoAgente(ramal,estado,pausaTabulacao,(e,r)=>{
                    if(e) throw e

                    const contatado = 'S'
                    const produtivo = 0
                    const status_tabulacao=0
                    const observacao = ''
                    //Desligando a chamada
                    _Asterisk2.default.desligaChamada(idAtendimento,contatado,produtivo,status_tabulacao,observacao,(e,r)=>{
                        if(e) throw e
                    
                        res.json(r);
                    })
                })
            }            
        }
    }

    tabularChamada(req,res){

        const idAtendimento = req.body.idAtendimento
        const ramal = req.body.ramal
        const numero = req.body.numero_discado
        const status_tabulacao = req.body.status_tabulacao
        const observacao = req.body.obs_tabulacao
        const contatado = 'S'
        let produtivo
        if(req.body.tipo_tabulacao=='produtivo'){
            produtivo=1
        }else{
            produtivo=0
        } 
        const data = req.body.data
        const hora = req.body.hora

        _Asterisk2.default.dadosAtendimento(idAtendimento,(e,atendimento)=>{
            const tabela = atendimento[0].tabela_mailing
            const idRegistro = atendimento[0].id_reg
            const idMailing = atendimento[0].id_mailing
            const idCampanha = atendimento[0].id_campanha
            _Asterisk2.default.tabulandoContato(tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,(e,r)=>{
                if(e) throw e

                _Asterisk2.default.desligaChamada(idAtendimento,contatado,produtivo,status_tabulacao,observacao,(e,r)=>{ 
                    _Cronometro2.default.encerrouTabulacao(idCampanha,numero,ramal,status_tabulacao,(e,r)=>{
                        if(e) throw e
    
                        res.json(r);                        
                    })
                })
            })
        })
    }

    marcarRetorno(req,res){

        const idAtendimento = req.body.idAtendimento
        const ramal = req.body.ramal
        const numero = req.body.numero_discado
        const status_tabulacao = req.body.status_tabulacao
        const data = req.body.data
        const hora = req.body.hora
        const observacao = req.body.obs_tabulacao
        const contatado = 'S'
        let produtivo
        if(req.body.tipo_tabulacao=='produtivo'){
            produtivo=1
        }else{
            produtivo=0
        } 

        _Asterisk2.default.dadosAtendimento(idAtendimento,(e,atendimento)=>{
            const tabela = atendimento[0].tabela_mailing
            const idRegistro = atendimento[0].id_reg
            const idMailing = atendimento[0].id_mailing
            const idCampanha = atendimento[0].id_campanha
            _Asterisk2.default.tabulandoContato(tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,(e,r)=>{
                if(e) throw e
              
                res.json(r);
            })
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