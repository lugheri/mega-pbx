import connect from '../Config/dbConnection';
import User from '../models/User';

class UserController{
   
    store(req,res){
        const { email, password } = req.body
    }  

    newUser(req,res){
        const dados = req.body
        User.newUser(dados,(e,r)=>{
            if(e) throw e
            res.json(r)
        })
    }

    listUsers(req,res){
        const status = parseInt(req.params.status)
        User.listUsers(status,(e,r)=>{
            if(e) throw e



            res.json(r)
        })
    }

   

    userData(req,res){
        const userId = parseInt(req.params.userId)
        User.userData(userId,(e,r)=>{
            if(e) throw e
            res.json(r)
        })
    }

    editUser(req,res){
       
        const userId = {"id":parseInt(req.params.userId)}
        const userData = req.body
        User.editUser(userId,userData,(e,r)=>{
            if(e) throw e
            res.json(r)
        })
    }

    //EQUIPES
    novaEquipe(req,res){
        const dados = req.body
        User.novaEquipe(dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    listEquipes(req,res){
        const status = parseInt(req.params.status);
        User.listEquipes(status,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    dadosEquipe(req,res){
        const idEquipe = parseInt(req.params.idEquipe)
        User.dadosEquipe(idEquipe,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    editEquipe(req,res){
        const idEquipe = {"id":parseInt(req.params.idEquipe)}
        const dados = req.body
        User.editEquipe(idEquipe,dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }


    //CARGOS
    novoCargo(req,res){
        const dados = req.body
        User.novoCargo(dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    listCargos(req,res){
        const status = parseInt(req.params.status);
        User.listCargos(status,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    dadosCargo(req,res){
        const idCargo = parseInt(req.params.idCargo)
        User.dadosCargo(idCargo,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    editCargo(req,res){        
        const idCargo = {"id":parseInt(req.params.idCargo)}
        const dados = req.body
        User.editCargo(idCargo,dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //NÍVEIS DE ACESSO
    novoNivel(req,res){
        const dados = req.body
        User.novoNivel(dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    listNiveis(req,res){
        const status = parseInt(req.params.status);
        User.listNiveis(status,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    dadosNivel(req,res){
        const idNivel = parseInt(req.params.idNivel)
        User.dadosNivel(idNivel,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    editNivel(req,res){
        const idNivel = {"id":parseInt(req.params.idNivel)}
        const dados = req.body
        User.editNivel(idNivel,dados,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //############################DASHBOARD###########################

  

}

export default new UserController();