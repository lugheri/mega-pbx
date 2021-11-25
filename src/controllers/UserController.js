import User from '../models/User';
import Clients from '../models/Clients';
import Redis from '../Config/Redis'

class UserController{
   
    store(req,res){
        const { email, password } = req.body
    }  

    async newUser(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const licencas = await Clients.maxLicences(empresa)
        const totalAgentes = await User.totalAgentesAtivos(empresa)

        console.log('licencas',licencas)
        console.log('totalAgentes',totalAgentes)


        if(licencas<=totalAgentes){
            res.json({"error":true,"message":"Número máximo de licencas atingido!"})
            return false
        }
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

        

        if(userData.status==1){
            //verifica status anterior do agente 
            const status = await  User.statusAgente(empresa,userId)
            if(status==0){
                //Confere limites de usuarios 
                const licencas = await Clients.maxLicences(empresa)
                const totalAgentes = await User.totalAgentesAtivos(empresa)
                if(licencas<=totalAgentes){
                    res.json({"error":true,"message":"Número máximo de licencas atingido!"})
                    return false
                }
            }  
        }

        const r = await User.editUser(empresa,userId,userData)
        res.json(r)
    }

    async checkUsers(){
        console.log('\n',"CHECANDO USUARIOS")
        let clientesAtivos=await Redis.getter('empresas')    
        if(!clientesAtivos){
            clientesAtivos=await Clients.clientesAtivos()
            await Redis.setter('empresas',clientesAtivos,600)
        }       
        const clientes = clientesAtivos;  
        for(let i=0;i<clientes.length;++i){            
            const empresa = clientes[i].prefix
            console.log('\n',"Empresa:",empresa)
            await this.usuariosEmpresa(empresa)
        }
        setTimeout(async ()=>{             
            await this.checkUsers();
        },65000)
    }

    async usuariosEmpresa(empresa){
        const status=1
        const usuarios = await User.listUsers(empresa,status)
        for(let u=0;u<usuarios.length; u++){

            const idUser = usuarios[u].id
            console.log('\n',"Usuario:",idUser,usuarios[u].nome)
            const userStatus = await Redis.getter(`${idUser}:logado`)
            console.log('Status do ',usuarios[u].nome,userStatus)
            if(userStatus!==true){
                console.log('\n',"Deslogando Usuario:",idUser,usuarios[u].nome)
                await User.registraLogin(empresa,idUser,'logout')
                await Redis.delete(`${idUser}:logado`)
            }
        }
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
        
        const idEquipe = parseInt(req.params.idEquipe)
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
        const idCargo = parseInt(req.params.idCargo)
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
        const niveis = await User.listNiveis(empresa,status)
        res.json(niveis)
    }

    async dadosNivel(req,res){
        const empresa = await User.getEmpresa(req)
        const idNivel = parseInt(req.params.idNivel)
        const r = await User.dadosNivel(empresa,idNivel)
        res.json(r)
    }
    async editNivel(req,res){
        const empresa = await User.getEmpresa(req)
        const idNivel = parseInt(req.params.idNivel)
        const dados = req.body
        const r = await User.editNivel(empresa,idNivel,dados)
        res.json(r)
    }
    

    //############################DASHBOARD###########################
    

  

}

export default new UserController();