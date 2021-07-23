"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Blacklist = require('../models/Blacklist'); var _Blacklist2 = _interopRequireDefault(_Blacklist);


class BlacklistController{
    async novaLista(req,res){
        const dados = req.body
        await _Blacklist2.default.novaLista(dados)
        res.json(true)
    }

    async listarBlacklists(req,res){
        const blacklists = await _Blacklist2.default.listarBlacklists()
        res.json(blacklists)
    }

    async verDadosLista(req,res){
        const idLista = req.params.idLista
        const blacklists = await _Blacklist2.default.verDadosLista(idLista)
        res.json(blacklists)
    }

    async editarDadosLista(req,res){
        const idLista = req.params.idLista
        const dados = req.body
        await _Blacklist2.default.editarDadosLista(idLista,dados)
        res.json(true)
    }

    async removerLista(req,res){
        const idLista = req.params.idLista
        await _Blacklist2.default.removerBlacklist(idLista)
        res.json(true)
    }

    async importarNumeros(req,res){  
        const idLista = req.body.idLista
        const file = req.file.path       
        const retorno={}
              retorno['registrosImportados']=await _Blacklist2.default.importarNumeros(idLista,file)
       
        res.json(retorno)
    }

    modeloArquivo(req,res){ 
        _Blacklist2.default.modeloArquivo(res)
    }

    async addNumero(req,res){
        const dados = req.body
        const r=await _Blacklist2.default.addNumero(dados)
        res.json(r)
    }

    async buscarNumero(req,res){
        const idLista = req.params.idLista
        const numero = req.params.numero
        const rows = await _Blacklist2.default.buscarNumero(idLista,numero)
        res.json(rows)
    }

    async numerosBloqueados(req,res){
        const idLista = req.params.idLista
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        const rows = await _Blacklist2.default.numerosBloqueados(inicio,limit)
        res.json(rows)

    }    

    async removerNumero(req,res){
        const idLista = req.params.idLista
        const numero = req.params.numero
        await _Blacklist2.default.removerNumero(idLista,numero)
        res.json(true)        
    }

    async addBlacklistCampanha(req,res){
        const idBlacklist = req.body.idBlacklist
        const idCampanha = req.body.idCampanha
        const rt= await _Blacklist2.default.addBlacklistCampanha(idBlacklist,idCampanha)
        res.json(rt)      
    }

    async blacklistsCampanha(req,res){
        const idCampanha = req.params.idCampanha
        const blacklists= await _Blacklist2.default.blacklistsCampanha(idCampanha)
        res.json(blacklists)      
    }

    async removerBlacklistCampanha(req,res){
        const idBlacklist = req.params.idBlacklist
        const idCampanha = req.params.idCampanha
        await _Blacklist2.default.removerBlacklistCampanha(idBlacklist,idCampanha)
        res.json(true)    
    }
}

exports. default = new BlacklistController();