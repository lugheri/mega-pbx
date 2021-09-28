"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class ReportController{  
    async monitoramentoAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        const idEquipe = parseInt(req.params.idEquipe)
        const idUser = parseInt(req.params.idUser)
        const agentes = await _Report2.default.monitorarAgentes(empresa,idCampanha,idEquipe,idUser)
        res.json(agentes)
    }

    async monitoramentoCampanhas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = parseInt(req.params.idCampanha)
        _Report2.default.monitorarCampanhas(empresa,idCampanha,(e,campanhas)=>{
            if(e) throw e;

            res.send(campanhas);
        })
    }



    async filtroCampanhas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const campanhas = await _Report2.default.filtroCampanhas(empresa)
        res.json(campanhas)
    } 
    
    async filtroEquipes(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const equipes = await _Report2.default.filtroEquipes(empresa)
        res.json(equipes)
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