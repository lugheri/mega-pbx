"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Mailing = require('../models/Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Filas = require('../models/Filas'); var _Filas2 = _interopRequireDefault(_Filas);


class CampanhasController{
    //######################  C A M P A N H A S   A T I V A S  ######################
    //Status da campanha em tempo real
    async statusCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.id);
        const r = await _Discador2.default.statusCampanha(empresa,idCampanha)
        res.json(r)
    }

    //######################Operacoes básicas das campanhas (CRUD)
    //Criar Campanhas
    async criarCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const tipo  = req.body.tipo
        const nome = req.body.nome
        const descricao = req.body.descricao  
        const result = await _Campanhas2.default.criarCampanha(empresa,tipo,nome,descricao) 
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
    }

    //Listar Campanhas
    async listarCampanhas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const campanhas = await _Campanhas2.default.listarCampanhas(empresa)
        res.json(campanhas)                    
    }

    async listarCampanhasAtivas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const campanhasAtivas = await _Campanhas2.default.listarCampanhasAtivas(empresa)
        res.json(campanhasAtivas)   
    }

    //Dados da campanha
    async dadosCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        const dadosCampanha = await _Campanhas2.default.dadosCampanha(empresa,idCampanha)
        res.json(dadosCampanha)    
    }
    //Atualizar campanha
    async atualizaCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        const valores = req.body
        await _Campanhas2.default.atualizaCampanha(empresa,idCampanha,valores)
        if(valores.estado!=1){
            await _Discador2.default.clearCallsCampanhas(empresa,idCampanha)
        }
        res.json(true)    
    }

    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    //TABULAÇÕES
    //Lista de Tabulaçoes da campanha
    //Add lista na campanha
    async addListaTabulacaoCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idListaTabulacao = req.body.idListaTabulacao
        const r = await _Campanhas2.default.addListaTabulacaoCampanha(empresa,idCampanha,idListaTabulacao)
        res.json(true);
    }
    //Exibe as listas de tabulacao da Campanha
    async listasTabulacaoCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.params.idCampanha;
        const r = await _Campanhas2.default.listasTabulacaoCampanha(empresa,idCampanha)
        res.json(r);
    }
    //remove Lista tabulacao da campanha
    async removerListaTabulacaoCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idListaNaCampanha = req.params.idListaNaCampanha
        const r = await _Campanhas2.default.removerListaTabulacaoCampanha(empresa,idListaNaCampanha)
        res.json(true);
    }

    async setMaxTimeStatusTab(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const time= req.body.maxTime
        await _Campanhas2.default.setMaxTimeStatusTab(empresa,idCampanha,time)
        res.json(true);
    }

    async getMaxTimeStatusTab(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.params.idCampanha
        const time = await _Campanhas2.default.getMaxTimeStatusTab(empresa,idCampanha)
        res.json(time);
    }


    //INTEGRAÇÕES
    async criarIntegracao(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        await _Campanhas2.default.criarIntegracao(empresa,dados)
        res.json(true);
    }    
    
    async listarIntegracoes(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const listaIntegracoes = await _Campanhas2.default.listarIntegracoes(empresa)
        res.json(listaIntegracoes);
    }
    async dadosIntegracao(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idIntegracao = parseInt(req.params.idIntegracao)      
        const dadosIntegracoes = await _Campanhas2.default.dadosIntegracao(empresa,idIntegracao)
        res.json(dadosIntegracoes);
    }
    async atualizarIntegracao(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idIntegracao = parseInt(req.params.idIntegracao)
        const dados = req.body
        await _Campanhas2.default.atualizarIntegracao(empresa,idIntegracao,dados)
        res.json(true);
    }
    async removerIntegracao(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idIntegracao = parseInt(req.params.idIntegracao)
        await _Campanhas2.default.removerIntegracao(empresa,idIntegracao)
        res.json(true);
    }
    async inserirIntegracaoCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        await _Campanhas2.default.inserirIntegracaoCampanha(empresa,dados)
        res.json(true);
    } 
    async listaIntegracaoCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const integracoesCampanha = await _Campanhas2.default.listaIntegracaoCampanha(empresa,idCampanha)
        res.json(integracoesCampanha);
    }

    async removerIntegracaoCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const idIntegracao = parseInt(req.params.idIntegracao)
        await _Campanhas2.default.removerIntegracaoCampanha(empresa,idCampanha,idIntegracao)
        res.json(true);
    }

    //DISCADOR
    //Configurar discador da campanha
    async configDiscadorCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const tipoDiscador = req.body.tipoDiscador
        const agressividade = req.body.agressividade
        const ordemDiscagem = req.body.ordemDiscagem
        const tipoDiscagem = req.body.tipoDiscagem
        const modo_atendimento = req.body.modo_atendimento
        const saudacao = req.body.saudacao

        const conf = await _Campanhas2.default.configDiscadorCampanha(empresa,idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,modo_atendimento,saudacao)
        res.json(conf);
        
    }
    //Ver configuracoes do Discador
    async verConfigDiscadorCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        
        const conf = await _Campanhas2.default.verConfigDiscadorCampanha(empresa,idCampanha)
        res.json(conf);
    }

    //FILAS
    //Lista as filas disponiveis
    async listarFilasDisponiveis(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const filas = await _Campanhas2.default.listarFilas(empresa)
        res.json(filas)
    }
    //Lista filas da campanha        
    async listarFilasCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const filasCampanha = await _Campanhas2.default.listarFilasCampanha(empresa,idCampanha)
        res.json(filasCampanha) 
    }
    //Adiciona a fila na campanha
    async addFilaCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        const infoFila=await _Campanhas2.default.dadosFila(empresa,idFila)
        
        if(infoFila.length>0){
            const nome=infoFila[0].nome//Apelido
            const nomeFila=infoFila[0].nomeFila//Nome Real da fila
            const r=await _Campanhas2.default.addFila(empresa,idCampanha,idFila,nome,nomeFila)
            if(r.affectedRows==0){
                res.json(false)
                return false
            }
            res.json(true)
            return false
        }
        res.json(true)    
    }
    //remove a fila da campanha
    async removerFilaCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        const result = await _Campanhas2.default.removerFilaCampanha(empresa,idCampanha,idFila)
        if(result.affectedRows==0){
            res.json(false)
            return false
        }
        res.json(true)               
    }
    

    //MAILING
    //Add mailing na campanha
    async addMailingCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idMailing = req.body.idMailing

        const r = await _Campanhas2.default.addMailingCampanha(empresa,idCampanha,idMailing)
        res.json(r)
    }        

    //Lista mailing da campanha
    async listarMailingCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const result = await _Campanhas2.default.listarMailingCampanha(empresa,idCampanha)
        res.json(result)
    }        
    //remove mailing da campanha
    async removeMailingCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const r = await _Campanhas2.default.removeMailingCampanha(empresa,idCampanha)
        res.json(r)
    }

    //Filtra os registros do mailing
    async filtrarDiscagem(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const parametros =  req.body
        const r = await _Campanhas2.default.filtrarRegistrosCampanha(empresa,parametros) 
        res.json(r)
    }

    //Exibe o status dos filtros
    async filtrosDiscagem(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.params.idCampanha
        const UF = req.params.uf

        const infoMailing = await _Campanhas2.default.infoMailingCampanha(empresa,idCampanha)
        if(infoMailing.length==0){
            res.json(false) 
            return false
        }
        const idMailing = infoMailing[0].id
        const tabelaNumero=infoMailing[0].tabela_numeros
        
        //Total de Registros do uf
        const filters = {}
              filters['totalNumeros']=await _Campanhas2.default.totalNumeros(empresa,tabelaNumero,UF)
              filters['regFiltrados']=await _Campanhas2.default.numerosFiltrados(empresa,idMailing,tabelaNumero,idCampanha,UF)
        if(UF!=0){ 
            //Verificando filtros pelo DDD
            filters['DDD']=[]
            const listDDDs = await _Campanhas2.default.dddsMailings(empresa,tabelaNumero,UF)
            for(let i=0;i<listDDDs.length;i++){
                const ddd = {}
                      ddd['ddd']=listDDDs[i].ddd
                      ddd['numeros']=await _Campanhas2.default.totalNumeros(empresa,tabelaNumero,UF,listDDDs[i].ddd)
                      ddd['filtered']=await _Campanhas2.default.checkTypeFilter(empresa,idCampanha,'ddd',listDDDs[i].ddd,UF)
                filters['DDD'].push(ddd)               
            }

            //Verificando filtros pelo Tipo de Número
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await _Campanhas2.default.totalNumeros_porTipo(empresa,tabelaNumero,UF,'celular')
                  celular['filtered']=await _Campanhas2.default.checkTypeFilter(empresa,idCampanha,'tipo','celular',UF)
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await _Campanhas2.default.totalNumeros_porTipo(empresa,tabelaNumero,UF,'fixo')
                  fixo['filtered']=await _Campanhas2.default.checkTypeFilter(empresa,idCampanha,'tipo','fixo',UF)
            filters['TIPO'].push(fixo)  

            //Verificando filtros pelo UF
            filters['UF']=[]
            const ufs = {}
                  ufs['uf']=UF
                  ufs['numeros']=await _Campanhas2.default.totalNumeros(empresa,tabelaNumero,UF)
                  ufs['filtered']=await _Campanhas2.default.checkTypeFilter(empresa,idCampanha,'uf',UF,UF)
            filters['UF'].push(ufs) 
                  
        }else{
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await _Campanhas2.default.totalNumeros_porTipo(empresa,tabelaNumero,UF,'celular')
                  celular['filtered']=await _Campanhas2.default.checkTypeFilter(empresa,idCampanha,'tipo','celular',"")
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await _Campanhas2.default.totalNumeros_porTipo(empresa,tabelaNumero,UF,'fixo')
                  fixo['filtered']=await _Campanhas2.default.checkTypeFilter(empresa,idCampanha,'tipo','fixo',"")
            filters['TIPO'].push(fixo)  
        }
        res.json(filters) 
    }

    //MAILING=>CONFIGURAR TELA DO AGENTE
    //Listar campos disponiveis que foram configurados no mailing  
    async listarCamposConfigurados(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(empresa,idCampanha)
        if(infoMailing.length==0){
            res.send(JSON.parse('{"erro":"Nenhum mailing encontrado na campanha"}'))
            return false
        }
        const idMailing = infoMailing[0].id
        const tabela = infoMailing[0].tabela_dados
        
        const campos = await _Campanhas2.default.camposConfiguradosDisponiveis(empresa,idMailing)      
        const camposConf=[]
        for(let i=0; i< campos.length; i++){
            camposConf[i]={}
            camposConf[i]['id']=campos[i].id 
            camposConf[i]['campo']=campos[i].campo 
            camposConf[i]['apelido']=campos[i].apelido 
            camposConf[i]['tipo']=campos[i].tipo 
            //Verificando se o campo esta adicionado na tela
            let selected=false
            if(await _Campanhas2.default.campoSelecionadoTelaAgente(empresa,campos[i].id,tabela,idCampanha)===true){
                selected = true
            }
            camposConf[i]['selecionado']=selected          
        }        
        res.json(camposConf)
    }
    //Marca campo como selecionado para exibir na tela do agente
    async adicionaCampo_telaAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha 
        const idCampo = req.body.idCampo
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(empresa,idCampanha)
        const tabela =infoMailing[0].tabela_dados
        if(await _Campanhas2.default.campoSelecionadoTelaAgente(empresa,idCampo,tabela,idCampanha)===false){
            await _Campanhas2.default.addCampoTelaAgente(empresa,idCampanha,tabela,idCampo)
            res.send(true)
        }        
        res.send(false)
    }
    //Lista apenas os campos selecionados
    async listaCampos_telaAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(empresa,idCampanha)
        if(infoMailing.length==0){
            res.send(false)
            return false
        }
        const tabela = infoMailing[0].tabela_dados
        const campos = await _Campanhas2.default.camposTelaAgente(empresa,idCampanha,tabela)
        res.send(campos)
    }
     //Desmarca o campo atual
     async removeCampo_telaAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const idCampo = parseInt(req.params.idCampo)
        await _Campanhas2.default.delCampoTelaAgente(empresa,idCampanha,idCampo)
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
        const empresa = await _User2.default.getEmpresa(req)
        let perc_trabalhados = 0
        let perc_contatados = 0
        let perc_naoContatados = 0
        let total=0
        let idMailing=0

        const idCampanha = parseInt(req.params.idCampanha)

        //Calcula a evolução da campanha com base no mailing ativo no momento
        const m = await _Campanhas2.default.totalMailingsCampanha(empresa,idCampanha)
        if(m.length>0){
            total=m[0].total
            idMailing=m[0].idMailing
        }
        console.log('total registros',total)        
        const contatados = await _Campanhas2.default.mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,'S')
        const naoContatados = await _Campanhas2.default.mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,'N')
        const trabalhados = contatados + naoContatados  
        
        console.log('total contatados',contatados)  
        console.log('total naoContatados',naoContatados)  
        console.log('total trabalhados',trabalhados)  
        
        
       
        if(total!=0){
            perc_trabalhados=Math.round((trabalhados / total)*100)
            perc_contatados=Math.round((contatados / total)*100)
            perc_naoContatados=Math.round((naoContatados / total)*100)                   
        }       
        const retorno={}
              retorno['trabalhado']=parseFloat(perc_trabalhados)
              retorno['contatados']=parseFloat(perc_contatados)
              retorno['nao_contatados']=parseFloat(perc_naoContatados)
        res.json(retorno)
    }

    async historicoMailingsCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)

        const mailings = []
        const ma = await _Campanhas2.default.mailingsAnteriores(empresa,idCampanha)

        for(let i=0;i<ma.length;i++){
            const idMailing = ma[i].idMailing
            const info = await _Mailing2.default.infoMailingAtivo(empresa,idMailing)            
           
            const produtivos = await _Campanhas2.default.mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,1)
            const improdutivos = await _Campanhas2.default.mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,0)

            const data =  await _Campanhas2.default.dataUltimoRegMailingNaCampanha(empresa,idCampanha,idMailing)

            let total = improdutivos+produtivos
            let nome = "Informações Removidas"
            if(info.length>0){               
                total=info[0].totalNumeros
                nome=info[0].nome
            }
            const trabalhados = produtivos+improdutivos
            const infoMailing = {}
                  infoMailing["id"]=idMailing
                  infoMailing["nome"]=nome
                  infoMailing["data"]=data
                  infoMailing["nao_trabalhados"]=total-trabalhados
                  infoMailing["produtivos"]=produtivos
                  infoMailing["improdutivos"]=improdutivos

                  mailings.push(infoMailing)
        }
        res.json(mailings)
    }

    //AGENDAMENTO
    //Agenda campanha
    async agendarCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const dI = req.body.data_inicio
        const dT = req.body.data_termino
        const hI = req.body.hora_inicio
        const hT = req.body.hora_termino
        const r = await _Campanhas2.default.agendarCampanha(empresa,idCampanha,dI,dT,hI,hT)
        res.json(r)
    }

    //ver agenda da campanha
    async verAgendaCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        const r = await _Campanhas2.default.verAgendaCampanha(empresa,idCampanha)
        res.json(r)
    }


    //#########  P A U S A S          ############
    //######################PAUSAS ######################
    //Criar lista de pausas
    async criarListaPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _Pausas2.default.novaLista(empresa,dados)
        res.json(r)
    }

    //Editar lista de pausas
    async editarListaPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = parseInt(req.params.id);
        const valores = req.body
        const r = await _Pausas2.default.editarListaPausa(empresa,idLista,valores)
        res.json(r)
    }

    //Ver dados da lista de pausas
    async dadosListaPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = parseInt(req.params.id);
        const r = await _Pausas2.default.dadosListaPausa(empresa,idLista)
        res.json(r)
    }

    //Ver todas as listas de pausas
    async listasPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const r = await _Pausas2.default.listasPausa(empresa)
        res.json(r)
    }

    //Criar nova pausa
    async criarPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const result = await _Pausas2.default.criarPausa(empresa,dados)
        res.json(result)
    }

    //Editar pausa
    async editarPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const id = parseInt(req.params.id);
        const valores = req.body
        const result = await _Pausas2.default.editarPausa(empresa,id,valores)
        res.json(result)        
    }

    async removerPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const id = parseInt(req.params.id);
        const result = await _Pausas2.default.removerPausa(empresa,id)
        res.json(result)       
    }

    //ver pausa
    async dadosPausa(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const id = parseInt(req.params.id);
        const result =  await _Pausas2.default.dadosPausa(empresa,id)
        res.json(result)        
    }

    //ver todas pausas de uma lista
    async listarPausas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = 1
        const result = await _Pausas2.default.listarPausas(empresa,idLista)
        res.json(result)
        
    } 

    //#########  F I L A S            ############
    async criarFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const apelido = req.body.name
        const description = req.body.description
        const musiconhold = req.body.musiconhold
        //const strategy = req.body.strategy
        //const timeout = req.body.timeout
        //const retry = req.body.retry
        //const autopause = req.body.autopause
        //const maxlen = req.body.maxlen
        const monitorType = 'mixmonitor'
        const monitorFormat = 'wav'
        const announce_frequency=0
        const announce_holdtime='no'
        const announce_position='no'
        const autofill='no'
        const autopause='no'
        const autopausebusy='no'
        const autopausedelay=0
        const autopauseunavail='no'
        const joinempty='yes'
        const leavewhenempty='no'
        const maxlen=0
        const memberdelay=0
        const penaltymemberslimit=0
        const periodic_announce_frequency=0
        const queue_callswaiting='silence/1'
        const queue_thereare='silence/1'
        const queue_youarenext='silence/1'
        const reportholdtime='no'
        const retry=5
        const ringinuse='yes'
        const servicelevel=60
        const strategy='rrmemory'
        const timeout=30
        const timeoutpriority='app'
        const timeoutrestart='no'
        const weight=0
        const wrapuptime=2

        const nomeFila = `${empresa}-${apelido.replace(" ","_").replace("/", "_")}`
        const r = await _Campanhas2.default.novaFila(empresa,nomeFila,apelido,description)
        if(r==false){
            const rt={}
            rt['error']=true
            rt['message']=`Já existe uma fila criada com o nome '${apelido}'`
            res.send(rt)
            return false            
        }
        const asterisk = await _Filas2.default.criarFila(empresa,nomeFila,musiconhold,monitorType,monitorFormat,announce_frequency,announce_holdtime,announce_position,autofill,autopause,autopausebusy,autopausedelay,autopauseunavail,joinempty,leavewhenempty,maxlen,memberdelay,penaltymemberslimit,periodic_announce_frequency,queue_callswaiting,queue_thereare,queue_youarenext,reportholdtime,retry,ringinuse,servicelevel,strategy,timeout,timeoutpriority,timeoutrestart,weight,wrapuptime)
        res.send(asterisk)
    }

    async listarFilas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const filas = await _Campanhas2.default.listarFilas(empresa)
        res.json(filas)
    }

    async dadosFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(empresa,idFila)
        res.json(dadosFila)
    }

    async configuracoesFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila        
        const dadosFila = await _Campanhas2.default.dadosFila(empresa,idFila)
        const nomeFila=dadosFila[0].nome
        const configFila=await _Filas2.default.dadosFila(empresa,nomeFila)
        res.json(configFila)
    }

    async editarFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(empresa,idFila)
        const nomeFilaAtual=dadosFila[0].nome
        const dados = req.body
        await _Campanhas2.default.editarFila(empresa,idFila,dados)
        await _Filas2.default.editarNomeFila(empresa,nomeFilaAtual,dados.name)
        res.json(true)
    }

    async configurarFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila
        const dadosFila = await _Campanhas2.default.dadosFila(empresa,idFila)
        const nomeFila=dadosFila[0].nome
        const configs = req.body
        await _Filas2.default.editarFila(empresa,nomeFila,configs)
        res.json(true)
    }

    async removerFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila
        const nomeFila = await _Campanhas2.default.nomeFila(empresa,idFila)
        await _Campanhas2.default.removerFila(empresa,idFila)
        await _Filas2.default.removerFila(empresa,nomeFila)
        res.send(true)
    }
    
    
    //#########  B A S E S            ############


}

exports. default = new CampanhasController();