import Clients from "../models/Clients";

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
        const r = await Clients.newAccount(nomeEmpresa,prefixo,licenses,channelsUser,totalChannels,trunk,tech_prefix,type_dial,asterisk_server,asterisk_domain)
        res.json(r)

    }


    async getTrunk(req,res){
        const empresa = req.params.prefix
        const trunks = await Clients.getTrunk(empresa)
        res.json(trunks)        
    }

    async maxChannels(req,res){
        const empresa = req.params.prefix
        const maxChannels = await Clients.maxChannels(empresa)
        res.json(maxChannels)
    }

    async servers(req,res){
        const empresa = req.params.prefix
        const servers = await Clients.servers(empresa)
        res.json(servers)
    }
   
}

export default new ClientsController();