import Asterisk from '../models/Asterisk';
import Campanhas from '../models/Campanhas';
import Gravacao from '../models/Gravacao';

class GravacaoController{
    listarGravacoes(req,res){
        Gravacao.listarGravacoes((e,gravacoes)=>{
            if(e) throw e

            Asterisk.getDomain((e,server)=>{

                const servidor = `https://${server[0].ip}/api/`

            let retorno = '['
            for(let i=0; i<gravacoes.length; ++i){
                let ouvir = `${servidor}gravacoes/${gravacoes[i].date_record}/${gravacoes[i].time_record}_${gravacoes[i].ramal_record}_${gravacoes[i].uniqueid}.wav`
                let baixar = `${servidor}gravacao.php?id=${gravacoes[i].uniqueid}`
                retorno += '{'
                retorno += `"idGravacao":"${gravacoes[i].id}",`
                retorno += `"data":"${gravacoes[i].data}",`
                retorno += `"protocolo":"${gravacoes[i].protocolo}",`
                retorno += `"ramal":"${gravacoes[i].ramal}",`
                retorno += `"usuario":"${gravacoes[i].nome}",`
                retorno += `"equipe":"${gravacoes[i].equipe}",`
                retorno += `"numero":"${gravacoes[i].numero}",`
                retorno += `"ouvir":"${ouvir}",`
                retorno += `"baixar":"${baixar}",`
                retorno += `"compartilhar":"${ouvir}"`
                if(i<gravacoes.length-1){
                    retorno += '},'
                }else{
                    retorno += '}'
                }
                
            }          
            retorno += ']'

            res.json(JSON.parse(retorno))
            })
        })
    }
    
    compartilharGravacao(req,res){
        const idGravacao = parseInt(req.params.idGravacao)
        Gravacao.infoGravacao(idGravacao,(e,infoGravacao)=>{
            if(e) throw e
            
            Asterisk.getDomain((e,server)=>{
                if(e) throw e
                const pasta = infoGravacao[0].date_record
                const arquivo = `${infoGravacao[0].time_record}_${infoGravacao[0].ramal}_${infoGravacao[0].uniqueid}.wav`
                const link = `https://${server[0].ip}/api/gravacoes/${pasta}/${arquivo}`

                res.json(link)               

            })            
        })    
    }
    
    buscarGravacoes(req,res){
        const de = req.body.de
        const ate = req.body.ate
        const ramal = req.body.ramal
        const numero = req.body.numero
        const protocolo = req.body.protocolo
        Gravacao.buscarGravacao(de,ate,ramal,numero,protocolo,(e,buscaGravacao)=>{
            if(e) throw e

            

            res.json(buscaGravacao)
        })
    }
    
    baixarGravacao(req,res){
        const idGravacao = parseInt(req.params.idGravacao)
        Gravacao.infoGravacao(idGravacao,(e,infoGravacao)=>{
            if(e) throw e
            
            Asterisk.getDomain((e,server)=>{
                if(e) throw e
                const uniqueidarquivo = infoGravacao[0].uniqueid
                const link = `https://${server[0].ip}/api/gravacao.php?id=${uniqueidarquivo}`

                res.json(link)               

            })            
        })  


    }
}
export default new GravacaoController();
