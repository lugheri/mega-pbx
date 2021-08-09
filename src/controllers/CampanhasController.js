import Campanhas from '../models/Campanhas';
import Tabulacoes from '../models/Tabulacoes';
import Pausas from '../models/Pausas';
import Mailing from '../models/Mailing';
import Discador from '../models/Discador';
import Filas from '../models/Filas';


class CampanhasController{
    //######################  C A M P A N H A S   A T I V A S  ######################
    //Status da campanha em tempo real
    async statusCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        const r = await Discador.statusCampanha(idCampanha)

        res.json(r)
        
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
        async addListaTabulacaoCampanha(req,res){
            const idCampanha = req.body.idCampanha
            const idListaTabulacao = req.body.idListaTabulacao
            const r = await Campanhas.addListaTabulacaoCampanha(idCampanha,idListaTabulacao)
            res.json(true);
        }
        //Exibe as listas de tabulacao da Campanha
        async listasTabulacaoCampanha(req,res){
            const idCampanha = req.params.idCampanha;
            const r = await Campanhas.listasTabulacaoCampanha(idCampanha)
            console.log('retorno',r)
            res.json(r);
        }
        //remove Lista tabulacao da campanha
        removerListaTabulacaoCampanha(req,res){
            const idListaNaCampanha = req.params.idListaNaCampanha
            const r = Campanhas.removerListaTabulacaoCampanha(idListaNaCampanha)
            res.json(true);
        }
        statusTabulacaoCampanha(req,res){
            res.json(false);
        }


