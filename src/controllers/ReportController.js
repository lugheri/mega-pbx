import Report from '../models/Report';
import User from '../models/User';

class ReportController{  
    async monitoramentoAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const parametros = req.params
        const monitoramentoAgentes = await Report.monitorarAgentes(empresa,parametros)
        res.json(monitoramentoAgentes)

    }

    async monitoramentoCampanhas(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        Report.monitorarCampanhas(empresa,idCampanha,(e,campanhas)=>{
            if(e) throw e;

            res.send(campanhas);
        })
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