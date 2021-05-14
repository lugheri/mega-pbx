import Asterisk from '../models/Asterisk';
import Campanhas from '../models/Campanhas';
import Gravacao from '../models/Gravacao';

class GravacaoController{
    listarGravacoes(req,res){
        Gravacao.listarGravacoes((e,gravacoes)=>{
            if(e) throw e

            res.json(gravacoes)
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