    //INTEGRAÇÕES
    criarIntegracao(req,res){
        const dados = req.body
        Campanhas.criarIntegracao(dados,(e,r)=>{
            if(e) throw e

            res.json(true);
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

            res.json(true);
        })
    }
    removerIntegracao(req,res){
        const idIntegracao = parseInt(req.params.idIntegracao)
        Campanhas.removerIntegracao(idIntegracao,(e,r)=>{
            if(e) throw e

            res.json(true);
        })
    }
    inserirIntegracaoCampanha(req,res){
        const dados = req.body
        Campanhas.inserirIntegracaoCampanha(dados,(e,r)=>{
            if(e) throw e

            res.json(true);
        })
    } 
    listaIntegracaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        Campanhas.listaIntegracaoCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            res.json(r);
        })
    }

    removerIntegracaoCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const idIntegracao = parseInt(req.params.idIntegracao)
        Campanhas.removerIntegracaoCampanha(idCampanha,idIntegracao,(e,r)=>{
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
        const modo_atendimento = req.body.modo_atendimento

        Campanhas.configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,modo_atendimento,(e,r)=>{
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
    async addFilaCampanha(req,res){
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        const infoFila=await Campanhas.dadosFila(idFila)
        
        if(infoFila.length>0){
            const nomeFila=infoFila[0].nome
            Campanhas.addFila(idCampanha,idFila,nomeFila,(e,result)=>{
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
        Campanhas.removerFilaCampanha(idCampanha,idFila,(err,result)=>{
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

        const r = await Campanhas.addMailingCampanha(idCampanha,idMailing)
        res.json(r)
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
    async removeMailingCampanha(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const r = await Campanhas.removeMailingCampanha(idCampanha)
        res.json(r)
    }

    //Filtra os registros do mailing
    async filtrarDiscagem(req,res){
        const parametros =  req.body
        const r = await Campanhas.filtrarRegistrosCampanha(parametros) 
        res.json(r)
    }

    //Exibe o status dos filtros
    async filtrosDiscagem(req,res){
        const idCampanha = req.params.idCampanha
        const UF = req.params.uf

        const infoMailing = await Campanhas.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            res.json(false) 
            return false
        }
        const idMailing = infoMailing[0].id
        const tabelaNumero=infoMailing[0].tabela_numeros
        
        //Total de Registros do uf
        const filters = {}
              filters['totalNumeros']=await Campanhas.totalNumeros(tabelaNumero,UF)
              filters['regFiltrados']=await Campanhas.numerosFiltrados(idMailing,tabelaNumero,idCampanha,UF)
        if(UF!=0){ 
            //Verificando filtros pelo DDD
            filters['DDD']=[]
            const listDDDs = await Campanhas.dddsMailings(tabelaNumero,UF)
            for(let i=0;i<listDDDs.length;i++){
                const ddd = {}
                      ddd['ddd']=listDDDs[i].ddd
                      ddd['numeros']=await Campanhas.totalNumeros(tabelaNumero,UF,listDDDs[i].ddd)
                      ddd['filtered']=await Campanhas.checkTypeFilter(idCampanha,'ddd',listDDDs[i].ddd,UF)
                filters['DDD'].push(ddd)               
            }

            //Verificando filtros pelo Tipo de Número
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await Campanhas.totalNumeros_porTipo(tabelaNumero,UF,'celular')
                  celular['filtered']=await Campanhas.checkTypeFilter(idCampanha,'tipo','celular',UF)
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await Campanhas.totalNumeros_porTipo(tabelaNumero,UF,'fixo')
                  fixo['filtered']=await Campanhas.checkTypeFilter(idCampanha,'tipo','fixo',UF)
            filters['TIPO'].push(fixo)  

            //Verificando filtros pelo UF
            filters['UF']=[]
            const ufs = {}
                  ufs['uf']=UF
                  ufs['numeros']=await Campanhas.totalNumeros(tabelaNumero,UF)
                  ufs['filtered']=await Campanhas.checkTypeFilter(idCampanha,'uf',UF,UF)
            filters['UF'].push(ufs) 
                  
        }else{
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await Campanhas.totalNumeros_porTipo(tabelaNumero,UF,'celular')
                  celular['filtered']=await Campanhas.checkTypeFilter(idCampanha,'tipo','celular',"")
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await Campanhas.totalNumeros_porTipo(tabelaNumero,UF,'fixo')
                  fixo['filtered']=await Campanhas.checkTypeFilter(idCampanha,'tipo','fixo',"")
            filters['TIPO'].push(fixo)  
        }
        res.json(filters) 
    }

    //MAILING=>CONFIGURAR TELA DO AGENTE
    //Listar campos disponiveis que foram configurados no mailing  
    async listarCamposConfigurados(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await Campanhas.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            res.send(JSON.parse('{"erro":"Nenhum mailing encontrado na campanha"}'))
            return false
        }
        const idMailing = infoMailing[0].id
        const tabela = infoMailing[0].tabela_dados
        
        const campos = await Campanhas.camposConfiguradosDisponiveis(idMailing)      
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
        const infoMailing = await Campanhas.infoMailingCampanha(idCampanha)
        const tabela =infoMailing[0].tabela_dados
        if(await Campanhas.campoSelecionadoTelaAgente(idCampo,tabela,idCampanha)===false){
            await Campanhas.addCampoTelaAgente(idCampanha,tabela,idCampo)
            res.send(true)
        }        
        res.send(false)
    }
    //Lista apenas os campos selecionados
    async listaCampos_telaAgente(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await Campanhas.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            res.send(false)
            return false
        }
        const tabela = infoMailing[0].tabela_dados
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
        Pausas.editarListaPausa(idLista,valores,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Ver dados da lista de pausas
    dadosListaPausa(req,res){
        const idLista = parseInt(req.params.id);
        Pausas.dadosListaPausa(idLista,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Ver todas as listas de pausas
    listasPausa(req,res){
        Pausas.listasPausa((e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Criar nova pausa
    criarPausa(req,res){
        const dados = req.body
        Pausas.criarPausa(dados,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //Editar pausa
    editarPausa(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        Pausas.editarPausa(id,valores,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //ver pausa
    dadosPausa(req,res){
        const id = parseInt(req.params.id);
        Pausas.dadosPausa(id,(e,result)=>{
            if(e) throw e
            
            res.json(result)
        })
    }

    //ver todas pausas de uma lista
    listarPausas(req,res){
        const idLista = parseInt(req.params.idLista)
        Pausas.listarPausas(idLista,(e,result)=>{
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
        const r = await Campanhas.novaFila(name,description)
        if(r==false){
            const rt={}
            rt['error']=true
            rt['message']=`Já esiste uma fila criada com o nome '${name}'`
            res.send(rt)
            return false            
        }
        const asterisk = await Filas.criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat)
        res.send(asterisk)
    }

    async listarFilas(req,res){
        const filas = await Campanhas.listarFilas()
        res.json(filas)
    }

    async dadosFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(idFila)
        res.json(dadosFila)
    }

    async configuracoesFila(req,res){const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(idFila)
        const nomeFila=dadosFila[0].nome
        const configFila=await Filas.dadosFila(nomeFila)
        res.json(configFila)
    }

    async editarFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(idFila)
        const nomeFilaAtual=dadosFila[0].nome
        const dados = req.body
        await Campanhas.editarFila(idFila,dados)
        await Filas.editarNomeFila(nomeFilaAtual,dados.name)
        res.json(true)
    }

    async configurarFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(idFila)
        const nomeFila=dadosFila[0].nome
        const configs = req.body
        await Filas.editarFila(nomeFila,configs)
        res.json(true)
    }

    async removerFila(req,res){
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(idFila)
        const nomeFila=dadosFila[0].nome
        await Campanhas.removerFila(idFila)
        await Filas.removerFila(nomeFila)
        res.send(true)
    }

    

    

    
    
    
    //#########  B A S E S            ############


}

export default new CampanhasController();