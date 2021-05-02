"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);

class ReportController{

        criarRelatorio(req,res){
            const data = req.body
            _Report2.default.criarRelatorio(data,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })

        }

        listarRelatorios(req,res){
            _Report2.default.listarRelatorios((e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        infoRelatorio(req,res){
            const idRelatorio = parseInt(req.params.idRelatorio)
            _Report2.default.infoRelatorio(idRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        editarRelatorio(req,res){
            const idRelatorio = parseInt(req.params.idRelatorio)
            const dados = req.body
            _Report2.default.editarRelatorio(idRelatorio,dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })

        }

        addCampoDisponiveis(req,res){
            const dados = req.body
            _Report2.default.addCampoDisponiveis(dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        listCamposDisponiveis(req,res){
            _Report2.default.listCamposDisponiveis((e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        editarCampoDisponiveis(req,res){
            const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
            const dados = req.body
            _Report2.default.editarCampoDisponiveis(idCampoDisponivel,dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        delCampoDisponiveis(req,res){
            const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
            _Report2.default.delCampoDisponiveis(idCampoDisponivel,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })

        }



        addCampoRelatorio(req,res){
            const dados = req.body
            _Report2.default.addCampoRelatorio(dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        listarCamposRelatorio(req,res){
            const idRelatorio = parseInt(req.params.idRelatorio)
            _Report2.default.listarCamposRelatorio(idRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        infoCamposRelatorio(req,res){
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            _Report2.default.infoCamposRelatorio(idCampoRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        editCampoRelatorio(req,res){
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const dados = req.body
            _Report2.default.editCampoRelatorio(idCampoRelatorio,dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        delCampoRelatorio(req,res){
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            _Report2.default.delCampoRelatorio(idCampoRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }
}

exports. default = new ReportController();