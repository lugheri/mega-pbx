"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _Gravacao = require('../models/Gravacao'); var _Gravacao2 = _interopRequireDefault(_Gravacao);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);

class ReportController{  
    async relatorioPausas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const equipe = req.body.equipe
        const logados = req.body.logados
        const pagina = req.body.pagina
        const status = req.body.status

        const relatorioPausas = []       
        const agentesAtivos = await _Report2.default.filtrarAgentes(empresa,0,0,status,false,ramal,equipe,logados,pagina)
       
        for(let i=0; i<agentesAtivos.length; i++){
            const agente = {}
            const idAgente = agentesAtivos[i].id
                  agente['Ramal']=idAgente
                  agente['Agente']=agentesAtivos[i].nome
                  //Listar pausas 
                  const pausas = await _Pausas2.default.listarPausas(empresa)
                  for(let p=0; p<pausas.length;p++){
                      const idPausa = pausas[p].id                     
                      const tempoPausa = await _Report2.default.calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,idAgente)
                      agente[`${pausas[p].nome}`] = await _Report2.default.converteSeg_tempo(tempoPausa)
                  }
            const totalPausasAgente = await _Report2.default.calculaTempoPausa(empresa,dataInicio,dataFinal,false,idAgente)
                  agente['Total']=await _Report2.default.converteSeg_tempo(totalPausasAgente)
            
