"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Gravacao = require('../models/Gravacao'); var _Gravacao2 = _interopRequireDefault(_Gravacao);

class GravacaoController{
    async listarGravacoes(req,res){     
        const empresa = await _User2.default.getEmpresa(req)
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        //console.log(`Pag: ${pag} Inicio: ${inicio} Fim: ${limit}`)
        const gravacoes = await _Gravacao2.default.listarGravacoes(empresa,inicio,limit)
        const server = await _Asterisk2.default.getDomain(empresa)
        const servidor = `https://${server[0].ip}/api/`
        const listaGravacoes=[]
        
        for(let i=0; i<gravacoes.length; ++i){
            const retorno={}
            let ouvir = `${servidor}gravacoes/${empresa}/${gravacoes[i].date_record}/${gravacoes[i].callfilename}.wav`
            let baixar = `${servidor}gravacao.php?empresa=${empresa}&id=${gravacoes[i].uniqueid}`
            const idEmpresa = await _User2.default.codEmpresa(empresa)
            const hash = Buffer.from(`${idEmpresa}:${gravacoes[i].id}`).toString('base64')
            let compartilhar = `https://cloudcall.rec.br/${hash}`

            retorno["idGravacao"]=gravacoes[i].id
            retorno["data"]=gravacoes[i].data

            let duracao = gravacoes[i].duracao
            let horas = Math.floor(duracao / 3600);
            let minutos = Math.floor((duracao - (horas * 3600)) / 60);
            let segundos = Math.floor(duracao % 60);
            if(horas<=9){horas="0"+horas}
            if(minutos<=9){minutos="0"+minutos}
            if(segundos<=9){segundos="0"+segundos}
                              
            retorno["duracao"]=`${horas}:${minutos}:${segundos}`
            retorno["protocolo"]=gravacoes[i].protocolo
            retorno["ramal"]=gravacoes[i].ramal
            retorno["usuario"]=gravacoes[i].nome
            retorno["equipe"]=gravacoes[i].equipe
            retorno["numero"]=gravacoes[i].numero
            retorno["nome_registro"]=gravacoes[i].nome_registro
            retorno["statusTabulacao"]=gravacoes[i].tabulacao
            retorno["tipoTabulacao"]=gravacoes[i].tipo
            retorno["venda"]=gravacoes[i].venda
            retorno["ouvir"]=ouvir
            retorno["baixar"]=baixar
            retorno["compartilhar"]=compartilhar
            listaGravacoes.push(retorno)
        } 
        
        res.json(listaGravacoes)
    }
    
    async compartilharGravacao(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idGravacao = parseInt(req.params.idGravacao)
        const infoGravacao = await _Gravacao2.default.infoGravacao(empresa,idGravacao)
        if(infoGravacao.length==0){
            res.json(false)   
            return false
        }
        const server = await _Asterisk2.default.getDomain(empresa)
        const pasta = infoGravacao[0].date_record
        let numero=0
        if((infoGravacao[0].numero==null)||(infoGravacao[0].numero=="")){
            numero=await _Gravacao2.default.numeroDiscadoByUniqueid(empresa,infoGravacao[0].uniqueid)
            
        }else{
            numero=infoGravacao[0].numero
        }
        
        const arquivo = `${infoGravacao[0].callfilename}.wav`
        const link = `https://${server[0].ip}/api/gravacoes/${empresa}/${pasta}/${arquivo}`
        res.json(link)               
    }

