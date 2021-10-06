"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class UserController{
   
    store(req,res){
        const { email, password } = req.body
    }  

    async newUser(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _User2.default.newUser(empresa,dados)
        res.json(r)
    }

    async listUsers(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const status = parseInt(req.params.status)
        const r = await _User2.default.listUsers(empresa,status)
        res.json(r)
    }

    async userData(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const userId = parseInt(req.params.userId)
        const r = await _User2.default.userData(empresa,userId)
        res.json(r)
    }

    async editUser(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const userId = parseInt(req.params.userId)
        const userData = req.body
        const r = await _User2.default.editUser(empresa,userId,userData)
        res.json(r)
    }

    

    //EQUIPES
    async novaEquipe(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _User2.default.novaEquipe(empresa,dados)
        res.json(r)
    }

    async listEquipes(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const status = parseInt(req.params.status);
        const r = await _User2.default.listEquipes(empresa,status)
        res.json(r)
    }

    async dadosEquipe(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idEquipe = parseInt(req.params.idEquipe)
        const r = await _User2.default.dadosEquipe(empresa,idEquipe)
        res.json(r)
    }

    async editEquipe(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        
        const idEquipe = parseInt(req.params.idEquipe)
        const dados = req.body
        const r = await _User2.default.editEquipe(empresa,idEquipe,dados)
        res.json(r)
    }


    //CARGOS
    async novoCargo(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _User2.default.novoCargo(empresa,dados)
        res.json(r)
    }

    async listCargos(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const status = parseInt(req.params.status);
        const r = await _User2.default.listCargos(empresa,status)
        res.json(r)
    }

    async dadosCargo(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCargo = parseInt(req.params.idCargo)
        const r = await _User2.default.dadosCargo(empresa,idCargo)
        res.json(r)
    }

    async editCargo(req,res){   
        const empresa = await _User2.default.getEmpresa(req)     
        const idCargo = parseInt(req.params.idCargo)
        const dados = req.body
        const r = await _User2.default.editCargo(empresa,idCargo,dados)
        res.json(r)
    }

    //NÍVEIS DE ACESSO
    async novoNivel(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r = await _User2.default.novoNivel(empresa,dados)
        res.json(r)
    }

    async listNiveis(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const status = parseInt(req.params.status);
        const niveis = await _User2.default.listNiveis(empresa,status)
        res.json(niveis)
    }

    async dadosNivel(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idNivel = parseInt(req.params.idNivel)
        const r = await _User2.default.dadosNivel(empresa,idNivel)
        res.json(r)
    }
    async editNivel(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idNivel = parseInt(req.params.idNivel)
        const dados = req.body
        const r = await _User2.default.editNivel(empresa,idNivel,dados)
        res.json(r)
    }
    

    //############################DASHBOARD###########################
    

  

}

exports. default = new UserController();