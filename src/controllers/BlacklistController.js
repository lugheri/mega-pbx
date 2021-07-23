import Blacklist from '../models/Blacklist';


class BlacklistController{
    async novaLista(req,res){
        const dados = req.body
        await Blacklist.novaLista(dados)
        res.json(true)
    }

    async listarBlacklists(req,res){
        const blacklists = await Blacklist.listarBlacklists()
        res.json(blacklists)
    }

    async verDadosLista(req,res){
        const idLista = req.params.idLista
        const blacklists = await Blacklist.verDadosLista(idLista)
        res.json(blacklists)
    }

    async editarDadosLista(req,res){
        const idLista = req.params.idLista
        const dados = req.body
        await Blacklist.editarDadosLista(idLista,dados)
        res.json(true)
    }

    async removerLista(req,res){
        const idLista = req.params.idLista
        await Blacklist.removerBlacklist(idLista)
        res.json(true)
    }

    async importarNumeros(req,res){  
        const idLista = req.body.idLista
        const file = req.file.path       
        const retorno={}
              retorno['registrosImportados']=await Blacklist.importarNumeros(idLista,file)
       
        res.json(retorno)
    }

    modeloArquivo(req,res){ 
        Blacklist.modeloArquivo(res)
    }

    async addNumero(req,res){
        const dados = req.body
        const r=await Blacklist.addNumero(dados)
        res.json(r)
    }

    async buscarNumero(req,res){
        const idLista = req.params.idLista
        const numero = req.params.numero
        const rows = await Blacklist.buscarNumero(idLista,numero)
        res.json(rows)
    }

    async numerosBloqueados(req,res){
        const idLista = req.params.idLista
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        const rows = await Blacklist.numerosBloqueados(inicio,limit)
        res.json(rows)

    }    

    async removerNumero(req,res){
        const idLista = req.params.idLista
        const numero = req.params.numero
        await Blacklist.removerNumero(idLista,numero)
        res.json(true)        
    }

    async addBlacklistCampanha(req,res){
        const idBlacklist = req.body.idBlacklist
        const idCampanha = req.body.idCampanha
        const rt= await Blacklist.addBlacklistCampanha(idBlacklist,idCampanha)
        res.json(rt)      
    }

    async blacklistsCampanha(req,res){
        const idCampanha = req.params.idCampanha
        const blacklists= await Blacklist.blacklistsCampanha(idCampanha)
        res.json(blacklists)      
    }

    async removerBlacklistCampanha(req,res){
        const idBlacklist = req.params.idBlacklist
        const idCampanha = req.params.idCampanha
        await Blacklist.removerBlacklistCampanha(idBlacklist,idCampanha)
        res.json(true)    
    }
}

export default new BlacklistController();