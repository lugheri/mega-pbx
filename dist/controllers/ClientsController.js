"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);

class ClientsController{
    //novo cliente

    
    async getTrunk(req,res){
        const empresa = req.params.prefix
        const trunks = await _Clients2.default.getTrunk(empresa)
        res.json(trunks)        
    }

    async maxChannels(req,res){
        const empresa = req.params.prefix
        const maxChannels = await _Clients2.default.maxChannels(empresa)
        res.json(maxChannels)
    }

    async servers(req,res){
        const empresa = req.params.prefix
        const servers = await _Clients2.default.servers(empresa)
        res.json(servers)
    }
   
}

exports. default = new ClientsController();