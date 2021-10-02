"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
//import util from 'util'


class Report{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async monitorarAgentes(empresa,parametros){
        const monitoramento=[]
        const idUser = parametros.idUser
        const idEquipe = parametros.idEquipe

        let filters=""
        //Checa se o usuario eh supervisor de alguma equipes
        let sql = `SELECT COUNT(id) as equipes
                     FROM ${empresa}_dados.users_equipes
                    WHERE supervisor=${idUser}`
        const es = await this.querySync(sql)
        if(es[0].equipes!=0){
            filters = ` AND eq.supervisor=${idUser} `
        }

        //filtra por equipe caso alguma tenha sido enviada
        if(idEquipe>0){
            filters = ` AND eq.id = ${idEquipe} `
        }

        sql = `SELECT us.id as ramal, us.nome, rm.estado as cod_estado, ea.estado, eq.equipe
                 FROM ${empresa}_dados.users AS us 
                 JOIN ${empresa}_dados.user_ramal AS rm ON rm.userID=us.id
                 JOIN ${empresa}_dados.estadosAgente AS ea ON ea.cod=rm.estado
            LEFT JOIN ${empresa}_dados.users_equipes AS eq ON eq.id=us.equipe
                WHERE us.status=1 ${filters} ORDER BY rm.datetime_estado DESC`
        const infoUsers = await this.querySync(sql)

        for(let i = 0; i < infoUsers.length; i++){
            const ramal = infoUsers[i].ramal
            const nome = infoUsers[i].nome
            const equipe = infoUsers[i].equipe
            const codEstado = infoUsers[i].cod_estado
            const estado = infoUsers[i].estado
            const agente={}
                  agente["ramal"]=ramal
                  agente["estado"]=estado
                  agente["cod_estado"]=codEstado
                  agente["equipe"]=equipe
                  agente["nome"]=nome

            const tempoStatus=await this.tempoEstadoAgente(empresa,ramal)
            const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
            const chamadasAtendidas=await _Discador2.default.chamadasAtendidas(empresa,ramal,hoje)
            const campanha=await _Discador2.default.listarCampanhasAtivasAgente(empresa,ramal)
            const TMT = await this.converteSeg_tempo(await _Cronometro2.default.tempoMedioAgente(empresa,ramal,'TMT',hoje))
            const TMA = await this.converteSeg_tempo(await _Cronometro2.default.tempoMedioAgente(empresa,ramal,'TMA',hoje))
            const TMO = await this.converteSeg_tempo(await _Cronometro2.default.tempoMedioAgente(empresa,ramal,'TMO',hoje))
            const produtivos = await _Discador2.default.chamadasProdutividadeDia_porAgente(empresa,1,ramal,hoje)
            const improdutivos = await _Discador2.default.chamadasProdutividadeDia_porAgente(empresa,0,ramal,hoje)

                  agente["tempoStatus"]=tempoStatus
                  agente["chamadasAtendidas"]=chamadasAtendidas
                  agente["campanha"]=campanha
                  agente["TMT"]=TMT
                  agente["TMA"]=TMA
                  agente["TMO"]=TMO
                  agente["produtivos"]=produtivos
                  agente["improdutivos"]=improdutivos
            monitoramento.push(agente)
        }
        return monitoramento
    }

    async tempoEstadoAgente(empresa,ramal){
        let tempo=0
        let sql = `SELECT TIMESTAMPDIFF (SECOND, datetime_estado, NOW()) as tempo
                     FROM ${empresa}_dados.user_ramal 
                    WHERE userId=${ramal}`
        const t = await this.querySync(sql)
        if(t.length>0){
            tempo=t[0].tempo
        }
        
        const tempoEstado = await this.converteSeg_tempo(tempo)
        return tempoEstado
    }

