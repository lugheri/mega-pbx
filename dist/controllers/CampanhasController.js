"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _Mailing = require('../models/Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

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

        //INTEGRACOES

        //DISCADOR
        //Configurar discador da campanha
        configDiscadorCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const tipoDiscador = req.body.tipoDiscador
            const agressividade = req.body.agressividade
            const ordemDiscagem = req.body.ordemDiscagem
            const tipoDiscagem = req.body.tipoDiscagem
            const maxTentativas = req.body.maxTentativas

            _Campanhas2.default.configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,maxTentativas,(e,r)=>{
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

                _Campanhas2.default.membrosForaFila(idFila,(e,membrosForaFila)=>{
                    if(e) throw e 
                    
                    dragDrop_fila += '"columns":{"foraDaFila":{"id":"foraDaFila","agentesIds":['

                    for(let i=0; i<membrosForaFila.length; i++){
                        let membro  = `"${membrosForaFila[i].agente}"`
                        dragDrop_fila+=membro
                        if((membrosForaFila.length-1)>i){
                            dragDrop_fila+=','
                        }                 
                    }
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
        //Lista campos da tela disponiveis
        getFieldsUserScreen(req,res){
            const idCampanha = parseInt(req.params.idCampanha);

            //Buscando nome da tabela
            _Campanhas2.default.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e
                
                const tabela= nomeTabela[0].tabela
                console.log(tabela)
                _Mailing2.default.camposMailing(tabela,(e,campos)=>{
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
                    _Campanhas2.default.camposNaoSelecionados(idCampanha,tabela,(e,camposNaoSelecionados)=>{
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

                        _Campanhas2.default.camposSelecionados(idCampanha,tabela,(e,camposSelecionados)=>{
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
            _Campanhas2.default.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e
                
                const tabela= nomeTabela[0].tabela

                const idCampo = req.body.idCampo

                const origem = req.body.origem.columName
                const posOrigen = req.body.origem.posicao

                const destino =  req.body.destino.columName
                const posDestino = req.body.destino.posicao

                //reordena fora da fila
                if((origem == 'naoSelecionados')&&(destino == 'naoSelecionados')){                    
                    _Campanhas2.default.reordenaCamposMailing(idCampo,tabela,posOrigen,posDestino,(e,r)=>{
                        if(e) throw e
                    })
                }
                //insere na fila
                if((origem == 'naoSelecionados')&&(destino == 'camposSelecionados')){
                    _Campanhas2.default.addCampoTelaAgente(idCampanha,tabela,idCampo,posDestino,(e,r)=>{
                        if(e) throw e
                                        
                        res.json(true)
                    })
                }

                //reordena dentro da fila
                if((origem == 'camposSelecionados')&&(destino == 'camposSelecionados')){                
                    _Campanhas2.default.reordenaCampoTelaAgente(idCampanha,tabela,idCampo,posOrigen,posDestino,(e,r)=>{
                        if(e) throw e
                                        
                        res.json(true)
                    })
                }

                //remove da fila
                if((origem == 'camposSelecionados')&&(destino == 'naoSelecionados')){
                    _Campanhas2.default.removeCampoTelaAgente(idCampanha,tabela,idCampo,(e,r)=>{
                        if(e) throw e
                
                        res.json(true)
                    })
                } 
            })          
        }



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