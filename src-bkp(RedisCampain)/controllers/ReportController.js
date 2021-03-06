import Report from '../models/Report';
import Campanhas from '../models/Campanhas'
import Asterisk from '../models/Asterisk';
import Gravacao from '../models/Gravacao'
import User from '../models/User';
import Pausas from '../models/Pausas';
import moment from 'moment';
import Discador from '../models/Discador';
import Agente from '../models/Agente';
import Tabulacoes from '../models/Tabulacoes'
import Redis from '../Config/Redis'

class ReportController{  
    async relatorioPausas(req,res){
        const empresa = await User.getEmpresa(req)
        let dataInicio  = req.body.dataInicio
        let dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const equipe = req.body.equipe
        const logados = req.body.logados
        const pagina = req.body.pagina
        let registros = 20
        if(req.body.totalRegistro==false){
           registros = req.body.totalRegistro
        }
        const status = req.body.status
       
        if((dataInicio==false)||(dataInicio=="")){ dataInicio=moment().format("Y-MM-DD")}
        if((dataFinal==false)||(dataFinal=="")){ dataFinal=moment().format("Y-MM-DD");}

        const relatorioPausas = []  
        
        //Resumo Linha
        const linhaResumo = {}

        const totalPausas = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,false,false)
              linhaResumo['Total em pausa']= await Report.converteSeg_tempo(totalPausas)

