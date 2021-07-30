"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _Mailing = require('../models/Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Filas = require('../models/Filas'); var _Filas2 = _interopRequireDefault(_Filas);


class CampanhasController{
    //######################  C A M P A N H A S   A T I V A S  ######################
    //Status da campanha em tempo real
    statusCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        _Discador2.default.statusCampanha(idCampanha,(e,r)=>{
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
        
        _Campanhas2.default.criarCampanha(tipo,nome,descricao,(e,result)=>{ 
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
        _Campanhas2.default.listarCampanhas((e,r)=>{
            if(e) throw e
            
            res.json(r)            
        })
    }

    listarCampanhasAtivas(req,res){
        _Campanhas2.default.listarCampanhasAtivas((e,r)=>{
            if(e) throw e
            
            res.json(r)            
        })
    }
    //Dados da campanha
    dadosCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha);
        _Campanhas2.default.dadosCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }
    //Atualizar campanha
    atualizaCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha);
        const valores = req.body
        _Campanhas2.default.atualizaCampanha(idCampanha,valores,(e,r)=>{
            if(e) throw e
            
            res.json(r)    
        })
    }

    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    //TABULAÇÕES
     //Lista de Tabulaçoes da campanha
        //Add lista na campanha
        async addListaTabulacaoCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const idListaTabulacao = req.body.idListaTabulacao
            const r = await _Campanhas2.default.addListaTabulacaoCampanha(idCampanha,idListaTabulacao)
            res.json(true);
        }
        //Exibe as listas de tabulacao da Campanha
        async listasTabulacaoCampanha(req,res){
            const idCampanha = req.params.idCampanha;
            const r = await _Campanhas2.default.listasTabulacaoCampanha(idCampanha)
            console.log('retorno',r)
            res.json(r);
        }
        //remove Lista tabulacao da campanha
        removerListaTabulacaoCampanha(req,res){
            const idListaNaCampanha = req.params.idListaNaCampanha
            const r = _Campanhas2.default.removerListaTabulacaoCampanha(idListaNaCampanha)
            res.json(true);
        }
        statusTabulacaoCampanha(req,res){
            res.json(false);
        }


    //INTEGRAÇÕES
    criarIntegracao(req,res){
        const dados = req.body
        _Campanhas2.default.criarIntegracao(dados,(e,r)=>{
            if(e) throw e

            res.json(true);
        })
    }    
    listarIntegracoes(req,res){
        const dados = req.body
        _Campanhas2.default.listarIntegracoes((e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }
    dadosIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)      
        _Campanhas2.default.dadosIntegracao(idIntegracao,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }
    atualizarIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)
        const dados = req.body
        _Campanhas2.default.atualizarIntegracao(idIntegracao,dados,(e,r)=>{
            if(e) throw e

            res.json(true);
        })
    }
    removerIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)
        _Campanhas2.default.removerIntegracao(idIntegracao,(e,r)=>{
            if(e) throw e

            res.json(true);
        })
    }
    inserirIntegracaoCampanha(req,res){
        const dados = req.body
        _Campanhas2.default.inserirIntegracaoCampanha(dados,(e,r)=>{
            if(e) throw e

            res.json(true);
        })
    } 
    listaIntegracaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        _Campanhas2.default.listaIntegracaoCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }

    removerIntegracaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const idIntegracao = parseInt(req.params.idIntegracao)
        _Campanhas2.default.removerIntegracaoCampanha(idCampanha,idIntegracao,(e,r)=>{
            if(e) throw e

            res.json(true);
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
    //Lista as filas disponiveis
    async listarFilasDisponiveis(req,res){
        const filas = await _Campanhas2.default.listarFilas()
        res.json(filas)
    }
    //Lista filas da campanha        
    listarFilasCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        _Campanhas2.default.listarFilasCampanha(idCampanha,(err,result)=>{
            if(err) throw err

            res.json(result) 
        })
    }
    //Adiciona a fila na campanha
    async addFilaCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        const infoFila=await _Campanhas2.default.dadosFila(idFila)
        
        if(infoFila.length>0){
            const nomeFila=infoFila[0].nome
            _Campanhas2.default.addFila(idCampanha,idFila,nomeFila,(e,result)=>{
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
    }
    //remove a fila da campanha
    removerFilaCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        _Campanhas2.default.removerFilaCampanha(idCampanha,idFila,(err,result)=>{
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
    async addMailingCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const idMailing = req.body.idMailing

        const r = await _Campanhas2.default.addMailingCampanha(idCampanha,idMailing)
        res.json(r)
    }        
    //Lista mailing da campanha
    listarMailingCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        _Campanhas2.default.listarMailingCampanha(idCampanha,(erro,result)=>{
            if(erro) throw erro
                
            res.json(result)
        })
    }        
    //remove mailing da campanha
    async removeMailingCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const r = await _Campanhas2.default.removeMailingCampanha(idCampanha)
        res.json(r)
    }

    //Filtra os registros do mailing
    async filtrarDiscagem(req,res){
        const parametros =  req.body
        const r = await _Campanhas2.default.filtrarRegistrosCampanha(parametros) 
        res.json(r)
    }

    //Exibe o status dos filtros
    async filtrosDiscagem(req,res){
        const idCampanha = req.params.idCampanha
        const UF = req.params.uf

        const infoMailing = await _Campanhas2.default.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            res.json(false) 
            return false
        }
        const idMailing = infoMailing[0].id
        const tabelaNumero=infoMailing[0].tabela_numeros
        
        //Total de Registros do uf
        const filters = {}
              filters['totalNumeros']=await _Campanhas2.default.totalNumeros(tabelaNumero,UF)
              filters['regFiltrados']=await _Campanhas2.default.numerosFiltrados(tabelaNumero,idCampanha,UF)
        if(UF!=0){ 
            //Verificando filtros pelo DDD
            filters['DDD']=[]
            const listDDDs = await _Campanhas2.default.dddsMailings(tabelaNumero,UF)
            for(let i=0;i<listDDDs.length;i++){
                const ddd = {}
                      ddd['ddd']=listDDDs[i].ddd
                      ddd['numeros']=await _Campanhas2.default.totalNumeros(tabelaNumero,UF,listDDDs[i].ddd)
                      ddd['filtered']=await _Campanhas2.default.checkTypeFilter(idCampanha,'ddd',listDDDs[i].ddd,UF)
                filters['DDD'].push(ddd)               
            }

            //Verificando filtros pelo Tipo de Número
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await _Campanhas2.default.totalNumeros_porTipo(tabelaNumero,UF,'celular')
                  celular['filtered']=await _Campanhas2.default.checkTypeFilter(idCampanha,'tipo','celular',UF)
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await _Campanhas2.default.totalNumeros_porTipo(tabelaNumero,UF,'fixo')
                  fixo['filtered']=await _Campanhas2.default.checkTypeFilter(idCampanha,'tipo','fixo',UF)
            filters['TIPO'].push(fixo)  

            //Verificando filtros pelo UF
            filters['UF']=[]
            const ufs = {}
                  ufs['uf']=UF
                  ufs['numeros']=await _Campanhas2.default.totalNumeros(tabelaNumero,UF)
                  ufs['filtered']=await _Campanhas2.default.checkTypeFilter(idCampanha,'uf',UF,UF)
            filters['UF'].push(ufs) 
                  
        }else{
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await _Campanhas2.default.totalNumeros_porTipo(tabelaNumero,UF,'celular')
                  celular['filtered']=await _Campanhas2.default.checkTypeFilter(idCampanha,'tipo','celular',"")
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await _Campanhas2.default.totalNumeros_porTipo(tabelaNumero,UF,'fixo')
                  fixo['filtered']=await _Campanhas2.default.checkTypeFilter(idCampanha,'tipo','fixo',"")
            filters['TIPO'].push(fixo)  
        }
        res.json(filters) 
    }

    //MAILING=>CONFIGURAR TELA DO AGENTE
    //Listar campos disponiveis que foram configurados no mailing  
    async listarCamposConfigurados(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            res.send(JSON.parse('{"erro":"Nenhum mailing encontrado na campanha"}'))
            return false
        }
        const idMailing = infoMailing[0].id
        const tabela = infoMailing[0].tabela_dados
        
        const campos = await _Campanhas2.default.camposConfiguradosDisponiveis(idMailing)      
        const camposConf=[]
        for(let i=0; i< campos.length; i++){
            camposConf[i]={}
            camposConf[i]['id']=campos[i].id 
            camposConf[i]['campo']=campos[i].campo 
            camposConf[i]['apelido']=campos[i].apelido 
            camposConf[i]['tipo']=campos[i].tipo 
            //Verificando se o campo esta adicionado na tela
            let selected=false
            if(await _Campanhas2.default.campoSelecionadoTelaAgente(campos[i].id,tabela,idCampanha)===true){
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
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(idCampanha)
        const tabela =infoMailing[0].tabela_dados
        if(await _Campanhas2.default.campoSelecionadoTelaAgente(idCampo,tabela,idCampanha)===false){
            await _Campanhas2.default.addCampoTelaAgente(idCampanha,tabela,idCampo)
            res.send(true)
        }        
        res.send(false)
    }
    //Lista apenas os campos selecionados
    async listaCampos_telaAgente(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            res.send(false)
            return false
        }
        const tabela = infoMailing[0].tabela_dados
        const campos = await _Campanhas2.default.camposTelaAgente(idCampanha,tabela)
        res.send(campos)
    }
     //Desmarca o campo atual
     async removeCampo_telaAgente(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const idCampo = parseInt(req.params.idCampo)
        await _Campanhas2.default.delCampoTelaAgente(idCampanha,idCampo)
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
       /* const idCampanha = parseInt(req.params.idCampanha)
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
        }    */       
        const retorno={}
              retorno['trabalhado']=0//parseFloat(perc_trabalhados)
              retorno['contatados']=0//parseFloat(perc_contatados)
              retorno['nao_contatados']=0//parseFloat(perc_naoContatados)
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


    //#########  P A U S A S          ############
    //######################PAUSAS ######################
    //Criar lista de pausas
    criarListaPausa(req,res){
        const dados = req.body
        _Pausas2.default.novaLista(dados,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Editar lista de pausas
    editarListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        const valores = req.body
        _Pausas2.default.editarListaPausa(idLista,valores,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Ver dados da lista de pausas
    dadosListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        _Pausas2.default.dadosListaPausa(idLista,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Ver todas as listas de pausas
    listasPausa(req,res){
        _Pausas2.default.listasPausa((e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Criar nova pausa
    criarPausa(req,res){
        const dados = req.body
        _Pausas2.default.criarPausa(dados,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Editar pausa
    editarPausa(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        _Pausas2.default.editarPausa(id,valores,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //ver pausa
    dadosPausa(req,res){
        const id = parseInt(req.params.id);
        _Pausas2.default.dadosPausa(id,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //ver todas pausas de uma lista
    listarPausas(req,res){
        const idLista = parseInt(req.params.idLista)
        _Pausas2.default.listarPausas(idLista,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    } 

    //#########  F I L A S            ############
    async criarFila(req,res){
        const name = req.body.name
        const description = req.body.description
        const musiconhold = req.body.musiconhold
        const strategy = req.body.strategy
        const timeout = req.body.timeout
        const retry = req.body.retry
        const autopause = req.body.autopause
        const maxlen = req.body.maxlen
        const monitorType = 'mixmonitor'
        const monitorFormat = 'wav'
        const r = await _Campanhas2.default.novaFila(name,description)
        if(r==false){
            const rt={}
            rt['error']=true
            rt['message']=`Já esiste uma fila criada com o nome '${name}'`
            res.send(rt)
            return false            
        }
        await _Filas2.default.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat)
        res.send(true)
    }

    async listarFilas(req,res){
        const filas = await _Campanhas2.default.listarFilas()
        res.json(filas)
    }

    async dadosFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(idFila)
        res.json(dadosFila)
    }

    async configuracoesFila(req,res){const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(idFila)
        const nomeFila=dadosFila[0].nome
        const configFila=await _Filas2.default.dadosFila(nomeFila)
        res.json(configFila)
    }

    async editarFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(idFila)
        const nomeFilaAtual=dadosFila[0].nome
        const dados = req.body
        await _Campanhas2.default.editarFila(idFila,dados)
        await _Filas2.default.editarNomeFila(nomeFilaAtual,dados.name)
        res.json(true)
    }

    async configurarFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(idFila)
        const nomeFila=dadosFila[0].nome
        const configs = req.body
        await _Filas2.default.editarFila(nomeFila,configs)
        res.json(true)
    }

    async removerFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(idFila)
        const nomeFila=dadosFila[0].nome
        await _Campanhas2.default.removerFila(idFila)
        await _Filas2.default.removerFila(nomeFila)
        res.send(true)
    }

    

    

    
    
    
    //#########  B A S E S            ############


}

exports. default = new CampanhasController();