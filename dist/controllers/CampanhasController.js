"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _Mailing = require('../models/Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);

var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _AsteriskController = require('./AsteriskController'); var _AsteriskController2 = _interopRequireDefault(_AsteriskController);


class CampanhasController{
    //######################CAMPANHAS ######################
    //Status da campanha em tempo real
    statusCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        _Campanhas2.default.statusCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //Operacoes básicas das campanhas (CRUD)
    //Criar Campanhas
    criarCampanha(req,res){
        const tipo  = req.body.tipo
        const nome = req.body.nome
        const descricao = req.body.descricao  
        _Campanhas2.default.criarCampanha(tipo,nome,descricao,(e,result)=>{ 
            if(e) throw e
            const idCampanha = result['insertId']

            //Criando fila da campanha
            const name = `campanha_${idCampanha}`
            const musiconhold = "default"
            const strategy = "ringall"
            const timeout = "15"
            const retry = "5"
            const autopause = "no"
            const maxlen = "0"
            const monitorType = "mixmonitor"
            const monitorFormat = "wav"
            _Asterisk2.default.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat,(e,r)=>{
                if(e) throw e;

                _Campanhas2.default.addFila(idCampanha,name,(e,r)=>{
                    if(e) throw e;

                    res.json(result)
                })    
                
            })
        })
    }

    //Listar Campanhas
    listarCampanhas(req,res){
        _Campanhas2.default.listarCampanhas((e,r)=>{
            if(e) throw e
            
            res.json(r)            
        })
    }

    //Status da evolucao do mailing na campanha
    statusEvolucaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        console.log(`idCampanha ${idCampanha}`)
        _Campanhas2.default.totalMailingsCampanha(idCampanha,(e,total_mailing)=>{
            if(e) throw e           
            

            let total
            if(total_mailing[0].total == null){
                 total = 0
            }else{
                total = parseInt(total_mailing[0].total)
            }

          

            _Campanhas2.default.mailingsContatados_porCampanha(idCampanha,(e,ja_contatados)=>{
                if(e) throw e

                const contatados = parseInt(ja_contatados[0].contatados)
                _Campanhas2.default.mailingsNaoContatados_porCampanha(idCampanha,(e,nao_Contatados)=>{
                    if(e) throw e

                    const naoContatados = parseInt(nao_Contatados[0].nao_contatados)

                    const trabalhados = contatados + naoContatados
                    
                    let perc_trabalhados = 0
                    let perc_contatados = 0
                    let perc_naoContatados = 0

                    if(total!=0){
                        perc_trabalhados = parseFloat((trabalhados / total)*100).toFixed(1)
                        perc_contatados = parseFloat((contatados / total)*100).toFixed(1)
                        perc_naoContatados = parseFloat((naoContatados / total)*100).toFixed(1)
                        
                    }           
                    
                    let retorno = '{'
                        retorno += `"trabalhado": ${perc_trabalhados},`
                        retorno += `"contatados": ${perc_contatados},`
                        retorno += `"nao_contatados": ${perc_naoContatados}`
                        retorno += '}'                       
                    console.log(retorno)
                    retorno = JSON.parse(retorno)                  

                    res.json(retorno)

                })
            })
        })
    }

    //Dados da campanha
    dadosCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        _Campanhas2.default.dadosCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }

    //Atualizar campanha
    atualizaCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        const valores = req.body
        _Campanhas2.default.atualizaCampanha(idCampanha,valores,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }

    //######################CAMPANHAS ATIVAS ######################

    //Agendamento da campanha
        //Agenda campanha
        agendarCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const dI = req.body.data_inicio
            const dT = req.body.data_termino
            const hI = req.body.hora_inicio
            const hT = req.body.hora_termino
            _Campanhas2.default.agendarCampanha(idCampanha,dI,dT,hI,hT,(e,r)=>{
                if(e) throw e
        
                res.json(r)
            })
        }

        //ver agenda da campanha
        verAgendaCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha);
            _Campanhas2.default.verAgendaCampanha(idCampanha,(e,r)=>{
                if(e) throw e
        
                res.json(r)
            })
        }
    
    //Lista de Tabulaçoes da campanha
        //Add lista na campanha
        addListaTabulacaoCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const idListaTabulacao = req.body.idListaTabulacao
            _Campanhas2.default.addListaTabulacaoCampanha(idCampanha,idListaTabulacao,(e,r)=>{
                if(e) throw e

                res.json(r);
            })

        }

        //Exibe as listas de tabulacao da Campanha
        listasTabulacaoCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha);
            
            _Campanhas2.default.listasTabulacaoCampanha(idCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        //remove Lista tabulacao da campanha
        removerListaTabulacaoCampanha(req,res){
            const idListaNaCampanha = parseInt(req.params.idListaNaCampanha)
            _Campanhas2.default.removerListaTabulacaoCampanha(idListaNaCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        statusTabulacaoCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            _Tabulacoes2.default.statusTabulacaoCampanha(idCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        //INTEGRACOES

        //DISCADOR
        //Inicia discador do agente
        iniciarDiscador(req,res){
            const ramal = req.params.ramal
            _Campanhas2.default.iniciarDiscador(ramal,(e,r)=>{
                _Cronometro2.default.iniciaDiscador(ramal,(e,r)=>{
                    if(e) throw e

                    res.json(r);
                })                
            })            
        }

         //Inicia discador do agente
         statusRamal(req,res){
            const ramal = req.params.ramal
            _Campanhas2.default.statusRamal(ramal,(e,estadoRamal)=>{
                if(e) throw e

                const estados=['deslogado','disponivel','em pausa','falando','indisponivel'];
               

                res.json(JSON.parse(`{"idEstado":"${estadoRamal[0].estado}","estado":"${estados[estadoRamal[0].estado]}"}`));
            })            
        }

        //Parando o Discador do agente
        pararDiscador(req,res){
            const ramal = req.params.ramal
            _Campanhas2.default.pararDiscador(ramal,(e,r)=>{
                _Cronometro2.default.pararDiscador(ramal,(e,r)=>{
                    if(e) throw e

                    res.json(r);
                })
               
            })            
        }

        //Configurar discador da campanha
        configDiscadorCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const tipoDiscador = req.body.tipoDiscador
            const agressividade = req.body.agressividade
            const ordemDiscagem = req.body.ordemDiscagem
            const tipoDiscagem = req.body.tipoDiscagem
            const maxTentativas = req.body.maxTentativas
            const modo_atendimento = req.body.modo_atendimento

            _Campanhas2.default.configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,maxTentativas,modo_atendimento,(e,r)=>{
                if(e) throw e

                res.json(r);
            })

        }

        //Ver configuracoes do Discador
        verConfigDiscadorCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha);
            
            _Campanhas2.default.verConfigDiscadorCampanha(idCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        //FILAS
        //get member fila
        getMembersFila(req,res){
            const idFila = req.params.idFila
            _User2.default.listOnlyUsers(1,(e,todosUsuarios)=>{
                if(e) throw e 
                let dragDrop_fila = '{"agentes":{'
                for(let i=0; i<todosUsuarios.length; i++){
                    let item  = `"${todosUsuarios[i].id}":{"id":"${todosUsuarios[i].id}","content":"${todosUsuarios[i].nome}"}`
                    dragDrop_fila+=item
                    if((todosUsuarios.length-1)>i){
                        dragDrop_fila+=','
                    }                  
                }
                dragDrop_fila+='},'

                _Campanhas2.default.membrosNaFila(idFila,(e,membrosFila)=>{
                    if(e) throw e 

                    console.log(todosUsuarios)
                    console.log(membrosFila)

                    dragDrop_fila += '"columns":{"foraDaFila":{"id":"foraDaFila","agentesIds":['
                    //Listando membros disponiveis para a fila
                    for(let i=0; i<todosUsuarios.length; i++){

                        //Listando membros da fila
                        let membroFila = false
                        for(let m=0; m<membrosFila.length; m++){
                            //Listando membros que nao constam na fila
                            if(todosUsuarios[i].id === membrosFila[m].ramal){
                                membroFila = true
                            }                        
                        }

                        //caso o membro nao seja localizado, lista o mesmo
                        if(membroFila == false){
                            dragDrop_fila  += `"${todosUsuarios[i].id}",`
                        }                
                    }
                    dragDrop_fila=dragDrop_fila.slice(0, -1)

                    dragDrop_fila+=']},'

                    _Campanhas2.default.membrosNaFila(idFila,(e,membrosFila)=>{
                        if(e) throw e 

                        dragDrop_fila += '"dentroDaFila":{"id":"dentroDaFila","agentesIds":['
                        for(let i=0; i<membrosFila.length; i++){
                            let membroFila  = `"${membrosFila[i].ramal}"`
                            dragDrop_fila+=membroFila
                            if((membrosFila.length-1)>i){
                                dragDrop_fila+=','
                            }                 
                        }
                        dragDrop_fila+=']}}}'

                        console.log(dragDrop_fila)
                        //res.json(true)
                    
                        const obj = JSON.parse(dragDrop_fila);
                        res.json(obj)
                    })
                })
                
                
            })
        }

        //Atualizar membros da campanha
        updateMemberFila(req,res){
            console.log(req)
            const idFila = parseInt(req.params.idFila)

            const idAgente = req.body.idAgente

            const origem = req.body.origem.columName
            const posOrigen = req.body.origem.posicao

            const destino =  req.body.destino.columName
            const posDestino = req.body.destino.posicao

            //reordena fora da fila
            if((origem == 'foraDaFila')&&(destino == 'foraDaFila')){
                console.log('nao atualiza')
                _Campanhas2.default.reordenaMembrosForaFila(idAgente,idFila,posOrigen,posDestino,(e,r)=>{
                    if(e) throw e
                                      
                    res.json(true)
                })
            }
            //insere na fila
            if((origem == 'foraDaFila')&&(destino == 'dentroDaFila')){
                _Campanhas2.default.addMembroFila(idAgente,idFila,posOrigen,posDestino,(e,r)=>{
                    if(e) throw e
                                      
                    res.json(true)
                })
            }

            //reordena dentro da fila
            if((origem == 'dentroDaFila')&&(destino == 'dentroDaFila')){                
                _Campanhas2.default.addMembroFila(idAgente,idFila,posOrigen,posDestino,(e,r)=>{
                    if(e) throw e
                                      
                    res.json(true)
                })
            }

            //remove da fila
            if((origem == 'dentroDaFila')&&(destino == 'foraDaFila')){
                _Campanhas2.default.removeMembroFila(idAgente,idFila,(e,r)=>{
                    if(e) throw e
               
                    res.json(true)
                })
            }           
        }



        
        //Lista filas da campanha        
        listarFilasCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            _Campanhas2.default.listarFilasCampanha(idCampanha,(err,result)=>{
                if(err) throw err

                res.json(result) 
            })
        }
    
        
        


        //MAILING
        //Add mailing na campanha
        addMailingCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const idMailing = req.body.idMailing

            _Mailing2.default.addMailingCampanha(idCampanha,idMailing,(e,r)=>{
                if(e) throw e
    
                res.json(r)
            })
        }
        
        //Lista mailing da campanha
        listarMailingCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            _Mailing2.default.listarMailingCampanha(idCampanha,(erro,result)=>{
                if(erro) throw erro
                
    
                
                res.json(result)
                
            })
        }
        
        //remove mailing da campanha
        removeMailingCampanha(req,res){
            const id = parseInt(req.params.id)
            _Mailing2.default.removeMailingCampanha(id,(erro,result)=>{
                if(erro) throw erro
    
                res.json(result)
            })
        }

        //mailing por uf 

        //saude do mailing


        //Configurar tela do agente

        listarCamposConfigurados(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            //Buscando nome da tabela
            _Campanhas2.default.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e

                if(nomeTabela.length!=0){

                    const tabela= nomeTabela[0].tabela

                    _Campanhas2.default.camposConfiguradosDisponiveis(tabela,(e,campos)=>{
                        if(e) throw e

                        console.log('Campos Disponíveis')
                        console.log(campos)

                        _Campanhas2.default.camposAdicionadosNaTelaAgente(idCampanha,tabela,(e,camposSelecionados)=>{
                            if(e) throw e
                            
                            //abrindo campos disponiveis 
                            let camposConf = "["
                            for(let i=0; i< campos.length; i++){
                                camposConf += "{"
                                camposConf += `"id":"${campos[i].id}",` 
                                camposConf += `"campo":"${campos[i].campo}",` 
                                camposConf += `"apelido":"${campos[i].apelido}",` 
                                camposConf += `"tipo":"${campos[i].tipo}",` 
                                //Verificando se o campo esta adicionado na tela
                                let sel = false
                                let idJoin = 0
                                for(let ii=0; ii< camposSelecionados.length; ii++){
                                    console.log(`if(${camposSelecionados[ii].idCampo}==${campos[i].id}`)
                                    if(camposSelecionados[ii].idCampo == campos[i].id){
                                        sel = true
                                        idJoin = 10
                                    }
                                }
                                
                                camposConf += `"idJoin":${idJoin},`
                                camposConf += `"selecionado":${sel}`
                            
                                if(i==campos.length-1){
                                    camposConf += "}"
                                }else{
                                    camposConf += "},"
                                }                        
                            }
                            camposConf += "]"

                            res.json(JSON.parse(camposConf))
                        })
                    })

                    /*Campanhas.camposConfiguradosDisponiveis(tabela,idCampanha,(e,campos)=>{
                        if(e) throw e
                        let retorno = "["
                        for(let i=0; i< campos.length; i++){
                            retorno += "{"
                            retorno += `"id":"${campos[i].id}",` 
                            retorno += `"campo":"${campos[i].campo}",` 
                            retorno += `"apelido":"${campos[i].apelido}",` 
                            retorno += `"tipo":"${campos[i].tipo}",` 
                            if(campos[i].idCampanha==idCampanha){
                                retorno += `"selecionado":true`
                            }else{
                                retorno += `"selecionado":false`
                            }
                            
                            if(i==campos.length-1){
                                retorno += "}"
                            }else{
                                retorno += "},"
                            }                        
                        }
                        retorno += "]"

                        res.send(JSON.parse(retorno))
                    })*/
                }else{
                    res.send(JSON.parse('{"erro":"Nenhum mailing encontrado na campanha"}'))
                }
            })
        }
        
        adicionaCampo_telaAgente(req,res){
            const idCampanha = req.body.idCampanha 
            const idCampo = req.body.idCampo
            _Campanhas2.default.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                const tabela= nomeTabela[0].tabela
                _Campanhas2.default.addCampoTelaAgente(idCampanha,tabela,idCampo,(e,r)=>{
                    if(e) throw e

                    res.send(true)
                })
            })
        }

        listaCampos_telaAgente(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            //Buscando nome da tabela
            _Campanhas2.default.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e

                const tabela= nomeTabela[0].tabela
                _Campanhas2.default.camposTelaAgente(idCampanha,tabela,(e,campos)=>{
                    if(e) throw e

                    res.send(campos)
                })
            })
        }

        removeCampo_telaAgente(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            const idCampo = parseInt(req.params.idCampo)
            _Campanhas2.default.delCampoTelaAgente(idCampanha,idCampo,(e,r)=>{
                if(e) throw e

                res.send(true)
            })
        }
       


        //Lista campos da tela disponiveis
        /*getFieldsUserScreen(req,res){
            const idCampanha = parseInt(req.params.idCampanha);

            //Buscando nome da tabela
            Campanhas.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e
                
                const tabela= nomeTabela[0].tabela
                console.log(tabela)
                Mailing.camposMailing(tabela,(e,campos)=>{
                    if(e) throw e 

                    let dragDrop_campos = '{"fields":{'
                    for(let i=0;i<campos.length; i++){
                        let item = `"${campos[i].id}":{"id":"${campos[i].id}","content":"${campos[i].campo}"}`
                        dragDrop_campos+=item
                        if((campos.length-1)>i){
                            dragDrop_campos+=','
                        } 
                    }
                    dragDrop_campos+='},'

                    //Campos Não Selecionados
                    Campanhas.camposNaoSelecionados(idCampanha,tabela,(e,camposNaoSelecionados)=>{
                        if(e) throw e 

                        dragDrop_campos += '"columns":{"naoSelecionados":{"id":"naoSelecionados","camposIds":['
                        for(let i=0; i<camposNaoSelecionados.length; i++){
                            let campo  = `"${camposNaoSelecionados[i].campo}"`
                            dragDrop_campos+=campo
                            if((camposNaoSelecionados.length-1)>i){
                                dragDrop_campos+=','
                            }                 
                        }
                        dragDrop_campos+=']},'

                        Campanhas.camposSelecionados(idCampanha,tabela,(e,camposSelecionados)=>{
                            if(e) throw e 

                            dragDrop_campos += '"camposSelecionados":{"id":"camposSelecionados","camposIds":['
                            for(let i=0; i<camposSelecionados.length; i++){
                                let camposSel  = `"${camposSelecionados[i].idCampo}"`
                                dragDrop_campos+=camposSel
                                if((camposSelecionados.length-1)>i){
                                    dragDrop_campos+=','
                                }                 
                            }
                            dragDrop_campos+=']}}}'
                            console.log(dragDrop_campos)
                            
                            const obj = JSON.parse(dragDrop_campos);
                            res.json(obj)
                        })
                    })                   
                })
            })           
        }

        //Atualiza campos da tela do agente
        updateFieldsUserScreen(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            Campanhas.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e
                
                const tabela= nomeTabela[0].tabela

                const idCampo = req.body.idCampo

                const origem = req.body.origem.columName
                const posOrigen = req.body.origem.posicao

                const destino =  req.body.destino.columName
                const posDestino = req.body.destino.posicao

                //reordena fora da fila
                if((origem == 'naoSelecionados')&&(destino == 'naoSelecionados')){                    
                    Campanhas.reordenaCamposMailing(idCampo,tabela,posOrigen,posDestino,(e,r)=>{
                        if(e) throw e
                    })
                }
                //insere na fila
                if((origem == 'naoSelecionados')&&(destino == 'camposSelecionados')){
                    Campanhas.addCampoTelaAgente(idCampanha,tabela,idCampo,posDestino,(e,r)=>{
                        if(e) throw e
                                        
                        res.json(true)
                    })
                }

                //reordena dentro da fila
                if((origem == 'camposSelecionados')&&(destino == 'camposSelecionados')){                
                    Campanhas.reordenaCampoTelaAgente(idCampanha,tabela,idCampo,posOrigen,posDestino,(e,r)=>{
                        if(e) throw e
                                        
                        res.json(true)
                    })
                }

                //remove da fila
                if((origem == 'camposSelecionados')&&(destino == 'naoSelecionados')){
                    Campanhas.removeCampoTelaAgente(idCampanha,tabela,idCampo,(e,r)=>{
                        if(e) throw e
                
                        res.json(true)
                    })
                } 
            })          
        }*/



    //######################TABULAÇÕES ######################
    //Criar lista de tabulacao
     criarListaTabulacao(req,res){
        const dados = req.body
        _Tabulacoes2.default.novaLista(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Editar lista de tabulacao
    editarListaTabulacao(req,res){
        const idLista = parseInt(req.params.id);
        const valores = req.body
        _Tabulacoes2.default.editarListaTabulacao(idLista,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver dados da lista de tabulacao
    dadosListaTabulacao(req,res){
        const idLista = parseInt(req.params.id);
        _Tabulacoes2.default.dadosListaTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver todas as listas de tabulacao
    listasTabulacao(req,res){
        _Tabulacoes2.default.listasTabulacao((erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Criar novo status de tabulacao
    criarStatusTabulacao(req,res){
        const dados = req.body
        _Tabulacoes2.default.criarStatusTabulacao(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Editar status de tabulacao
    editarStatusTabulacao(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        _Tabulacoes2.default.editarStatusTabulacao(id,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //ver status de tabulacao
    statusTabulacao(req,res){
        const id = parseInt(req.params.id);
        _Tabulacoes2.default.statusTabulacao(id,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //ver todos status de tabulacao de uma lista
    listarStatusTabulacao(req,res){
        const idLista = parseInt(req.params.idLista)
        _Tabulacoes2.default.listarStatusTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    } 


    //######################PAUSAS ######################
    //Criar lista de pausas
    criarListaPausa(req,res){
        const dados = req.body
        _Pausas2.default.novaLista(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Editar lista de pausas
    editarListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        const valores = req.body
        _Pausas2.default.editarListaPausa(idLista,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver dados da lista de pausas
    dadosListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        _Pausas2.default.dadosListaPausa(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver todas as listas de pausas
    listasPausa(req,res){
        _Pausas2.default.listasPausa((erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Criar nova pausa
    criarPausa(req,res){
        const dados = req.body
        _Pausas2.default.criarPausa(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Editar pausa
    editarPausa(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        _Pausas2.default.editarPausa(id,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //ver pausa
    dadosPausa(req,res){
        const id = parseInt(req.params.id);
        _Pausas2.default.dadosPausa(id,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //ver todas pausas de uma lista
    listarPausas(req,res){
        const idLista = parseInt(req.params.idLista)
        _Pausas2.default.listarPausas(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    } 

    //######################FILAS ######################
     addFilaCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const nomeFila = req.params.nomeFila
        _Campanhas2.default.addFila(idCampanha,nomeFila,(err,result)=>{
            if(err) throw err

            res.json(result)
        })
    }



    delFilaCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const nomeFila = req.params.nomeFila
        _Campanhas2.default.delFilaCampanha(idCampanha,nomeFila,(err,result)=>{
            if(err) throw err

            res.json(result)
        })
    }

    

    //######################BASES ######################

    //Funcoes de bases precisam ser revisadas
    listarColunasMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        _Mailing2.default.listarColunasMailing(idMailing,(erro,result)=>{
            if(erro) throw erro

            res.send(result)
        })
    }   

    setaColuna(req,res){
       
        const valores = req.body
        _Mailing2.default.selecionaColuna(valores,(err,result)=>{
            if(err) throw err

            res.send(result)
        })
    }

    listarColunas(req,res){
        const idCamp_Mailing = parseInt(req.params.idCamp_Mailing)
        _Mailing2.default.listarColunas(idCamp_Mailing,(erro,result)=>{
            if(erro) throw erro

            res.json(result)
        })
    }

    atualizarColuna(req,res){
        const idColuna = parseInt(req.params.idColuna)
        const valores = req.body
        _Mailing2.default.atualizarColuna(idColuna,valores,(erro,result)=>{
            if(erro) throw erro

            res.json(result)
        })

    }

    removerColuna(req,res){
        const idColuna = parseInt(req.params.idColuna)
        _Mailing2.default.removerColuna(idColuna,(erro,result)=>{
            if(erro) throw erro

            res.json(result)
        })
    }

    //######################TELA DO AGENTE ######################

    //PausasListas
    //Lista as pausas disponíveis para o agente
    listarPausasCampanha(req,res){
        const listaPausa = 1
        _Pausas2.default.listarPausas(listaPausa,(e,r)=>{
            if(e) throw e

            res.send(r)
        })

    }

    //Pausa o agente com o status selecionado
    pausarAgente(req,res){
        const ramal = req.body.ramal
        const idPausa = parseInt(req.body.idPausa)
        _Pausas2.default.dadosPausa(idPausa,(e,infoPausa)=>{
            const pausa = infoPausa[0].nome
            const descricao = infoPausa[0].descricao
            const tempo = infoPausa[0].tempo
            
            _Asterisk2.default.pausarAgente(ramal,idPausa,pausa,descricao,tempo,(e,r)=>{
                if(e) throw e

                _Cronometro2.default.entrouEmPausa(idPausa,ramal,(e,tempoPausa)=>{
                    if(e) throw e

                    res.send(r)
                })                
            })
        })
    }

    //Exibe o estado e as informacoes da pausa do agente
    statusPausaAgente(req,res){
        const ramal = req.params.ramal
        _Asterisk2.default.infoPausaAgente(ramal,(e,infoPausa)=>{
            console.log(infoPausa.length)
            if(infoPausa.length==0){
                let retorno = '{"status":"agente disponivel"}'  
                res.send(JSON.parse(retorno))
            }else{
                const idPausa = infoPausa[0].idPausa            
                _Pausas2.default.dadosPausa(idPausa,(e,dadosPausa)=>{
                    if(e) throw e


                    const inicio = infoPausa[0].inicio
                    const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
                    const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
                    const limite = infoPausa[0].limite
                    const nome = infoPausa[0].nome
                    const descricao = infoPausa[0].descricao
                    const tempo = dadosPausa[0].tempo

                    
                //Tempo passado
                    let startTime = _moment2.default.call(void 0, `${hoje}T${inicio}`).format();
                    let endTime = _moment2.default.call(void 0, `${hoje}T${agora}`).format();
                    let duration = _moment2.default.duration(_moment2.default.call(void 0, endTime).diff(startTime));
                
                    let horasPass = duration.hours(); //hours instead of asHours
                    let minPass = duration.minutes(); //minutes instead of asMinutes
                    let segPass = duration.seconds(); //minutes instead of asMinutes
                    
                    const tempoPassado = horasPass+':'+minPass+':'+segPass
                    const minutosTotais = (horasPass*60)+minPass+(segPass/60)
                    const percentual = (minutosTotais/tempo)*100

                    //Tempo restante
                    let startTime_res = _moment2.default.call(void 0, `${hoje}T${agora}`).format();
                    let endTime_res = _moment2.default.call(void 0, `${hoje}T${limite}`).format();
                    let duration_res = _moment2.default.duration(_moment2.default.call(void 0, endTime_res).diff(startTime_res));
                    let horasRes = duration_res.hours(); //hours instead of asHours
                    let minRes = duration_res.minutes(); //minutes instead of asMinutes
                    let segRes = duration_res.seconds(); //minutes instead of asMinutes
                    
                    const tempoRestante = horasRes+':'+minRes+':'+segRes


                    
                

                    let retorno = '{'
                        retorno += `"idPausa":${idPausa},`
                        retorno += `"nome":"${nome}",`
                        retorno += `"descricao":"${descricao}",`
                        retorno += `"tempoTotal":${tempo},`
                        retorno += `"tempoPassado":"${tempoPassado}",`
                        retorno += `"tempoRestante":"${tempoRestante}",`
                        retorno += `"porcentagem":${percentual.toFixed(1)}`
                    retorno += '}'    

                    



                    res.send(JSON.parse(retorno))
                })
            }
        })
    }

    //Tira o agente da pausa
    removePausaAgente(req,res){
        const ramal = req.body.ramal
        _Asterisk2.default.removePausaAgente(ramal,(e,r)=>{
            if(e) throw e

            _Cronometro2.default.saiuDaPausa(ramal,(e,tempoPausa)=>{
                if(e) throw e

                res.send(r)
            })            
        })
    }

    //Historico do id do registro
    historicoRegistro(req,res){
        const idReg = parseInt(req.params.idRegistro)
        _Campanhas2.default.historicoRegistro(idReg,(e,historico)=>{
            if(e) throw e

            res.json(historico)
        })

    }

    //Historico do agente
    historicoChamadas(req,res){
        const ramal = req.params.ramal
        _Campanhas2.default.historicoChamadas(ramal,(e,historico)=>{
            if(e) throw e

            res.json(historico)
        })

    }

    //Remove chamadas paradas
    removeChamadasParadas(req,res){
        //Le as informacoes da chamada parada
        _Campanhas2.default.chamadasTravadas((e,travadas)=>{
            if(e) throw e
            
            const idCampanha = travadas[0].id_campanha
            const idMailing = travadas[0].id_mailing
            const idRegistro = travadas[0].id_reg
            const idChamadaSimultanea = travadas[0].id
            //altera o estado do registo para disponivel
            _Campanhas2.default.liberaRegisto(idCampanha,idMailing,idRegistro,(e,travadas)=>{
                //remove a chamada simultanea
                _Campanhas2.default.removeChamadaSimultanea(idChamadaSimultanea,(e,remove)=>{
                    if(e) throw e

                    res.json(true)
                })
            })

        })
        
    }


    










//OLD

   

    removendoChamadasOciosas(req,res){
        _Campanhas2.default.removendoChamadasOciosas((e,r)=>{
            if(e) throw e
        })
        setTimeout(()=>{this.removendoChamadasOciosas(req,res)},10000)
    }

    //verificador das campanhas ativas
    campanhasAtivas(req,res){
        //Verifica campanhas do ativo ativadas
        _Campanhas2.default.campanhasAtivasHabilitadas((e,r)=>{
            if(e) throw e             
            
            if(r){
                for(let i=0; i<r.length; i++){
                    //Verificando se cada campanha possui fila atribuida
                    let idCampanha = r[i].id
                    let nomeCampanha = r[i].nome
                    _Campanhas2.default.filaCampanha(idCampanha,(e,r)=>{ 
                        if(e) throw e

                        if(r.length==0){
                            let msg='Nenhuma fila atribuida na campanha!'
                            let estado = 2
                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                if(e) throw e
                            })                            
                        }else{
                            let idFilaCampanha = r[0].id
                            let fila = r[0].nomeFila
                           
                            //Verificando Mailing da campanha
                            _Campanhas2.default.mailingCampanha(idCampanha,(e,r)=>{
                                if(r.length==0){
                                    let msg='Nenhum Mailing atribuido na campanha'
                                    let estado = 2
                                    _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                        if(e) throw e
                                    })                                     
                                }else{
                                    let idMailing = r[0].idMailing
                                    //Verificando se o Mailing esta configuradoo
                                    _Campanhas2.default.mailingConfigurado(idMailing,(e,r)=>{
                                        if(e) throw e

                                        if(r[0].configurado){
                                            //Verificando se a campanha esta no data para iniciar
                                            const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
                                            const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
                                            _Campanhas2.default.dataCampanha(idCampanha,hoje,(e,r)=>{

                                                if(e) throw e
                                                
                                                if(r.length>=1){
                                                    _Campanhas2.default.horarioCampanha(idCampanha,agora,(e,r)=>{ 
                                                        if(e) throw e    
        
                                                        if(r.length>=1){ 
                                                            _Discador2.default.agentesFila(fila,(e,r)=>{ 
                                                                if(e) throw e  
                                                                
                                                                if(r.length ==0){
                                                                    
                                                                    let msg='Nenhum agente na fila'
                                                                    let estado = 2
                                                                    _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                        if(e) throw e
                                                                    }) 
                                                                }else{
                                                                    //verificando se os agentes estao logados e disponiveis
                                                                    _Discador2.default.agentesDisponiveis(idFilaCampanha,(e,r)=>{
                                                                        if(e) throw e  

                                                                        if(r.length ==0){
                                                                            let msg='Nenhum agente disponível'
                                                                            let estado = 2
                                                                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                                if(e) throw e

                                                                            }) 
                                                                            
                                                                        }else{
                                                                            for(let i=0; i<r.length; i++){
                                                                                let ramal=r[i].ramal

                                                                                //preparando a regra de discagem do mailing
                                                                            
                                                                                //Follow UP

                                                                                //verifica disponibilidade do ramal

                                                                                _Discador2.default.filtrarRegistro(idCampanha,idMailing,ramal,(e,r)=>{
                                                                                    if(e) throw e  

                                                                                    if(r.length!=0){                                                                                       
                                                                                        let msg='Discando'
                                                                                        let estado = 1
                                                                                        _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                                            if(e) throw e
            
                                                                                        }) 


                                                                                        _Discador2.default.discar(idCampanha,idMailing,ramal,fila,r,(e,res)=>{
                                                                                            
                                                                                        })
                                                                                    }
                                                                                })
                                                                            }
                                                                        }
                                                                    })                                                                
                                                                }     
                                                            })
                                                        }else{
                                                            let msg='Campanha fora do horario de atendimento'
                                                            let estado = 2
                                                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                if(e) throw e
                                                            }) 
                                                        }
                                                    })
                                                }else{
                                                    let msg='Campanha fora da data de atendimento'
                                                    let estado = 2
                                                    _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                        if(e) throw e
                                                    }) 
                                                }
                                            })
                                        }else{
                                            let msg='Mailing não configurado na campanha'
                                            let estado = 2
                                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                if(e) throw e
                                            }) 
                                        }
                                    })
                                }
                            })
                        }                   
                    })                
                } 
            }else{
                console.log(`Nenhuma campanha ativa`)
            }
        })
        //verifica fila adicionada

        //verifica mailing adicionado e configurado

        /*Campanhas.campanhasAtivas((err,result)=>{
            if(err) throw err

            console.log(`Log Campanha=>${result}`)
        })*/
        //return next();
        setTimeout(()=>{this.campanhasAtivas(req,res)},10000)
    }


    

       

    





   

   
   



}

exports. default = new CampanhasController();