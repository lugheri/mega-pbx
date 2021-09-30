import connect from '../Config/dbConnection'
import Discador from '../models/Discador'
import Campanhas from '../models/Campanhas'


class Dashboard{

    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async painel(empresa){
        const agentesLogados = await Discador.agentesLogados(empresa)
        const totalCampanhasAtivas = await Campanhas.totalCampanhasAtivas(empresa)
        const produtivas = await Discador.chamadasProdutividade_CampanhasAtivas(empresa,1)
        const improdutivas = await Discador.chamadasProdutividade_CampanhasAtivas(empresa,0)
        const totalChamadas = await Discador.totalChamadas_CampanhasAtivas(empresa)
        const percentual_produtivas = Math.round((produtivas / totalChamadas)*100)
        const ag_Disponiveis = await Discador.agentesPorEstado(empresa,1)
        const ag_emPausa = await Discador.agentesPorEstado(empresa,2)
        const ag_emLigacao = await Discador.agentesPorEstado(empresa,3)        
        const ag_emTela = await Discador.agentesPorEstado(empresa,5)
        const ag_chamadaManual = await Discador.agentesPorEstado(empresa,6)
        const naoContatados = await Discador.chamadasPorContato_CampanhasAtivas(empresa,'N')
        const contatados = await Discador.chamadasPorContato_CampanhasAtivas(empresa,'S')
        const emAtendimento = await Discador.chamadasEmAtendimento(empresa)       
        
        const dash={}
              dash['sinteticos']={}
              dash['sinteticos']['AgentesLogados']=agentesLogados        
              dash['sinteticos']['CampanhasAtivas']=totalCampanhasAtivas[0].total        
              dash['sinteticos']['Produtivas']=`${percentual_produtivas}%`
              dash['sinteticos']['TotalDeChamadas']=totalChamadas
              dash['sinteticos']['AnotherKpis']={}
              dash['sinteticos']['AnotherKpis']['TabulacoesProdutivas']=produtivas
              dash['sinteticos']['AnotherKpis']['TabulacoesImprodutivas']=improdutivas
              dash['sinteticos']['AnotherKpis']['AgentesEmPausa']=ag_emPausa
              dash['sinteticos']['AnotherKpis']['AgentesEmLigacao']=ag_emLigacao+ag_chamadaManual+ag_emTela
              dash['sinteticos']['AnotherKpis']['AgentesDisponiveis']=ag_Disponiveis
              dash['sinteticos']['AnotherKpis']['LigacoesAbandonadasNoTotal']=0
              dash['sinteticos']['AnotherKpis']['NaoContatados']=naoContatados
              dash['sinteticos']['AnotherKpis']['Contatados']=contatados
              dash['sinteticos']['AnotherKpis']['ChamadasEmAtendimento']=emAtendimento

        const totais = await Discador.logChamadasSimultaneas(empresa,'total',20)
        const conectadas = await Discador.logChamadasSimultaneas(empresa,'conectadas',20)
        const manuais = await Discador.logChamadasSimultaneas(empresa,'manuais',20)
              dash['RealTimeChart']={}
              dash['RealTimeChart']['Totais']={}
              dash['RealTimeChart']['Totais']['data']=totais
              dash['RealTimeChart']['Conectados']={}
              dash['RealTimeChart']['Conectados']['data']=conectadas
              dash['RealTimeChart']['Manuais']={}
              dash['RealTimeChart']['Manuais']['data']=manuais

        const campanhasAtivas = await Campanhas.listarCampanhasAtivas(empresa)
              
            dash["Campanhas"]={}
            for(let i = 0; i<campanhasAtivas.length; i++) {
                const statusCampanha=await Discador.statusCampanha(empresa,campanhasAtivas[i].id)
                const totalRegistros=await Campanhas.totalRegistrosCampanha(empresa,campanhasAtivas[i].id)
                const idMailing = await Campanhas.listarMailingCampanha(empresa,campanhasAtivas[i].id) 
                const Improdutivas=await Discador.chamadasProdutividade_porCampanha(empresa,campanhasAtivas[i].id,0,idMailing[0].idMailing)
                const Produtivas=await Discador.chamadasProdutividade_porCampanha(empresa,campanhasAtivas[i].id,1,idMailing[0].idMailing)
                const Trabalhados=Improdutivas+Produtivas
                const PercentualTrabalhado=Math.round((Trabalhados / totalRegistros[0].total)*100)
                dash["Campanhas"]["nomeCampanha"]=campanhasAtivas[i].nome
                dash["Campanhas"]["idCampanha"]=campanhasAtivas[i].id
                dash["Campanhas"]["statusCampanha"]=statusCampanha[0].estado
                dash["Campanhas"]["descricaoCampanha"]=campanhasAtivas[i].descricao
                dash["Campanhas"]["totalRegistros"]=totalRegistros[0].total
                dash["Campanhas"]["PercentualTrabalhado"]=`${PercentualTrabalhado}%`
                dash["Campanhas"]["Improdutivas"]=Improdutivas
                dash["Campanhas"]["Produtivas"]=Produtivas
                dash["Campanhas"]["Trabalhado"]=Trabalhados
            }

        const mailings = await Campanhas.listarMailingCampanhasAtivas(empresa)
            dash["Mailings"]={}
            for(let i = 0; i<mailings.length; i++) {
                const idMailing = mailings[i].id
                const nomeMailing = mailings[i].nome
                const totalRegistros=mailings[i].totalReg
                const Improdutivas=await Discador.chamadasProdutividade_porMailing(empresa,0,idMailing)
                const Produtivas=await Discador.chamadasProdutividade_porMailing(empresa,1,idMailing)

                dash["Mailings"]["nameMailing"]=nomeMailing
                dash["Mailings"]["data"]={}
                dash["Mailings"]["data"]["Produtivo"]=[]
                dash["Mailings"]["data"]["Improdutivo"]=[]
                dash["Mailings"]["data"]["NaoTrabalhado"]=[]
            }

            dash["Agentes"]={}
            dash["Agentes"]["idAgente"]=0
            dash["Agentes"]["nomeAgente"]="NOME"
            dash["Agentes"]["ProdutividadeAgente"]=75           
              

        return dash
        
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