    async gravacaoCompartilhada(req,res){
        const hash = req.params.hash
        //const data = Buffer.from(hash).toString('base64')

        const data = Buffer.from(hash, 'base64').toString('ascii').split(':');

        const idEmpresa=data[0]
        const idRec=data[1]

        const empresa = await _Gravacao2.default.prefixEmpresa(idEmpresa)
        if(empresa==false){
            res.json({"error":true,"message":"Gravação não encontrada!"})
            return false;
        }

        const gravacoes = await _Gravacao2.default.linkGravacao(empresa,idRec);
        if(gravacoes.length==0){
            res.json({"error":true,"message":"Gravação não encontrada!"})
            return false;
        }

        const gravacao={}
              gravacao["data"]=gravacoes[0].data
              let duracao = gravacoes[0].duracao
              let horas = Math.floor(duracao / 3600);
              let minutos = Math.floor((duracao - (horas * 3600)) / 60);
              let segundos = Math.floor(duracao % 60);
              if(horas<=9){horas="0"+horas}
              if(minutos<=9){minutos="0"+minutos}
              if(segundos<=9){segundos="0"+segundos}

              gravacao["duracao"]=`${horas}:${minutos}:${segundos}`
              gravacao["protocolo"]=gravacoes[0].protocolo
              gravacao["ramal"]=gravacoes[0].ramal
              gravacao["usuario"]=gravacoes[0].nome
              gravacao["equipe"]=gravacoes[0].equipe
              gravacao["numero"]=gravacoes[0].numero
              gravacao["nome_registro"]=gravacoes[0].nome_registro
              gravacao["statusTabulacao"]=gravacoes[0].tabulacao
              gravacao["tipoTabulacao"]=gravacoes[0].tipo

              gravacao["link"]=`https://asterisk-dev.megaconecta.tec.br/api/gravacoes/${empresa}/${gravacoes[0].date_record}/${gravacoes[0].callfilename}.wav`
        res.json(gravacao)
    }
    
    async buscarGravacoes(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const minTime = req.body.minTime
        const maxTime = req.body.maxTime
        const de = req.body.de
        const ate = req.body.ate
        const buscarPor = req.body.buscarPor
        const parametro = req.body.parametro
        const gravacoes = await _Gravacao2.default.buscarGravacao(empresa,minTime,maxTime,de,ate,buscarPor,parametro)
        const server = await _Asterisk2.default.getDomain(empresa)
        const servidor = `https://${server[0].ip}/api/`
        const resultBusca = []
        for(let i=0; i<gravacoes.length; ++i){
            let ouvir = `${servidor}gravacoes/${empresa}/${gravacoes[i].date_record}/${gravacoes[i].callfilename}.wav`
            let baixar = `${servidor}gravacao.php?empresa=${empresa}&id=${gravacoes[i].uniqueid}`

            const idEmpresa = await _User2.default.codEmpresa(empresa)
            const hash = Buffer.from(`${idEmpresa}:${gravacoes[i].id}`).toString('base64')
            let compartilhar = `https://cloudcall.rec.br/${hash}`
            const item={}
            item["idGravacao"]=gravacoes[i].id
            item["data"]=gravacoes[i].data
            
            let duracao = gravacoes[i].duracao
            let horas = Math.floor(duracao / 3600);
            let minutos = Math.floor((duracao - (horas * 3600)) / 60);
            let segundos = Math.floor(duracao % 60);
            if(horas<=9){horas="0"+horas}
            if(minutos<=9){minutos="0"+minutos}
            if(segundos<=9){segundos="0"+segundos}
                                
            item["duracao"]=`${horas}:${minutos}:${segundos}`
            item["protocolo"]=gravacoes[i].protocolo
            item["ramal"]=gravacoes[i].ramal
            item["usuario"]=gravacoes[i].nome
            item["equipe"]=gravacoes[i].equipe
            item["numero"]=gravacoes[i].numero
            item["nome_registro"]=gravacoes[i].nome_registro
            item["statusTabulacao"]=gravacoes[i].tabulacao
            item["tipoTabulacao"]=gravacoes[i].tipo
            item["venda"]=gravacoes[i].venda
            item["ouvir"]=ouvir
            item["baixar"]=baixar
            item["compartilhar"]=compartilhar

            resultBusca.push(item)
        }          
        res.json(resultBusca)
    }
    
    async baixarGravacao(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idGravacao = parseInt(req.params.idGravacao)
        const infoGravacao = await _Gravacao2.default.infoGravacao(empresa,idGravacao)
        if(infoGravacao.length==0){
            res.json(false)   
            return false
        }
        const server = await _Asterisk2.default.getDomain(empresa)
        const uniqueidarquivo = infoGravacao[0].uniqueid
        const link = `https://${server[0].ip}/api/gravacao.php?empresa=${empresa}&id=${uniqueidarquivo}`
        res.json(link)               
    }

   
}
exports. default = new GravacaoController();
