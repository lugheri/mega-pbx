"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _Clients = require('./Clients'); var _Clients2 = _interopRequireDefault(_Clients);


class Dashboard{
//Query Sync
    async querySync(conn,sql){    
       
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
    }   

    async painel(empresa){
       
        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")       
        const agentesLogados = await _Discador2.default.agentesLogados(empresa)
        const produtivas = await _Discador2.default.chamadasProdutividade_CampanhasAtivas_dia(empresa,1)
        const improdutivas = await _Discador2.default.chamadasProdutividade_CampanhasAtivas_dia(empresa,0) 
        const totalChamadas = await _Discador2.default.totalChamadas_CampanhasAtivas_dia(empresa)
        let percentual_improdutivas=0
        let percentual_produtivas=0
        if(totalChamadas!=0){
            percentual_improdutivas = Math.round((improdutivas / totalChamadas)*100)
            percentual_produtivas = Math.round((produtivas / totalChamadas)*100)
        }   

        const ag_Disponiveis = await _Discador2.default.agentesPorEstado(empresa,1)
        const ag_emPausa = await _Discador2.default.agentesPorEstado(empresa,2)
        const ag_emLigacao = await _Discador2.default.agentesPorEstado(empresa,3)        
        const ag_emTela = await _Discador2.default.agentesPorEstado(empresa,5)
        const ag_chamadaManual = await _Discador2.default.agentesPorEstado(empresa,6)
        const chamadasAbandonadas = await _Discador2.default.chamadasAbandonadas_CampanhasAtivas(empresa)
        const naoContatados = await _Discador2.default.chamadasPorContato_dia(empresa,'N')       
        const contatados = await _Discador2.default.chamadasPorContato_dia(empresa,'S')
        const emAtendimento = await _Discador2.default.chamadasEmAtendimento(empresa)   
        
       
        /*console.log('totalChamadas',totalChamadas)
        console.log('improdutivas',improdutivas)
        console.log('produtivas',produtivas)*/
        
        const dash={}
              dash['sinteticos']={}
              dash['sinteticos']['AgentesLogados']=agentesLogados        
              dash['sinteticos']['Improdutivas']=`${percentual_improdutivas}%`       
              dash['sinteticos']['Produtivas']=`${percentual_produtivas}%`
              dash['sinteticos']['TotalDeChamadas']=totalChamadas
              dash['sinteticos']['AnotherKpis']={}
              dash['sinteticos']['AnotherKpis']['TabulacoesProdutivas']=produtivas
              dash['sinteticos']['AnotherKpis']['TabulacoesImprodutivas']=improdutivas
              dash['sinteticos']['AnotherKpis']['AgentesEmPausa']=ag_emPausa
              dash['sinteticos']['AnotherKpis']['AgentesEmLigacao']=ag_emLigacao+ag_chamadaManual+ag_emTela
              dash['sinteticos']['AnotherKpis']['AgentesDisponiveis']=ag_Disponiveis
              dash['sinteticos']['AnotherKpis']['LigacoesAbandonadasNoTotal']=chamadasAbandonadas
              dash['sinteticos']['AnotherKpis']['NaoContatados']=naoContatados
              dash['sinteticos']['AnotherKpis']['Contatados']=contatados
              dash['sinteticos']['AnotherKpis']['ChamadasEmAtendimento']=emAtendimento       

        const campanhasAtivas = await _Campanhas2.default.listarCampanhasAtivas(empresa)

        //console.log('campanhasAtivas',campanhasAtivas)
              
            dash["Campanhas"]=[]
            for(let i = 0; i<campanhasAtivas.length; i++) {
                const campanha={}
                const statusCampanha=await _Discador2.default.statusCampanha(empresa,campanhasAtivas[i].id)
                const idMailing = await _Campanhas2.default.listarMailingCampanha(empresa,campanhasAtivas[i].id) 

                const totalRegistros=await _Campanhas2.default.totalRegistrosCampanha(empresa,campanhasAtivas[i].id)
                const Improdutivas_mailingAtual = await _Discador2.default.chamadasProdutividade_porCampanha(empresa,campanhasAtivas[i].id,0,idMailing[0].idMailing)
                const Produtivas_mailingAtual = await _Discador2.default.chamadasProdutividade_porCampanha(empresa,campanhasAtivas[i].id,1,idMailing[0].idMailing)
                const Trabalhados_mailingAtual=Improdutivas_mailingAtual+Produtivas_mailingAtual
                const NaoTrabalhados_mailingAtual=totalRegistros[0].total-Trabalhados_mailingAtual  

               // console.log('totalRegistros',totalRegistros)
                //console.log('Trabalhados_mailingAtual',Trabalhados_mailingAtual)
                
                
                let PercentualTrabalhado=0
                if(totalRegistros[0].total!=0){
                    PercentualTrabalhado=Math.round((Trabalhados_mailingAtual / totalRegistros[0].total)*100)
                }                

               
                campanha["nomeCampanha"]=campanhasAtivas[i].nome
                campanha["idCampanha"]=campanhasAtivas[i].id
                campanha["statusCampanha"]=statusCampanha[0].estado
                campanha["descricaoStatusCampanha"]=statusCampanha[0].mensagem
                campanha["descricaoCampanha"]=campanhasAtivas[i].descricao
                campanha["PercentualTrabalhado"]=PercentualTrabalhado
                campanha["Improdutivas"]=Improdutivas_mailingAtual
                campanha["Produtivas"]=Produtivas_mailingAtual
                campanha["Trabalhado"]=Trabalhados_mailingAtual
                campanha["NaoTrabalhado"]=NaoTrabalhados_mailingAtual
                dash["Campanhas"].push(campanha)

            }
           // console.log('dash Campanhas',dash)
         
         const mailings = await _Campanhas2.default.listarMailingCampanhasAtivas(empresa)
         //console.log('mailings',mailings)
            dash["Mailings"]=[]
            const mailingsAdicionados=[]
            for(let i = 0; i<mailings.length; i++) {
                const mailing={}
               
                const idMailing = mailings[i].id
                const nomeMailing = mailings[i].nome
                const totalRegistros=mailings[i].totalNumeros-mailings[i].numerosInvalidos                
                const Improdutivas=await _Discador2.default.chamadasProdutividade_porMailing(empresa,0,idMailing)
                const Produtivas=await _Discador2.default.chamadasProdutividade_porMailing(empresa,1,idMailing)
                const trabalhado=Produtivas+Improdutivas

                let perc_improdutivas=0
                let perc_produtivas=0
                let perc_trabalhado=0
                if(totalRegistros!=0){
                    perc_improdutivas=Math.round((Improdutivas / totalRegistros)*100)
                    perc_produtivas=Math.round((Produtivas / totalRegistros)*100)
                    perc_trabalhado=Math.round((trabalhado / totalRegistros)*100)
                }                

                mailing["nameMailing"]=nomeMailing
                mailing["data"]={}
                mailing["data"]["Produtivo"]=perc_produtivas
                mailing["data"]["Improdutivo"]=perc_improdutivas
                mailing["data"]["Trabalhados"]=perc_trabalhado
                //verifica se o mailing ja consta na lista de mailngs
                if(mailingsAdicionados.includes(idMailing)==false){//Caso o cpf conste no array de cpfs
                    dash["Mailings"].push(mailing)
                }                
                mailingsAdicionados.push(idMailing)
            }
           
          
            dash["dia"]=await _Discador2.default.diaAtual()
            dash["Agentes"]=[]
           
            const agentes = await _Discador2.default.listarAgentesLogados(empresa)
            for(let i = 0; i<agentes.length; i++) {
                
               
                const idAgente=agentes[i].id
                
                const totalAtendimento=await _Discador2.default.totalAtendimentosAgente(empresa,idAgente)
                const Improdutivas=await _Discador2.default.chamadasProdutividade_Agente(empresa,0,idAgente)
                const Produtivas=await _Discador2.default.chamadasProdutividade_Agente(empresa,1,idAgente)
                const chManuais=await _Discador2.default.chamadasManuais_Agente(empresa,idAgente)
                const tempoFalado=await _Discador2.default.tempoFaladoAgente(empresa,idAgente)
               
                let perc_improdutivas=0
                let perc_produtivas=0
                let perc_manuais=0
                if(totalAtendimento!=0){
                    perc_improdutivas=Math.round((Improdutivas / totalAtendimento)*100)
                    perc_produtivas=Math.round((Produtivas / totalAtendimento)*100)
                    perc_manuais=Math.round((chManuais / totalAtendimento)*100)
                }

                
                const agente={}
                      agente["nomeAgente"]=agentes[i].nome
                    let estadoAgente=agentes[i].estado
                    if(estadoAgente==3){
                        const tabulando = await _Report2.default.statusTabulacaoChamada(empresa,idAgente)
                        if(tabulando==1){
                            estadoAgente=3.5
                        }

                    }else if(estadoAgente==6){
                        const falando = await _Report2.default.statusAtendimentoChamada(empresa,idAgente)
                        if(falando==1){
                            estadoAgente=7
                        }
                    }


                      agente["statusAgente"]=estadoAgente

                      agente["produtivos"]={}
                      agente["produtivos"]["porcentagem"]=perc_produtivas
                      agente["produtivos"]["total"]=Produtivas

                      agente["improdutivos"]={}
                      agente["improdutivos"]["porcentagem"]=perc_improdutivas
                      agente["improdutivos"]["total"]=Improdutivas

                      agente["chManuais"]={}
                      agente["chManuais"]["porcentagem"]=perc_manuais
                      agente["chManuais"]["total"]=chManuais

                      

                      agente["tempoFalado"]=await this.converteSeg_tempo(tempoFalado)
                dash["Agentes"].push(agente)
                
            }    
           
          return dash


        
    }

