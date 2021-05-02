import 'dotenv/config'; 

import md5 from 'md5';
import jwt from 'jsonwebtoken';

import User from '../models/User';


class SessionController{
    async store(req,res){
        const {usuario, senha } = req.body;
        
        const user = await User.findUser(usuario, (erro,result)=>{
            if(erro){
                return res.json('Query error');
            }else{
                
                if(!result[0])
                    return res.json({userNotFound: 'User not found'});
                
                if(result[0].senha!=md5(senha))
                    return res.json({WrongPassword: 'Wrong password'});
               
                return res.json({
                    token: jwt.sign({userId:result[0].id},process.env.APP_SECRET, {
                        expiresIn: '12h'
                    })
                })
            }    
        })            
    }

    validate(req, res){
        res.json(true);
    }
}

export default new SessionController()