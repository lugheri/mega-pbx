"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv/config');

var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class SessionController{
    async store(req,res){
        const {usuario,senha} = req.body;

        const e = await _User2.default.findEmpresa(usuario);
        if(!e[0]){
            res.json({userNotFound:'Empresa não encontrada!'})
            return false
        }
        const empresa=e[0].prefix

        console.log('prefixo',empresa)

        const userData = await _User2.default.findUser(empresa,usuario)
        
        if(!userData[0]){
            return res.json({userNotFound:'Usuário não encontrado!'})
        }else{    
            if(userData[0].senha!=_md52.default.call(void 0, senha)){
                return res.json({WrongPassword: 'Senha errada!'})
            }else{
                const acao='login'
                const token = _jsonwebtoken2.default.sign({userId:userData[0].id,empresa:empresa},process.env.APP_SECRET,{
                    expiresIn:'12h'
                })
                await _User2.default.setToken(empresa,userData[0].id,token)
                await _User2.default.registraLogin(empresa,userData[0].id,acao)
                
                res.json({                    
                    token: token
                })
            }
        }
    }

    validate(req,res){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);


        res.json(payload)
    }

    async checkToken(req,res){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const ramal = payload.userId
        const empresa = payload.empresa
       
        const t = await _User2.default.checkToken(empresa,ramal,authHeader)
        res.json(t)

    }

    async logout(req,res){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const idUser = payload.userId
        const empresa = payload.empresa
        const acao='logout'

        await _User2.default.setToken(empresa,idUser,'')
        await _User2.default.registraLogin(empresa,idUser,acao)

        token: _jsonwebtoken2.default.sign({userId:0,empresa:0},process.env.APP_SECRET,{
            expiresIn:'1m'
        })
        res.json(true)
    }

  


}
exports. default = new SessionController()