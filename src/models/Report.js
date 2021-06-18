import connect from '../Config/dbConnection';
import util from 'util'


class Report{
    filtroCampanhas(callback){
        const sql = "SELECT id,nome FROM campanhas WHERE status=1 AND estado=1"
        connect.banco.query(sql,callback)
    }
    
    filtroEquipes(callback){
        const sql = "SELECT id,equipe FROM users_equipes WHERE status=1"
        connect.banco.query(sql,callback)
    }

    querySync(sql,args){
        return new Promise ((resolve,reject) =>{
            connect.banco.query(sql,args,(err,rows)=>{
                if(err)
                    return reject(err);
               
                resolve(rows);
            })
        })
    }

    async monitorarAgentes(idCampanha,idEquipe,callback){         
        try{
            let filter = ""
            if(idCampanha){
                filter += ` AND cf.idCampanha = ${idCampanha} `
            }
            if(idEquipe){
                filter += ` AND ue.id = ${idEquipe} `
            }
            const sql=`SELECT DISTINCT ur.ramal,ea.estado,ur.estado as cod_estado,ue.equipe,us.nome FROM user_ramal AS ur JOIN users AS us ON ur.userId=us.id JOIN users_equipes AS ue ON ue.id=us.equipe LEFT JOIN estadosAgente AS ea ON ur.estado=ea.cod LEFT JOIN agentes_filas AS af ON af.ramal=us.id LEFT JOIN campanhas_filas AS cf ON af.fila=cf.id WHERE 1=1 ${filter}`
            const rowsAgentes = await this.querySync(sql)            
          
            for(let k in rowsAgentes) {
                //QUANTIDADE
                filter=""
                if(idCampanha){
                    filter = ` AND campanha = ${idCampanha} `
                }
                let ramal= rowsAgentes[k].ramal
                let codEstado = rowsAgentes[k].cod_estado
                rowsAgentes[k]['tempoStatus'] = await this.tempoEstadoAgente(ramal,codEstado)
                
                let sql = `SELECT COUNT(id) as total FROM historico_atendimento WHERE agente=${rowsAgentes[k].ramal} ${filter}`
                const rowsQTD = await this.querySync(sql);
                rowsAgentes[k]['quantidade']=rowsQTD[0].total
                
                //CAMPANHA
                if(idCampanha){
                    filter = ` AND h.campanha = ${idCampanha} `
                }
                sql = `SELECT h.campanha, c.nome as nomeCampanha FROM historico_atendimento AS h LEFT JOIN campanhas AS c ON c.id=h.campanha WHERE h.agente=${rowsAgentes[k].ramal} ${filter} ORDER BY h.id DESC LIMIT 1`
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
                sql=`SELECT AVG(tempo_total) as TMT FROM tempo_tabulacao WHERE idAgente=${rowsAgentes[k].ramal} ${filter}`
                const rowsTMT = await this.querySync(sql)    
                rowsAgentes[k]['TMT']=await this.converteSeg_tempo(rowsTMT[0].TMT)  
                
                //TMA
                sql=`SELECT AVG(tempo_total) as TMA FROM tempo_ligacao WHERE idAgente=${rowsAgentes[k].ramal} ${filter}`
                const rowsTMA = await this.querySync(sql)    
                rowsAgentes[k]['TMA']=await this.converteSeg_tempo(rowsTMA[0].TMA)
                
                //TMO
                sql=`SELECT AVG(tempo_total) as TMO FROM tempo_espera WHERE idAgente=${rowsAgentes[k].ramal} ${filter}`
                const rowsTMO = await this.querySync(sql)  
                rowsAgentes[k]['TMO']=await this.converteSeg_tempo(rowsTMO[0].TMO)
                
                //PRODUTIVAS
                sql=`SELECT COUNT(id) as produtivos FROM mailings.campanhas_tabulacao_mailing WHERE agente=${rowsAgentes[k].ramal} AND produtivo=1 ${filter}`
                const rowsProdutivos = await this.querySync(sql)  
                rowsAgentes[k]['produtivos']=rowsProdutivos[0].produtivos
                
                //IMPRODUTIVAS
                sql=`SELECT COUNT(id) as improdutivos FROM mailings.campanhas_tabulacao_mailing WHERE agente=${rowsAgentes[k].ramal} AND produtivo!=1 ${filter}`
                const rowsImprodutivos = await this.querySync(sql)  
                rowsAgentes[k]['improdutivos']=rowsImprodutivos[0].improdutivos
               
            }
            callback(null,rowsAgentes)
            
        }catch(err){
            console.log(err)
        }        
    }  

    
    
