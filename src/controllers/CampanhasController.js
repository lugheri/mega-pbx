import Campanhas from '../models/Campanhas';
import Tabulacoes from '../models/Tabulacoes';
import Pausas from '../models/Pausas';
import Mailing from '../models/Mailing';
import Discador from '../models/Discador';
import Filas from '../models/Filas';


class CampanhasController{
    //######################  C A M P A N H A S   A T I V A S  ######################
    //Status da campanha em tempo real
    statusCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        Discador.statusCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //######################Operacoes básicas das campanhas (CRUD)
    //Criar Campanhas
    criarCampanha(req,res){
        const tipo  = req.body.tipo
        const nome = req.body.nome
        const descricao = req.body.descricao  
        
        Campanhas.criarCampanha(tipo,nome,descricao,(e,result)=>{ 
            if(e) throw e

            res.json(result)

            /*
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
                
            })*/
        })
    }
    //Listar Campanhas
    listarCampanhas(req,res){
        Campanhas.listarCampanhas((e,r)=>{
            if(e) throw e
            
            res.json(r)            
        })
    }

    listarCampanhasAtivas(req,res){
        Campanhas.listarCampanhasAtivas((e,r)=>{
            if(e) throw e
            
            res.json(r)            
        })
    }
    //Dados da campanha
    dadosCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha);
        Campanhas.dadosCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }
    //Atualizar campanha
    atualizaCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha);
        const valores = req.body
        Campanhas.atualizaCampanha(idCampanha,valores,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }

    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    //TABULAÇÕES
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


    //INTEGRAÇÕES
    criarIntegracao(req,res){
        const dados = req.body
        Campanhas.criarIntegracao(dados,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }    
    listarIntegracoes(req,res){
        const dados = req.body
        Campanhas.listarIntegracoes((e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }
    dadosIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)      
        Campanhas.dadosIntegracao(idIntegracao,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }
    atualizarIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)
        const dados = req.body
        Campanhas.atualizarIntegracao(idIntegracao,dados,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }
    removerIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)
        Campanhas.removerIntegracao(idIntegracao,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }
    inserirIntegracaoCampanha(req,res){
        const dados = req.body
        Campanhas.inserirIntegracaoCampanha(dados,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    } 

    //DISCADOR
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
    //Lista as filas disponiveis
    async listarFilasDisponiveis(req,res){
        const filas = await Campanhas.listarFilas()
        //const filas = await Filas.listar()
        res.json(filas)
    }
    //Lista filas da campanha        
    listarFilasCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        Campanhas.listarFilasCampanha(idCampanha,(err,result)=>{
            if(err) throw err

            res.json(result) 
        })
    }
    //Adiciona a fila na campanha
    addFilaCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        Campanhas.dadosFila(idFila,(e,infoFila)=>{
            if(e) throw e

            if(infoFila.length>0){
                const nomeFila=infoFila[0].nomeFila
                Campanhas.addFila(idCampanha,nomeFila,(e,result)=>{
                    if(e) throw e
        
                    if(result.affectedRows==0){
                        res.json(false)
                        return false
                    }
                    res.json(true)
                })
                return false
            }
            res.json(true)    
        })
       
    }
    //remove a fila da campanha
    removerFilaCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const nomeFila = req.body.nomeFila
        Campanhas.removerFilaCampanha(idCampanha,nomeFila,(err,result)=>{
            if(err) throw err

            if(result.affectedRows==0){
                res.json(false)
                return false
            }
            res.json(true)               
        })
    }
    

    //MAILING
    //Add mailing na campanha
    addMailingCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const idMailing = req.body.idMailing

        Campanhas.addMailingCampanha(idCampanha,idMailing,(e,r)=>{
            if(e) throw e
    
            res.json(r)
        })
    }        
    //Lista mailing da campanha
    listarMailingCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        Campanhas.listarMailingCampanha(idCampanha,(erro,result)=>{
            if(erro) throw erro
                
            res.json(result)
        })
    }        
    //remove mailing da campanha
    removeMailingCampanha(req,res){
        const id = parseInt(req.params.id)
        Campanhas.removeMailingCampanha(id,(erro,result)=>{
            if(erro) throw erro
    
            res.json(result)
        })
    }

    //MAILING=>CONFIGURAR TELA DO AGENTE
    //Listar campos disponiveis que foram configurados no mailing
    async listarCamposConfigurados(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const tabela = await Campanhas.nomeTabela_byIdCampanha(idCampanha)
        if(tabela===false){
            res.send(JSON.parse('{"erro":"Nenhum mailing encontrado na campanha"}'))
            return false
        }
        const campos = await Campanhas.camposConfiguradosDisponiveis(tabela)      
        const camposConf=[]
        for(let i=0; i< campos.length; i++){
            camposConf[i]={}
            camposConf[i]['id']=campos[i].id 
            camposConf[i]['campo']=campos[i].campo 
            camposConf[i]['apelido']=campos[i].apelido 
            camposConf[i]['tipo']=campos[i].tipo 
            //Verificando se o campo esta adicionado na tela
            let selected=false
            if(await Campanhas.campoSelecionadoTelaAgente(campos[i].id,tabela,idCampanha)===true){
                selected = true
            }
            camposConf[i]['selecionado']=selected          
        }        
        res.json(camposConf)
    }
    //Marca campo como selecionado para exibir na tela do agente
    async adicionaCampo_telaAgente(req,res){
        const idCampanha = req.body.idCampanha 
        const idCampo = req.body.idCampo
        const tabela = await Campanhas.nomeTabela_byIdCampanha(idCampanha)
        await Campanhas.addCampoTelaAgente(idCampanha,tabela,idCampo)
        res.send(true)
    }

    //Lista apenas os campos selecionados
    async listaCampos_telaAgente(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const tabela = await Campanhas.nomeTabela_byIdCampanha(idCampanha)
        const campos = await Campanhas.camposTelaAgente(idCampanha,tabela)
        res.send(campos)
    }
    //Desmarca o campo atual
    async removeCampo_telaAgente(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const idCampo = parseInt(req.params.idCampo)
        await Campanhas.delCampoTelaAgente(idCampanha,idCampo)
        res.send(true)
    }

    //BLACKLIST
    //Bloqueio por DDDs


    //Bloqueio por Tipo (Celular ou Fixo)


    //Add Numeros


    //Add Lista


    //GRAFICO CAMPANHA
    //Status da evolucao do mailing na campanha
    async statusEvolucaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        console.log(`idCampanha ${idCampanha}`)
        const total = await Campanhas.totalMailingsCampanha(idCampanha)
        const contatados = await Campanhas.mailingsContatadosPorCampanha(idCampanha,'S')
        const naoContatados = await Campanhas.mailingsContatadosPorCampanha(idCampanha,'N')
        const trabalhados = contatados + naoContatados                    
        
        let perc_trabalhados = 0
        let perc_contatados = 0
        let perc_naoContatados = 0
        if(total!=0){
            perc_trabalhados = parseFloat((trabalhados / total)*100).toFixed(1)
            perc_contatados = parseFloat((contatados / total)*100).toFixed(1)
            perc_naoContatados = parseFloat((naoContatados / total)*100).toFixed(1)                        
        }           
        const retorno={}
              retorno['trabalhado']=parseFloat(perc_trabalhados)
              retorno['contatados']=parseFloat(perc_contatados)
              retorno['nao_contatados']=parseFloat(perc_naoContatados)
              console.log(retorno)                    
        res.json(retorno)
    }

    //AGENDAMENTO
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


    //#########  P A U S A S          ############
    //######################PAUSAS ######################
    //Criar lista de pausas
    criarListaPausa(req,res){
        const dados = req.body
        Pausas.novaLista(dados,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Editar lista de pausas
    editarListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        const valores = req.body
        Pausas.editarListaPausa(idLista,valores,(erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Ver dados da lista de pausas
    dadosListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        Pausas.dadosListaPausa(idLista,(erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Ver todas as listas de pausas
    listasPausa(req,res){
        Pausas.listasPausa((erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Criar nova pausa
    criarPausa(req,res){
        const dados = req.body
        Pausas.criarPausa(dados,(erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Editar pausa
    editarPausa(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        Pausas.editarPausa(id,valores,(erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //ver pausa
    dadosPausa(req,res){
        const id = parseInt(req.params.id);
        Pausas.dadosPausa(id,(erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //ver todas pausas de uma lista
    listarPausas(req,res){
        const idLista = parseInt(req.params.idLista)
        Pausas.listarPausas(idLista,(erro,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    } 

    //#########  F I L A S            ############
    async criarFila(req,res){
        const name = req.body.name
        const musiconhold = req.body.musiconhold
        const strategy = req.body.strategy
        const timeout = req.body.timeout
        const retry = req.body.retry
        const autopause = req.body.autopause
        const maxlen = req.body.maxlen
        const monitorType = 'mixmonitor'
        const monitorFormat = 'wav'
        await Campanhas.novaFila(name)
        await Filas.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat)
        res.send(true)
    }

    async removerFila(req,res){
        const nomeFila = req.params.nomeFila
        await Campanhas.removerFila(nomeFila)
        await Filas.removerFila(nomeFila)
        res.send(true)
    }

    async dadosFila(req,res){
        const nomeFila = req.params.nomeFila
        const dadosFila = await Filas.dadosFila(nomeFila)
        res.json(dadosFila)
    }

    async listarFilas(req,res){
        const filas = await Campanhas.listarFilas()
        res.json(filas)
    }

    async editarFila(req,res){
        const nomeFila = req.params.nomeFila
        const dados = req.body;
        await Filas.editarFila(nomeFila,dados)
        res.json(true)
    }
    
    
    //#########  B A S E S            ############


}

export default new CampanhasController();