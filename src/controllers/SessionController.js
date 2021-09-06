import 'dotenv/config';

import md5 from 'md5';
import jwt from 'jsonwebtoken';
import User from '../models/User';

class SessionController{
    async store(req,res){
        const {usuario,senha} = req.body;

        const userData = await User.findUser(usuario)
        
        if(!userData[0]){
            return res.json({userNotFound:'Usuário não encontrado!'})
        }else{    
            if(userData[0].senha!=md5(senha)){
                return res.json({WrongPassword: 'Senha errada!'})
            }else{
                const acao='login'
                await User.registraLogin(userData[0].id,userData[0].empresa,acao)
                
                res.json({                    
                    token: jwt.sign({userId:userData[0].id,empresa:userData[0].empresa},process.env.APP_SECRET,{
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

        await User.registraLogin(idUser,empresa,acao)

        token: jwt.sign({userId:0,empresa:0},process.env.APP_SECRET,{
            expiresIn:'1m'
        })
        res.json(true)
    }

  


}
export default new SessionController()