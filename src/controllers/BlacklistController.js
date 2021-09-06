import Blacklist from '../models/Blacklist';
import User from '../models/User';


class BlacklistController{
    async novaLista(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        await Blacklist.novaLista(empresa,dados)
        res.json(true)
    }

    async listarBlacklists(req,res){
        const empresa = await User.getEmpresa(req)
        const blacklists = await Blacklist.listarBlacklists(empresa)
        res.json(blacklists)
    }

    async verDadosLista(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const blacklists = await Blacklist.verDadosLista(empresa,idLista)
        res.json(blacklists)
    }

    async editarDadosLista(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const dados = req.body
        await Blacklist.editarDadosLista(empresa,idLista,dados)
        res.json(true)
    }

    async removerLista(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        await Blacklist.removerBlacklist(empresa,idLista)
        res.json(true)
    }

    async importarNumeros(req,res){  
        const empresa = await User.getEmpresa(req)
        const idLista = req.body.idLista
        const file = req.file.path       
        const retorno={}
              retorno['registrosImportados']=await Blacklist.importarNumeros(empresa,idLista,file)
       
        res.json(retorno)
    }

    modeloArquivo(req,res){ 
        Blacklist.modeloArquivo(res)
    }

    async addNumero(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const r=await Blacklist.addNumero(empresa,dados)
        res.json(r)
    }

    async buscarNumero(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const numero = req.params.numero
        const rows = await Blacklist.buscarNumero(empresa,idLista,numero)
        res.json(rows)
    }

    async numerosBloqueados(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        const rows = await Blacklist.numerosBloqueados(empresa,inicio,limit)
        res.json(rows)

    }    

    async removerNumero(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const numero = req.params.numero
        await Blacklist.removerNumero(empresa,idLista,numero)
        res.json(true)        
    }

    async addBlacklistCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idBlacklist = req.body.idBlacklist
        const idCampanha = req.body.idCampanha
        const rt= await Blacklist.addBlacklistCampanha(empresa,idBlacklist,idCampanha)
        res.json(rt)      
    }

    async blacklistsCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idCampanha = req.params.idCampanha
        const blacklists= await Blacklist.blacklistsCampanha(empresa,idCampanha)
        res.json(blacklists)      
    }

    async removerBlacklistCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const idBlacklist = req.params.idBlacklist
        const idCampanha = req.params.idCampanha
        await Blacklist.removerBlacklistCampanha(empresa,idBlacklist,idCampanha)
        res.json(true)    
    }
}

export default new BlacklistController();