    async monitorarCampanhas(empresa,idCampanha){
        if(!idCampanha){
            return {}
        }

        //Informações da campanha
        let sql = `SELECT c.nome, s.estado,
                          DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,
                          DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio,
                          DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,
                          DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino
                     FROM ${empresa}_dados.campanhas AS c 
                     JOIN ${empresa}_dados.campanhas_horarios AS h ON c.id=h.id_campanha
                     JOIN ${empresa}_dados.campanhas_status AS s ON s.idCampanha=c.id
                WHERE c.id=${idCampanha}`
        const infoCampanha = await this.querySync(sql)




        const monitoramentoCampanha = {}
              monitoramentoCampanha["nomeDaCampanha"]=infoCampanha[0].nome
              monitoramentoCampanha["CampanhaRodando"]=infoCampanha[0].estado
              monitoramentoCampanha["DataCampanha"]=`${infoCampanha[0].dataInicio} - ${infoCampanha[0].dataTermino}`
              monitoramentoCampanha["ChamadasAtendidasNoTotal"]=0
              monitoramentoCampanha["TabulacaoDeVendasNoTotal"]=0
              monitoramentoCampanha["ChamadasEmAtendimento"]=0
              monitoramentoCampanha["ChamadasNãoAtendidas"]=0
              monitoramentoCampanha["Conversao"]="0%"
              monitoramentoCampanha["Cronograma"]=`${infoCampanha[0].horaInicio} - ${infoCampanha[0].horaTermino}`
              monitoramentoCampanha["TempoMedioDeAtendimento"]="00:00:00"

              monitoramentoCampanha["DadosCampanhaPorcentagem"]={}
              monitoramentoCampanha["DadosCampanhaPorcentagem"]["Trabalhado"]=0
              monitoramentoCampanha["DadosCampanhaPorcentagem"]["Produtivo"]=0
              monitoramentoCampanha["DadosCampanhaPorcentagem"]["Improdutivo"]=0

              monitoramentoCampanha["ConsolidadoDodia"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["total"]=0
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["labelChart"]=[]
              monitoramentoCampanha["ConsolidadoDodia"]["TotalDeChamadas"]["dataChart"]=[]

              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["total"]=0
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["labelChart"]=[]
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasCompletadasHoje"]["dataChart"]=[]

              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["total"]=0
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["labelChart"]=[]
              monitoramentoCampanha["ConsolidadoDodia"]["TabulacaoDeVendasHoje"]["dataChart"]=[]

              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]={}
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["total"]=0
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["labelChart"]=[]
              monitoramentoCampanha["ConsolidadoDodia"]["ChamadasAbandonadas"]["dataChart"]=[]

              monitoramentoCampanha["DadosAgente"]={}
              monitoramentoCampanha["DadosAgente"]["indisponiveis"]=0
              monitoramentoCampanha["DadosAgente"]["Disponiveis"]=0
              monitoramentoCampanha["DadosAgente"]["Falando"]=0
              monitoramentoCampanha["DadosAgente"]["Pausados"]=0
          
        return monitoramentoCampanha
        
    }





    
    
    async monitorarCampanhasOld(empresa,idCampanha,callback){
        if(idCampanha>=1){
            this.monitoramentoCampanhaIndividual(empresa,idCampanha,callback)
        }else{
            this.monitoramentoCampanhaGeral(empresa,callback)
        }
    }

