import Campanhas from '../models/Campanhas';
import Mailing from '../models/Mailing';
import Pausas from '../models/Pausas';
import User from '../models/User'
import Discador from '../models/Discador';
import Filas from '../models/Filas';
import Redis from '../Config/Redis'


class CampanhasController{
    //######################  C A M P A N H A S   A T I V A S  ######################
    //Status da campanha em tempo real
    async statusCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.id);
        const r = await Discador.statusCampanha(empresa,idCampanha)
        //console.log('Status Campanha',r)
        res.json(r)
    }
    //GRAFICO CAMPANHA
    //Status da evolucao do mailing na campanha
    async statusEvolucaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        let perc_trabalhados = 0
        let perc_contatados = 0
        let perc_naoContatados = 0
        let total=0
        let idMailing=0
        const idCampanha = parseInt(req.params.idCampanha)
        //Calcula a evolução da campanha com base no mailing ativo no momento
        const m = await Campanhas.totalMailingsCampanha(empresa,idCampanha)
        if(m.length>0){
            total=m[0].total
            idMailing=m[0].idMailing
        }
        //console.log('total registros',total)        
        const contatados = await Campanhas.mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,'S')
        const naoContatados = await Campanhas.mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,'N')
        const trabalhados = contatados + naoContatados 
        /*console.log('total contatados',contatados)  
        console.log('total naoContatados',naoContatados)  
        console.log('total trabalhados',trabalhados)  */ 
       
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
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const mailings = []
        const ma = await Campanhas.mailingsAnteriores(empresa,idCampanha)
        for(let i=0;i<ma.length;i++){
            const idMailing = ma[i].idMailing
            const info = await Mailing.infoMailingAtivo(empresa,idMailing)
            const produtivos = await Campanhas.mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,1)
            const improdutivos = await Campanhas.mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,0)
            const data =  await Campanhas.dataUltimoRegMailingNaCampanha(empresa,idCampanha,idMailing)
            let total = improdutivos+produtivos
            let nome = "Informações Removidas"
            if(info.length>0){               
                total=info[0].totalNumeros-info[0].numerosInvalidos
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
    //######################Operacoes básicas das campanhas (CRUD)
    //Criar Campanhas
    async criarCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const tipo  = req.body.tipo
        const nome = req.body.nome
        const descricao = req.body.descricao  
        const result = await Campanhas.criarCampanha(empresa,tipo,nome,descricao) 
        res.json(result)                
    }
    //Listar Campanhas
    async listarCampanhas(req,res){
        const empresa = await User.getEmpresa(req)
        const campanhas = await Campanhas.listarCampanhas(empresa)
        res.json(campanhas)                    
    }
    async listarCampanhasAtivas(req,res){
        const empresa = await User.getEmpresa(req)
        const campanhasAtivas = await Campanhas.listarCampanhasAtivas(empresa)
        res.json(campanhasAtivas)   
    }
    //Dados da campanha
    async dadosCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        const dadosCampanha = await Campanhas.dadosCampanha(empresa,idCampanha)
        res.json(dadosCampanha)    
    }
     //Atualizar campanha
     async atualizaCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        const valores = req.body       
        await Campanhas.atualizaCampanha(empresa,idCampanha,valores)
        if(valores.estado!=1){           
            await Discador.clearCallsCampanhas(empresa,idCampanha)
        }
        const agentesCampanhas = await Campanhas.membrosCampanhas(empresa,idCampanha)        
        for(let i=0; i<agentesCampanhas.length; i++){
            await Redis.delete(`${empresa}:campanhasAtivasAgente:${agentesCampanhas[i].ramal}`)
        }
        await Discador.atualizaStatus(empresa,idCampanha,'...',valores.estado)
        res.json(true)    
    }
     //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    //TABULAÇÕES
    //Lista de Tabulaçoes da campanha
    //Add lista na campanha
    async addListaTabulacaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idListaTabulacao = req.body.idListaTabulacao
        const r = await Campanhas.addListaTabulacaoCampanha(empresa,idCampanha,idListaTabulacao)
        res.json(true);
    }
     //Exibe as listas de tabulacao da Campanha
     async listasTabulacaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.params.idCampanha;
        const r = await Campanhas.listasTabulacaoCampanha(empresa,idCampanha)
        res.json(r);
    }
    //remove Lista tabulacao da campanha
    async removerListaTabulacaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idListaNaCampanha = req.params.idListaNaCampanha
        const r = await Campanhas.removerListaTabulacaoCampanha(empresa,idListaNaCampanha)
        res.json(true);
    }
    async setMaxTimeStatusTab(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const time= req.body.maxTime
        await Campanhas.setMaxTimeStatusTab(empresa,idCampanha,time)
        res.json(true);
    }
    async getMaxTimeStatusTab(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.params.idCampanha
        const time = await Campanhas.getMaxTimeStatusTab(empresa,idCampanha)
        res.json(time);
    }
    //INTEGRAÇÕES
    async criarIntegracao(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        await Campanhas.criarIntegracao(empresa,dados)
        res.json(true);
    }        
    async listarIntegracoes(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const listaIntegracoes = await Campanhas.listarIntegracoes(empresa)
        res.json(listaIntegracoes);
    }
    async dadosIntegracao(req,res){
        const empresa = await User.getEmpresa(req)
        const idIntegracao = parseInt(req.params.idIntegracao)      
        const dadosIntegracoes = await Campanhas.dadosIntegracao(empresa,idIntegracao)
        res.json(dadosIntegracoes);
    }
    async atualizarIntegracao(req,res){
        const empresa = await User.getEmpresa(req)
        const idIntegracao = parseInt(req.params.idIntegracao)
        const dados = req.body
        await Campanhas.atualizarIntegracao(empresa,idIntegracao,dados)
        res.json(true);
    }
    async removerIntegracao(req,res){
        const empresa = await User.getEmpresa(req)
        const idIntegracao = parseInt(req.params.idIntegracao)
        await Campanhas.removerIntegracao(empresa,idIntegracao)
        res.json(true);
    }
    async inserirIntegracaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        await Campanhas.inserirIntegracaoCampanha(empresa,dados)
        res.json(true);
    } 
    async listaIntegracaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const integracoesCampanha = await Campanhas.listaIntegracaoCampanha(empresa,idCampanha)
        res.json(integracoesCampanha);
    }

    async removerIntegracaoCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const idIntegracao = parseInt(req.params.idIntegracao)
        await Campanhas.removerIntegracaoCampanha(empresa,idCampanha,idIntegracao)
        res.json(true);
    }
    //DISCADOR
    //Configurar discador da campanha
    async configDiscadorCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const tipoDiscador = req.body.tipoDiscador
        const agressividade = req.body.agressividade
        const ordemDiscagem = req.body.ordemDiscagem
        const tipoDiscagem = req.body.tipoDiscagem
        const modo_atendimento = req.body.modo_atendimento
        const saudacao = req.body.saudacao
        const conf = await Campanhas.configDiscadorCampanha(empresa,idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,modo_atendimento,saudacao)
        res.json(conf);        
    }
    //Ver configuracoes do Discador
    async verConfigDiscadorCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);        
        const conf = await Campanhas.verConfigDiscadorCampanha(empresa,idCampanha)
        res.json(conf);
    }
    //FILAS
    //Lista as filas disponiveis
    async listarFilasDisponiveis(req,res){
        const empresa = await User.getEmpresa(req)
        const filas = await Campanhas.listarFilas(empresa)
        res.json(filas)
    }
    //Lista filas da campanha        
    async listarFilasCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const filasCampanha=[]
        const infoFilas = await Campanhas.listarFilasCampanha(empresa,idCampanha)
        for(let i=0;i<infoFilas.length; i++){
            const fila={}
                  fila['idFila']=infoFilas[i].idFila
                  fila['nomeFila']=`(${infoFilas[i].nomeFila}) - ${infoFilas[i].apelido}`
            filasCampanha.push(fila)
        }
        res.json(filasCampanha) 
    }
    //Adiciona a fila na campanha
    async addFilaCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        const infoFila=await Campanhas.dadosFila(empresa,idFila)
        
        if(infoFila.length>0){
            const nome=infoFila[0].nome//Apelido
            const nomeFila=infoFila[0].nomeFila//Nome Real da fila
            const r=await Campanhas.addFila(empresa,idCampanha,idFila,nome,nomeFila)
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
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idFila = req.body.idFila
        const result = await Campanhas.removerFilaCampanha(empresa,idCampanha,idFila)
        if(result.affectedRows==0){
            res.json(false)
            return false
        }
        res.json(true)               
    }
    //MAILING
    //Add mailing na campanha
    async addMailingCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const idMailing = req.body.idMailing
        const r = await Campanhas.addMailingCampanha(empresa,idCampanha,idMailing)
        res.json(r)
    }
    //Lista mailing da campanha
    async listarMailingCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const result = await Campanhas.listarMailingCampanha(empresa,idCampanha)
        res.json(result)
    }        
    //remove mailing da campanha
    async removeMailingCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const r = await Campanhas.removeMailingCampanha(empresa,idCampanha)
        res.json(r)
    }
    //Filtra os registros do mailing
    async filtrarDiscagem(req,res){
        const empresa = await User.getEmpresa(req)
        const parametros =  req.body
        const r = await Campanhas.filtrarRegistrosCampanha(empresa,parametros) 
        res.json(r)
    }

    //Exibe o status dos filtros
    async filtrosDiscagem(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.params.idCampanha
        const UF = req.params.uf
        const infoMailing = await Campanhas.infoMailingCampanha(empresa,idCampanha)
        if(infoMailing.length==0){
            res.json(false) 
            return false
        }
        const idMailing = infoMailing[0].id
        const tabelaNumero=infoMailing[0].tabela_numeros        
        //Total de Registros do uf
        const filters = {}
              filters['totalNumeros']=await Campanhas.totalNumeros(empresa,tabelaNumero,UF)
              filters['regFiltrados']=await Campanhas.numerosFiltrados(empresa,idMailing,tabelaNumero,idCampanha,UF)
        if(UF!=0){ 
            //Verificando filtros pelo DDD
            filters['DDD']=[]
            const listDDDs = await Campanhas.dddsMailings(empresa,tabelaNumero,UF)
            for(let i=0;i<listDDDs.length;i++){
                const ddd = {}
                      ddd['ddd']=listDDDs[i].ddd
                      ddd['numeros']=await Campanhas.totalNumeros(empresa,tabelaNumero,UF,listDDDs[i].ddd)
                      ddd['filtered']=await Campanhas.checkTypeFilter(empresa,idCampanha,'ddd',listDDDs[i].ddd,UF)
                filters['DDD'].push(ddd)               
            }
            //Verificando filtros pelo Tipo de Número
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await Campanhas.totalNumeros_porTipo(empresa,tabelaNumero,UF,'celular')
                  celular['filtered']=await Campanhas.checkTypeFilter(empresa,idCampanha,'tipo','celular',UF)
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await Campanhas.totalNumeros_porTipo(empresa,tabelaNumero,UF,'fixo')
                  fixo['filtered']=await Campanhas.checkTypeFilter(empresa,idCampanha,'tipo','fixo',UF)
            filters['TIPO'].push(fixo)  

            //Verificando filtros pelo UF
            filters['UF']=[]
            const ufs = {}
                  ufs['uf']=UF
                  ufs['numeros']=await Campanhas.totalNumeros(empresa,tabelaNumero,UF)
                  ufs['filtered']=await Campanhas.checkTypeFilter(empresa,idCampanha,'uf',UF,UF)
            filters['UF'].push(ufs) 
                  
        }else{
            filters['TIPO']=[]
            const celular = {}
                  celular['tipo']='celular'
                  celular['numeros']=await Campanhas.totalNumeros_porTipo(empresa,tabelaNumero,UF,'celular')
                  celular['filtered']=await Campanhas.checkTypeFilter(empresa,idCampanha,'tipo','celular',"")
            filters['TIPO'].push(celular)  
                 
            const fixo = {}
                  fixo['tipo']='fixo'
                  fixo['numeros']=await Campanhas.totalNumeros_porTipo(empresa,tabelaNumero,UF,'fixo')
                  fixo['filtered']=await Campanhas.checkTypeFilter(empresa,idCampanha,'tipo','fixo',"")
            filters['TIPO'].push(fixo)  
        }
        res.json(filters) 
    }
    //MAILING=>CONFIGURAR TELA DO AGENTE
    //Listar campos disponiveis que foram configurados no mailing  
    async listarCamposConfigurados(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await Campanhas.infoMailingCampanha(empresa,idCampanha)
        if(infoMailing.length==0){
            res.send(JSON.parse('{"erro":"Nenhum mailing encontrado na campanha"}'))
            return false
        }
        const idMailing = infoMailing[0].id
        const tabela = infoMailing[0].tabela_dados
        
        const campos = await Campanhas.camposConfiguradosDisponiveis(empresa,idMailing)      
        const camposConf=[]
        for(let i=0; i< campos.length; i++){
            camposConf[i]={}
            camposConf[i]['id']=campos[i].id 
            camposConf[i]['campo']=campos[i].campo 
            camposConf[i]['apelido']=campos[i].apelido 
            camposConf[i]['tipo']=campos[i].tipo 
            //Verificando se o campo esta adicionado na tela
            let selected=false
            if(await Campanhas.campoSelecionadoTelaAgente(empresa,campos[i].id,tabela,idCampanha)===true){
                selected = true
            }
            camposConf[i]['selecionado']=selected          
        }        
        res.json(camposConf)
    }
    //Marca campo como selecionado para exibir na tela do agente
    async adicionaCampo_telaAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha 
        const idCampo = req.body.idCampo
        const infoMailing = await Campanhas.infoMailingCampanha(empresa,idCampanha)
        const tabela =infoMailing[0].tabela_dados
        if(await Campanhas.campoSelecionadoTelaAgente(empresa,idCampo,tabela,idCampanha)===false){
            await Campanhas.addCampoTelaAgente(empresa,idCampanha,tabela,idCampo)
            res.send(true)
        }        
        res.send(false)
    }
    //Lista apenas os campos selecionados
    async listaCampos_telaAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const infoMailing = await Campanhas.infoMailingCampanha(empresa,idCampanha)
        if(infoMailing.length==0){
            res.send(false)
            return false
        }
        const tabela = infoMailing[0].tabela_dados
        const campos = await Campanhas.camposTelaAgente(empresa,idCampanha,tabela)
        res.send(campos)
    }
     //Desmarca o campo atual
     async removeCampo_telaAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const idCampo = parseInt(req.params.idCampo)
        await Campanhas.delCampoTelaAgente(empresa,idCampanha,idCampo)
        res.send(true)
    }
    //AGENDAMENTO
    //Agenda campanha
    async agendarCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.body.idCampanha
        const dI = req.body.data_inicio
        const dT = req.body.data_termino
        const hI = req.body.hora_inicio
        const hT = req.body.hora_termino
        const r = await Campanhas.agendarCampanha(empresa,idCampanha,dI,dT,hI,hT)
        res.json(r)
    }

    //ver agenda da campanha
    async verAgendaCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha);
        const r = await Campanhas.verAgendaCampanha(empresa,idCampanha)
        res.json(r)
    }
    //#########  P A U S A S          ############
    //######################PAUSAS ######################
    //Criar lista de pausas
    async criarListaPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await Pausas.novaLista(empresa,dados)
        res.json(r)
    }
    //Editar lista de pausas
    async editarListaPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = parseInt(req.params.id);
        const valores = req.body
        const r = await Pausas.editarListaPausa(empresa,idLista,valores)
        res.json(r)
    }
    //Ver dados da lista de pausas
    async dadosListaPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = parseInt(req.params.id);
        const r = await Pausas.dadosListaPausa(empresa,idLista)
        res.json(r)
    }
    //Ver todas as listas de pausas
    async listasPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const r = await Pausas.listasPausa(empresa)
        res.json(r)
    }
    //Criar nova pausa
    async criarPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const result = await Pausas.criarPausa(empresa,dados)
        res.json(result)
    }
    //Editar pausa
    async editarPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const id = parseInt(req.params.id);
        const valores = req.body
        const result = await Pausas.editarPausa(empresa,id,valores)
        res.json(result)        
    }
    async removerPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const id = parseInt(req.params.id);
        const result = await Pausas.removerPausa(empresa,id)
        res.json(result)       
    }
    //ver pausa
    async dadosPausa(req,res){
        const empresa = await User.getEmpresa(req)
        const id = parseInt(req.params.id);
        const result =  await Pausas.dadosPausa(empresa,id)
        res.json(result)        
    }
    //ver todas pausas de uma lista
    async listarPausas(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = 1
        const result = await Pausas.listarPausas(empresa,idLista)
        res.json(result)        
    } 
    //#########  F I L A S            ############
    async criarFila(req,res){
        const empresa = await User.getEmpresa(req)
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
        const eventmemberstatus='yes'
        const eventwhencalled='yes'
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
        const retry=1
        const ringinuse='yes'
        const servicelevel=60
        const strategy='leastrecent'
        const timeout=1
        const timeoutpriority='app'
        const timeoutrestart='no'
        const weight=0
        const wrapuptime=0
        const idEmpresa = await User.getAccountId(req)
        const f = await Campanhas.novaFila(empresa,idEmpresa,apelido,description)
        if(f==false){
            const rt={}
            rt['error']=true
            rt['message']=`Já existe uma fila criada com o nome '${nomeFila}'`
            res.send(rt)
            return false            
        }        
        const nomeFila = f
        const asterisk = await Filas.criarFila(empresa,nomeFila,musiconhold,monitorType,monitorFormat,announce_frequency,announce_holdtime,announce_position,autofill,eventmemberstatus,eventwhencalled,autopause,autopausebusy,autopausedelay,autopauseunavail,joinempty,leavewhenempty,maxlen,memberdelay,penaltymemberslimit,periodic_announce_frequency,queue_callswaiting,queue_thereare,queue_youarenext,reportholdtime,retry,ringinuse,servicelevel,strategy,timeout,timeoutpriority,timeoutrestart,weight,wrapuptime)
        res.send(asterisk)
    }
    async listarFilas(req,res){
        const empresa = await User.getEmpresa(req)
        const filas = await Campanhas.listarFilas(empresa)
        res.json(filas)
    }
    async dadosFila(req,res){
        const empresa = await User.getEmpresa(req)
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(empresa,idFila)
        res.json(dadosFila)
    }
    async configuracoesFila(req,res){
        const empresa = await User.getEmpresa(req)
        const idFila = req.params.idFila        
        const dadosFila = await Campanhas.dadosFila(empresa,idFila)
        const nomeFila=dadosFila[0].nome
        const configFila=await Filas.dadosFila(empresa,nomeFila)
        res.json(configFila)
    }
    async editarFila(req,res){
        const empresa = await User.getEmpresa(req)
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(empresa,idFila)
        const nomeFilaAtual=dadosFila[0].nome
        const dados = req.body
        await Campanhas.editarFila(empresa,idFila,dados)
        await Filas.editarNomeFila(empresa,nomeFilaAtual,dados.name)
        res.json(true)
    }
    async configurarFila(req,res){
        const empresa = await User.getEmpresa(req)
        const idFila = req.params.idFila
        const dadosFila = await Campanhas.dadosFila(empresa,idFila)
        const nomeFila=dadosFila[0].nome
        const configs = req.body
        await Filas.editarFila(empresa,nomeFila,configs)
        res.json(true)
    }
    async removerFila(req,res){
        const empresa = await User.getEmpresa(req)
        const idFila = req.params.idFila
        const nomeFila = await Campanhas.nomeFila(empresa,idFila)
        await Campanhas.removerFila(empresa,idFila)
        await Filas.removerFila(empresa,nomeFila)
        res.send(true)
    }    
    //#########  R E V I S A O   O K ############
}

export default new CampanhasController();