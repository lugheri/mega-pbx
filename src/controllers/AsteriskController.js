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
            
            Discador.getQueueByNumber(numero,(e,queue)=>{
                if(e) throw e

                if(queue.length==0){
                    console.log('Sem filas disponivel')
                    res.json("")
                }else{
                
                    const fila = queue[0].Fila
                    const idAtendimento = queue[0].id
                    Discador.setaRegistroNaFila(idAtendimento,(e,r)=>{
                        if(e) throw e
                        console.log(`1 Com filas ${fila}`)

                        //recupera dados da campanhas
                        Discador.dadosAtendimento(idAtendimento, (e,dadosAtendimento)=>{
                            if(e) throw e
                           
                            const idCampanha = dadosAtendimento[0].id_campanha
                            const idMailing = dadosAtendimento[0].id_mailing
                            const idRegistro = dadosAtendimento[0].id_reg

                            Cronometro.entrouNaFila(idCampanha,idMailing,idRegistro,numero,(e,r)=>{
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
            Asterisk.answer(dados,(e,r)=>{
                if(e) throw e

                Cronometro.saiuDaFila(dados.numero,(e,r)=>{
                    console.log('chamada atendida')
                   
                    Discador.dadosAtendimento_byNumero(dados.numero, (e,dadosAtendimento)=>{
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
                        Cronometro.iniciouAtendimento(idCampanha,idMailing,idRegistro,dados.numero,ramal,uniqueid,(e,r)=>{
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
            Discador.dadosAtendimento_byNumero(numero, (e,chamada)=>{
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
                        Cronometro.saiuDaFila(dados.numero,(e,r)=>{
                            if(e) throw e

                            //Registra histórico de chamada
                            Discador.registraHistoricoAtendimento(protocolo,idCampanha,idMailing,id_reg,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado,(e,r)=>{
                                if(e) throw e
                                //Tabula registro
                                Discador.tabulandoContato(idAtendimento,tabela,contatado,tabulacao,observacoes,produtivo,numero,ramal,id_reg,idMailing,idCampanha,(e,r)=>{
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
        Asterisk.channelDump((e,r)=>{
        console.log('channel dump')
        })
    }
  
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