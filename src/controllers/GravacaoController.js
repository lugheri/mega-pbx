import Asterisk from '../models/Asterisk';
import User from '../models/User';
import Gravacao from '../models/Gravacao';

class GravacaoController{
    async listarGravacoes(req,res){     
        const empresa = await User.getEmpresa(req)
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        //console.log(`Pag: ${pag} Inicio: ${inicio} Fim: ${limit}`)
        const gravacoes = await Gravacao.listarGravacoes(empresa,inicio,limit)
        const server = await Asterisk.getDomain(empresa)
        const servidor = `https://${server[0].ip}/api/`
        const listaGravacoes=[]
        
        for(let i=0; i<gravacoes.length; ++i){
            const retorno={}
            let ouvir = `${servidor}gravacoes/${empresa}/${gravacoes[i].date_record}/${gravacoes[i].time_record}_${gravacoes[i].numero}_${gravacoes[i].uniqueid}.wav`
            let baixar = `${servidor}gravacao.php?empresa=${empresa}&id=${gravacoes[i].uniqueid}`
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
            retorno["statusTabulacao"]=gravacoes[i].tabulacao
            retorno["tipoTabulacao"]=gravacoes[i].tipo
            retorno["venda"]=gravacoes[i].venda
            retorno["ouvir"]=ouvir
            retorno["baixar"]=baixar
            retorno["compartilhar"]=ouvir
            listaGravacoes.push(retorno)
        } 
        
        res.json(listaGravacoes)
    }
    
    async compartilharGravacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idGravacao = parseInt(req.params.idGravacao)
        const infoGravacao = await Gravacao.infoGravacao(empresa,idGravacao)
        if(infoGravacao.length==0){
            res.json(false)   
            return false
        }
        const server = await Asterisk.getDomain(empresa)
        const pasta = infoGravacao[0].date_record
        let numero=0
        if((infoGravacao[0].numero==null)||(infoGravacao[0].numero=="")){
            numero=await Gravacao.numeroDiscadoByUniqueid(empresa,infoGravacao[0].uniqueid)
            
        }else{
            numero=infoGravacao[0].numero
        }
        
        const arquivo = `${infoGravacao[0].time_record}_${infoGravacao[0].ramal}_${infoGravacao[0].uniqueid}.wav`
        const link = `https://${server[0].ip}/api/gravacoes/${empresa}/${pasta}/${arquivo}`
        res.json(link)               
    }
    
    async buscarGravacoes(req,res){
        const empresa = await User.getEmpresa(req)
        const minTime = req.body.minTime
        const maxTime = req.body.maxTime
        const de = req.body.de
        const ate = req.body.ate
        const buscarPor = req.body.buscarPor
        const parametro = req.body.parametro
        const gravacoes = await Gravacao.buscarGravacao(empresa,minTime,maxTime,de,ate,buscarPor,parametro)
        const server = await Asterisk.getDomain(empresa)
        const servidor = `https://${server[0].ip}/api/`
        const resultBusca = []
        for(let i=0; i<gravacoes.length; ++i){
            let ouvir = `${servidor}gravacoes/${empresa}/${gravacoes[i].date_record}/${gravacoes[i].time_record}_${gravacoes[i].origem}_${gravacoes[i].uniqueid}.wav`
            let baixar = `${servidor}gravacao.php?empresa=${empresa}&id=${gravacoes[i].uniqueid}`
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
            item["statusTabulacao"]=gravacoes[i].tabulacao
            item["tipoTabulacao"]=gravacoes[i].tipo
            item["venda"]=gravacoes[i].venda
            item["ouvir"]=ouvir
            item["baixar"]=baixar
            item["compartilhar"]=ouvir

            resultBusca.push(item)
        }          
        res.json(resultBusca)
    }
    
    async baixarGravacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idGravacao = parseInt(req.params.idGravacao)
        const infoGravacao = await Gravacao.infoGravacao(empresa,idGravacao)
        if(infoGravacao.length==0){
            res.json(false)   
            return false
        }
        const server = await Asterisk.getDomain(empresa)
        const uniqueidarquivo = infoGravacao[0].uniqueid
        const link = `https://${server[0].ip}/api/gravacao.php?empresa=${empresa}&id=${uniqueidarquivo}`
        res.json(link)               
    }
}
export default new GravacaoController();
