import Campanhas from '../models/Campanhas';
import Tabulacoes from '../models/Tabulacoes';
import Pausas from '../models/Pausas';
import Mailing from '../models/Mailing';
import Discador from '../models/Discador';
import Asterisk from '../models/Asterisk';
import User from '../models/User';
import Cronometro from '../models/Cronometro';

import moment from 'moment';
import AsteriskController from './AsteriskController';


class CampanhasController{
    //######################CAMPANHAS ######################
    //Status da campanha em tempo real
    statusCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        Discador.statusCampanha(idCampanha,(e,r)=>{
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
        Campanhas.criarCampanha(tipo,nome,descricao,(e,result)=>{ 
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
            Asterisk.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat,(e,r)=>{
                if(e) throw e;

                Campanhas.addFila(idCampanha,name,(e,r)=>{
                    if(e) throw e;

                    res.json(result)
                })    
                
            })
        })
    }

    //Listar Campanhas
    listarCampanhas(req,res){
        Campanhas.listarCampanhas((e,r)=>{
            if(e) throw e
            
            res.json(r)            
        })
    }

    //Status da evolucao do mailing na campanha
    statusEvolucaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        console.log(`idCampanha ${idCampanha}`)
        Campanhas.totalMailingsCampanha(idCampanha,(e,total_mailing)=>{
            if(e) throw e           
            

            let total
            if(total_mailing[0].total == null){
                 total = 0
            }else{
                total = parseInt(total_mailing[0].total)
            }

          

            Campanhas.mailingsContatados_porCampanha(idCampanha,(e,ja_contatados)=>{
                if(e) throw e

                const contatados = parseInt(ja_contatados[0].contatados)
                Campanhas.mailingsNaoContatados_porCampanha(idCampanha,(e,nao_Contatados)=>{
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
        Campanhas.dadosCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }

    //Atualizar campanha
    atualizaCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        const valores = req.body
        Campanhas.atualizaCampanha(idCampanha,valores,(e,r)=>{
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
            Campanhas.agendarCampanha(idCampanha,dI,dT,hI,hT,(e,r)=>{
                if(e) throw e
        
                res.json(r)
            })
        }

        //ver agenda da campanha
        verAgendaCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha);
            Campanhas.verAgendaCampanha(idCampanha,(e,r)=>{
                if(e) throw e
        
                res.json(r)
            })
        }
    
    //Lista de Tabulaçoes da campanha
        //Add lista na campanha
        addListaTabulacaoCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const idListaTabulacao = req.body.idListaTabulacao
            Campanhas.addListaTabulacaoCampanha(idCampanha,idListaTabulacao,(e,r)=>{
                if(e) throw e

                res.json(r);
            })

        }

        //Exibe as listas de tabulacao da Campanha
        listasTabulacaoCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha);
            
            Campanhas.listasTabulacaoCampanha(idCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        //remove Lista tabulacao da campanha
        removerListaTabulacaoCampanha(req,res){
            const idListaNaCampanha = parseInt(req.params.idListaNaCampanha)
            Campanhas.removerListaTabulacaoCampanha(idListaNaCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        statusTabulacaoCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            Tabulacoes.statusTabulacaoCampanha(idCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        //INTEGRACOES

        //DISCADOR
        //Inicia discador do agente
        /*
        iniciarDiscador(req,res){
            const ramal = req.params.ramal
            Campanhas.iniciarDiscador(ramal,(e,r)=>{
                Cronometro.iniciaDiscador(ramal,(e,r)=>{
                    if(e) throw e

                    res.json(r);
                })                
            })            
        }

         //Inicia discador do agente
         statusRamal(req,res){
            const ramal = req.params.ramal
            Campanhas.statusRamal(ramal,(e,estadoRamal)=>{
                if(e) throw e

                const estados=['deslogado','disponivel','em pausa','falando','indisponivel'];
               

                res.json(JSON.parse(`{"idEstado":"${estadoRamal[0].estado}","estado":"${estados[estadoRamal[0].estado]}"}`));
            })            
        }

        //Parando o Discador do agente
        pararDiscador(req,res){
            const ramal = req.params.ramal
            Campanhas.pararDiscador(ramal,(e,r)=>{
                Cronometro.pararDiscador(ramal,(e,r)=>{
                    if(e) throw e

                    res.json(r);
                })
               
            })            
        }
        */

        //Configurar discador da campanha
        configDiscadorCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const tipoDiscador = req.body.tipoDiscador
            const agressividade = req.body.agressividade
            const ordemDiscagem = req.body.ordemDiscagem
            const tipoDiscagem = req.body.tipoDiscagem
            const maxTentativas = req.body.maxTentativas
            const modo_atendimento = req.body.modo_atendimento

            Campanhas.configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,maxTentativas,modo_atendimento,(e,r)=>{
                if(e) throw e

                res.json(r);
            })

        }

        //Ver configuracoes do Discador
        verConfigDiscadorCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha);
            
            Campanhas.verConfigDiscadorCampanha(idCampanha,(e,r)=>{
                if(e) throw e

                res.json(r);
            })
        }

        //FILAS
        //get member fila
        getMembersFila(req,res){
            const idFila = req.params.idFila
            User.listOnlyUsers(1,(e,todosUsuarios)=>{
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

                Campanhas.membrosNaFila(idFila,(e,membrosFila)=>{
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

                    Campanhas.membrosNaFila(idFila,(e,membrosFila)=>{
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
                Campanhas.reordenaMembrosForaFila(idAgente,idFila,posOrigen,posDestino,(e,r)=>{
                    if(e) throw e
                                      
                    res.json(true)
                })
            }
            //insere na fila
            if((origem == 'foraDaFila')&&(destino == 'dentroDaFila')){
                Campanhas.addMembroFila(idAgente,idFila,posOrigen,posDestino,(e,r)=>{
                    if(e) throw e
                                      
                    res.json(true)
                })
            }

            //reordena dentro da fila
            if((origem == 'dentroDaFila')&&(destino == 'dentroDaFila')){                
                Campanhas.addMembroFila(idAgente,idFila,posOrigen,posDestino,(e,r)=>{
                    if(e) throw e
                                      
                    res.json(true)
                })
            }

            //remove da fila
            if((origem == 'dentroDaFila')&&(destino == 'foraDaFila')){
                Campanhas.removeMembroFila(idAgente,idFila,(e,r)=>{
                    if(e) throw e
               
                    res.json(true)
                })
            }           
        }



        
        //Lista filas da campanha        
        listarFilasCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            Campanhas.listarFilasCampanha(idCampanha,(err,result)=>{
                if(err) throw err

                res.json(result) 
            })
        }
    
        
        


        //MAILING
        //Add mailing na campanha
        addMailingCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const idMailing = req.body.idMailing

            Mailing.addMailingCampanha(idCampanha,idMailing,(e,r)=>{
                if(e) throw e
    
                res.json(r)
            })
        }
        
        //Lista mailing da campanha
        listarMailingCampanha(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            Mailing.listarMailingCampanha(idCampanha,(erro,result)=>{
                if(erro) throw erro
                
    
                
                res.json(result)
                
            })
        }
        
        //remove mailing da campanha
        removeMailingCampanha(req,res){
            const id = parseInt(req.params.id)
            Mailing.removeMailingCampanha(id,(erro,result)=>{
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
            Campanhas.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e

                if(nomeTabela.length!=0){

                    const tabela= nomeTabela[0].tabela

                    Campanhas.camposConfiguradosDisponiveis(tabela,(e,campos)=>{
                        if(e) throw e

                        console.log('Campos Disponíveis')
                        console.log(campos)

                        Campanhas.camposAdicionadosNaTelaAgente(idCampanha,tabela,(e,camposSelecionados)=>{
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
            Campanhas.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                const tabela= nomeTabela[0].tabela
                Campanhas.addCampoTelaAgente(idCampanha,tabela,idCampo,(e,r)=>{
                    if(e) throw e

                    res.send(true)
                })
            })
        }

        listaCampos_telaAgente(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            //Buscando nome da tabela
            Campanhas.nomeTabela_byIdCampanha(idCampanha,(e,nomeTabela)=>{
                if(e) throw e

                const tabela= nomeTabela[0].tabela
                Campanhas.camposTelaAgente(idCampanha,tabela,(e,campos)=>{
                    if(e) throw e

                    res.send(campos)
                })
            })
        }

        removeCampo_telaAgente(req,res){
            const idCampanha = parseInt(req.params.idCampanha)
            const idCampo = parseInt(req.params.idCampo)
            Campanhas.delCampoTelaAgente(idCampanha,idCampo,(e,r)=>{
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
        Tabulacoes.novaLista(dados,(erro,result)=>{
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
        Tabulacoes.editarListaTabulacao(idLista,valores,(erro,result)=>{
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
        Tabulacoes.dadosListaTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver todas as listas de tabulacao
    listasTabulacao(req,res){
        Tabulacoes.listasTabulacao((erro,result)=>{
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
        Tabulacoes.criarStatusTabulacao(dados,(erro,result)=>{
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
        Tabulacoes.editarStatusTabulacao(id,valores,(erro,result)=>{
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
        Tabulacoes.statusTabulacao(id,(erro,result)=>{
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
        Tabulacoes.listarStatusTabulacao(idLista,(erro,result)=>{
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
        Pausas.novaLista(dados,(erro,result)=>{
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
        Pausas.editarListaPausa(idLista,valores,(erro,result)=>{
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
        Pausas.dadosListaPausa(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver todas as listas de pausas
    listasPausa(req,res){
        Pausas.listasPausa((erro,result)=>{
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
        Pausas.criarPausa(dados,(erro,result)=>{
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
        Pausas.editarPausa(id,valores,(erro,result)=>{
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
        Pausas.dadosPausa(id,(erro,result)=>{
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
        Pausas.listarPausas(idLista,(erro,result)=>{
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
        Campanhas.addFila(idCampanha,nomeFila,(err,result)=>{
            if(err) throw err

            res.json(result)
        })
    }



    delFilaCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const nomeFila = req.params.nomeFila
        Campanhas.delFilaCampanha(idCampanha,nomeFila,(err,result)=>{
            if(err) throw err

            res.json(result)
        })
    }

    

    //######################BASES ######################

    //Funcoes de bases precisam ser revisadas
    listarColunasMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        Mailing.listarColunasMailing(idMailing,(erro,result)=>{
            if(erro) throw erro

            res.send(result)
        })
    }   

    setaColuna(req,res){
       
        const valores = req.body
        Mailing.selecionaColuna(valores,(err,result)=>{
            if(err) throw err

            res.send(result)
        })
    }

    listarColunas(req,res){
        const idCamp_Mailing = parseInt(req.params.idCamp_Mailing)
        Mailing.listarColunas(idCamp_Mailing,(erro,result)=>{
            if(erro) throw erro

            res.json(result)
        })
    }

    atualizarColuna(req,res){
        const idColuna = parseInt(req.params.idColuna)
        const valores = req.body
        Mailing.atualizarColuna(idColuna,valores,(erro,result)=>{
            if(erro) throw erro

            res.json(result)
        })

    }

    removerColuna(req,res){
        const idColuna = parseInt(req.params.idColuna)
        Mailing.removerColuna(idColuna,(erro,result)=>{
            if(erro) throw erro

            res.json(result)
        })
    }

    

    


    










//OLD

   
/*
    removendoChamadasOciosas(req,res){
        Campanhas.removendoChamadasOciosas((e,r)=>{
            if(e) throw e
        })
        setTimeout(()=>{this.removendoChamadasOciosas(req,res)},10000)
    }
    
    //verificador das campanhas ativas
    campanhasAtivas(req,res){
        //Verifica campanhas do ativo ativadas
        Campanhas.campanhasAtivasHabilitadas((e,r)=>{
            if(e) throw e             
            
            if(r){
                for(let i=0; i<r.length; i++){
                    //Verificando se cada campanha possui fila atribuida
                    let idCampanha = r[i].id
                    let nomeCampanha = r[i].nome
                    Campanhas.filaCampanha(idCampanha,(e,r)=>{ 
                        if(e) throw e

                        if(r.length==0){
                            let msg='Nenhuma fila atribuida na campanha!'
                            let estado = 2
                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                if(e) throw e
                            })                            
                        }else{
                            let idFilaCampanha = r[0].id
                            let fila = r[0].nomeFila
                           
                            //Verificando Mailing da campanha
                            Campanhas.mailingCampanha(idCampanha,(e,r)=>{
                                if(r.length==0){
                                    let msg='Nenhum Mailing atribuido na campanha'
                                    let estado = 2
                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                        if(e) throw e
                                    })                                     
                                }else{
                                    let idMailing = r[0].idMailing
                                    //Verificando se o Mailing esta configuradoo
                                    Campanhas.mailingConfigurado(idMailing,(e,r)=>{
                                        if(e) throw e

                                        if(r[0].configurado){
                                            //Verificando se a campanha esta no data para iniciar
                                            const hoje = moment().format("Y-MM-DD")
                                            const agora = moment().format("HH:mm:ss")
                                            Campanhas.dataCampanha(idCampanha,hoje,(e,r)=>{

                                                if(e) throw e
                                                
                                                if(r.length>=1){
                                                    Campanhas.horarioCampanha(idCampanha,agora,(e,r)=>{ 
                                                        if(e) throw e    
        
                                                        if(r.length>=1){ 
                                                            Discador.agentesFila(fila,(e,r)=>{ 
                                                                if(e) throw e  
                                                                
                                                                if(r.length ==0){
                                                                    
                                                                    let msg='Nenhum agente na fila'
                                                                    let estado = 2
                                                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                        if(e) throw e
                                                                    }) 
                                                                }else{
                                                                    //verificando se os agentes estao logados e disponiveis
                                                                    Discador.agentesDisponiveis(idFilaCampanha,(e,r)=>{
                                                                        if(e) throw e  

                                                                        if(r.length ==0){
                                                                            let msg='Nenhum agente disponível'
                                                                            let estado = 2
                                                                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                                if(e) throw e

                                                                            }) 
                                                                            
                                                                        }else{
                                                                            for(let i=0; i<r.length; i++){
                                                                                let ramal=r[i].ramal

                                                                                //preparando a regra de discagem do mailing
                                                                            
                                                                                //Follow UP

                                                                                //verifica disponibilidade do ramal

                                                                                Discador.filtrarRegistro(idCampanha,idMailing,ramal,(e,r)=>{
                                                                                    if(e) throw e  

                                                                                    if(r.length!=0){                                                                                       
                                                                                        let msg='Discando'
                                                                                        let estado = 1
                                                                                        Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                                            if(e) throw e
            
                                                                                        }) 


                                                                                        Discador.discar(idCampanha,idMailing,ramal,fila,r,(e,res)=>{
                                                                                            
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
                                                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                if(e) throw e
                                                            }) 
                                                        }
                                                    })
                                                }else{
                                                    let msg='Campanha fora da data de atendimento'
                                                    let estado = 2
                                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                        if(e) throw e
                                                    }) 
                                                }
                                            })
                                        }else{
                                            let msg='Mailing não configurado na campanha'
                                            let estado = 2
                                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
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
        })
        //return next();
        //setTimeout(()=>{this.campanhasAtivas(req,res)},10000)
    }*/


    

       

    





   

   
   



}

export default new CampanhasController();