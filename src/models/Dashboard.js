import connect from '../Config/dbConnection'
import Discador from '../models/Discador'
import Campanhas from '../models/Campanhas'
import Report from '../models/Report'
import moment from 'moment'
import Redis from '../Config/Redis'


class Dashboard{
    //Query Sync
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err){ 
                    console.error({"errorCode":err.code,"message":err.message,"stack":err.stack, "sql":sql}) 
                    resolve(false);
                }
                resolve(rows)
            })
        })
    } 

    async painel(empresa){       
        const hoje = moment().format("YYYY-MM-DD")
        const agentesLogados = await Discador.agentesLogados(empresa)
        const produtivas = await Discador.chamadasProdutividade_CampanhasAtivas_dia(empresa,1)
        const improdutivas = await Discador.chamadasProdutividade_CampanhasAtivas_dia(empresa,0)
        const totalChamadas = await Discador.totalChamadas_CampanhasAtivas_dia(empresa)
        let percentual_improdutivas=0
        let percentual_produtivas=0
        if(totalChamadas!=0){
            percentual_improdutivas = Math.round((improdutivas / totalChamadas)*100)
            percentual_produtivas = Math.round((produtivas / totalChamadas)*100)
        } 
        const ag_Disponiveis = await Discador.agentesPorEstado(empresa,1)
        const ag_emPausa = await Discador.agentesPorEstado(empresa,2)
        const ag_emLigacao = await Discador.agentesPorEstado(empresa,3)        
        const ag_emTela = await Discador.agentesPorEstado(empresa,5)
        const ag_chamadaManual = await Discador.agentesPorEstado(empresa,6)
        const chamadasAbandonadas = await Discador.chamadasAbandonadas_CampanhasAtivas(empresa)
        const naoContatados = await Discador.chamadasPorContato_dia(empresa,'N')       
        const contatados = await Discador.chamadasPorContato_dia(empresa,'S')
        const emAtendimento = await Discador.chamadasEmAtendimento(empresa) 

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
        const campanhasAtivas = await Campanhas.listarCampanhasAtivas(empresa)  
              dash["Campanhas"]=[]
              for(let i = 0; i<campanhasAtivas.length; i++) {
                const campanha={}
                let statusDaCampanha=0
                let mensagemCampanha="!"
                const statusCampanha=await Discador.statusCampanha(empresa,campanhasAtivas[i].id)
                if(statusCampanha!==false){
                    statusDaCampanha=statusCampanha['estado']
                    mensagemCampanha=statusCampanha['mensagem']
                }
                const idMailing = await Campanhas.listarMailingCampanha(empresa,campanhasAtivas[i].id) 
                const totalRegistros=await Campanhas.totalRegistrosCampanha(empresa,campanhasAtivas[i].id)
                const Improdutivas_mailingAtual = await Discador.chamadasProdutividade_porCampanha(empresa,campanhasAtivas[i].id,0,idMailing[0].idMailing)
                const Produtivas_mailingAtual = await Discador.chamadasProdutividade_porCampanha(empresa,campanhasAtivas[i].id,1,idMailing[0].idMailing)
                const Trabalhados_mailingAtual=Improdutivas_mailingAtual+Produtivas_mailingAtual
                const NaoTrabalhados_mailingAtual=totalRegistros[0].total-Trabalhados_mailingAtual 
                let PercentualTrabalhado=0
                if(totalRegistros[0].total!=0){
                    PercentualTrabalhado=Math.round((Trabalhados_mailingAtual / totalRegistros[0].total)*100)
                }
                campanha["nomeCampanha"]=campanhasAtivas[i].nome
                campanha["idCampanha"]=campanhasAtivas[i].id
                campanha["statusCampanha"]=statusDaCampanha
                campanha["descricaoStatusCampanha"]=mensagemCampanha
                campanha["descricaoCampanha"]=campanhasAtivas[i].descricao
                campanha["PercentualTrabalhado"]=PercentualTrabalhado
                campanha["Improdutivas"]=Improdutivas_mailingAtual
                campanha["Produtivas"]=Produtivas_mailingAtual
                campanha["Trabalhado"]=Trabalhados_mailingAtual
                campanha["NaoTrabalhado"]=NaoTrabalhados_mailingAtual
                dash["Campanhas"].push(campanha)
            }
        const mailings = await Campanhas.listarMailingCampanhasAtivas(empresa)
            dash["Mailings"]=[]
        const mailingsAdicionados=[]
            for(let i = 0; i<mailings.length; i++) {
                const mailing={}               
                const idMailing = mailings[i].id
                const nomeMailing = mailings[i].nome
                const totalRegistros=mailings[i].totalNumeros-mailings[i].numerosInvalidos 
                const Improdutivas=await Discador.chamadasProdutividade_porMailing(empresa,0,idMailing)
                const Produtivas=await Discador.chamadasProdutividade_porMailing(empresa,1,idMailing)
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
            dash["dia"]=await Report.diaAtual()
            dash["Agentes"]=[]
        const agentes = await Discador.listarAgentesLogados(empresa)
            for(let i = 0; i<agentes.length; i++){ 
                const idAgente=agentes[i].id 
                const totalAtendimento=await Discador.totalAtendimentosAgente(empresa,idAgente)
                const Improdutivas=await Discador.chamadasProdutividade_Agente(empresa,0,idAgente)
                const Produtivas=await Discador.chamadasProdutividade_Agente(empresa,1,idAgente)
                const chManuais=await Discador.chamadasManuais_Agente(empresa,idAgente)
                const tempoFalado=await Discador.tempoFaladoAgente(empresa,idAgente)
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
                    const tabulando = await Report.statusTabulacaoChamada(empresa,idAgente)
                        if(tabulando==1){
                            estadoAgente=3.5
                        }
                    }else if(estadoAgente==6){
                        const falando = await Report.statusAtendimentoChamada(empresa,idAgente)
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
        let ligando = 0
        let falando = 0
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if(chamadasSimultaneas!==null){
            const chamando = chamadasSimultaneas.filter(chamadas => chamadas.event_chamando == 1)
            const na_fila = chamadasSimultaneas.filter(chamadas => chamadas.event_na_fila == 1)
            const conectadas = chamadasSimultaneas.filter(chamadas => chamadas.event_em_atendimento == 1)
            ligando = chamando.length + na_fila.length
            falando = conectadas.length
        }
        const realTime={}
              realTime['RealTimeChart']={}             
              realTime['RealTimeChart']['Ligando']=ligando
              realTime['RealTimeChart']['Falando']=falando
        return realTime
    }

    async realTimeCallsCampain(empresa,idCampanha){   
        let ligando = 0
        let falando = 0
        const chamadasSimultaneas = await Redis.getter(`${empresa}:chamadasSimultaneas`)
        if(chamadasSimultaneas !== null){
            const chamadasSimultaneasCampanha = chamadasSimultaneas.filter(chamadas => chamadas.id_campanha == idCampanha)
            const chamando = chamadasSimultaneasCampanha.filter(chamadas => chamadas.event_chamando == 1)
            const na_fila = chamadasSimultaneasCampanha.filter(chamadas => chamadas.event_na_fila == 1)
            const conectadas = chamadasSimultaneasCampanha.filter(chamadas => chamadas.event_em_atendimento == 1)
            ligando = chamando.length + na_fila.length
            falando = conectadas.length
        }
        const realTime={}
              realTime['RealTimeChart']={}
              realTime['RealTimeChart']['Ligando']=ligando
              realTime['RealTimeChart']['Falando']=falando
        return realTime
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

export default new Dashboard()