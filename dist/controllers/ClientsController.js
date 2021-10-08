"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);

class ClientsController{
    //novo cliente
    async newAccount(req,res){
        const nomeEmpresa = req.body.nomeEmpresa
        const prefixo = req.body.prefixo
        const licenses  = req.body.licenses
        const channelsUser = req.body.channelsUser
        const trunk = req.body.trunk
        const tech_prefix = req.body.tech_prefix
        const type_dial = req.body.type_dial
        const asterisk_server = req.body.asterisk_server
        const asterisk_domain = req.body.asterisk_domain
        const totalChannels = channelsUser*licenses
        console.log(nomeEmpresa)
        const r = await _Clients2.default.newAccount(nomeEmpresa,prefixo,licenses,channelsUser,totalChannels,trunk,tech_prefix,type_dial,asterisk_server,asterisk_domain)
        res.json(r)

    }


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