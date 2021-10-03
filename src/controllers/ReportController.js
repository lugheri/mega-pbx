import Report from '../models/Report';
import User from '../models/User';
import Pausas from '../models/Pausas';

class ReportController{  
    async relatorioPausas(req,res){
        const empresa = await User.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const logados = req.body.logados
        const pagina = req.body.pagina

        const relatorioPausas = []       
        const agentesAtivos = await Report.filtrarAgentes(empresa,dataInicio,dataFinal,1,false,ramal,logados,pagina)
       
        for(let i=0; i<agentesAtivos.length; i++){
            const agente = {}
            const idAgente = agentesAtivos[i].id
                  agente['ramal']=idAgente
                  agente['nomeAgente']=agentesAtivos[i].nome
                  //Listar pausas 
                  const pausas = await Pausas.listarPausas(empresa)
                  for(let p=0; p<pausas.length;p++){
                      const idPausa = pausas[p].id                     
                      const tempoPausa = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,idAgente)
                      agente[`${pausas[p].nome}`] = await Report.converteSeg_tempo(tempoPausa)
                  }
            const totalPausasAgente = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,false,idAgente)
                  agente['total']=await Report.converteSeg_tempo(totalPausasAgente)
            
            relatorioPausas.push(agente)
        }
        //Ultima Linha
        const linhaFinal = {}
              linhaFinal['ramal']="Total"
              linhaFinal["nomeAgente"]=""
              const pausas = await Pausas.listarPausas(empresa)
              for(let p=0; p<pausas.length;p++){
                const idPausa = pausas[p].id                     
                const tempoPausa = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,false)
                linhaFinal[`${pausas[p].nome}`] = await Report.converteSeg_tempo(tempoPausa)
              }
        const totalPausas = await Report.calculaTempoPausa(empresa,dataInicio,dataFinal,false,false)
              linhaFinal["total"]= await Report.converteSeg_tempo(totalPausas)
        
        relatorioPausas.push(linhaFinal)

        return res.json(relatorioPausas)
    }







    


    async monitoramentoAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const parametros = req.params
        const monitoramentoAgentes = await Report.monitorarAgentes(empresa,parametros)
        res.json(monitoramentoAgentes)
    }

    async monitoramentoCampanhas(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const monitoramentoCampanhas = await Report.monitorarCampanhas(empresa,idCampanha)
        res.send(monitoramentoCampanhas);
    }

    

    async detalhamentoChamadas(req,res){
        const empresa = await User.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const ramal = req.body.ramal
        const campanha = req.body.campanha
        const numero = req.body.numero

    }

    async loginXLogout(req,res){
        const empresa = await User.getEmpresa(req)
        const dataInicio  = req.body.dataInicio
        const dataFinal  = req.body.dataFinal
        const tipoBusca  = req.body.tipoBusca
    }








    async filtroCampanhas(req,res){
        const empresa = await User.getEmpresa(req)
        const campanhas = await Report.filtroCampanhas(empresa)
        res.json(campanhas)
    } 
    
    async filtroEquipes(req,res){
        const empresa = await User.getEmpresa(req)
        const equipes = await Report.filtroEquipes(empresa)
        res.json(equipes)
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