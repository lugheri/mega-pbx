import User from '../models/User';

class UserController{
   
    store(req,res){
        const { email, password } = req.body
    }  

    async newUser(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await User.newUser(empresa,dados)
        res.json(r)
    }

    async listUsers(req,res){
        const empresa = await User.getEmpresa(req)
        const status = parseInt(req.params.status)
        const r = await User.listUsers(empresa,status)
        res.json(r)
    }

    async userData(req,res){
        const empresa = await User.getEmpresa(req)
        const userId = parseInt(req.params.userId)
        const r = await User.userData(empresa,userId)
        res.json(r)
    }

    async editUser(req,res){
        const empresa = await User.getEmpresa(req)
        const userId = parseInt(req.params.userId)
        const userData = req.body
        const r = await User.editUser(empresa,userId,userData)
        res.json(r)
    }

    //EQUIPES
    async novaEquipe(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await User.novaEquipe(empresa,dados)
        res.json(r)
    }

    async listEquipes(req,res){
        const empresa = await User.getEmpresa(req)
        const status = parseInt(req.params.status);
        const r = await User.listEquipes(empresa,status)
        res.json(r)
    }

    async dadosEquipe(req,res){
        const empresa = await User.getEmpresa(req)
        const idEquipe = parseInt(req.params.idEquipe)
        const r = await User.dadosEquipe(empresa,idEquipe)
        res.json(r)
    }

    async editEquipe(req,res){
        const empresa = await User.getEmpresa(req)
        const idEquipe = {"id":parseInt(req.params.idEquipe)}
        const dados = req.body
        const r = await User.editEquipe(empresa,idEquipe,dados)
        res.json(r)
    }


    //CARGOS
    async novoCargo(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await User.novoCargo(empresa,dados)
        res.json(r)
    }

    async listCargos(req,res){
        const empresa = await User.getEmpresa(req)
        const status = parseInt(req.params.status);
        const r = await User.listCargos(empresa,status)
        res.json(r)
    }

    async dadosCargo(req,res){
        const empresa = await User.getEmpresa(req)
        const idCargo = parseInt(req.params.idCargo)
        const r = await User.dadosCargo(empresa,idCargo)
        res.json(r)
    }

    async editCargo(req,res){   
        const empresa = await User.getEmpresa(req)     
        const idCargo = {"id":parseInt(req.params.idCargo)}
        const dados = req.body
        const r = await User.editCargo(empresa,idCargo,dados)
        res.json(r)
    }

    //NÍVEIS DE ACESSO
    async novoNivel(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r = await User.novoNivel(empresa,dados)
        res.json(r)
    }

    async listNiveis(req,res){
        const empresa = await User.getEmpresa(req)
        const status = parseInt(req.params.status);
        const r = User.listNiveis(empresa,status)
        res.json(r)
    }

    async dadosNivel(req,res){
        const empresa = await User.getEmpresa(req)
        const idNivel = parseInt(req.params.idNivel)
        const r = await User.dadosNivel(empresa,idNivel)
        res.json(r)
    }
    async editNivel(req,res){
        const empresa = await User.getEmpresa(req)
        const idNivel = {"id":parseInt(req.params.idNivel)}
        const dados = req.body
        const r = await User.editNivel(empresa,idNivel,dados)
        res.json(r)
    }
    

    //############################DASHBOARD###########################
    

  

}

export default new UserController();