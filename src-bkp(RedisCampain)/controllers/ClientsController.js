import Clients from "../models/Clients";
import User from '../models/User';

class ClientsController{
    //TRUNKS
    async createTrunk(req,res){
        const conta=req.body.conta
        const ip_provider=req.body.ip_provider
        const tech_prefix=req.body.tech_prefix
        const type_dial=req.body.type_dial
        const contact = `sip:${ip_provider}`
        const qualify_frequency=req.body.qualify_frequency
        const max_contacts=req.body.max_contacts
        const context=req.body.context
        const server_ip=req.body.server_ip
        const dtmf_mode=req.body.dtmf_mode
        const force_rport=req.body.force_rport
        const disallow=req.body.disallow
        const allow=req.body.allow
        const rtp_symmetric=req.body.rtp_symmetric
        const rewrite_contact=req.body.rewrite_contact
        const direct_media=req.body.direct_media
        const allow_subscribe=req.body.allow_subscribe
        const transport=req.body.transport

        //Registrando tronco no sistema 
        const r = await Clients.registerTrunk(conta,ip_provider,tech_prefix,type_dial,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport)
        if(r['error']==true){
            res.json(r)
        }
        //Criando tronco no asterisk
        await Clients.createTrunk(conta,ip_provider,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport)
        res.json(true)
    }













    //TRUNKS
    
    async listTrunks(req,res){
        const troncos = await Clients.listTrunks()
        res.json(troncos)
    }
    async infoTrunk(req,res){
        const conta=req.params.conta
        const troncos = await Clients.infoTrunk(conta)
        res.json(troncos)
    }
    async editTrunk(req,res){
        const conta=req.params.conta
        const ip_provider=req.body.ip_provider
        const tech_prefix=req.body.tech_prefix
        const type_dial=req.body.type_dial
        const contact = `sip:${ip_provider}`
        const qualify_frequency=req.body.qualify_frequency
        const max_contacts=req.body.max_contacts
        const context=req.body.context
        const server_ip=req.body.server_ip
        const dtmf_mode=req.body.dtmf_mode
        const force_rport=req.body.force_rport
        const disallow=req.body.disallow
        const allow=req.body.allow
        const rtp_symmetric=req.body.rtp_symmetric
        const rewrite_contact=req.body.rewrite_contact
        const direct_media=req.body.direct_media
        const allow_subscribe=req.body.allow_subscribe
        const transport=req.body.transport
        //Registrando tronco no sistema 
        const r = await Clients.updateRegisterTrunk(conta,ip_provider,tech_prefix,type_dial,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport)
        if(r['error']==true){
            res.json(r)
        }
        //Criando tronco no asterisk
        await Clients.updateCreateTrunk(conta,ip_provider,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport)
        res.json(true)
    }
    async deleteTrunk(req,res){
        const conta=req.params.conta
        await Clients.deleteRegisterTrunk(conta)
        await Clients.deleteTrunk(conta)
        res.json(true)
    }

    //SERVIDOR 
    async createServer(req,res){
        const nome_dominio=req.body.nome_dominio
        const ip_servidor=req.body.ip_servidor
        const tipo=req.body.tipo
        const status=req.body.status
        const r = await Clients.createServer(nome_dominio,ip_servidor,tipo,status)
        if(r['error']==true){
            res.json(r)
        }
        res.json(true)
    }
    async listServers(req,res){
        const servidores = await Clients.listServers()
        res.json(servidores)
    }
    async infoServer(req,res){
        const idServer =req.params.idServer
        const servidores = await Clients.infoServer(idServer)
        res.json(servidores)
    }    
    async updateServer(req,res){
        const idServer =req.params.idServer
        const nome_dominio=req.body.nome
        const ip_servidor=req.body.ip
        const tipo=req.body.tipo
        const status=req.body.status
        await Clients.updateServer(idServer,nome_dominio,ip_servidor,tipo,status)
        res.json(true)
    }    
    async deleteServer(req,res){
        const idServer =req.params.idServer
        await Clients.deleteServer(idServer)
        res.json(true)
    }
    
    /*async acceptContract(req,res){
        const empresa = await User.getEmpresa(req)
        const r = await Clients.acceptContract(empresa)
        res.json(r)
    }*/

    //novo cliente
    async newAccount(req,res){
        console.log('newAccount')
        const nomeEmpresa = req.body.nomeEmpresa
        const mega = req.body.mega
        const prefixo = req.body.prefixo
        const fidelidade = req.body.fidelidade
        const licenses  = req.body.licenses
        const channelsUser = req.body.channelsUser
        const trunk = req.body.conta_trunk

        const infoTrunk = await Clients.infoTrunk(trunk)
        let tech_prefix = ""
        let type_dial = ""
        if(infoTrunk.length>0){
            tech_prefix = infoTrunk[0].tech_prefix        
            type_dial = infoTrunk[0].type_dial
        }
        const type_server = req.body.type_server
        const totalChannels = channelsUser*licenses
        console.log('newAccount')
        const r = await Clients.newAccount(mega,nomeEmpresa,prefixo,fidelidade,licenses,channelsUser,totalChannels, trunk, tech_prefix, type_dial,type_server)
                                
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

    async listarClientes(req,res){
        const pag = req.params.pag
        const reg = req.params.reg
        const clientes = await Clients.listarClientes(pag,reg)
        res.json(clientes)
    }
    async infoCliente(req,res){
        const idCliente = req.params.idCliente
        const clientes = await Clients.infoCliente(idCliente)
        res.json(clientes)
    }
    async editarCliente(req,res){
        const idCliente = req.params.idCliente
        const nomeEmpresa = req.body.nomeEmpresa
        const fidelidade = req.body.fidelidade
        const licenses  = req.body.licenses
        const channelsUser = req.body.channelsUser
        const totalChannels = channelsUser*licenses
        const trunk = req.body.conta_trunk
        const infoTrunk = await Clients.infoTrunk(trunk)
        let tech_prefix = ""
        let type_dial = ""
        if(infoTrunk.length>0){
            tech_prefix = infoTrunk[0].tech_prefix        
            type_dial = infoTrunk[0].type_dial
        }
        let asterisk_server = ""
        let asterisk_domain= ""
        const idServer = req.body.id_servidor
        const infoServer = await Clients.infoServer(idServer)
        if(infoServer.length>0){
            asterisk_server = infoServer[0].ip        
            asterisk_domain = infoServer[0].nome
        }
     

        const clientes = await Clients.editarCliente(idCliente,nomeEmpresa,fidelidade,licenses,channelsUser,totalChannels,trunk,tech_prefix,type_dial,idServer,asterisk_server,asterisk_domain)
        res.json(true)
    }
    async desativarCliente(req,res){
        const idCliente = req.params.idCliente
        await Clients.desativarCliente(idCliente)
        res.json(true)
    }
   
}

export default new ClientsController();