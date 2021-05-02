"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class UserController{
   
    store(req,res){
        const { email, password } = req.body
    }  

    newUser(req,res){
        const dados = req.body
        _User2.default.newUser(dados,(e,r)=>{
            if(e) throw e
            res.json(r)
        })
    }

    listUsers(req,res){
        const status = parseInt(req.params.status)
        _User2.default.listUsers(status,(e,r)=>{
            if(e) throw e



            res.json(r)
        })
    }

   

    userData(req,res){
        const userId = parseInt(req.params.userId)
        _User2.default.userData(userId,(e,r)=>{
            if(e) throw e
            res.json(r)
        })
    }

    editUser(req,res){
       
        const userId = {"id":parseInt(req.params.userId)}
        const userData = req.body
        _User2.default.editUser(userId,userData,(e,r)=>{
            if(e) throw e
            res.json(r)
        })
    }

    //EQUIPES
    novaEquipe(req,res){
        const dados = req.body
        _User2.default.novaEquipe(dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    listEquipes(req,res){
        const status = parseInt(req.params.status);
        _User2.default.listEquipes(status,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    dadosEquipe(req,res){
        const idEquipe = parseInt(req.params.idEquipe)
        _User2.default.dadosEquipe(idEquipe,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    editEquipe(req,res){
        const idEquipe = {"id":parseInt(req.params.idEquipe)}
        const dados = req.body
        _User2.default.editEquipe(idEquipe,dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }


    //CARGOS
    novoCargo(req,res){
        const dados = req.body
        _User2.default.novoCargo(dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    listCargos(req,res){
        const status = parseInt(req.params.status);
        _User2.default.listCargos(status,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    dadosCargo(req,res){
        const idCargo = parseInt(req.params.idCargo)
        _User2.default.dadosCargo(idCargo,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    editCargo(req,res){        
        const idCargo = {"id":parseInt(req.params.idCargo)}
        const dados = req.body
        _User2.default.editCargo(idCargo,dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //NÍVEIS DE ACESSO
    novoNivel(req,res){
        const dados = req.body
        _User2.default.novoNivel(dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    listNiveis(req,res){
        const status = parseInt(req.params.status);
        _User2.default.listNiveis(status,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    dadosNivel(req,res){
        const idNivel = parseInt(req.params.idNivel)
        _User2.default.dadosNivel(idNivel,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    editNivel(req,res){
        const idNivel = {"id":parseInt(req.params.idNivel)}
        const dados = req.body
        _User2.default.editNivel(idNivel,dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //############################DASHBOARD###########################

  

}

exports. default = new UserController();