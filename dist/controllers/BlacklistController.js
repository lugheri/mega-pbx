"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Blacklist = require('../models/Blacklist'); var _Blacklist2 = _interopRequireDefault(_Blacklist);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);


class BlacklistController{
    async novaLista(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        await _Blacklist2.default.novaLista(empresa,dados)
        res.json(true)
    }

    async listarBlacklists(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const blacklists = await _Blacklist2.default.listarBlacklists(empresa)
        res.json(blacklists)
    }

    async verDadosLista(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.params.idLista
        const blacklists = await _Blacklist2.default.verDadosLista(empresa,idLista)
        res.json(blacklists)
    }

    async editarDadosLista(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.params.idLista
        const dados = req.body
        await _Blacklist2.default.editarDadosLista(empresa,idLista,dados)
        res.json(true)
    }

    async removerLista(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.params.idLista
        await _Blacklist2.default.removerBlacklist(empresa,idLista)
        res.json(true)
    }

    async importarNumeros(req,res){  
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.body.idLista
        const file = req.file.path       
        const retorno={}
              retorno['registrosImportados']=await _Blacklist2.default.importarNumeros(empresa,idLista,file)
       
        res.json(retorno)
    }

    modeloArquivo(req,res){ 
        _Blacklist2.default.modeloArquivo(res)
    }

    async addNumero(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const dados = req.body
        const r=await _Blacklist2.default.addNumero(empresa,dados)
        res.json(r)
    }

    async buscarNumero(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.params.idLista
        const numero = req.params.numero
        const rows = await _Blacklist2.default.buscarNumero(empresa,idLista,numero)
        res.json(rows)
    }

    async numerosBloqueados(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.params.idLista
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        const rows = await _Blacklist2.default.numerosBloqueados(empresa,inicio,limit)
        res.json(rows)

    }    

    async removerNumero(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idLista = req.params.idLista
        const numero = req.params.numero
        await _Blacklist2.default.removerNumero(empresa,idLista,numero)
        res.json(true)        
    }

    async addBlacklistCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idBlacklist = req.body.idBlacklist
        const idCampanha = req.body.idCampanha
        const rt= await _Blacklist2.default.addBlacklistCampanha(empresa,idBlacklist,idCampanha)
        res.json(rt)      
    }

    async blacklistsCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idCampanha = req.params.idCampanha
        const blacklists= await _Blacklist2.default.blacklistsCampanha(empresa,idCampanha)
        res.json(blacklists)      
    }

    async removerBlacklistCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idBlacklist = req.params.idBlacklist
        const idCampanha = req.params.idCampanha
        await _Blacklist2.default.removerBlacklistCampanha(empresa,idBlacklist,idCampanha)
        res.json(true)    
    }
}

exports. default = new BlacklistController();