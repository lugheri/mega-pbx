import 'dotenv/config';

import md5 from 'md5';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Clients from '../models/Clients'
import Redis from '../Config/Redis'
import moment from 'moment'

class SessionController{
    async store(req,res){      
       
        const {usuario,senha} = req.body;
        const e = await User.findEmpresa(usuario);

            
        
        if(!e[0]){
            res.json({userNotFound:'Empresa não encontrada!'})
            return false
        }
       
        const empresa=e[0].prefix
        const userData = await User.findUser(empresa,usuario)
        
        if(!userData[0]){
            return res.json({userNotFound:'Usuário não encontrado!'})
        }else{    
           
            if(userData[0].senha!=md5(senha)){
                return res.json({WrongPassword: 'Senha errada!'})
            }else{               
                const acao='login'
                const idAccount = await Clients.accountId(empresa)
                await Redis.setter('empresas',await Clients.clientesAtivos())

                const token = jwt.sign({userId:userData[0].id,empresa:empresa,idAccount:idAccount},process.env.APP_SECRET,{
                    expiresIn:'12h'
                })
                await User.setToken(empresa,userData[0].id,token)
                await User.registraLogin(empresa,userData[0].id,acao)
                
                //checa se contrato ja foi aceito 
                const signature = await Clients.signatureContract(empresa)
               
                if(signature['approved']==true){
                    res.json({                    
                        token: token
                    })
                }else{
                    if(userData[0].nivelAcesso>=3){
                        res.json({ "termo de uso":false,
                                   "fidelidade":signature['fidelidade'],
                                   "token": token})
                    }else{
                        res.json({ "error":true,"message":"Aguardando aceite dos termos de uso!"})
                    }
                }                             
            }
        }
    }

    async validate(req,res){
        const authHeader = req.headers.authorization;
        let payload = jwt.verify(authHeader, process.env.APP_SECRET);
        const now = moment(new Date())
        const empresa = payload['empresa']
        const ramal = payload['userId']
        await Redis.setter(`${ramal}:logado`,true,90)

        res.json(payload)
    }

    async checkToken(req,res){
        const authHeader = req.headers.authorization;
        const payload = jwt.verify(authHeader, process.env.APP_SECRET);
        const ramal = payload.userId
        const empresa = payload.empresa
       
        const t = await User.checkToken(empresa,ramal,authHeader)
        res.json(t)

    }

    async logout(req,res){
        const authHeader = req.headers.authorization;
        const payload = jwt.verify(authHeader, process.env.APP_SECRET);
        const idUser = payload.userId
        const empresa = payload.empresa
        const acao='logout'

        await User.setToken(empresa,idUser,'')
        await User.registraLogin(empresa,idUser,acao)

        token: jwt.sign({userId:0,empresa:0},process.env.APP_SECRET,{
            expiresIn:'1m'
        })
        res.json(true)
    }

  


}
export default new SessionController()