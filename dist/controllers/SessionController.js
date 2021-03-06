"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv/config');

var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);
var _Redis = require('../Config/Redis'); var _Redis2 = _interopRequireDefault(_Redis);

class SessionController{
    async store(req,res){          
        const {usuario,senha} = req.body;
        const e = await _User2.default.findEmpresa(usuario);
        
        if(!e[0]){
            res.json({userNotFound:'Empresa não encontrada!'})
            return false
        }
       
        const empresa=e[0].prefix
        const userData = await _User2.default.findUser(empresa,usuario)
        
        if(!userData[0]){
            return res.json({userNotFound:'Usuário não encontrado!'})
        }else{    
           
            if(userData[0].senha!=_md52.default.call(void 0, senha)){
                return res.json({WrongPassword: 'Senha errada!'})
            }else{               
                const acao='login'
                const idAccount = await _Clients2.default.accountId(empresa)
                await _Redis2.default.setter('empresas',await _Clients2.default.clientesAtivos())

                const token = _jsonwebtoken2.default.sign({userId:userData[0].id,empresa:empresa,idAccount:idAccount},process.env.APP_SECRET,{
                    expiresIn:'12h'
                })
                await _User2.default.setToken(empresa,userData[0].id,token)
                await _User2.default.registraLogin(empresa,userData[0].id,acao)
                
                //checa se contrato ja foi aceito 
                const signature = await _Clients2.default.signatureContract(empresa)
               
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