    async realTimeCalls(empresa){       
        const totais = await _Discador2.default.logChamadasSimultaneas(empresa,'total',1)
        const conectadas = await _Discador2.default.logChamadasSimultaneas(empresa,'conectadas',1)
        const realTime={}
              realTime['RealTimeChart']={}
              const ligando = totais - conectadas
              realTime['RealTimeChart']['Ligando']=ligando
              realTime['RealTimeChart']['Falando']=conectadas
        return realTime
    }

    async realTimeCallsCampain(empresa,idCampanha){     
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async(err,conn)=>{
            
                let sql = `SELECT COUNT(id) as total 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id_campanha=${idCampanha}
                        ORDER BY id DESC LIMIT 1`
                const t = await this.querySync(conn,sql)
                const totais = t[0].total

                sql = `SELECT COUNT(id) as conectadas 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
                            WHERE id_campanha=${idCampanha} AND falando=1 
                            ORDER BY id DESC LIMIT 1`
                const c = await this.querySync(conn,sql,)
                const conectadas = c[0].conectadas

                const realTime={}
                    realTime['RealTimeChart']={}
                    realTime['RealTimeChart']['Ligando']=totais
                    realTime['RealTimeChart']['Falando']=conectadas
                
                pool.end((err)=>{
                    if(err) console.log(err)
                    }) 
                resolve(realTime)
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

}

exports. default = new Dashboard()