    async monitorarCampanhas(idCampanha,callback){
        if(idCampanha>=1){
            this.monitoramentoCampanhaIndividual(idCampanha,callback)
        }else{
            this.monitoramentoCampanhaGeral(callback)
        }
    }

    async monitoramentoCampanhaGeral(callback){
        const monitoramentoGeral = {}
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino FROM campanhas as c LEFT JOIN campanhas_horarios AS h ON h.id_campanha=c.id WHERE c.estado=1 AND c.status=1`
        
        const rowsCampanhasAtivas = await this.querySync(sql) 
        const totalCampanhas= rowsCampanhasAtivas.length
        //==>nomeDaCampanha:
        monitoramentoGeral['nomeDaCampanha']='Todas Ativas'
        
        //==>datainicial:
        sql = `SELECT DATE_FORMAT (h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio FROM campanhas as c LEFT JOIN campanhas_horarios AS h ON h.id_campanha=c.id WHERE c.estado=1 AND c.status=1 ORDER BY h.inicio ASC LIMIT 1`
        const rowInicio = await this.querySync(sql)
        monitoramentoGeral['datainicial']=rowInicio[0].dataInicio
        
        //==>datafinal:
        sql = `SELECT DATE_FORMAT(h.termino, '%d/%m/%Y') AS dataTermino, DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino FROM campanhas as c LEFT JOIN campanhas_horarios AS h ON h.id_campanha=c.id WHERE c.estado=1 AND c.status=1 ORDER BY h.termino DESC LIMIT 1`
        const rowTermino = await this.querySync(sql)
        monitoramentoGeral['datafinal']=rowTermino[0].dataTermino
        
        //==>porcentagemParaTermino
        let percTermino=0
        let totalRegistros = 0
        let trabalhados = 0
        let restantes = 0            
        for(let i=0; i<rowsCampanhasAtivas.length; i++){
            //Recuperando informacoes do mailing
            percTermino = await this.restantes(rowsCampanhasAtivas[i].id)
            totalRegistros+=percTermino['totalReg']
            trabalhados+=percTermino['trabalhados']            
        }  
        //calculando regisros restantes
        restantes += totalRegistros-trabalhados
        //calculando percentual dos restantes
        const porcentagemFim = 100-(restantes/totalRegistros)                
        monitoramentoGeral['porcentagemParaTermino']=porcentagemFim.toFixed(0)

        //==>totalRegistrosMailing  
        monitoramentoGeral['totalRegistrosMailing']={}

        //==>totalRegistrosMailing->totalDeRegistros
        monitoramentoGeral['totalRegistrosMailing']['totalDeRegistros']=totalRegistros
        
        //Calculando Contatados e nao contatados
        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S'`
        const rowContatadas = await this.querySync(sql)
        let contatados=rowContatadas[0].total
        
        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE contatado='N'`
        const rowNaoContatadas = await this.querySync(sql)
        let naoContatados=rowNaoContatadas[0].total                  
        
        //==>totalRegistrosMailing->contatado        
        const percContatados=parseFloat((parseFloat(contatados)/parseFloat(totalRegistros))*100)
        
        monitoramentoGeral['totalRegistrosMailing']['contatado%']=percContatados.toFixed(0)
        monitoramentoGeral['totalRegistrosMailing']['contatado']=contatados
        //==>totalRegistrosMailing->naocontatado
        const percNaoContatados=(naoContatados/totalRegistros)*100
        monitoramentoGeral['totalRegistrosMailing']['naocontatado%']=percNaoContatados.toFixed(0)
        monitoramentoGeral['totalRegistrosMailing']['naocontatado']=naoContatados
        //==>totalRegistrosMailing->naotrabalhado
        const percRestantes=(restantes/totalRegistros)*100  
        monitoramentoGeral['totalRegistrosMailing']['restantes%']=percRestantes.toFixed(0)
        monitoramentoGeral['totalRegistrosMailing']['restantes']=restantes

        //==>totalRegistrosCampanha 
        monitoramentoGeral['totalRegistrosCampanha']={}

        //==>totalRegistrosCampanha->totalDeRegistros
        monitoramentoGeral['totalRegistrosCampanha']['totalDeRegistros']=totalRegistros

        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE produtivo='1'`
        const rowProdutivas = await this.querySync(sql)
        let produtivo=rowProdutivas[0].total

        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE produtivo='0'`
        const rowImprodutivas = await this.querySync(sql)
        let improdutivo=rowImprodutivas[0].total       

        //==>totalRegistrosCampanha->produtivo
        const percProdutivas=parseFloat((produtivo/totalRegistros)*100)
        monitoramentoGeral['totalRegistrosCampanha']['produtivo%']=percProdutivas.toFixed(0)
        monitoramentoGeral['totalRegistrosCampanha']['produtivo']=produtivo
        
        //==>totalRegistrosCampanha->improdutivo
        const percImprodutivas=improdutivo/totalRegistros
       
        monitoramentoGeral['totalRegistrosCampanha']['improdutivo%']=percImprodutivas.toFixed(0)
        monitoramentoGeral['totalRegistrosCampanha']['improdutivo']=improdutivo
                        
        //==>totalRegistrosCampanha->naotrabalhado
        monitoramentoGeral['totalRegistrosCampanha']['naotrabalhado%']=percRestantes.toFixed(0)
        monitoramentoGeral['totalRegistrosCampanha']['naotrabalhado']=restantes

        //==>usuariosNaCampanha
        monitoramentoGeral['usuariosNaCampanha']={}
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE af.estado!=0`
        const rowAgentesCampanha = await this.querySync(sql) 
        let totalUsuarios=rowAgentesCampanha[0].total  
            
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE af.estado=4`
        const rowIndisponiveis = await this.querySync(sql) 
        let usuariosIndisponiveis=rowIndisponiveis[0].total  

        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE af.estado=1`
        const rowDisponiveis = await this.querySync(sql) 
        let usuariosDisponiveis=rowDisponiveis[0].total  

        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE af.estado=3`
        const rowFalando = await this.querySync(sql) 
        let usuariosFalando=rowFalando[0].total  

        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE af.estado=2`
        const rowPausados = await this.querySync(sql) 
        let usuariosPausados=rowPausados[0].total  


        //==>usuariosNaCampanha->total
        monitoramentoGeral['usuariosNaCampanha']['total']=totalUsuarios
        
        //==>usuariosNaCampanha->indisponiveis
        monitoramentoGeral['usuariosNaCampanha']['indisponiveis']=usuariosIndisponiveis
        
        //==>usuariosNaCampanha->disponiveis 
        monitoramentoGeral['usuariosNaCampanha']['disponiveis']=usuariosDisponiveis
        
        //==>usuariosNaCampanha->ocupados
        monitoramentoGeral['usuariosNaCampanha']['ocupados']=usuariosFalando
        
        //==>usuariosNaCampanha->em_pausa 
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE  af.estado=2`
        const rowEmPausa = await this.querySync(sql)
        monitoramentoGeral['usuariosNaCampanha']['em_pausa']=usuariosPausados
        
        //==>ChamadasEmAtendimento 
        monitoramentoGeral['ChamadasEmAtendimento']={}
       
        //==>ChamadasEmAtendimento->total
        sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE falando=1`
        const rowChamadasAtendimento = await this.querySync(sql)
        monitoramentoGeral['ChamadasEmAtendimento']['total']=rowChamadasAtendimento[0].total

        //==>ChamadasEmAtendimento->horario 
        sql = `SELECT DATE_FORMAT(data, '%H:%i:%s') AS horario FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowHorarioConectadas = await this.querySync(sql)
        let horarios=[]
        for(let i=0; i<rowHorarioConectadas.length;i++){
            horarios[i]=rowHorarioConectadas[i].horario
        }
        monitoramentoGeral['ChamadasEmAtendimento']['horario']=horarios

        //==>ChamadasEmAtendimento->horariovalor
        sql = `SELECT conectadas AS chamadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowChamadasConectadas = await this.querySync(sql)
        let conectadas=[]
        for(let i=0; i<rowChamadasConectadas.length;i++){
            conectadas[i]=rowChamadasConectadas[i].chamadas
        }
        monitoramentoGeral['ChamadasEmAtendimento']['valor']=conectadas               

        //==>chamadasNaFila
        monitoramentoGeral['chamadasNaFila']={} 

        //==>chamadasNaFila->total
        sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE na_fila=1 `
        const rowChamadasFila = await this.querySync(sql)
        monitoramentoGeral['chamadasNaFila']['total']=rowChamadasFila[0].total

        //==>chamadasNaFila->horario
        sql = `SELECT DATE_FORMAT(data, '%H:%i:%s') AS horario FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowHorarioFilas = await this.querySync(sql)
        let horariosFila=[]
        for(let i=0; i<rowHorarioFilas.length;i++){
            horariosFila[i]=rowHorarioFilas[i].horario
        }
        monitoramentoGeral['chamadasNaFila']['horario']=horarios

        //==>chamadasNaFila->valor    
        sql = `SELECT total, conectadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowTodasConectadas = await this.querySync(sql)
        let naFila=[]
        for(let i=0; i<rowTodasConectadas.length;i++){
            
            naFila[i]=(rowTodasConectadas[i].total-rowTodasConectadas[i].conectadas)
        }            
        monitoramentoGeral['chamadasNaFila']['valor']=naFila

        //==>conversao 
        monitoramentoGeral['conversao']={} 

        //==>conversao->total
        sql = `SELECT count(c.id) as total FROM mailings.campanhas_tabulacao_mailing AS c JOIN campanhas_status_tabulacao AS t ON t.id=c.tabulacao WHERE t.venda=1`
        const rowConvertidas = await this.querySync(sql)
        monitoramentoGeral['conversao']['total']=rowConvertidas[0].total
        
        //==>conversao->horario
        sql = `SELECT COUNT(c.id) vendas, DATE_FORMAT(DATA, '%d/%m/%Y') AS dia FROM mailings.campanhas_tabulacao_mailing AS c JOIN mega_conecta.campanhas_status_tabulacao AS t ON t.id=c.tabulacao WHERE t.venda=1 GROUP BY DATE_FORMAT(DATA, '%d/%m/%Y') LIMIT 6`
        const rowVendasData = await this.querySync(sql)

        let vendas = []
        let dataVendas = []
        for(let i=0; i<rowVendasData.length; i++){
            vendas[i] = rowVendasData[i].vendas
            dataVendas[i] = rowVendasData[i].dia
        }
        monitoramentoGeral['conversao']['horario']=dataVendas

        //==>conversao->valor
        monitoramentoGeral['conversao']['valor']=vendas

        //==>TotaldeChamadas
        sql = `SELECT COUNT(id) as total FROM historico_atendimento`
        const rowTotalChamadas = await this.querySync(sql)
        monitoramentoGeral['TotaldeChamadas']=rowTotalChamadas[0].total
        
        //==>chamadasCompletadas
        sql = `SELECT COUNT(id) as total FROM historico_atendimento WHERE contatado='S'`
        const rowChamadasCompletadas = await this.querySync(sql)
        monitoramentoGeral['chamadasCompletadas']=rowChamadasCompletadas[0].total
        
        //==>chamadasAbandonadas
        sql = `SELECT COUNT(id) as total FROM historico_atendimento WHERE contatado='N'`
        const rowChamadasAbandonadas = await this.querySync(sql)
        monitoramentoGeral['chamadasAbandonadas']=rowChamadasAbandonadas[0].total 
        
        //==>chamdasNaoAtendidas
        monitoramentoGeral['chamdasNaoAtendidas']="-?-" 
       
        //==>cronograma
        monitoramentoGeral['cronograma']=`${rowsCampanhasAtivas[0].horaInicio} às ${rowsCampanhasAtivas[0].horaTermino}`
        
        //==>fila
        monitoramentoGeral['fila']='Selecione uma campanha'
        
        //==>repeticoes
        sql = `SELECT tentativas FROM mailings.campanhas_tabulacao_mailing ORDER BY tentativas DESC LIMIT 1`
        const rowMaxTentativas = await this.querySync(sql)
        let maxTentativas=0
        if(rowMaxTentativas.length>=1){
            maxTentativas=rowMaxTentativas[0].tentativas
        }
        monitoramentoGeral['repeticoes']=maxTentativas

        //==>chamadasPendetes
        monitoramentoGeral['chamadasPendentes']="-?-" 
        //==>chamadasNaoCompletadas
        monitoramentoGeral['chamadasNaoCompletadas']="-?-" 
        
        //==>colocacaoDeChamadas
        monitoramentoGeral['colocacaoDeChamadas']="-?-" 
       
        //==>chamadaComMaiorDuracao
        sql=`SELECT tempo_total as tempo FROM tempo_ligacao ORDER BY tempo_total DESC LIMIT 1`
        const rowsMaiorLigacao = await this.querySync(sql) 
        let maiorLigacao=0
        if(rowsMaiorLigacao.length>=1){
            maiorLigacao=rowsMaiorLigacao[0].tempo
        }
        monitoramentoGeral['chamadaComMaiorDuracao']=await this.converteSeg_tempo(maiorLigacao)
        
        //==>duracaoMediaDasChamadas
        sql=`SELECT AVG(tempo_total) as TMA FROM tempo_ligacao WHERE tempo_total is not null`
        const rowsTMA = await this.querySync(sql)  
        monitoramentoGeral['duracaoMediaDasChamadas']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        //==>vendas
        monitoramentoGeral['vendas']=rowConvertidas[0].total

        //==>agentesFalando
        monitoramentoGeral['agentesFalando']=usuariosFalando
        
        //==>mediaDeOciosidade
        sql=`SELECT AVG(tempo_total) as TMO FROM tempo_espera`
        const rowsTMO = await this.querySync(sql)  
        monitoramentoGeral['mediaDeOciosidade']=await this.converteSeg_tempo(rowsTMO[0].TMO)

        callback(null,monitoramentoGeral)
    }

    async monitoramentoCampanhaIndividual(idCampanha,callback){
        const monitoramentoIndividual = {}
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino FROM campanhas as c LEFT JOIN campanhas_horarios AS h ON h.id_campanha=c.id WHERE c.estado=1 AND c.status=1 AND c.id=${idCampanha}`
        const rowsCampanhasAtivas = await this.querySync(sql) 
        //==>nomeDaCampanha: 
        monitoramentoIndividual['nomeDaCampanha']=rowsCampanhasAtivas[0].nome
                
        //==>datainicial:
        monitoramentoIndividual['datainicial']=rowsCampanhasAtivas[0].dataInicio
        
        //==>datafinal:
        monitoramentoIndividual['datafinal']=rowsCampanhasAtivas[0].dataTermino
        
        //Recuperando informacoes do mailing
        const percTermino = await this.restantes(rowsCampanhasAtivas[0].id)
        const totalRegistros=percTermino['totalReg']
        const trabalhados=percTermino['trabalhados']

        const restantes = totalRegistros-trabalhados
        //calculando porcentagem
        const porcentagemFim = 100-(restantes/totalRegistros)
        //==>porcentagemParaTermino
          monitoramentoIndividual['porcentagemParaTermino']=porcentagemFim.toFixed(0)

        //==>totalRegistrosMailing  
          monitoramentoIndividual['totalRegistrosMailing']={}

        //==>totalRegistrosMailing->totalDeRegistros
          monitoramentoIndividual['totalRegistrosMailing']['totalDeRegistros']=totalRegistros
        
        //==>totalRegistrosMailing->contatado
        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE contatado='S' AND idCampanha=${idCampanha}`
        const rowContatadas = await this.querySync(sql)
        const contatados=rowContatadas[0].total
        const percContatados=parseFloat((contatados/totalRegistros)*100)
        monitoramentoIndividual['totalRegistrosMailing']['contatado%']=percContatados.toFixed(0)
        monitoramentoIndividual['totalRegistrosMailing']['contatado']=contatados
        
        //==>totalRegistrosMailing->naocontatado
        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE contatado='N' AND idCampanha=${idCampanha}`
        const rowNaoContatadas = await this.querySync(sql)
        const naoContatados=rowNaoContatadas[0].total
        const percNaoContatados=parseFloat((naoContatados/totalRegistros)*100)
        monitoramentoIndividual['totalRegistrosMailing']['naocontatado%']=percNaoContatados.toFixed(0)
        monitoramentoIndividual['totalRegistrosMailing']['naocontatado']=naoContatados
        
        //==>totalRegistrosMailing->naotrabalhado
        const percRestantes=(restantes/totalRegistros)*100  
        monitoramentoIndividual['totalRegistrosMailing']['restantes%']=percRestantes.toFixed(0)
        monitoramentoIndividual['totalRegistrosMailing']['restantes']=restantes 
        
        //==>totalRegistrosCampanha 
        monitoramentoIndividual['totalRegistrosCampanha']={}

        //==>totalRegistrosCampanha->totalDeRegistros
        monitoramentoIndividual['totalRegistrosCampanha']['totalDeRegistros']=totalRegistros

        //==>totalRegistrosCampanha->produtivo
        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE produtivo='1' AND idCampanha=${idCampanha}`
        const rowProdutivos = await this.querySync(sql)
        const produtivos=rowProdutivos[0].total
        const percProdutivos=parseFloat((produtivos/totalRegistros)*100)
        monitoramentoIndividual['totalRegistrosCampanha']['produtivo%']=percProdutivos.toFixed(0)
        monitoramentoIndividual['totalRegistrosCampanha']['produtivo']=produtivos

        //==>totalRegistrosCampanha->improdutivo
        sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE produtivo='0' AND idCampanha=${idCampanha}`
        const rowImprodutivos = await this.querySync(sql)
        const improdutivos=rowImprodutivos[0].total
        const percImprodutivos=parseFloat((improdutivos/totalRegistros)*100)
        monitoramentoIndividual['totalRegistrosCampanha']['improdutivo%']=percImprodutivos.toFixed(0)
        monitoramentoIndividual['totalRegistrosCampanha']['improdutivo']=improdutivos 

        //==>totalRegistrosCampanha->naotrabalhado
        monitoramentoIndividual['totalRegistrosCampanha']['naotrabalhado%']=percRestantes.toFixed(0)
        monitoramentoIndividual['totalRegistrosCampanha']['naotrabalhado']=restantes 
        

        //==>usuariosNaCampanha 
        monitoramentoIndividual['usuariosNaCampanha']={}

        //==>usuariosNaCampanha->total
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado!=0`
        const rowAgentesCampanha = await this.querySync(sql)
        monitoramentoIndividual['usuariosNaCampanha']['total']=rowAgentesCampanha[0].total
        
        //==>usuariosNaCampanha->indisponiveis
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=4`
        const rowAgentesIndisponiveis = await this.querySync(sql)
        monitoramentoIndividual['usuariosNaCampanha']['indisponiveis']=rowAgentesIndisponiveis[0].total
        
        //==>usuariosNaCampanha->disponiveis 
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=2`
        const rowAgentesDisponiveis = await this.querySync(sql)
        monitoramentoIndividual['usuariosNaCampanha']['disponiveis']=rowAgentesDisponiveis[0].total
        
        //==>usuariosNaCampanha->ocupados 
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=3`
        const rowOcupados = await this.querySync(sql)
        monitoramentoIndividual['usuariosNaCampanha']['ocupados']=rowOcupados[0].total
        
        //==>usuariosNaCampanha->em_pausa 
        sql = `SELECT COUNT(af.id) as total FROM campanhas_filas AS cf JOIN agentes_filas AS af ON af.fila=cf.id WHERE cf.idCampanha=${idCampanha} AND af.estado=2`
        const rowEmPausa = await this.querySync(sql)
        monitoramentoIndividual['usuariosNaCampanha']['em_pausa']=rowEmPausa[0].total

        
       

        //==>ChamadasEmAtendimento 
        monitoramentoIndividual['ChamadasEmAtendimento']={}
       
        //==>ChamadasEmAtendimento->total
        sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha} AND falando=1`
        const rowChamadasAtendimento = await this.querySync(sql)
        monitoramentoIndividual['ChamadasEmAtendimento']['total']=rowChamadasAtendimento[0].total

        //==>ChamadasEmAtendimento->horario 
        sql = `SELECT DATE_FORMAT(data, '%H:%i:%s') AS horario FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowHorarioConectadas = await this.querySync(sql)
        let horarios=[]
        for(let i=0; i<rowHorarioConectadas.length;i++){
            horarios[i]=rowHorarioConectadas[i].horario
        }
        monitoramentoIndividual['ChamadasEmAtendimento']['horario']=horarios

        //==>ChamadasEmAtendimento->horariovalor
        sql = `SELECT conectadas AS chamadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowChamadasConectadas = await this.querySync(sql)
        let conectadas=[]
        for(let i=0; i<rowChamadasConectadas.length;i++){
            conectadas[i]=rowChamadasConectadas[i].chamadas
        }
        monitoramentoIndividual['ChamadasEmAtendimento']['valor']=conectadas               

        //==>chamadasNaFila
        monitoramentoIndividual['chamadasNaFila']={} 

        //==>chamadasNaFila->total
        sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha} AND na_fila=1 `
        const rowChamadasFila = await this.querySync(sql)
        monitoramentoIndividual['chamadasNaFila']['total']=rowChamadasFila[0].total

        //==>chamadasNaFila->horario
        sql = `SELECT DATE_FORMAT(data, '%H:%i:%s') AS horario FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowHorarioFilas = await this.querySync(sql)
        let horariosFila=[]
        for(let i=0; i<rowHorarioFilas.length;i++){
            horariosFila[i]=rowHorarioFilas[i].horario
        }
        monitoramentoIndividual['chamadasNaFila']['horario']=horarios

        //==>chamadasNaFila->valor    
        sql = `SELECT total, conectadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT 6`
        const rowTodasConectadas = await this.querySync(sql)
        let naFila=[]
        for(let i=0; i<rowTodasConectadas.length;i++){
            
            naFila[i]=(rowTodasConectadas[i].total-rowTodasConectadas[i].conectadas)
        }            
        monitoramentoIndividual['chamadasNaFila']['valor']=naFila

        //==>conversao 
        monitoramentoIndividual['conversao']={} 

        //==>conversao->total
        sql = `SELECT count(c.id) as total FROM mailings.campanhas_tabulacao_mailing AS c JOIN campanhas_status_tabulacao AS t ON t.id=c.tabulacao WHERE c.idCampanha=${idCampanha} AND t.venda=1`
        const rowConvertidas = await this.querySync(sql)
        monitoramentoIndividual['conversao']['total']=rowConvertidas[0].total
        
        //==>conversao->horario
        sql = `SELECT COUNT(c.id) vendas, DATE_FORMAT(DATA, '%d/%m/%Y') AS dia FROM mailings.campanhas_tabulacao_mailing AS c JOIN mega_conecta.campanhas_status_tabulacao AS t ON t.id=c.tabulacao WHERE c.idCampanha=${idCampanha} AND t.venda=1 GROUP BY DATE_FORMAT(DATA, '%d/%m/%Y') LIMIT 6`
        const rowVendasData = await this.querySync(sql)

        let vendas = []
        let dataVendas = []
        for(let i=0; i<rowVendasData.length; i++){
            vendas[i] = rowVendasData[i].vendas
            dataVendas[i] = rowVendasData[i].dia
        }

        monitoramentoIndividual['conversao']['horario']=dataVendas
        //==>conversao->valor
        monitoramentoIndividual['conversao']['valor']=vendas

        //==>TotaldeChamadas
        sql = `SELECT COUNT(id) as total FROM historico_atendimento WHERE campanha=${idCampanha}`
        const rowTotalChamadas = await this.querySync(sql)
        monitoramentoIndividual['TotaldeChamadas']=rowTotalChamadas[0].total
        
        //==>chamadasCompletadas
        sql = `SELECT COUNT(id) as total FROM historico_atendimento WHERE campanha=${idCampanha} AND contatado='S'`
        const rowChamadasCompletadas = await this.querySync(sql)
        monitoramentoIndividual['chamadasCompletadas']=rowChamadasCompletadas[0].total
        
        //==>chamadasAbandonadas
        sql = `SELECT COUNT(id) as total FROM historico_atendimento WHERE campanha=${idCampanha} AND contatado='N'`
        const rowChamadasAbandonadas = await this.querySync(sql)
        monitoramentoIndividual['chamadasAbandonadas']=rowChamadasAbandonadas[0].total 
        
        //==>chamdasNaoAtendidas
        monitoramentoIndividual['chamdasNaoAtendidas']="-?-" 
       
        //==>cronograma
        monitoramentoIndividual['cronograma']=`${rowsCampanhasAtivas[0].horaInicio} às ${rowsCampanhasAtivas[0].horaTermino}`
        
        //==>fila
        sql=`SELECT nomeFila FROM campanhas_filas WHERE idCampanha=${idCampanha}`
        const rowNomeFila = await this.querySync(sql)
        let nomeFila=""
        if(rowNomeFila.length>=1){
            nomeFila=rowNomeFila[0].nomeFila
        }
        monitoramentoIndividual['fila']=nomeFila
        
        //==>repeticoes
        sql = `SELECT tentativas FROM mailings.campanhas_tabulacao_mailing WHERE idCampanha='${idCampanha}' ORDER BY tentativas DESC LIMIT 1`
        const rowMaxTentativas = await this.querySync(sql)
        let maxTentativas=0
        if(rowMaxTentativas.length>=1){
            maxTentativas=rowMaxTentativas[0].tentativas
        }
        monitoramentoIndividual['repeticoes']=maxTentativas

        //==>chamadasPendetes
        monitoramentoIndividual['chamadasPendentes']="-?-" 
        //==>chamadasNaoCompletadas
        monitoramentoIndividual['chamadasNaoCompletadas']="-?-" 
        
        //==>colocacaoDeChamadas
        monitoramentoIndividual['colocacaoDeChamadas']="-?-" 
       
        //==>chamadaComMaiorDuracao
        sql=`SELECT tempo_total as tempo FROM tempo_ligacao WHERE idCampanha=${idCampanha} ORDER BY tempo_total DESC LIMIT 1`
        const rowsMaiorLigacao = await this.querySync(sql) 
        let maiorLigacao=0
        if(rowsMaiorLigacao.length>=1){
            maiorLigacao=rowsMaiorLigacao[0].tempo
        }
        monitoramentoIndividual['chamadaComMaiorDuracao']=await this.converteSeg_tempo(maiorLigacao)
        
        //==>duracaoMediaDasChamadas
        sql=`SELECT AVG(tempo_total) as TMA FROM tempo_ligacao WHERE idCampanha=${idCampanha}`
        const rowsTMA = await this.querySync(sql)  
        monitoramentoIndividual['duracaoMediaDasChamadas']=await this.converteSeg_tempo(rowsTMA[0].TMA) 
        
        //==>vendas
        monitoramentoIndividual['vendas']=rowConvertidas[0].total

        //==>agentesFalando
        monitoramentoIndividual['agentesFalando']=rowOcupados[0].total
        
        //==>mediaDeOciosidade
        sql=`SELECT AVG(tempo_total) as TMO FROM tempo_espera WHERE idCampanha=${idCampanha}`
        const rowsTMO = await this.querySync(sql)  
        monitoramentoIndividual['mediaDeOciosidade']=await this.converteSeg_tempo(rowsTMO[0].TMO)

        callback(null,monitoramentoIndividual)
    }

    async tempoEstadoAgente(ramal,codEstado){
        return new Promise (async(resolve,reject) =>{
            let tempo = 0
            if(codEstado==0){//Deslogado
                const sql = `SELECT TIMESTAMPDIFF (SECOND, saida, NOW()) as tempo FROM tempo_login WHERE idAgente=${ramal} AND saida IS NOT NULL ORDER BY id DESC LIMIT 1`
                tempo = await this.querySync(sql)
            }else if(codEstado==1){//Disponivel
                const sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_espera WHERE idAgente=${ramal} AND entrada IS NOT NULL ORDER BY id DESC LIMIT 1`
                tempo = await this.querySync(sql)
            }else if(codEstado==2){//Pausado
                const sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_pausa WHERE idAgente=${ramal} AND entrada IS NOT NULL ORDER BY id DESC LIMIT 1`
                tempo = await this.querySync(sql)
            }else if(codEstado==3){//Falando
                const sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_ligacao WHERE idAgente=${ramal} AND entrada IS NOT NULL ORDER BY id DESC LIMIT 1`
                tempo = await this.querySync(sql)
            }else if(codEstado==4){//Indisponivel
                const sql = `SELECT TIMESTAMPDIFF (SECOND, saida, NOW()) as tempo FROM tempo_login WHERE idAgente=${ramal} AND saida IS NOT NULL ORDER BY id DESC LIMIT 1`
                tempo = await this.querySync(sql)
            }else{
                tempo = 0
            }
           
            const tempoEstado = await this.converteSeg_tempo(tempo)
            

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