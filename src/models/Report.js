import connect from '../Config/dbConnection';
//import util from 'util'


class Report{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    async monitorarAgentes(idCampanha,idEquipe,idUser){         
        let filter = ""
        if(idCampanha){
            filter += ` AND cf.idCampanha = ${idCampanha} `
        }
        if(idEquipe){
            filter += ` AND ue.id = ${idEquipe} `
        }

        //Verifica se o usuario eh supervisor de alguma equipe        
        let sql=`SELECT nivelAcesso FROM users WHERE id=${idUser}`
        const rowsVerificaNivel = await this.querySync(sql)
        if(rowsVerificaNivel[0].nivelAcesso==2){
            sql = `SELECT COUNT(id) as equipes FROM users_equipes WHERE supervisor=${idUser}`
            const rowsVerificaSup = await this.querySync(sql)
            if(rowsVerificaSup[0].equipes!=0){
                filter += ` AND ue.supervisor = ${idUser} `
            }
        }

        sql=`SELECT DISTINCT ur.ramal,
                             ea.estado,
                             ur.estado as cod_estado,
                             ue.equipe,
                             us.nome 
                        FROM user_ramal AS ur 
                        JOIN users AS us ON ur.userId=us.id 
                        JOIN users_equipes AS ue ON ue.id=us.equipe 
                        LEFT JOIN estadosAgente AS ea ON ur.estado=ea.cod 
                        LEFT JOIN agentes_filas AS af ON af.ramal=us.id 
                        LEFT JOIN campanhas_filas AS cf ON af.fila=cf.id 
                       WHERE 1=1 ${filter}`
        const rowsAgentes = await this.querySync(sql)            
          
        for(let k in rowsAgentes){
            //QUANTIDADE
            filter=""
            if(idCampanha){
                filter = ` AND campanha = ${idCampanha} `
            }
            let ramal= rowsAgentes[k].ramal
            let codEstado = rowsAgentes[k].cod_estado
            rowsAgentes[k]['tempoStatus'] = await this.tempoEstadoAgente(ramal,codEstado)
                
            let sql = `SELECT COUNT(id) as total 
                         FROM historico_atendimento
                        WHERE agente=${rowsAgentes[k].ramal} ${filter}`
            const rowsQTD = await this.querySync(sql);
            rowsAgentes[k]['quantidade']=rowsQTD[0].total
              
            //CAMPANHA
            if(idCampanha){
                filter = ` AND h.campanha = ${idCampanha} `
            }
            sql = `SELECT h.campanha, c.nome as nomeCampanha 
                     FROM historico_atendimento AS h 
                LEFT JOIN campanhas AS c ON c.id=h.campanha 
                    WHERE h.agente=${rowsAgentes[k].ramal} ${filter} 
                    ORDER BY h.id DESC LIMIT 1`
            const rowsCampanha = await this.querySync(sql);
            let nomeCampanha="";
            if(rowsCampanha.length==1){
                nomeCampanha = rowsCampanha[0].nomeCampanha
            }
            rowsAgentes[k]['campanha']=nomeCampanha
                
            //TMT
            if(idCampanha){
                filter = ` AND idCampanha = ${idCampanha} `
            }
            sql=`SELECT AVG(tempo_total) as TMT 
                   FROM tempo_tabulacao WHERE idAgente=${rowsAgentes[k].ramal} ${filter}`
            const rowsTMT = await this.querySync(sql)    
            rowsAgentes[k]['TMT']=await this.converteSeg_tempo(rowsTMT[0].TMT)  
                
            //TMA
            sql=`SELECT AVG(tempo_total) as TMA 
                   FROM tempo_ligacao WHERE idAgente=${rowsAgentes[k].ramal} ${filter}`
            const rowsTMA = await this.querySync(sql)    
            rowsAgentes[k]['TMA']=await this.converteSeg_tempo(rowsTMA[0].TMA)
                
            //TMO
            sql=`SELECT AVG(tempo_total) as TMO 
                   FROM tempo_espera WHERE idAgente=${rowsAgentes[k].ramal} ${filter}`
            const rowsTMO = await this.querySync(sql)  
            rowsAgentes[k]['TMO']=await this.converteSeg_tempo(rowsTMO[0].TMO)
                
            //PRODUTIVAS
            sql=`SELECT COUNT(id) as produtivos 
                   FROM mailings.campanhas_tabulacao_mailing 
                  WHERE agente=${rowsAgentes[k].ramal} AND produtivo=1 ${filter}`
            const rowsProdutivos = await this.querySync(sql)  
            rowsAgentes[k]['produtivos']=rowsProdutivos[0].produtivos
                
            //IMPRODUTIVAS
            sql=`SELECT COUNT(id) as improdutivos 
                   FROM mailings.campanhas_tabulacao_mailing 
                  WHERE agente=${rowsAgentes[k].ramal} AND produtivo!=1 ${filter}`
            const rowsImprodutivos = await this.querySync(sql)  
            rowsAgentes[k]['improdutivos']=rowsImprodutivos[0].improdutivos

            let statusVenda=0
            let totalVendas=0
            if(idCampanha){
                sql=`SELECT s.id as statusVenda 
                      FROM tabulacoes_status AS s 
                      JOIN campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista 
                      WHERE l.idCampanha=${idCampanha} AND s.venda=1 `
                const rowStatusVenda = await this.querySync(sql)
                if(rowStatusVenda.length!=0){
                    statusVenda=rowStatusVenda[0].statusVenda
                    sql=`SELECT COUNT(id) as totalVendas 
                          FROM historico_atendimento 
                          WHERE status_tabulacao=${statusVenda} AND campanha=${idCampanha} AND agente=${rowsAgentes[k].ramal}`
                    const rowVendas = await this.querySync(sql)
                    totalVendas = rowVendas[0].totalVendas            
                }
            }else{
                sql=`SELECT id as statusVenda FROM tabulacoes_status WHERE venda=1`
                const rowStatusVenda = await this.querySync(sql)
                if(rowStatusVenda.length!=0){
                    statusVenda=rowStatusVenda[0].statusVenda
                    sql=`SELECT COUNT(id) as totalVendas FROM historico_atendimento WHERE status_tabulacao=${statusVenda} AND agente=${rowsAgentes[k].ramal}`
                    const rowVendas = await this.querySync(sql)
                    totalVendas = rowVendas[0].totalVendas            
                }
            }    

            let conversao=0
            if(totalVendas>0){
                conversao = (totalVendas/rowsProdutivos[0].produtivos)*100
            }
            rowsAgentes[k]['totalVendas']=totalVendas
            rowsAgentes[k]['conversao']=conversao
        }
        return rowsAgentes         
    }  

    
    