        const pausas = await Pausas.listarPausas(empresa)
        for(let p=0; p<pausas.length;p++){
            const idPausa = pausas[p].id                     
            const tempoPausa = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,false)
              linhaResumo[`${pausas[p].nome}`] = await Report.converteSeg_tempo(tempoPausa)
        }
   
        relatorioPausas.push(linhaResumo)

        const agentesAtivos = await Report.filtrarAgentes(empresa,0,0,status,false,ramal,equipe,logados,pagina,registros)
        for(let i=0; i<agentesAtivos.length; i++){
            const agente = {}
            const idAgente = agentesAtivos[i].id
                  agente['Ramal']=idAgente
                  agente['Agente']=agentesAtivos[i].nome
                  //Listar pausas 
                  const pausas = await Pausas.listarPausas(empresa)
                  for(let p=0; p<pausas.length;p++){
                      const idPausa = pausas[p].id            
                      const tempoPausa = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,idAgente)
                      agente[`${pausas[p].nome}`] = await Report.converteSeg_tempo(tempoPausa)
                  }
            const totalPausasAgente = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,false,idAgente)
                  agente['Total']=await Report.converteSeg_tempo(totalPausasAgente)
            if(agente['Total']!='00:00:00'){
              relatorioPausas.push(agente)
            }
        }
       
        return res.json(relatorioPausas)
    }

    async loginXLogout(req,res){
        const empresa = await User.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const estado = req.body.estado
        const equipe = req.body.equipe
        const logados = req.body.logados
        const pagina = req.body.pagina
        let registros = 20
        if(req.body.totalRegistro==false){
           registros = req.body.totalRegistro
        }

        
        
        const status = req.body.status
        const hoje = moment().format("Y-MM-DD")
        const loginLogout = []
        const agentes = await Report.filtrarAgentes(empresa,0,0,status,estado,ramal,equipe,logados,pagina,registros)
        let de = hoje
        let ate = hoje
        if((dataInicio!=false)||(dataInicio!="")){de=dataInicio;}
        if((dataFinal!=false)||(dataFinal!="")){ate=dataFinal;}
        for(let i = 0; i <agentes.length; i++){
            const idAgente=agentes[i].id
            const login = await Report.dadosLogin(empresa,idAgente,de,ate,'login',0)
          
            for(let l=0; l<login.length;l++) {
                const llAgente = {}
                      llAgente["ramal"]=idAgente
                      llAgente["agente"]=agentes[i].nome
                let dataLogin = `${login[l].data} ${login[l].hora}`
                      llAgente["Login"]=moment(dataLogin, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")

                const logout = await Report.dadosLogin(empresa,idAgente,de,ate,'logout',login[l].id)
                let dataLogout = moment().format("YYYY-MM-DD HH:mm:ss")
                if(logout.length>0){
                    dataLogout = `${logout[0].data} ${logout[0].hora}`
                      llAgente["Logout"]=moment(dataLogout, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
                }else{
                      llAgente["Logout"]="Logado"
                }
                
                const tl = moment(dataLogout,"YYYY-MM-DD HH:mm:ss").diff(moment(dataLogin,"YYYY-MM-DD HH:mm:ss"))
                const tempoLogado = moment.duration(tl).asSeconds()
                      llAgente["Tempo Logado"]=await Report.converteSeg_tempo(tempoLogado)

                const tempoChamadasRecebidas = await Report.totalChamadasRecebidas(empresa,idAgente,dataLogin,dataLogout)
                      llAgente["Chamadas Recebidas"]=await Report.converteSeg_tempo(tempoChamadasRecebidas)

                const tempoChamadasRealizadas = await Report.totalChamadasRealizadas(empresa,idAgente,dataLogin,dataLogout)                      
                      llAgente["Chamadas Realizadas"]=await Report.converteSeg_tempo(tempoChamadasRealizadas)
                
                const tempoChamadasManuais = await Report.totalChamadasManuais(empresa,idAgente,dataLogin,dataLogout)                      
                      llAgente["Chamadas Manuais"]=await Report.converteSeg_tempo(tempoChamadasManuais)      
                      
                const tempoEmChamadas=tempoChamadasRecebidas+tempoChamadasRealizadas+tempoChamadasManuais
                      llAgente["Tempo em Chamada"]=await Report.converteSeg_tempo(tempoEmChamadas)

                const perc_servico = Math.floor((tempoEmChamadas/tempoLogado)*100)
                      llAgente["% de Servi??o"]=`${perc_servico}%`
                
                      llAgente["Status"]=await Report.infoEstadoAgente(empresa,idAgente)
                loginLogout.push(llAgente)
            }
        }
        res.json(loginLogout)
    }

    async monitoramentoAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const idCampanha = req.body.campanha
        const equipe = req.body.equipe
        const logados = req.body.logados
        const pagina = req.body.pagina
        let registros = 20
        if(req.body.totalRegistro==false){
           registros = req.body.totalRegistro
        }
        const status = req.body.status

        const monitoramentoAgentes = []
        const agentesAtivos = await Report.filtrarAgentes(empresa,0,0,status,false,ramal,equipe,logados,pagina,registros)
        for(let i=0; i<agentesAtivos.length; i++){
            const idAgente = agentesAtivos[i].id
            const infoUser = await Report.infoAgente(empresa,idAgente);
            const nome = infoUser[0].nome
            const equipe = infoUser[0].equipe
            const codEstado = infoUser[0].cod_estado
            const estado = infoUser[0].estado
            
            const agente={}
                  agente["ramal"]=idAgente                 
                let estadoAgente = codEstado
                let falando=0
                let desligada=0
                let tabulando=0
                let tabulada=0
                const status = await Report.statusTabulacaoAgente(empresa,idAgente)
                if(status!=0){
                   falando=status.event_falando
                   desligada=status.event_desligada
                   tabulando=status.event_tabulando
                   tabulada=status.event_tabulada
                }
                if(estadoAgente==3){                   
                  if((tabulando==1)||(desligada==1)){
                      estadoAgente=3.5
                  }
                  if((falando==0)&&(desligada==1)&&(tabulada==1)){
                      await Agente.alterarEstadoAgente(empresa,idAgente,1,0)
                  }
                }else if(estadoAgente==6){   
                      const falandoManual = await Report.statusAtendimentoChamadaManual(empresa,idAgente)                
                      if(falandoManual==1){
                          estadoAgente=7
                      }
                  }else if(estadoAgente==5){
                      if(tabulando==1){
                          estadoAgente=3.5
                      }
                      if(falando==1){
                          estadoAgente=3
                      }
                  }
                agente["estado"]=estadoAgente
                agente["cod_estado"]=codEstado
                agente["equipe"]=equipe
                agente["nome"]=nome
            let userCampanhas
            if((idCampanha==false)||(idCampanha=="")){
                userCampanhas=true
            }else{      
                userCampanhas = await Report.usuarioCampanha(empresa,idAgente,idCampanha)
            }
            if(userCampanhas==true){
                const estadoRamal = await Agente.statusRamal(empresa,idAgente)
                let tempo = 0       
                const now = moment(new Date());         
                const duration = moment.duration(now.diff(estadoRamal['hora']))
                tempo=await Report.converteSeg_tempo(duration.asSeconds()) 

               // const tempoStatus=await Report.tempoEstadoAgente(empresa,idAgente)
                const hoje = moment().format("Y-MM-DD")
                const chamadasAtendidas=await Report.chamadasAtendidas(empresa,idAgente,idCampanha,dataInicio,dataFinal,hoje)
                const campanha = await Discador.listarCampanhasAtivasAgente(empresa,idAgente)
                const TMT = await Report.converteSeg_tempo(await Report.tempoMedioAgente(empresa,idAgente,'TMT',idCampanha,dataInicio,dataFinal,hoje))
                const TMA = await Report.converteSeg_tempo(await Report.tempoMedioAgente(empresa,idAgente,'TMA',idCampanha,dataInicio,dataFinal,hoje))
                const TMO = await Report.converteSeg_tempo(await Report.tempoMedioAgente(empresa,idAgente,'TMO',idCampanha,dataInicio,dataFinal,hoje))
                const produtivos = await Report.chamadasProdutividade(empresa,1,idAgente,idCampanha,dataInicio,dataFinal,hoje)
                const improdutivos = await Report.chamadasProdutividade(empresa,0,idAgente,idCampanha,dataInicio,dataFinal,hoje)
                    agente["tempoStatus"]=tempo
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


    async detalhamentoTabulacoes(req,res){
        const empresa = await User.getEmpresa(req)
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
        let registros = 20
        if(req.body.totalRegistro==false){
           registros = req.body.totalRegistro
        }
        const hoje = moment().format("Y-MM-DD")
        const detalhamentoTabulacoes=[]
        const sinteticos = {}
        sinteticos['tabulacoes']= {}

        const sinteticosTabulacoes = await Report.sinteticosTabulacoes(empresa,dataInicio,dataFinal,hoje,ramal,equipe,campanha,mailing,numero,tipo,contatados,produtivo,tabulacao)
        for(let i = 0;i<sinteticosTabulacoes.length; i++) {
                const status = await Tabulacoes.nomeStatus(empresa,sinteticosTabulacoes[i].status_tabulacao) 
                  sinteticos['tabulacoes'][status]=sinteticosTabulacoes[i].total
           
        
        }

        detalhamentoTabulacoes.push(sinteticos)
        
        
        
        const chamadas = await Report.chamadasRealizadas(empresa,dataInicio,dataFinal,hoje,ramal,equipe,campanha,mailing,numero,tipo,contatados,produtivo,tabulacao,pagina,registros)
        for(let i = 0;i<chamadas.length; i++) {
            const call={}
                  call['ramal']=chamadas[i].agente
                  call['agente']=chamadas[i].nome
                  call['data']=chamadas[i].dataCall
                  call['hora']=chamadas[i].hora
                  call['campanha']=await Campanhas.nomeCampanhas(empresa,chamadas[i].campanha)
                  call['cliente']=chamadas[i].nome_registro
                  call['numero']=chamadas[i].numero_discado
                  if(chamadas[i].contatado=='S'){
                    call['contatado']='Sim'
                  }else{
                    call['contatado']='N??o'
                  }
                  if(chamadas[i].produtivo==1){
                    call['produtivo']='Sim'
                  }else{
                    call['produtivo']='N??o'
                  }       
                  if(chamadas[i].status_tabulacao==0){
                    call['tabulacao']=chamadas[i].obs_tabulacao
                    call['observacoes']="Tabula????o autom??tica"
                  }else{
                    call['tabulacao']=await Tabulacoes.nomeStatus(empresa,chamadas[i].status_tabulacao) 
                    call['observacoes']=chamadas[i].obs_tabulacao
                  }                 
            detalhamentoTabulacoes.push(call)
        }
        res.json(detalhamentoTabulacoes)
    }




    async detalhamentoChamadas(req,res){
        const empresa = await User.getEmpresa(req)
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
        let registros = 20
        if(req.body.totalRegistro==false){
           registros = req.body.totalRegistro
        }
        const hoje = moment().format("Y-MM-DD")
        const detChamadas=[]

        //console.log('\n','campanha',campanha)
        if(campanha){
            registros = 0 //Qtd Limit de registros
            const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
            //console.log("chamadasSimultaneas > > > ",chamadasSimultaneas)
            if((chamadasSimultaneas!=null)&&(chamadasSimultaneas.length>0)){
               
                
                const chamadasSimultaneasCampanha = chamadasSimultaneas.filter(chamada => chamada.id_campanha == campanha)
                const chamadasEmAtendimento = chamadasSimultaneasCampanha.filter(campanhas => campanhas.event_em_atendimento == 1) 
                const chamadasNaFila = chamadasSimultaneasCampanha.filter(campanhas => campanhas.event_na_fila == 1) 
                const chamadasAguardando = chamadasSimultaneasCampanha.filter(campanhas => campanhas.event_chamando == 1) 
                
                for(let i = 0;i<chamadasEmAtendimento.length; i++) { 
                    const callSim={}
                    callSim['ramal']=chamadasEmAtendimento[i].ramal 
                    callSim['agente']=''
                    callSim['data']=hoje
                    callSim['hora']=chamadasEmAtendimento[i].horario
                    callSim['duracao']=await Report.converteSeg_tempo(await Report.timeCall(empresa,chamadasEmAtendimento[i].uniqueid))
                    callSim['campanha']=await Campanhas.nomeCampanhas(empresa,campanha)
                    callSim['tipo']=chamadasEmAtendimento[i].tipo
                    callSim['telefone']=chamadasEmAtendimento[i].numero
                    callSim['contatado']=""
                    callSim['produtivo']=""
                    callSim['tabulacao']=""                 
                    callSim['status']=chamadasEmAtendimento[i].status
                    callSim['gravacao']="/"
                    detChamadas.push(callSim)      
                }

                for(let i = 0;i<chamadasNaFila.length; i++) {  
                    const callSim={}
                        callSim['ramal']=chamadasNaFila[i].ramal 
                        callSim['agente']=''
                        callSim['data']=hoje
                        callSim['hora']=chamadasNaFila[i].horario
                        callSim['duracao']='00:00:00'
                        callSim['campanha']=await Campanhas.nomeCampanhas(empresa,campanha)
                        callSim['tipo']=chamadasNaFila[i].tipo
                        callSim['telefone']=chamadasNaFila[i].numero
                        callSim['contatado']=""
                        callSim['produtivo']=""
                        callSim['tabulacao']=""                 
                        callSim['status']=chamadasNaFila[i].status
                        callSim['gravacao']="/"
                        detChamadas.push(callSim)      
                }     
                

                for(let i = 0;i<chamadasAguardando.length; i++) {  
                    const callSim={}
                        callSim['ramal']=chamadasAguardando[i].ramal 
                        callSim['agente']=''
                        callSim['data']=hoje
                        callSim['hora']=chamadasAguardando[i].horario
                        callSim['duracao']='00:00:00'
                        callSim['campanha']=await Campanhas.nomeCampanhas(empresa,campanha)
                        callSim['tipo']=chamadasAguardando[i].tipo
                        callSim['telefone']=chamadasAguardando[i].numero
                        callSim['contatado']=""
                        callSim['produtivo']=""
                        callSim['tabulacao']=""                 
                        callSim['status']=chamadasAguardando[i].status
                        callSim['gravacao']="/"
                        detChamadas.push(callSim)                     
                }
            }
        }
      
        const chamadas = await Report.chamadasRealizadas(empresa,dataInicio,dataFinal,hoje,ramal,equipe,campanha,mailing,numero,tipo,contatados,produtivo,tabulacao,pagina,registros)

        for(let i = 0;i<chamadas.length; i++) {
            const call={}
                  call['ramal']=chamadas[i].agente
                  call['agente']=chamadas[i].nome
                  call['data']=chamadas[i].dataCall
                  call['hora']=chamadas[i].hora
                  call['duracao']=await Report.converteSeg_tempo(await Report.timeCall(empresa,chamadas[i].uniqueid))
                  call['campanha']=await Campanhas.nomeCampanhas(empresa,chamadas[i].campanha)
                  call['tipo']=chamadas[i].tipo
                  call['telefone']=chamadas[i].numero_discado
                  if(chamadas[i].contatado=='S'){
                    call['contatado']='Sim'
                  }else{
                    call['contatado']='N??o'
                  }
                  if(chamadas[i].produtivo==1){
                    call['produtivo']='Sim'
                  }else{
                    call['produtivo']='N??o'
                  }                 
                  call['tabulacao']=await Tabulacoes.nomeStatus(empresa,chamadas[i].status_tabulacao) 
                  call['status']='Encerrada'
                  let gravacao = " - "
                  const linkGrav = await Gravacao.linkByUniqueid(empresa,chamadas[i].uniqueid)
                  if(linkGrav!=0){ 
                    const server = await Asterisk.getDomain(empresa)
                    const pasta = linkGrav[0].date_record
                    
                    const arquivo = `${linkGrav[0].callfilename}.wav`
                    gravacao = `https://${server[0].ip}/api/gravacoes/${empresa}/${pasta}/${arquivo}`
                  }
                  call['gravacao']=gravacao

            detChamadas.push(call)
        }
        //console.log('\n','detChamadas',detChamadas)
        res.json(detChamadas)
    }

    

    async monitoramentoCampanhas(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)

        const infoCampanha = await Campanhas.infoCampanha(empresa,idCampanha)
        if(infoCampanha.length==0){
            res.json({})
            return false
        }
        const hoje = moment().format("YYYY-MM-DD")
        const monitoramentoCampanha = {}
              monitoramentoCampanha["nomeDaCampanha"]=infoCampanha[0].nome
              monitoramentoCampanha["CampanhaRodando"]=infoCampanha[0].estado
              monitoramentoCampanha["DataCampanha"]=`${infoCampanha[0].dataInicio} - ${infoCampanha[0].dataTermino}`
              monitoramentoCampanha["ChamadasAtendidasNoTotal"]=await Report.chamadasAtendidasCampanha(empresa,idCampanha)
              monitoramentoCampanha["ChamadasProdutivasNoTotal"]=await Report.chamadasProdutivaCampanha(empresa,idCampanha)
              monitoramentoCampanha["ChamadasEmAtendimento"]=await Report.chamadasEmAtendimentoCampanha(empresa,idCampanha)
              monitoramentoCampanha["ChamadasN??oAtendidas"]=await Report.chamadasNaoAtendidasCampanha(empresa,idCampanha)
              monitoramentoCampanha["Contatados"]=await Report.chamadasContatadasCampanha(empresa,idCampanha)
              monitoramentoCampanha["Agressividade"]=await Report.agressividadeCampanha(empresa,idCampanha)
              monitoramentoCampanha["Cronograma"]=`${infoCampanha[0].horaInicio} - ${infoCampanha[0].horaTermino}`
              monitoramentoCampanha["TempoMedioDeAtendimento"]=await Report.converteSeg_tempo(await Report.TempoMedioDeAtendimentoCampanha(empresa,idCampanha))
              
              monitoramentoCampanha["DadosCampanhaPorcentagem"]={}

              let perc_trabalhados = 0
              let perc_produtivos = 0
              let perc_improdutivos = 0
              let total=0
              let idMailing=0

              const m = await Campanhas.totalMailingsCampanha(empresa,idCampanha)
              if(m.length>=0){
                  total=m[0].total
                  idMailing=m[0].idMailing
              }     
              const produtivo = await Report.mailingsProdutivosPorCampanha(empresa,idCampanha,idMailing,1)
              const Improdutivos = await Report.mailingsProdutivosPorCampanha(empresa,idCampanha,idMailing,0)
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
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["total"]=await Report.totalChamadasDia(empresa,idCampanha,hoje)
              
              const TotalDeChamadas_labelChart=[]
              const TotalDeChamadas_dataChart=[]              
              const TotalDeChamadas_resumo = await Report.totalChamadas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<TotalDeChamadas_resumo.length; i++){
                  const label = TotalDeChamadas_resumo[i].dataCall
                  TotalDeChamadas_labelChart.push(label)
                  const value = TotalDeChamadas_resumo[i].chamadas 
                  TotalDeChamadas_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["labelChart"]=TotalDeChamadas_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["dataChart"]=TotalDeChamadas_dataChart

              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["total"]= await Report.totalChamadasCompletadasDia(empresa,idCampanha,hoje)
              
              const ChamadasCompletadasHoje_labelChart=[]
              const ChamadasCompletadasHoje_dataChart=[]              
              const ChamadasCompletadas_resumo = await Report.ChamadasCompletadas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<ChamadasCompletadas_resumo.length; i++){
                  const label = ChamadasCompletadas_resumo[i].dataCall
                  ChamadasCompletadasHoje_labelChart.push(label)
                  const value = ChamadasCompletadas_resumo[i].chamadas 
                  ChamadasCompletadasHoje_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["labelChart"]=ChamadasCompletadasHoje_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["dataChart"]=ChamadasCompletadasHoje_dataChart

              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["total"]=await Report.totalTabulacoesVendaDia(empresa,idCampanha,hoje)
              
              const ChamadasVendasHoje_labelChart=[]
              const ChamadasVendasHoje_dataChart=[]              
              const ChamadasVendas_resumo = await Report.totalChamadasVendas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<ChamadasVendas_resumo.length; i++){
                  const label = ChamadasVendas_resumo[i].dataCall
                  ChamadasVendasHoje_labelChart.push(label)
                  const value = ChamadasVendas_resumo[i].chamadas 
                  ChamadasVendasHoje_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["labelChart"]=ChamadasVendasHoje_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["dataChart"]=ChamadasVendasHoje_dataChart

              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["total"]= await Report.totalChamadasAbandonadasDia(empresa,idCampanha,hoje)
              
              const ChamadasAbandonadasHoje_labelChart=[]
              const ChamadasAbandonadasHoje_dataChart=[]              
              const ChamadasAbandonadas_resumo = await Report.totalChamadasAbandonadas_UltimosDias(empresa,idCampanha,hoje)
              for(let i=0; i<ChamadasAbandonadas_resumo.length; i++){
                  const label = ChamadasAbandonadas_resumo[i].dataCall
                  ChamadasAbandonadasHoje_labelChart.push(label)
                  const value = ChamadasAbandonadas_resumo[i].chamadas 
                  ChamadasAbandonadasHoje_dataChart.push(value)
              }
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["labelChart"]=ChamadasAbandonadasHoje_labelChart
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["dataChart"]=ChamadasAbandonadasHoje_dataChart

              monitoramentoCampanha["DadosAgente"]={}
              monitoramentoCampanha["DadosAgente"]["indisponiveis"]=await Discador.agentesPorEstado(empresa,1)
              monitoramentoCampanha["DadosAgente"]["Disponiveis"]=await Discador.agentesPorEstado(empresa,4)
              monitoramentoCampanha["DadosAgente"]["Falando"]=await Discador.agentesPorEstado(empresa,3)
              monitoramentoCampanha["DadosAgente"]["Pausados"]=await Discador.agentesPorEstado(empresa,2)
        res.send(monitoramentoCampanha);
    }



    
    async atualizaAgressividade(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha  = req.params.idCampanha
        const agressividade  = req.body.agressividade 
        await Report.atualizaAgressividade(empresa,idCampanha,agressividade)
        res.json(true)
    }

    







    


    

    

    

   
   







    async filtroAgentes(req,res){
        const empresa = await User.getEmpresa(req)
        const agentes = await Report.filtrarAgentes(empresa,0,0,1,false,0,0,false,1,30)
        res.json(agentes)
    }
    
    async filtroEquipes(req,res){
        const empresa = await User.getEmpresa(req)
        const equipes = await Report.filtroEquipes(empresa)
        res.json(equipes)
    }

    async filtroCampanhas(req,res){
        const empresa = await User.getEmpresa(req)
        const campanhas = await Report.filtroCampanhas(empresa)
        res.json(campanhas)
    } 

    async filtroMailings(req,res){
        const empresa = await User.getEmpresa(req)
        const mailings = await Report.filtroMailings(empresa)
        res.json(mailings)
    } 
    

    


    
    
    async criarRelatorio(req,res){
        const empresa = await User.getEmpresa(req)
        const data = req.body
        const r = await Report.criarRelatorio(empresa,data)
        res.send(r);
    }

    async listarRelatorios(req,res){
        const empresa = await User.getEmpresa(req)
        const r = await Report.listarRelatorios(empresa)
        res.send(r);
    }

    async infoRelatorio(req,res){
        const empresa = await User.getEmpresa(req)
        const idRelatorio = parseInt(req.params.idRelatorio)
        const r = await Report.infoRelatorio(empresa,idRelatorio)
        res.send(r);
    }

    async editarRelatorio(req,res){
        const empresa = await User.getEmpresa(req)
        const idRelatorio = parseInt(req.params.idRelatorio)
        const dados = req.body
        const r = await Report.editarRelatorio(empresa,idRelatorio,dados)
        res.send(r);
    }

    async addCampoDisponiveis(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await Report.addCampoDisponiveis(empresa,dados)
        res.send(r);
    }

    async listCamposDisponiveis(req,res){
        const empresa = await User.getEmpresa(req)
        const r = await Report.listCamposDisponiveis(empresa)
        res.send(r);
    }

    async editarCampoDisponiveis(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
        const dados = req.body
        const r = await Report.editarCampoDisponiveis(empresa,idCampoDisponivel,dados)
        res.send(r);
    }

    async delCampoDisponiveis(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
        const r = await Report.delCampoDisponiveis(empresa,idCampoDisponivel)
        res.send(r);
    }



    async addCampoRelatorio(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await Report.addCampoRelatorio(empresa,dados)
        res.send(r);
    }

        async listarCamposRelatorio(req,res){
            const empresa = await User.getEmpresa(req)
            const idRelatorio = parseInt(req.params.idRelatorio)
            const r = await Report.listarCamposRelatorio(empresa,idRelatorio)
            res.send(r);
        }
    

        async infoCamposRelatorio(req,res){
            const empresa = await User.getEmpresa(req)
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const r = await Report.infoCamposRelatorio(empresa,idCampoRelatorio)
            res.send(r);
        }
    

        async editCampoRelatorio(req,res){
            const empresa = await User.getEmpresa(req)
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const dados = req.body
            const r = await Report.editCampoRelatorio(empresa,idCampoRelatorio,dados)
            res.send(r);
        }
    

        async delCampoRelatorio(req,res){
            const empresa = await User.getEmpresa(req)
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const r = await Report.delCampoRelatorio(empresa,idCampoRelatorio)
            res.send(r);
        }
    
}

export default new ReportController();