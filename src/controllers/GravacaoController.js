import Asterisk from '../models/Asterisk';
import Campanhas from '../models/Campanhas';
import Gravacao from '../models/Gravacao';

class GravacaoController{
    listarGravacoes(req,res){        
        const pag  = parseInt(req.params.pag-1)       
        const limit = parseInt(req.params.limit)
        const inicio = pag*limit
        console.log(`Pag: ${pag} Inicio: ${inicio} Fim: ${limit}`)
        Gravacao.listarGravacoes(inicio,limit,(e,gravacoes)=>{
            if(e) throw e

            Asterisk.getDomain((e,server)=>{

                const servidor = `https://${server[0].ip}/api/`

            let retorno = '['
            for(let i=0; i<gravacoes.length; ++i){
                let ouvir = `${servidor}gravacoes/${gravacoes[i].date_record}/${gravacoes[i].time_record}_${gravacoes[i].origem}_${gravacoes[i].uniqueid}.wav`
                let baixar = `${servidor}gravacao.php?id=${gravacoes[i].uniqueid}`
                retorno += '{'
                retorno += `"idGravacao":"${gravacoes[i].id}",`
                retorno += `"data":"${gravacoes[i].data}",`
                let duracao = gravacoes[i].duracao
                
                let horas = Math.floor(duracao / 3600);
                let minutos = Math.floor((duracao - (horas * 3600)) / 60);
                let segundos = Math.floor(duracao % 60);
                if(horas<=9){horas="0"+horas}
                if(minutos<=9){minutos="0"+minutos}
                if(segundos<=9){segundos="0"+segundos}
                              
                retorno += `"duracao":"${horas}:${minutos}:${segundos}",`
                retorno += `"protocolo":"${gravacoes[i].protocolo}",`
                retorno += `"ramal":"${gravacoes[i].ramal}",`
                retorno += `"usuario":"${gravacoes[i].nome}",`
                retorno += `"equipe":"${gravacoes[i].equipe}",`
                retorno += `"numero":"${gravacoes[i].numero}",`
                retorno += `"statusTabulacao":"${gravacoes[i].tabulacao}",`
                retorno += `"tipoTabulacao":"${gravacoes[i].tipo}",`
                retorno += `"venda":"${gravacoes[i].venda}",`
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
        const minTime = req.body.minTime
        const maxTime = req.body.maxTime
        const de = req.body.de
        const ate = req.body.ate
        const buscarPor = req.body.buscarPor
        const parametro = req.body.parametro
        Gravacao.buscarGravacao(minTime,maxTime,de,ate,buscarPor,parametro,(e,gravacoes)=>{
            if(e) throw e

            Asterisk.getDomain((e,server)=>{

                const servidor = `https://${server[0].ip}/api/`

                let retorno = '['
                for(let i=0; i<gravacoes.length; ++i){
                    let ouvir = `${servidor}gravacoes/${gravacoes[i].date_record}/${gravacoes[i].time_record}_${gravacoes[i].origem}_${gravacoes[i].uniqueid}.wav`
                    let baixar = `${servidor}gravacao.php?id=${gravacoes[i].uniqueid}`
                    retorno += '{'
                    retorno += `"idGravacao":"${gravacoes[i].id}",`
                    retorno += `"data":"${gravacoes[i].data}",`
                    let duracao = gravacoes[i].duracao
                    
                    let horas = Math.floor(duracao / 3600);
                    let minutos = Math.floor((duracao - (horas * 3600)) / 60);
                    let segundos = Math.floor(duracao % 60);
                    if(horas<=9){horas="0"+horas}
                    if(minutos<=9){minutos="0"+minutos}
                    if(segundos<=9){segundos="0"+segundos}
                                
                    retorno += `"duracao":"${horas}:${minutos}:${segundos}",`
                    retorno += `"protocolo":"${gravacoes[i].protocolo}",`
                    retorno += `"ramal":"${gravacoes[i].ramal}",`
                    retorno += `"usuario":"${gravacoes[i].nome}",`
                    retorno += `"equipe":"${gravacoes[i].equipe}",`
                    retorno += `"numero":"${gravacoes[i].numero}",`
                    retorno += `"statusTabulacao":"${gravacoes[i].tabulacao}",`
                    retorno += `"tipoTabulacao":"${gravacoes[i].tipo}",`
                    retorno += `"venda":"${gravacoes[i].venda}",`
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