    async monitorarCampanhas(idCampanha,callback){
        if(idCampanha>=1){
            this.monitoramentoCampanhaIndividual(idCampanha,callback)
        }else{
            this.monitoramentoCampanhaGeral(callback)
        }
    }

    async monitoramentoCampanhaIndividual(idCampanha,callback){
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino FROM campanhas as c LEFT JOIN campanhas_horarios AS h ON h.id_campanha=c.id WHERE c.estado=1 AND c.status=1 AND c.id=${idCampanha}`
        const rowsCampanhasAtivas = await this.querySync(sql) 
        if(rowsCampanhasAtivas.length==0){
            const monitoramentoCampanhaIndividual=false
            callback(null,monitoramentoCampanhaIndividual)
            return false
        }
        const monitoramentoCampanhaIndividual = {}

       
        monitoramentoCampanhaIndividual['nomeDaCampanha']=rowsCampanhasAtivas[0].nome

        //Status da campanha
        sql=`SELECT estado FROM campanhas_status WHERE idCampanha=${idCampanha}`
        const rowEstado = await this.querySync(sql)
        let estado = false
        if(rowEstado.length!=0){
            if(rowEstado[0].estado==1){
                estado=true
            }
        }
        monitoramentoCampanhaIndividual['CampanhaRodando']=estado
        monitoramentoCampanhaIndividual['DataCampanha']=`${rowsCampanhasAtivas[0].dataInicio} - ${rowsCampanhasAtivas[0].dataTermino}`
        
        sql=`SELECT COUNT(id) AS atendidas FROM historico_atendimento WHERE campanha=${idCampanha} AND contatado='S'`
        const rowAtendidas = await this.querySync(sql)
        const atendidas=rowAtendidas[0].atendidas
        monitoramentoCampanhaIndividual['ChamadasAtendidasNoTotal']=atendidas

        sql=`SELECT s.id as statusVenda FROM tabulacoes_status AS s 
            JOIN campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista 
            WHERE l.idCampanha=${idCampanha} AND s.venda=1 `
        const rowStatusVenda = await this.querySync(sql)
        let statusVenda=0
        let totalVendas=0
        if(rowStatusVenda.length!=0){
            statusVenda=rowStatusVenda[0].statusVenda
            sql=`SELECT COUNT(id) as totalVendas FROM historico_atendimento WHERE status_tabulacao=${statusVenda} AND campanha=${idCampanha}`
            const rowVendas = await this.querySync(sql)
            totalVendas = rowVendas[0].totalVendas            
        }
        monitoramentoCampanhaIndividual['TabulacaoDeVendasNoTotal']=totalVendas
        

        sql=`SELECT COUNT(id) as emAtendimento FROM campanhas_chamadas_simultaneas WHERE falando=1 AND id_campanha=${idCampanha}`
        const rowEmAtendimento = await this.querySync(sql)
        monitoramentoCampanhaIndividual['ChamadasEmAtendimento']=rowEmAtendimento[0].emAtendimento

        sql=`SELECT COUNT(id) AS naoAtendidas FROM historico_atendimento WHERE campanha=${idCampanha} AND contatado='N'`
        const rowNaoAtendidas = await this.querySync(sql)
        monitoramentoCampanhaIndividual['ChamadasNãoAtendidas']=rowNaoAtendidas[0].naoAtendidas
        
        let conversao=0
        if(totalVendas>0){
            conversao = (totalVendas/atendidas)*100
        }
        
        monitoramentoCampanhaIndividual['Conversao']=`${conversao.toFixed(0)}%`
        monitoramentoCampanhaIndividual['Cronograma']=`${rowsCampanhasAtivas[0].horaInicio} - ${rowsCampanhasAtivas[0].horaTermino}`
        
        sql=`SELECT AVG(tempo_total) as TMA FROM tempo_ligacao WHERE idCampanha=${idCampanha}`
        const rowsTMA = await this.querySync(sql)  
        monitoramentoCampanhaIndividual['TempoMedioDeAtendimento']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']={}
        
        sql=`SELECT total,conectadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 12`        
        const rowsChamadasSimultaneas = await this.querySync(sql)          
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['Conectados']=[]
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas']=[]
        for(let i=0;i<rowsChamadasSimultaneas.length;i++){
            monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['Conectados'].push(rowsChamadasSimultaneas[0].conectadas)
            monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas'].push(rowsChamadasSimultaneas[0].total)
        
        }
    
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']={}

        sql=`SELECT SUM(m.totalReg) as totalRegistros FROM mailings as m JOIN campanhas_mailing AS c ON m.id=c.idMailing WHERE idCampanha=${idCampanha}`        
        const rowsTotalMailing = await this.querySync(sql)     
        const totalRegistros = rowsTotalMailing[0].totalRegistros

        sql=`SELECT count(id) as trabalhados FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S' AND idCampanha=${idCampanha}`        
        const rowsTrabalhadas = await this.querySync(sql)  
        let trabalhados=0
        let produtivas=0
        let improdutivas=0
        if(rowsTrabalhadas>0){
           trabalhados = (rowsTrabalhadas[0].trabalhados/totalRegistros)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Trabalhado']=parseInt(trabalhados.toFixed(0))

        sql=`SELECT count(id) as produtivo FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S' AND produtivo=1 AND idCampanha=${idCampanha}`        
        const rowsProdutivas = await this.querySync(sql)  
        if(produtivas>0){   
        const produtivas = (rowsProdutivas[0].produtivo/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Produtivo']=parseInt(produtivas.toFixed(0))

        sql=`SELECT count(id) as improdutivas FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S' AND produtivo=0 AND idCampanha=${idCampanha}`        
        const rowsImprodutivas = await this.querySync(sql)   
        if(improdutivas>0){   
            improdutivas = (rowsImprodutivas[0].improdutivas/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Improdutivo']=parseInt(improdutivas.toFixed(0))

        
        monitoramentoCampanhaIndividual['ConsolidadoDodia']={}
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']={}

        sql=`SELECT COUNT(id) AS chamadas FROM historico_atendimento WHERE data=date(now()) AND campanha=${idCampanha}`
        const rowsCallsHoje = await this.querySync(sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['total']=rowsCallsHoje[0].chamadas
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND campanha=${idCampanha} GROUP BY data ORDER BY data DESC LIMIT 7`
        const rowsCallsLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['dataChart']=[]
        for(let i=0;i<rowsCallsLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['labelChart'].push(rowsCallsLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['dataChart'].push(rowsCallsLastWeeK[i].chamadas)
        }        

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']={}

        sql=`SELECT COUNT(id) AS total FROM historico_atendimento WHERE data=date(now()) AND contatado='S' AND campanha=${idCampanha}`
        const rowsCompletedHoje = await this.querySync(sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['total']=rowsCompletedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND contatado='S' AND campanha=${idCampanha} GROUP BY data ORDER BY data DESC LIMIT 7`
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
            sql=`SELECT COUNT(id) AS total FROM historico_atendimento WHERE data=date(now()) AND status_tabulacao=${statusVenda} AND campanha=${idCampanha}`
            const rowsSalesHoje = await this.querySync(sql)   
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=rowsSalesHoje[0].total
            
            sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND status_tabulacao=${statusVenda}  AND campanha=${idCampanha} GROUP BY data ORDER BY data DESC LIMIT 7`
            const rowsSalesLastWeeK = await this.querySync(sql) 
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
            for(let i=0;i<rowsSalesLastWeeK.length;i++){
                monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart'].push(rowsSalesLastWeeK[i].label)
                monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart'].push(rowsSalesLastWeeK[i].chamadas)
            }   
        }

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']={}

        sql=`SELECT COUNT(id) AS total FROM historico_atendimento WHERE data=date(now()) AND obs_tabulacao='ABANDONOU FILA' AND campanha=${idCampanha}`
        const rowsAbandonedHoje = await this.querySync(sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['total']=rowsAbandonedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND obs_tabulacao='ABANDONOU FILA' AND campanha=${idCampanha} GROUP BY data ORDER BY data DESC LIMIT 7`
        const rowsAbandonedLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart']=[]
        for(let i=0;i<rowsAbandonedLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart'].push(rowsAbandonedLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart'].push(rowsAbandonedLastWeeK[i].chamadas)
        }

        monitoramentoCampanhaIndividual['DadosAgente']={}
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=4`
        const rowAgentesIndisponiveis = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['indisponiveis']=rowAgentesIndisponiveis[0].total

        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=1`
        const rowAgentesDisponiveis = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Disponiveis']=rowAgentesDisponiveis[0].total

        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=3`
        const rowAgentesFalando = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Falando']=rowAgentesFalando[0].total

        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=2`
        const rowAgentesPausados = await this.querySync(sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Pausados']=rowAgentesPausados[0].total      
       
       
        callback(null,monitoramentoCampanhaIndividual)
        
    }

    async monitoramentoCampanhaGeral(callback){
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino FROM campanhas as c LEFT JOIN campanhas_horarios AS h ON h.id_campanha=c.id WHERE c.estado=1 AND c.status=1`
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
        
        sql=`SELECT COUNT(id) AS atendidas FROM historico_atendimento WHERE contatado='S'`
        const rowAtendidas = await this.querySync(sql)
        const atendidas=rowAtendidas[0].atendidas
        monitoramentoCampanhas['ChamadasAtendidasNoTotal']=atendidas

        sql=`SELECT s.id as statusVenda FROM tabulacoes_status AS s JOIN campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista WHERE s.venda=1 `
        const rowStatusVenda = await this.querySync(sql)
        let statusVenda=0
        let totalVendas=0
        if(rowStatusVenda.length!=0){
            statusVenda=rowStatusVenda[0].statusVenda
            sql=`SELECT COUNT(id) as totalVendas FROM historico_atendimento WHERE status_tabulacao=${statusVenda}`
            const rowVendas = await this.querySync(sql)
            totalVendas = rowVendas[0].totalVendas            
        }
        monitoramentoCampanhas['TabulacaoDeVendasNoTotal']=totalVendas


        sql=`SELECT COUNT(id) as emAtendimento FROM campanhas_chamadas_simultaneas WHERE falando=1`
        const rowEmAtendimento = await this.querySync(sql)
        monitoramentoCampanhas['ChamadasEmAtendimento']=rowEmAtendimento[0].emAtendimento

        sql=`SELECT COUNT(id) AS naoAtendidas FROM historico_atendimento WHERE contatado='N'`
        const rowNaoAtendidas = await this.querySync(sql)
        monitoramentoCampanhas['ChamadasNãoAtendidas']=rowNaoAtendidas[0].naoAtendidas
        let conversao=0
        if(totalVendas>0){
            conversao = (totalVendas/atendidas)*100
        }
        monitoramentoCampanhas['Conversao']=`${conversao.toFixed(0)}%`
        monitoramentoCampanhas['Cronograma']=`${rowsCampanhasAtivas[0].horaInicio} - ${rowsCampanhasAtivas[0].horaTermino}`
        
        sql=`SELECT AVG(tempo_total) as TMA FROM tempo_ligacao`
        const rowsTMA = await this.querySync(sql)  
        monitoramentoCampanhas['TempoMedioDeAtendimento']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']={}
        
        sql=`SELECT total,conectadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 12`        
        const rowsChamadasSimultaneas = await this.querySync(sql)          
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['Conectados']=[]
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas']=[]
        for(let i=0;i<rowsChamadasSimultaneas.length;i++){
            monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['Conectados'].push(rowsChamadasSimultaneas[0].conectadas)
            monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas'].push(rowsChamadasSimultaneas[0].total)
        }
     
        monitoramentoCampanhas['DadosCampanhaPorcentagem']={}

        sql=`SELECT SUM(m.totalReg) as totalRegistros FROM mailings as m JOIN campanhas_mailing AS c ON m.id=c.idMailing`        
        const rowsTotalMailing = await this.querySync(sql)     
        const totalRegistros = rowsTotalMailing[0].totalRegistros

        sql=`SELECT count(id) as trabalhados FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S'`        
        const rowsTrabalhadas = await this.querySync(sql)  
        let trabalhados=0
        let produtivas=0
        let improdutivas=0
        if(trabalhados>0){
            trabalhados = (rowsTrabalhadas[0].trabalhados/totalRegistros)*100
        }    


        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Trabalhado']=parseInt(trabalhados.toFixed(0))

        sql=`SELECT count(id) as produtivo FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S' AND produtivo=1`        
        const rowsProdutivas = await this.querySync(sql)     
        if(produtivas>0){
            produtivas = (rowsProdutivas[0].produtivo/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Produtivo']=parseInt(produtivas.toFixed(0))

        sql=`SELECT count(id) as improdutivas FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S' AND produtivo=0`        
        const rowsImprodutivas = await this.querySync(sql)   
        if(improdutivas>0){
             improdutivas = (rowsImprodutivas[0].improdutivas/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Improdutivo']=parseInt(improdutivas.toFixed(0))
        
        monitoramentoCampanhas['ConsolidadoDodia']={}
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']={}

        sql=`SELECT COUNT(id) AS chamadas FROM historico_atendimento WHERE data=date(now())`
        const rowsCallsHoje = await this.querySync(sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['total']=rowsCallsHoje[0].chamadas
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) GROUP BY data ORDER BY data DESC LIMIT 7`
        const rowsCallsLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['dataChart']=[]
        for(let i=0;i<rowsCallsLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['labelChart'].push(rowsCallsLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['dataChart'].push(rowsCallsLastWeeK[i].chamadas)
        }        

        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']={}

        sql=`SELECT COUNT(id) AS total FROM historico_atendimento WHERE data=date(now()) AND contatado='S'`
        const rowsCompletedHoje = await this.querySync(sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['total']=rowsCompletedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND contatado='S' GROUP BY data ORDER BY data DESC LIMIT 7`
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
            sql=`SELECT COUNT(id) AS total FROM historico_atendimento WHERE data=date(now()) AND status_tabulacao=${statusVenda}`
            const rowsSalesHoje = await this.querySync(sql)   
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=rowsSalesHoje[0].total
            
            sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND status_tabulacao=${statusVenda} GROUP BY data ORDER BY data DESC LIMIT 7`
            const rowsSalesLastWeeK = await this.querySync(sql) 
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
            for(let i=0;i<rowsSalesLastWeeK.length;i++){
                monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart'].push(rowsSalesLastWeeK[i].label)
                monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart'].push(rowsSalesLastWeeK[i].chamadas)
            }   
        }         

        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']={}

        sql=`SELECT COUNT(id) AS total FROM historico_atendimento WHERE data=date(now()) AND obs_tabulacao='ABANDONOU FILA'`
        const rowsAbandonedHoje = await this.querySync(sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['total']=rowsAbandonedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label FROM historico_atendimento WHERE data<>DATE(NOW()) AND obs_tabulacao='ABANDONOU FILA' GROUP BY data ORDER BY data DESC LIMIT 7`
        const rowsAbandonedLastWeeK = await this.querySync(sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart']=[]
        for(let i=0;i<rowsAbandonedLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart'].push(rowsAbandonedLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart'].push(rowsAbandonedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhas['DadosAgente']={}
        sql = `SELECT COUNT(id) as total FROM user_ramal WHERE estado=4`
        const rowAgentesIndisponiveis = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['indisponiveis']=rowAgentesIndisponiveis[0].total

        sql = `SELECT COUNT(id) as total FROM user_ramal WHERE estado=1`
        const rowAgentesDisponiveis = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['Disponiveis']=rowAgentesDisponiveis[0].total

        sql = `SELECT COUNT(id) as total FROM user_ramal WHERE estado=3`
        const rowAgentesFalando = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['Falando']=rowAgentesFalando[0].total

        sql = `SELECT COUNT(id) as total FROM user_ramal WHERE estado=2`
        const rowAgentesPausados = await this.querySync(sql)
        monitoramentoCampanhas['DadosAgente']['Pausados']=rowAgentesPausados[0].total      
       
       
        callback(null,monitoramentoCampanhas)
    }

    

    async tempoEstadoAgente(ramal,codEstado){
        console.log('ramal',ramal)
        console.log('codEstado',codEstado)
        return new Promise (async(resolve,reject) =>{
            let tempo = 0
            if(codEstado==0){//Deslogado
                const sql = `SELECT TIMESTAMPDIFF (SECOND, saida, NOW()) as tempo FROM tempo_login WHERE idAgente=${ramal} AND saida IS NOT NULL ORDER BY id DESC LIMIT 1`
                const t = await this.querySync(sql)
                if(t.length>0){
                    tempo = t[0].tempo
                }
            }else if(codEstado==1){//Disponivel
                const sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_espera WHERE idAgente=${ramal} AND entrada IS NOT NULL ORDER BY id DESC LIMIT 1`
                const t = await this.querySync(sql)
                if(t.length>0){
                    tempo = t[0].tempo
                }
            }else if(codEstado==2){//Pausado
                const sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_pausa WHERE idAgente=${ramal} AND entrada IS NOT NULL ORDER BY id DESC LIMIT 1`
                const t = await this.querySync(sql)
                if(t.length>0){
                    tempo = t[0].tempo
                }
            }else if(codEstado==3){//Falando
                const sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_ligacao WHERE idAgente=${ramal} AND entrada IS NOT NULL ORDER BY id DESC LIMIT 1`
                const t = await this.querySync(sql)
                if(t.length>0){
                    tempo = t[0].tempo
                }
            }else if(codEstado==4){//Indisponivel
                const sql = `SELECT TIMESTAMPDIFF (SECOND, saida, NOW()) as tempo FROM tempo_login WHERE idAgente=${ramal} AND saida IS NOT NULL ORDER BY id DESC LIMIT 1`
                const t = await this.querySync(sql)
                if(t.length>0){
                    tempo = t[0].tempo
                }
            }
            console.log('tempo',tempo)
           
            const tempoEstado = await this.converteSeg_tempo(tempo)
            
            console.log('tempoEstado',tempoEstado)
            resolve(tempoEstado);
        })
    }

    async restantes(idCampanha){
        return new Promise ((resolve,reject) =>{
            //Calculando tentativas e mailing da campanha
            const sql = `SELECT d.tentativas,m.id as idMailing,m.tabela,m.totalReg FROM campanhas_discador AS d JOIN campanhas_mailing AS cm ON cm.idCampanha=d.idCampanha JOIN mailings AS m ON m.id=cm.idMailing WHERE d.idCampanha=${idCampanha}`
            connect.banco.query(sql,(e,rowDadosCampanha)=>{
                if(e) throw e
                const tentativas = rowDadosCampanha[0].tentativas
                const tabela = rowDadosCampanha[0].tabela
                const idMailing = rowDadosCampanha[0].idMailing
                const totalReg = rowDadosCampanha[0].totalReg
                //Contanto total de registros e registros com menos tentativas
                const sql = `SELECT COUNT(id_key_base) AS trabalhados FROM ${tabela} AS t LEFT JOIN mailings.campanhas_tabulacao_mailing AS c ON c.idRegistro=t.id_key_base WHERE (c.idCampanha=${idCampanha} OR c.idCampanha IS NULL) AND (c.idMailing=${idMailing} OR c.idMailing IS NULL) AND c.tentativas>=${tentativas}`
                connect.mailings.query(sql,(e,rowRestantes)=>{
                    
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
    
    filtroCampanhas(callback){
        const sql = "SELECT id,nome FROM campanhas WHERE status=1 AND estado=1"
        connect.banco.query(sql,callback)
    }
    
    filtroEquipes(callback){
        const sql = "SELECT id,equipe FROM users_equipes WHERE status=1"
        connect.banco.query(sql,callback)
    }

    

    criarRelatorio(data,callback){
        const sql = `INSERT INTO report_info (data,nome,descricao,status) VALUES (NOW(),'${data.nome}','${data.descricao}',1) ` 
        connect.banco.query(sql,callback)
    }

    listarRelatorios(callback){
        const sql = "SELECT * FROM report_info WHERE status=1";
        connect.banco.query(sql,callback)
    }

    infoRelatorio(idRelatorio,callback){
        const sql = `SELECT * FROM report_info WHERE id='${idRelatorio}'`;
        connect.banco.query(sql,callback)
    }

    editarRelatorio(idRelatorio,dados,callback){
        const sql = `UPDATE report_info SET nome='${dados.nome}', descricao='${dados.descricao}', status='${dados.status}' WHERE id='${idRelatorio}'`
        connect.banco.query(sql,callback)
    }

    addCampoDisponiveis(dados,callback){
        const sql = `INSERT INTO report_campos_disponiveis (campo,descricao,sintetico,charts,status) VALUES ('${dados.campo}','${dados.descricao}','${dados.sintetico}','${dados.charts}','${dados.status}')`
        connect.banco.query(sql,callback)
    }

    listCamposDisponiveis(callback){
        const sql = "SELECT * FROM report_campos_disponiveis";
        connect.banco.query(sql,callback)
    }

    editarCampoDisponiveis(idCampoDisponivel,dados,callback){
        const sql = `UPDATE report_campos_disponiveis SET campo='${dados.campo}',descricao='${dados.descricao}',sintetico='${dados.sintetico}',charts='${dados.charts}',status='${dados.status}' WHERE id='${idCampoDisponivel}'`
        connect.banco.query(sql,callback)
    }

    delCampoDisponiveis(idCampoDisponivel,callback){
        const sql = `DELETE FROM report_campos_disponiveis WHERE id='${idCampoDisponivel}'`
        connect.banco.query(sql,callback) 
    }

    


    addCampoRelatorio(dados,callback){
        const sql = `INSERT INTO report_campos (idreport,idcampo,sintetico,chart) VALUES ('${dados.idreport}','${dados.idcampo}','${dados.sintetico}','${dados.chart}')`
        connect.banco.query(sql,callback)
    }

    listarCamposRelatorio(idRelatorio,callback){
        const sql = `SELECT * FROM report_campos WHERE idreport=${idRelatorio}`;
        connect.banco.query(sql,callback)
    }

    infoCamposRelatorio(idCampoRelatorio,callback){
        const sql = `SELECT * FROM report_campos WHERE id=${idCampoRelatorio}`;
        connect.banco.query(sql,callback)
    }
    
    editCampoRelatorio(idCampoRelatorio,dados,callback){
        const sql = `UPDATE report_campos SET sintetico='${dados.sintetico}', chart='${dados.chart}' WHERE id='${idCampoRelatorio}'`
        connect.banco.query(sql,callback)
    }
    
    delCampoRelatorio(idCampoRelatorio,callback){
        const sql = `DELETE FROM report_campos WHERE id='${idCampoRelatorio}'`
        connect.banco.query(sql,callback)
    }




}
export default new Report()