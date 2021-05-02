import 'dotenv/config';

import md5 from 'md5';
import jwt from 'jsonwebtoken';

import User from '../models/User';

class SessionController{
    async store(req,res){
        const {usuario,senha} = req.body;

        await User.findUser(usuario,(erro,result)=>{
            if(erro) throw erro

            if(!result[0]){
                return res.json({userNotFound:'Usuário não encontrado!'})
            }else{    
                if(result[0].senha!=md5(senha)){
                    return res.json({WrongPassword: 'Senha errada!'})
                }else{
                    const acao='login'
                    User.registraLogin(result[0].id,acao,(e,r)=>{
                        if(e) throw e

                        res.json({                    
                            token: jwt.sign({userId:result[0].id},process.env.APP_SECRET,{
                                expiresIn:'12h'
                            })
                        })
                    })    
                    
                }
            }
        })
    }

    validate(req,res){
        res.json(true)
    }

    logout(req,res){
        const authHeader = req.headers.authorization;
        const payload = jwt.verify(authHeader, process.env.APP_SECRET);
        const idUser = payload.userId
        const acao='logout'

        User.registraLogin(idUser,acao,(e,r)=>{

            token: jwt.sign({userId:0},process.env.APP_SECRET,{
                expiresIn:'1m'
            })
            res.json(true)
        }) 
    }
}
export default new SessionController()