    async monitoramentoCampanhaIndividual(empresa,idCampanha,callback){
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino 
                   FROM ${empresa}_dados.campanhas as c 
              LEFT JOIN ${empresa}_dados.campanhas_horarios AS h ON h.id_campanha=c.id 
                  WHERE c.estado=1 AND c.status=1 AND c.id=${idCampanha}`
        const rowsCampanhasAtivas = await this.querySync(sql) 
        if(rowsCampanhasAtivas.length==0){
            const monitoramentoCampanhaIndividual=false
            callback(null,monitoramentoCampanhaIndividual)
            return false
        }
        const monitoramentoCampanhaIndividual = {}

       
        monitoramentoCampanhaIndividual['nomeDaCampanha']=rowsCampanhasAtivas[0].nome

        //Status da campanha
        sql=`SELECT estado 
               FROM ${empresa}_dados.campanhas_status 
              WHERE idCampanha=${idCampanha}`
        const rowEstado = await this.querySync(sql)
        let estado = false
        if(rowEstado.length!=0){
            if(rowEstado[0].estado==1){
                estado=true
            }
        }
        monitoramentoCampanhaIndividual['CampanhaRodando']=estado
        monitoramentoCampanhaIndividual['DataCampanha']=`${rowsCampanhasAtivas[0].dataInicio} - ${rowsCampanhasAtivas[0].dataTermino}`
        
        sql=`SELECT COUNT(id) AS atendidas 
               FROM ${empresa}_dados.historico_atendimento
              WHERE campanha=${idCampanha} AND contatado='S'`
        const rowAtendidas = await this.querySync(sql)
        const atendidas=rowAtendidas[0].atendidas
        monitoramentoCampanhaIndividual['ChamadasAtendidasNoTotal']=atendidas

        sql=`SELECT s.id as statusVenda 
               FROM ${empresa}_dados.tabulacoes_status AS s 
               JOIN ${empresa}_dados.campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista 
              WHERE l.idCampanha=${idCampanha} AND s.venda=1 `
        const rowStatusVenda = await this.querySync(sql)
        let statusVenda=0
        let totalVendas=0
        if(rowStatusVenda.length!=0){
            statusVenda=rowStatusVenda[0].statusVenda
            sql=`SELECT COUNT(id) as totalVendas 
                   FROM ${empresa}_dados.historico_atendimento
                  WHERE status_tabulacao=${statusVenda} AND campanha=${idCampanha}`
            const rowVendas = await this.querySync(sql)
            totalVendas = rowVendas[0].totalVendas            
        }
        monitoramentoCampanhaIndividual['TabulacaoDeVendasNoTotal']=totalVendas
        

        sql=`SELECT COUNT(id) as emAtendimento 
               FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
              WHERE falando=1 AND id_campanha=${idCampanha}`
        const rowEmAtendimento = await this.querySync(sql)
        monitoramentoCampanhaIndividual['ChamadasEmAtendimento']=rowEmAtendimento[0].emAtendimento

        sql=`SELECT COUNT(id) AS naoAtendidas 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE campanha=${idCampanha} AND contatado='N'`
        const rowNaoAtendidas = await this.querySync(sql)
        monitoramentoCampanhaIndividual['ChamadasNãoAtendidas']=rowNaoAtendidas[0].naoAtendidas
        
        let conversao=0
        if(totalVendas>0){
            conversao = (totalVendas/atendidas)*100
        }
        
        monitoramentoCampanhaIndividual['Conversao']=`${conversao.toFixed(0)}%`
        monitoramentoCampanhaIndividual['Cronograma']=`${rowsCampanhasAtivas[0].horaInicio} - ${rowsCampanhasAtivas[0].horaTermino}`
        
        sql=`SELECT AVG(tempo_total) as TMA 
               FROM ${empresa}_dados.tempo_ligacao 
              WHERE idCampanha=${idCampanha}`
        const rowsTMA = await this.querySync(sql)  
        monitoramentoCampanhaIndividual['TempoMedioDeAtendimento']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']={}
        
        sql=`SELECT total,conectadas 
               FROM ${empresa}_dados.log_chamadas_simultaneas 
              ORDER BY id DESC LIMIT 12`        
        const rowsChamadasSimultaneas = await this.querySync(sql)          
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['Conectados']=[]
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas']=[]
        for(let i=0;i<rowsChamadasSimultaneas.length;i++){
            monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['Conectados'].push(rowsChamadasSimultaneas[0].conectadas)
            monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas'].push(rowsChamadasSimultaneas[0].total)
        
        }
    
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']={}

        sql=`SELECT SUM(m.totalReg) as totalRegistros 
               FROM ${empresa}_dados.mailings as m 
               JOIN ${empresa}_dados.campanhas_mailing AS c ON m.id=c.idMailing 
              WHERE idCampanha=${idCampanha}`        
        const rowsTotalMailing = await this.querySync(sql)     
        const totalRegistros = rowsTotalMailing[0].totalRegistros

        sql=`SELECT count(id) as trabalhados 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
              WHERE contatado='S' AND idCampanha=${idCampanha}`        
        const rowsTrabalhadas = await this.querySync(sql)  
        let trabalhados=0
        let produtivas=0
        let improdutivas=0
        if(rowsTrabalhadas>0){
           trabalhados = (rowsTrabalhadas[0].trabalhados/totalRegistros)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Trabalhado']=parseInt(trabalhados.toFixed(0))

        sql=`SELECT count(id) as produtivo 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
              WHERE contatado='S' AND produtivo=1 AND idCampanha=${idCampanha}`        
        const rowsProdutivas = await this.querySync(sql)  
        if(produtivas>0){   
        const produtivas = (rowsProdutivas[0].produtivo/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Produtivo']=parseInt(produtivas.toFixed(0))

        sql=`SELECT count(id) as improdutivas
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
              WHERE contatado='S' AND produtivo=0 AND idCampanha=${idCampanha}`        
        const rowsImprodutivas = await this.querySync(sql)   
        if(improdutivas>0){   
            improdutivas = (rowsImprodutivas[0].improdutivas/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Improdutivo']=parseInt(improdutivas.toFixed(0))

        
        monitoramentoCampanhaIndividual['ConsolidadoDodia']={}
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']={}

        sql=`SELECT COUNT(id) AS chamadas 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE data=date(now()) AND campanha=${idCampanha}`
        const rowsCallsHoje = await this.querySync(sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['total']=rowsCallsHoje[0].chamadas
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE data<>DATE(NOW()) AND campanha=${idCampanha} 
           GROUP BY data 
           ORDER BY data 
               DESC LIMIT 7`
        const rowsCallsLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['dataChart']=[]
        for(let i=0;i<rowsCallsLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['labelChart'].push(rowsCallsLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['dataChart'].push(rowsCallsLastWeeK[i].chamadas)
        }        

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND contatado='S' AND campanha=${idCampanha}`
        const rowsCompletedHoje = await this.querySync(sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['total']=rowsCompletedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE data<>DATE(NOW()) AND contatado='S' AND campanha=${idCampanha} 
           GROUP BY data 
           ORDER BY data DESC LIMIT 7`
        const rowsCompletedLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart']=[]
        for(let i=0;i<rowsCompletedLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart'].push(rowsCompletedLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart'].push(rowsCompletedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']={}        
        if(statusVenda==0){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=0
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
        }else{
            sql=`SELECT COUNT(id) AS total 
                   FROM ${empresa}_dados.historico_atendimento 
                  WHERE data=date(now()) AND status_tabulacao=${statusVenda} AND campanha=${idCampanha}`
            const rowsSalesHoje = await this.querySync(sql)   
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=rowsSalesHoje[0].total
            
            sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE data<>DATE(NOW()) AND status_tabulacao=${statusVenda} AND campanha=${idCampanha} 
                   GROUP BY data 
                   ORDER BY data DESC 
                   LIMIT 7`
            const rowsSalesLastWeeK = await this.querySync(sql) 
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
            for(let i=0;i<rowsSalesLastWeeK.length;i++){
                monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart'].push(rowsSalesLastWeeK[i].label)
                monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart'].push(rowsSalesLastWeeK[i].chamadas)
            }   
        }

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND obs_tabulacao='ABANDONOU FILA' AND campanha=${idCampanha}`
        const rowsAbandonedHoje = await this.querySync(sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['total']=rowsAbandonedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento
              WHERE data<>DATE(NOW()) AND obs_tabulacao='ABANDONOU FILA' AND campanha=${idCampanha} 
              GROUP BY data 
              ORDER BY data DESC 
              LIMIT 7`
        const rowsAbandonedLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart']=[]
        for(let i=0;i<rowsAbandonedLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart'].push(rowsAbandonedLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart'].push(rowsAbandonedLastWeeK[i].chamadas)
        }

        monitoramentoCampanhaIndividual['DadosAgente']={}
        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=4`
        const rowAgentesIndisponiveis = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['indisponiveis']=rowAgentesIndisponiveis[0].total

        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=1`
        const rowAgentesDisponiveis = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Disponiveis']=rowAgentesDisponiveis[0].total

        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=3`
        const rowAgentesFalando = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Falando']=rowAgentesFalando[0].total

        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=2`
        const rowAgentesPausados = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Pausados']=rowAgentesPausados[0].total      
       
       
        callback(null,monitoramentoCampanhaIndividual)
        
    }

    async monitoramentoCampanhaGeral(empresa,callback){
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino
                   FROM ${empresa}_dados.campanhas as c 
              LEFT JOIN ${empresa}_dados.campanhas_horarios AS h ON h.id_campanha=c.id
                  WHERE c.estado=1 AND c.status=1`
        const rowsCampanhasAtivas = await this.querySync(sql) 
        if(rowsCampanhasAtivas.length==0){
            const monitoramentoCampanhas=false
            callback(null,monitoramentoCampanhas)
            return false
        }
        const monitoramentoCampanhas = {}

       
        monitoramentoCampanhas['nomeDaCampanha']='Todas as campanhas'

        //Status da campanha       
        monitoramentoCampanhas['CampanhaRodando']=''
        monitoramentoCampanhas['DataCampanha']=''
        
        sql=`SELECT COUNT(id) AS atendidas 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE contatado='S'`
        const rowAtendidas = await this.querySync(sql)
        const atendidas=rowAtendidas[0].atendidas
        monitoramentoCampanhas['ChamadasAtendidasNoTotal']=atendidas

        sql=`SELECT s.id as statusVenda 
               FROM ${empresa}_dados.tabulacoes_status AS s 
               JOIN ${empresa}_dados.campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista 
               WHERE s.venda=1 `
        const rowStatusVenda = await this.querySync(sql)
        let statusVenda=0
        let totalVendas=0
        if(rowStatusVenda.length!=0){
            statusVenda=rowStatusVenda[0].statusVenda
            sql=`SELECT COUNT(id) as totalVendas 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE status_tabulacao=${statusVenda}`
            const rowVendas = await this.querySync(sql)
            totalVendas = rowVendas[0].totalVendas            
        }
        monitoramentoCampanhas['TabulacaoDeVendasNoTotal']=totalVendas


        sql=`SELECT COUNT(id) as emAtendimento 
               FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
               WHERE falando=1`
        const rowEmAtendimento = await this.querySync(sql)
        monitoramentoCampanhas['ChamadasEmAtendimento']=rowEmAtendimento[0].emAtendimento

        sql=`SELECT COUNT(id) AS naoAtendidas 
              FROM ${empresa}_dados.historico_atendimento 
              WHERE contatado='N'`
        const rowNaoAtendidas = await this.querySync(sql)
        monitoramentoCampanhas['ChamadasNãoAtendidas']=rowNaoAtendidas[0].naoAtendidas
        let conversao=0
        if(totalVendas>0){
            conversao = (totalVendas/atendidas)*100
        }
        monitoramentoCampanhas['Conversao']=`${conversao.toFixed(0)}%`
        monitoramentoCampanhas['Cronograma']=`${rowsCampanhasAtivas[0].horaInicio} - ${rowsCampanhasAtivas[0].horaTermino}`
        
        sql=`SELECT AVG(tempo_total) as TMA 
               FROM ${empresa}_dados.tempo_ligacao`
        const rowsTMA = await this.querySync(sql)  
        monitoramentoCampanhas['TempoMedioDeAtendimento']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']={}
        
        sql=`SELECT total,conectadas 
               FROM ${empresa}_dados.log_chamadas_simultaneas 
               ORDER BY id DESC 
               LIMIT 12`        
        const rowsChamadasSimultaneas = await this.querySync(sql)          
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['Conectados']=[]
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas']=[]
        for(let i=0;i<rowsChamadasSimultaneas.length;i++){
            monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['Conectados'].push(rowsChamadasSimultaneas[0].conectadas)
            monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas'].push(rowsChamadasSimultaneas[0].total)
        }
     
        monitoramentoCampanhas['DadosCampanhaPorcentagem']={}

        sql=`SELECT SUM(m.totalReg) as totalRegistros 
               FROM ${empresa}_dados.mailings as m 
               JOIN ${empresa}_dados.campanhas_mailing AS c ON m.id=c.idMailing`        
        const rowsTotalMailing = await this.querySync(sql)     
        const totalRegistros = rowsTotalMailing[0].totalRegistros

        sql=`SELECT count(id) as trabalhados 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
               WHERE contatado='S'`        
        const rowsTrabalhadas = await this.querySync(sql)  
        let trabalhados=0
        let produtivas=0
        let improdutivas=0
        if(trabalhados>0){
            trabalhados = (rowsTrabalhadas[0].trabalhados/totalRegistros)*100
        }    


        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Trabalhado']=parseInt(trabalhados.toFixed(0))

        sql=`SELECT count(id) as produtivo 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
               WHERE contatado='S' AND produtivo=1`        
        const rowsProdutivas = await this.querySync(sql)     
        if(produtivas>0){
            produtivas = (rowsProdutivas[0].produtivo/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Produtivo']=parseInt(produtivas.toFixed(0))

        sql=`SELECT count(id) as improdutivas 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
               WHERE contatado='S' AND produtivo=0`        
        const rowsImprodutivas = await this.querySync(sql)   
        if(improdutivas>0){
             improdutivas = (rowsImprodutivas[0].improdutivas/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Improdutivo']=parseInt(improdutivas.toFixed(0))
        
        monitoramentoCampanhas['ConsolidadoDodia']={}
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']={}

        sql=`SELECT COUNT(id) AS chamadas
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now())`
        const rowsCallsHoje = await this.querySync(sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['total']=rowsCallsHoje[0].chamadas
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data<>DATE(NOW()) 
               GROUP BY data 
               ORDER BY data DESC 
               LIMIT 7`
        const rowsCallsLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['dataChart']=[]
        for(let i=0;i<rowsCallsLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['labelChart'].push(rowsCallsLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['dataChart'].push(rowsCallsLastWeeK[i].chamadas)
        }        

        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND contatado='S'`
        const rowsCompletedHoje = await this.querySync(sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['total']=rowsCompletedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data<>DATE(NOW()) AND contatado='S' 
               GROUP BY data 
               ORDER BY data DESC 
               LIMIT 7`
        const rowsCompletedLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart']=[]
        for(let i=0;i<rowsCompletedLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart'].push(rowsCompletedLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart'].push(rowsCompletedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']={}
        if(statusVenda==0){
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=0
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
        }else{
            sql=`SELECT COUNT(id) AS total 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE data=date(now()) AND status_tabulacao=${statusVenda}`
            const rowsSalesHoje = await this.querySync(sql)   
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=rowsSalesHoje[0].total
            
            sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE data<>DATE(NOW()) AND status_tabulacao=${statusVenda} 
                   GROUP BY data 
                   ORDER BY data DESC LIMIT 7`
            const rowsSalesLastWeeK = await this.querySync(sql) 
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
            for(let i=0;i<rowsSalesLastWeeK.length;i++){
                monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart'].push(rowsSalesLastWeeK[i].label)
                monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart'].push(rowsSalesLastWeeK[i].chamadas)
            }   
        }         

        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND obs_tabulacao='ABANDONOU FILA'`
        const rowsAbandonedHoje = await this.querySync(sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['total']=rowsAbandonedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data<>DATE(NOW()) AND obs_tabulacao='ABANDONOU FILA' 
               GROUP BY data 
               ORDER BY data DESC 
               LIMIT 7`
        const rowsAbandonedLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart']=[]
        for(let i=0;i<rowsAbandonedLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart'].push(rowsAbandonedLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart'].push(rowsAbandonedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhas['DadosAgente']={}
        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=4`
        const rowAgentesIndisponiveis = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['indisponiveis']=rowAgentesIndisponiveis[0].total

        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=1`
        const rowAgentesDisponiveis = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['Disponiveis']=rowAgentesDisponiveis[0].total

        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=3`
        const rowAgentesFalando = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['Falando']=rowAgentesFalando[0].total

        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=2`
        const rowAgentesPausados = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['Pausados']=rowAgentesPausados[0].total      
       
       
        callback(null,monitoramentoCampanhas)
    }

    

   

    async restantes(idCampanha){
        return new Promise ((resolve,reject) =>{
            //Calculando tentativas e mailing da campanha
            const sql = `SELECT d.tentativas,m.id as idMailing,m.tabela,m.totalReg 
                           FROM campanhas_discador AS d JOIN campanhas_mailing AS cm ON cm.idCampanha=d.idCampanha 
                           JOIN mailings AS m ON m.id=cm.idMailing WHERE d.idCampanha=${idCampanha}`
            _dbConnection2.default.banco.query(sql,(e,rowDadosCampanha)=>{
                if(e) throw e
                const tentativas = rowDadosCampanha[0].tentativas
                const tabela = rowDadosCampanha[0].tabela
                const idMailing = rowDadosCampanha[0].idMailing
                const totalReg = rowDadosCampanha[0].totalReg
                //Contanto total de registros e registros com menos tentativas
                const sql = `SELECT COUNT(id_key_base) AS trabalhados 
                               FROM ${tabela} AS t 
                               LEFT JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS c ON c.idRegistro=t.id_key_base 
                               WHERE (c.idCampanha=${idCampanha} OR c.idCampanha IS NULL) AND (c.idMailing=${idMailing} OR c.idMailing IS NULL) AND c.tentativas>=${tentativas}`
                _dbConnection2.default.mailings.query(sql,(e,rowRestantes)=>{
                    
                    const trabalhados=rowRestantes[0].trabalhados
                    const saida = {totalReg:totalReg, trabalhados:trabalhados};
                    if(e)
                        return reject(e);
                
                    resolve(saida);
                })
            })
        })
    }

    async converteSeg_tempo(segundos_totais){
        return new Promise((resolve, reject)=>{
            let horas = Math.floor(segundos_totais / 3600);
            let minutos = Math.floor((segundos_totais - (horas * 3600)) / 60);
            let segundos = Math.floor(segundos_totais % 60);
            if(horas<=9){horas="0"+horas}
            if(minutos<=9){minutos="0"+minutos}
            if(segundos<=9){segundos="0"+segundos}

            const tempo =`${horas}:${minutos}:${segundos}`

            resolve(tempo);

        })
    }

    //REVISAR
    
    async filtroCampanhas(empresa){
        const sql = `SELECT id,nome 
                       FROM ${empresa}_dados.campanhas 
                      WHERE status=1 AND estado=1`
        return await this.querySync(sql)
    }
    
    async filtroEquipes(empresa){
        const sql = `SELECT id,equipe 
                       FROM ${empresa}_dados.users_equipes 
                      WHERE status=1`
        return await this.querySync(sql)
    }

    

    async criarRelatorio(empresa,data){
        const sql = `INSERT INTO ${empresa}_dados.report_info 
                                (data,nome,descricao,status) 
                         VALUES (NOW(),'${data.nome}','${data.descricao}',1) ` 
        return await this.querySync(sql)
    }

    async listarRelatorios(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_info 
                      WHERE status=1`;
        return await this.querySync(sql)
    }

    async infoRelatorio(empresa,idRelatorio){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_info 
                      WHERE id='${idRelatorio}'`;
        return await this.querySync(sql)
    }

    async editarRelatorio(empresa,idRelatorio,dados){
        const sql = `UPDATE ${empresa}_dados.report_info 
                        SET nome='${dados.nome}',
                            descricao='${dados.descricao}', 
                            status='${dados.status}' 
                      WHERE id='${idRelatorio}'`
        return await this.querySync(sql)
    }

    async addCampoDisponiveis(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.report_campos_disponiveis 
                                (campo,descricao,sintetico,charts,status) 
                         VALUES ('${dados.campo}','${dados.descricao}','${dados.sintetico}','${dados.charts}','${dados.status}')`
        return await this.querySync(sql)
    }

    async listCamposDisponiveis(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_campos_disponiveis`;
        return await this.querySync(sql)
    }

    async editarCampoDisponiveis(empresa,idCampoDisponivel,dados){
        const sql = `UPDATE ${empresa}_dados.report_campos_disponiveis 
                        SET campo='${dados.campo}',
                            descricao='${dados.descricao}',
                            sintetico='${dados.sintetico}',
                            charts='${dados.charts}',
                            status='${dados.status}' 
                      WHERE id='${idCampoDisponivel}'`
        return await this.querySync(sql)
    }

    async delCampoDisponiveis(empresa,idCampoDisponivel){
        const sql = `DELETE FROM ${empresa}_dados.report_campos_disponiveis 
                      WHERE id='${idCampoDisponivel}'`
        return await this.querySync(sql)
    }

    


    async addCampoRelatorio(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.report_campos 
                                (idreport,idcampo,sintetico,chart) 
                         VALUES ('${dados.idreport}','${dados.idcampo}','${dados.sintetico}','${dados.chart}')`
        return await this.querySync(sql)
    }

    async listarCamposRelatorio(empresa,idRelatorio){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_campos 
                      WHERE idreport=${idRelatorio}`;
        return await this.querySync(sql)
    }

    async infoCamposRelatorio(empresa,idCampoRelatorio){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_campos 
                      WHERE id=${idCampoRelatorio}`;
        return await this.querySync(sql)
    }
    
    async editCampoRelatorio(empresa,idCampoRelatorio,dados){
        const sql = `UPDATE ${empresa}_dados.report_campos 
                        SET sintetico='${dados.sintetico}', 
                            chart='${dados.chart}'
                      WHERE id='${idCampoRelatorio}'`
        return await this.querySync(sql)
    }
    
    async delCampoRelatorio(empresa,idCampoRelatorio){
        const sql = `DELETE FROM ${empresa}_dados.report_campos 
                      WHERE id='${idCampoRelatorio}'`
        return await this.querySync(sql)
    }




}
exports. default = new Report()