"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv/config');

var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class SessionController{
    async store(req,res){
        const {usuario,senha} = req.body;

        await _User2.default.findUser(usuario,(erro,result)=>{
            if(erro) throw erro

            if(!result[0]){
                return res.json({userNotFound:'Usuário não encontrado!'})
            }else{    
                if(result[0].senha!=_md52.default.call(void 0, senha)){
                    return res.json({WrongPassword: 'Senha errada!'})
                }else{
                    const acao='login'
                    _User2.default.registraLogin(result[0].id,acao,(e,r)=>{
                        if(e) throw e

                        res.json({                    
                            token: _jsonwebtoken2.default.sign({userId:result[0].id},process.env.APP_SECRET,{
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
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const idUser = payload.userId
        const acao='logout'

        _User2.default.registraLogin(idUser,acao,(e,r)=>{

            token: _jsonwebtoken2.default.sign({userId:0},process.env.APP_SECRET,{
                expiresIn:'1m'
            })
            res.json(true)
        }) 
    }
}
exports. default = new SessionController()