            relatorioPausas.push(agente)
        }
        //Ultima Linha
        const linhaFinal = {}
              linhaFinal['Ramal']="Total"
              linhaFinal["Agente"]=""
              const pausas = await _Pausas2.default.listarPausas(empresa)
              for(let p=0; p<pausas.length;p++){
                const idPausa = pausas[p].id                     
                const tempoPausa = await _Report2.default.calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,false)
                linhaFinal[`${pausas[p].nome}`] = await _Report2.default.converteSeg_tempo(tempoPausa)
              }
        const totalPausas = await _Report2.default.calculaTempoPausa(empresa,dataInicio,dataFinal,false,false)
              linhaFinal["Total"]= await _Report2.default.converteSeg_tempo(totalPausas)
        
        relatorioPausas.push(linhaFinal)

        return res.json(relatorioPausas)
    }
    async detalhamentoChamadas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const equipe = req.body.ramal
        const campanha = req.body.campanha
        const mailing = req.body.mailing
        const numero = req.body.numero 
        const tipo = req.body.tipo         
        const contatados = req.body.contatados
        const produtivo = req.body.produtivo
        const tabulacao = req.body.tabulacao
        const pagina = req.body.pagina
        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")

        const detChamadas = []

        const chamadasSimultaneas = await _Report2.default.chamadasSimultaneas(empresa,dataInicio,dataFinal,hoje,ramal,equipe,campanha,mailing,numero)
        let status = "Encerrada"
        for(let i = 0;i<chamadasSimultaneas.length; i++) {            
            const callSim={}
                  callSim['ramal']=chamadasSimultaneas[i].ramal 
                  callSim['agente']=chamadasSimultaneas[i].nome
                  callSim['data']=chamadasSimultaneas[i].dataCall
                  callSim['hora']=chamadasSimultaneas[i].horaCall
                  callSim['duracao']=await _Report2.default.converteSeg_tempo(await _Report2.default.timeCall(empresa,chamadasSimultaneas[i].uniqueid))
                  callSim['campanha']=await _Campanhas2.default.nomeCampanhas(empresa,chamadasSimultaneas[i].id_campanha)
                  callSim['tipo']=chamadasSimultaneas[i].tipo_ligacao
                  callSim['telefone']=chamadasSimultaneas[i].numero
                  callSim['contatado']=""
                  callSim['produtivo']=""
                  callSim['tabulacao']=""
                  if(chamadasSimultaneas[i].falando==1){
                      status="Em Atendimento"
                  }else{
                     if((chamadasSimultaneas[i].desligada==1)||(chamadasSimultaneas[i].tabulando==1)||(chamadasSimultaneas[i].tabulado==1)){
                        status="Finalizando..."
                     }else{
                        status="Chamando..."
                     }
                  }
                  callSim['status']=status
                  let gravacao = " - "
                  const linkGrav = await _Gravacao2.default.linkByUniqueid(empresa,chamadasSimultaneas[i].uniqueid)
                  if(linkGrav!=0){ 
                    const server = await _Asterisk2.default.getDomain(empresa)
                    const pasta = linkGrav[0].date_record
                    
                    const arquivo = `${linkGrav[0].callfilename}.wav`
                    gravacao = `https://${server[0].ip}/api/gravacoes/${empresa}/${pasta}/${arquivo}`
                  }
                  callSim['gravacao']=gravacao
            detChamadas.push(callSim)
        }
        const chamadas = await _Report2.default.chamadasRealizadas(empresa,dataInicio,dataFinal,hoje,ramal,equipe,campanha,mailing,numero,tipo,contatados,produtivo,tabulacao,pagina)

        for(let i = 0;i<chamadas.length; i++) {
            const call={}
                  call['ramal']=chamadas[i].agente
                  call['agente']=chamadas[i].nome
                  call['data']=chamadas[i].dataCall
                  call['hora']=chamadas[i].hora
                  call['duracao']=await _Report2.default.converteSeg_tempo(await _Report2.default.timeCall(empresa,chamadas[i].uniqueid))
                  call['campanha']=await _Campanhas2.default.nomeCampanhas(empresa,chamadas[i].campanha)
                  call['tipo']=chamadas[i].tipo
                  call['telefone']=chamadas[i].numero_discado
                  if(chamadas[i].contatado==1){
                    call['contatado']='Sim'
                  }else{
                    call['contatado']='Não'
                  }
                  if(chamadas[i].produtivo==1){
                    call['produtivo']='Sim'
                  }else{
                    call['produtivo']='Não'
                  }                 
                  call['tabulacao']=await _Tabulacoes2.default.nomeStatus(empresa,chamadas[i].status_tabulacao) 
                  call['status']='Encerrada'
                  let gravacao = " - "
                  const linkGrav = await _Gravacao2.default.linkByUniqueid(empresa,chamadas[i].uniqueid)
                  if(linkGrav!=0){ 
                    const server = await _Asterisk2.default.getDomain(empresa)
                    const pasta = linkGrav[0].date_record
                    
                    const arquivo = `${linkGrav[0].callfilename}.wav`
                    gravacao = `https://${server[0].ip}/api/gravacoes/${empresa}/${pasta}/${arquivo}`
                  }
                  call['gravacao']=gravacao

            detChamadas.push(call)
        }
        res.json(detChamadas)
    }

    async monitoramentoAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const idCampanha = req.body.campanha
        const equipe = req.body.equipe
        const logados = req.body.logados
        const pagina = req.body.pagina
        const status = req.body.status

        const monitoramentoAgentes = []
        const agentesAtivos = await _Report2.default.filtrarAgentes(empresa,0,0,status,false,ramal,equipe,logados,pagina)
        for(let i=0; i<agentesAtivos.length; i++){
            const idAgente = agentesAtivos[i].id
            const infoUser = await _Report2.default.infoAgente(empresa,idAgente);
            const nome = infoUser[0].nome
            const equipe = infoUser[0].equipe
            const codEstado = infoUser[0].cod_estado
            const estado = infoUser[0].estado
            
            const agente={}
                  agente["ramal"]=idAgente
                 let estadoAgente = codEstado
                  if(codEstado==3){
                    const tabulando = await _Report2.default.statusTabulacaoChamada(empresa,idAgente)
                    if(tabulando==1){
                        estadoAgente=3.5
                    }

                }else if(codEstado==6){
                    const falando = await _Report2.default.statusAtendimentoChamada(empresa,idAgente)
                    if(falando==1){
                        estadoAgente=7
                    }
                }


                  agente["estado"]=estadoAgente
                  agente["cod_estado"]=codEstado
                  agente["equipe"]=equipe
                  agente["nome"]=nome
            let userCampanhas
            if((estado!=false)||(estado!="")){
                userCampanhas=true
            }else{      
                userCampanhas = await _Report2.default.usuarioCampanha(empresa,idAgente,idCampanha)
            }
            if(userCampanhas==true){
                const tempoStatus=await _Report2.default.tempoEstadoAgente(empresa,idAgente)
                const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
                const chamadasAtendidas=await _Report2.default.chamadasAtendidas(empresa,idAgente,idCampanha,dataInicio,dataFinal,hoje)
                const campanha = await _Discador2.default.listarCampanhasAtivasAgente(empresa,idAgente)
                const TMT = await _Report2.default.converteSeg_tempo(await _Report2.default.tempoMedioAgente(empresa,idAgente,'TMT',idCampanha,dataInicio,dataFinal,hoje))
                const TMA = await _Report2.default.converteSeg_tempo(await _Report2.default.tempoMedioAgente(empresa,idAgente,'TMA',idCampanha,dataInicio,dataFinal,hoje))
                const TMO = await _Report2.default.converteSeg_tempo(await _Report2.default.tempoMedioAgente(empresa,idAgente,'TMO',idCampanha,dataInicio,dataFinal,hoje))
                const produtivos = await _Report2.default.chamadasProdutividade(empresa,1,idAgente,idCampanha,dataInicio,dataFinal,hoje)
                const improdutivos = await _Report2.default.chamadasProdutividade(empresa,0,idAgente,idCampanha,dataInicio,dataFinal,hoje)

                    agente["tempoStatus"]=tempoStatus
                    agente["chamadasAtendidas"]=chamadasAtendidas
                    agente["campanha"]=campanha
                    agente["TMT"]=TMT
                    agente["TMA"]=TMA
                    agente["TMO"]=TMO
                    agente["produtivos"]=produtivos
                    agente["improdutivos"]=improdutivos

                monitoramentoAgentes.push(agente)
            }
        }
        res.json(monitoramentoAgentes)
    }

    async monitoramentoCampanhas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)

        const infoCampanha = await _Campanhas2.default.infoCampanha(empresa,idCampanha)
        if(infoCampanha.length==0){
            res.json({})
            return false
        }
        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
        const monitoramentoCampanha = {}
              monitoramentoCampanha["nomeDaCampanha"]=infoCampanha[0].nome
              monitoramentoCampanha["CampanhaRodando"]=infoCampanha[0].estado
              monitoramentoCampanha["DataCampanha"]=`${infoCampanha[0].dataInicio} - ${infoCampanha[0].dataTermino}`
              monitoramentoCampanha["ChamadasAtendidasNoTotal"]=await _Report2.default.chamadasAtendidasCampanha(empresa,idCampanha)
              monitoramentoCampanha["ChamadasProdutivasNoTotal"]=await _Report2.default.chamadasProdutivaCampanha(empresa,idCampanha)
              monitoramentoCampanha["ChamadasEmAtendimento"]=await _Report2.default.chamadasEmAtendimentoCampanha(empresa,idCampanha)
              monitoramentoCampanha["ChamadasNãoAtendidas"]=await _Report2.default.chamadasNaoAtendidasCampanha(empresa,idCampanha)
              monitoramentoCampanha["Contatados"]=await _Report2.default.chamadasContatadasCampanha(empresa,idCampanha)
              monitoramentoCampanha["Agressividade"]=await _Report2.default.agressividadeCampanha(empresa,idCampanha)
              monitoramentoCampanha["Cronograma"]=`${infoCampanha[0].horaInicio} - ${infoCampanha[0].horaTermino}`
              monitoramentoCampanha["TempoMedioDeAtendimento"]=await _Report2.default.converteSeg_tempo(await _Report2.default.TempoMedioDeAtendimentoCampanha(empresa,idCampanha))
              
              monitoramentoCampanha["DadosCampanhaPorcentagem"]={}

              let perc_trabalhados = 0
              let perc_produtivos = 0
              let perc_improdutivos = 0
              let total=0
              let idMailing=0

              const m = await _Campanhas2.default.totalMailingsCampanha(empresa,idCampanha)
              if(m.length>=0){
                  total=m[0].total
                  idMailing=m[0].idMailing
              }     
              const produtivo = await _Report2.default.mailingsProdutivosPorCampanha(empresa,idCampanha,idMailing,1)
              const Improdutivos = await _Report2.default.mailingsProdutivosPorCampanha(empresa,idCampanha,idMailing,0)
              const trabalhados = produtivo + Improdutivos  
                                        
             
              if(total!=0){
                  perc_trabalhados=Math.round((trabalhados / total)*100)
                  perc_produtivos=Math.round((produtivo / total)*100)
                  perc_improdutivos=Math.round((Improdutivos / total)*100)           
              }
              monitoramentoCampanha["DadosCampanhaPorcentagem"]["Trabalhado"]=perc_trabalhados
              monitoramentoCampanha["DadosCampanhaPorcentagem"]["Produtivo"]=perc_produtivos            
              monitoramentoCampanha["DadosCampanhaPorcentagem"]["Improdutivo"]=perc_improdutivos

              monitoramentoCampanha["ConsolidadoDodia"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["total"]=await _Report2.default.totalChamadasDia(empresa,idCampanha,hoje)
              
              const TotalDeChamadas_labelChart=[]
              const TotalDeChamadas_dataChart=[]              
              const TotalDeChamadas_resumo = await _Report2.default.totalChamadas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<TotalDeChamadas_resumo.length; i++){
                  const label = TotalDeChamadas_resumo[i].dataCall
                  TotalDeChamadas_labelChart.push(label)
                  const value = TotalDeChamadas_resumo[i].chamadas 
                  TotalDeChamadas_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["labelChart"]=TotalDeChamadas_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["dataChart"]=TotalDeChamadas_dataChart

              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["total"]= await _Report2.default.totalChamadasCompletadasDia(empresa,idCampanha,hoje)
              
              const ChamadasCompletadasHoje_labelChart=[]
              const ChamadasCompletadasHoje_dataChart=[]              
              const ChamadasCompletadas_resumo = await _Report2.default.ChamadasCompletadas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<ChamadasCompletadas_resumo.length; i++){
                  const label = ChamadasCompletadas_resumo[i].dataCall
                  ChamadasCompletadasHoje_labelChart.push(label)
                  const value = ChamadasCompletadas_resumo[i].chamadas 
                  ChamadasCompletadasHoje_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["labelChart"]=ChamadasCompletadasHoje_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["dataChart"]=ChamadasCompletadasHoje_dataChart

              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["total"]=await _Report2.default.totalTabulacoesVendaDia(empresa,idCampanha,hoje)
              
              const ChamadasVendasHoje_labelChart=[]
              const ChamadasVendasHoje_dataChart=[]              
              const ChamadasVendas_resumo = await _Report2.default.totalChamadasVendas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<ChamadasVendas_resumo.length; i++){
                  const label = ChamadasVendas_resumo[i].dataCall
                  ChamadasVendasHoje_labelChart.push(label)
                  const value = ChamadasVendas_resumo[i].chamadas 
                  ChamadasVendasHoje_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["labelChart"]=ChamadasVendasHoje_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["dataChart"]=ChamadasVendasHoje_dataChart

              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["total"]= await _Report2.default.totalChamadasAbandonadasDia(empresa,idCampanha,hoje)
              
              const ChamadasAbandonadasHoje_labelChart=[]
              const ChamadasAbandonadasHoje_dataChart=[]              
              const ChamadasAbandonadas_resumo = await _Report2.default.totalChamadasAbandonadas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<ChamadasAbandonadas_resumo.length; i++){
                  const label = ChamadasAbandonadas_resumo[i].dataCall
                  ChamadasAbandonadasHoje_labelChart.push(label)
                  const value = ChamadasAbandonadas_resumo[i].chamadas 
                  ChamadasAbandonadasHoje_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["labelChart"]=ChamadasAbandonadasHoje_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["dataChart"]=ChamadasAbandonadasHoje_dataChart

              monitoramentoCampanha["DadosAgente"]={}
              monitoramentoCampanha["DadosAgente"]["indisponiveis"]=await _Discador2.default.agentesPorEstado(empresa,1)
              monitoramentoCampanha["DadosAgente"]["Disponiveis"]=await _Discador2.default.agentesPorEstado(empresa,4)
              monitoramentoCampanha["DadosAgente"]["Falando"]=await _Discador2.default.agentesPorEstado(empresa,3)
              monitoramentoCampanha["DadosAgente"]["Pausados"]=await _Discador2.default.agentesPorEstado(empresa,2)
        res.send(monitoramentoCampanha);
    }

    async atualizaAgressividade(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha  = req.params.idCampanha
        const agressividade  = req.body.agressividade 
        await _Report2.default.atualizaAgressividade(empresa,idCampanha,agressividade)
        res.json(true)
    }

    async loginXLogout(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const estado = req.body.estado
        const equipe = req.body.equipe
        const logados = req.body.logados
        const pagina = req.body.pagina
        const status = req.body.status

        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")

        const loginLogout = []
        const agentes = await _Report2.default.filtrarAgentes(empresa,0,0,status,estado,ramal,equipe,logados,pagina)
        let de = hoje
        let ate = hoje

        if((dataInicio!=false)||(dataInicio!="")){de=dataInicio;}
        if((dataFinal!=false)||(dataFinal!="")){ate=dataFinal;}

        for(let i = 0; i <agentes.length; i++){
            const idAgente=agentes[i].id
           
            const login = await _Report2.default.dadosLogin(empresa,idAgente,de,ate,'login',0)
            for(let l=0; l<login.length;l++) {
                const llAgente = {}
                      llAgente["ramal"]=idAgente
                      llAgente["agente"]=agentes[i].nome
                let dataLogin = `${login[l].data} ${login[l].hora}`
                      llAgente["Login"]=_moment2.default.call(void 0, dataLogin, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")

                const logout = await _Report2.default.dadosLogin(empresa,idAgente,de,ate,'logout',login[l].id)
                let dataLogout = _moment2.default.call(void 0, ).format("YYYY-MM-DD HH:mm:ss")
                if(logout.length>0){
                    dataLogout = `${logout[0].data} ${logout[0].hora}`
                      llAgente["Logout"]=_moment2.default.call(void 0, dataLogout, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
                }else{
                      llAgente["Logout"]=" - "
                }
                      
                    const tl = _moment2.default.call(void 0, dataLogout,"YYYY-MM-DD HH:mm:ss").diff(_moment2.default.call(void 0, dataLogin,"YYYY-MM-DD HH:mm:ss"))
                    const tempoLogado = _moment2.default.duration(tl).asSeconds()
                        llAgente["Tempo Logado"]=await _Report2.default.converteSeg_tempo(tempoLogado)

                const tempoChamadasRecebidas = await _Report2.default.totalChamadasRecebidas(empresa,idAgente,dataLogin,dataLogout)
                      llAgente["Chamadas Recebidas"]=await _Report2.default.converteSeg_tempo(tempoChamadasRecebidas)

                const tempoChamadasRealizadas = await _Report2.default.totalChamadasRealizadas(empresa,idAgente,dataLogin,dataLogout)                      
                      llAgente["Chamadas Realizadas"]=await _Report2.default.converteSeg_tempo(tempoChamadasRealizadas)
                      
                const tempoEmChamadas=tempoChamadasRecebidas+tempoChamadasRealizadas
                      llAgente["Tempo em Chamada"]=await _Report2.default.converteSeg_tempo(tempoEmChamadas)

                const perc_servico = Math.floor((tempoEmChamadas/tempoLogado)*100)
                      llAgente["% de Serviço"]=`${perc_servico}%`
                
                      llAgente["Status"]=await _Report2.default.infoEstadoAgente(empresa,idAgente)
                loginLogout.push(llAgente)
            }
        }

        res.json(loginLogout)
    }







    


    

    

    

   
   







    async filtroAgentes(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const agentes = await _Report2.default.filtrarAgentes(empresa,0,0,1,false,0,0,false,1)
        res.json(agentes)
    }
    
    async filtroEquipes(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const equipes = await _Report2.default.filtroEquipes(empresa)
        res.json(equipes)
    }

    async filtroCampanhas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const campanhas = await _Report2.default.filtroCampanhas(empresa)
        res.json(campanhas)
    } 

    async filtroMailings(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const mailings = await _Report2.default.filtroMailings(empresa)
        res.json(mailings)
    } 
    

    


    
    
    async criarRelatorio(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const data = req.body
        const r = await _Report2.default.criarRelatorio(empresa,data)
        res.send(r);
    }

    async listarRelatorios(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const r = await _Report2.default.listarRelatorios(empresa)
        res.send(r);
    }

    async infoRelatorio(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idRelatorio = parseInt(req.params.idRelatorio)
        const r = await _Report2.default.infoRelatorio(empresa,idRelatorio)
        res.send(r);
    }

    async editarRelatorio(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idRelatorio = parseInt(req.params.idRelatorio)
        const dados = req.body
        const r = await _Report2.default.editarRelatorio(empresa,idRelatorio,dados)
        res.send(r);
    }

    async addCampoDisponiveis(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _Report2.default.addCampoDisponiveis(empresa,dados)
        res.send(r);
    }

    async listCamposDisponiveis(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const r = await _Report2.default.listCamposDisponiveis(empresa)
        res.send(r);
    }

    async editarCampoDisponiveis(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
        const dados = req.body
        const r = await _Report2.default.editarCampoDisponiveis(empresa,idCampoDisponivel,dados)
        res.send(r);
    }

    async delCampoDisponiveis(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
        const r = await _Report2.default.delCampoDisponiveis(empresa,idCampoDisponivel)
        res.send(r);
    }



    async addCampoRelatorio(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _Report2.default.addCampoRelatorio(empresa,dados)
        res.send(r);
    }

        async listarCamposRelatorio(req,res){
            const empresa = await _User2.default.getEmpresa(req)
            const idRelatorio = parseInt(req.params.idRelatorio)
            const r = await _Report2.default.listarCamposRelatorio(empresa,idRelatorio)
            res.send(r);
        }
    

        async infoCamposRelatorio(req,res){
            const empresa = await _User2.default.getEmpresa(req)
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const r = await _Report2.default.infoCamposRelatorio(empresa,idCampoRelatorio)
            res.send(r);
        }
    

        async editCampoRelatorio(req,res){
            const empresa = await _User2.default.getEmpresa(req)
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const dados = req.body
            const r = await _Report2.default.editCampoRelatorio(empresa,idCampoRelatorio,dados)
            res.send(r);
        }
    

        async delCampoRelatorio(req,res){
            const empresa = await _User2.default.getEmpresa(req)
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const r = await _Report2.default.delCampoRelatorio(empresa,idCampoRelatorio)
            res.send(r);
        }
    
}

exports. default = new ReportController();