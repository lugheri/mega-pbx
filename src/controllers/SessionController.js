import 'dotenv/config';

import md5 from 'md5';
import jwt from 'jsonwebtoken';
import User from '../models/User';

class SessionController{
    async store(req,res){
        const {usuario,senha} = req.body;

        const e = await User.findEmpresa(usuario);
        if(!e[0]){
            res.json({userNotFound:'Empresa não encontrada!'})
            return false
        }
        const empresa=e[0].prefix

        console.log('prefixo',empresa)

        const userData = await User.findUser(empresa,usuario)
        
        if(!userData[0]){
            return res.json({userNotFound:'Usuário não encontrado!'})
        }else{    
            if(userData[0].senha!=md5(senha)){
                return res.json({WrongPassword: 'Senha errada!'})
            }else{
                const acao='login'
                await User.registraLogin(empresa,userData[0].id,acao)
                
                res.json({                    
                    token: jwt.sign({userId:userData[0].id,empresa:empresa},process.env.APP_SECRET,{
                        expiresIn:'12h'
                    })
                })
            }
        }
    }

    validate(req,res){
        const authHeader = req.headers.authorization;
        const payload = jwt.verify(authHeader, process.env.APP_SECRET);


        res.json(payload)
    }

    async logout(req,res){
        const authHeader = req.headers.authorization;
        const payload = jwt.verify(authHeader, process.env.APP_SECRET);
        const idUser = payload.userId
        const empresa = payload.empresa
        const acao='logout'

        await User.registraLogin(empresa,idUser,acao)

        token: jwt.sign({userId:0,empresa:0},process.env.APP_SECRET,{
            expiresIn:'1m'
        })
        res.json(true)
    }

  


}
export default new SessionController()