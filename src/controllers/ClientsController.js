import Clients from "../models/Clients";

class ClientsController{
    //novo cliente

    
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