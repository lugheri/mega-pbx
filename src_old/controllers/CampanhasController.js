import Campanhas from '../models/Campanhas';
import Tabulacoes from '../models/Tabulacoes';

class CampanhasController{
    //Campanhas
    async criarCampanha(req,res){
        const dados = req.body;
        console.log(req.body)
        await Campanhas.criarCampanha(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    listarCampanhas(req,res){
        Campanhas.listarCampanhas((erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    dadosCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        Campanhas.dadosCampanha(idCampanha,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    atualizaCampanha(req,res){
        const idCampanha = parseInt(req.params.id);
        console.log(idCampanha)

        const valores = req.body
        console.log(valores)
        Campanhas.atualizaCampanha(idCampanha,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Tabulacoes
    criarListaTabulacao(req,res){
        const dados = req.body
        Tabulacoes.novaLista(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    editarListaTabulacao(req,res){
        const idLista = parseInt(req.params.id);
        const valores = req.body
        Tabulacoes.editarListaTabulacao(idLista,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }
    dadosListaTabulacao(req,res){
        const idLista = parseInt(req.params.id);
        Tabulacoes.dadosListaTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }
    listasTabulacao(req,res){
        Tabulacoes.listasTabulacao((erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    criarStatusTabulacao(req,res){
        const dados = req.body
        Tabulacoes.criarStatusTabulacao(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }
    editarStatusTabulacao(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        Tabulacoes.editarStatusTabulacao(id,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }
    statusTabulacao(req,res){
        const id = parseInt(req.params.id);
        Tabulacoes.statusTabulacao(id,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }
    listarStatusTabulacao(req,res){
        const idLista = parseInt(req.params.idLista)
        Tabulacoes.listarStatusTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

}

export default new CampanhasController();