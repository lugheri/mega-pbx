"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);

class TabulacaoController{
    //GRUPOS DE TABULAÇAO
    //Criar lista de tabulacao
    criarListaTabulacao(req,res){
        const dados = req.body
        _Tabulacoes2.default.novaLista(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Editar lista de tabulacao
    editarListaTabulacao(req,res){
        const idLista = parseInt(req.params.id);
        const valores = req.body
        _Tabulacoes2.default.editarListaTabulacao(idLista,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver dados da lista de tabulacao
    dadosListaTabulacao(req,res){
        const idLista = parseInt(req.params.id);
        _Tabulacoes2.default.dadosListaTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //Ver todas as listas de tabulacao
    listasTabulacao(req,res){
        _Tabulacoes2.default.listasTabulacao((erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }
    
    //STATUS DE TABULAÇAO

    //Criar novo status de tabulacao
    criarStatusTabulacao(req,res){
        const dados = req.body

        _Tabulacoes2.default.criarStatusTabulacao(dados,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Editar status de tabulacao
    editarStatusTabulacao(req,res){
        const id = parseInt(req.params.id);
        const valores = req.body
        _Tabulacoes2.default.editarStatusTabulacao(id,valores,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })

    }

    //ver status de tabulacao
    statusTabulacao(req,res){
        const id = parseInt(req.params.id);
        _Tabulacoes2.default.statusTabulacao(id,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //ver todos status de tabulacao de uma lista
   /* listarStatusTabulacao(req,res){
        const idLista = parseInt(req.params.idLista)
        Tabulacoes.listarStatusTabulacao(idLista,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    } */

    //get status
    async getStatus(req,res){
        const idLista = parseInt(req.params.idLista)     
        const status = await _Tabulacoes2.default.listarStatusTabulacao(idLista)
        const statusTabulacao = {}
              statusTabulacao['status']={}

        for(let i=0; i<status.length; i++){
            statusTabulacao['status'][`${status[i].id}`]={}
            statusTabulacao['status'][`${status[i].id}`]['id']=`${status[i].id}`
            statusTabulacao['status'][`${status[i].id}`]['tabulacao']=status[i].tabulacao
            statusTabulacao['status'][`${status[i].id}`]['followUp']=status[i].followUp
            statusTabulacao['status'][`${status[i].id}`]['venda']=status[i].venda
        } 

        statusTabulacao['columns']={}
        //Produtivas
        statusTabulacao['columns']['produtivas']={}
        statusTabulacao['columns']['produtivas']['id']="produtivas"
        const produtivas = await _Tabulacoes2.default.listarStatusTabulacaoPorTipo(idLista,'produtivo')
        statusTabulacao['columns']['produtivas']['statusIds']=[]
        for(let i=0; i<produtivas.length; i++) {
            statusTabulacao['columns']['produtivas']['statusIds'][i] = produtivas[i].id
        }
        //Improdutivas
        statusTabulacao['columns']['improdutivas']={}
        statusTabulacao['columns']['improdutivas']['id']="improdutivas"
        const improdutivas = await _Tabulacoes2.default.listarStatusTabulacaoPorTipo(idLista,'improdutivo')
        statusTabulacao['columns']['improdutivas']['statusIds']=[]
        for(let i=0; i<improdutivas.length; i++) {
            statusTabulacao['columns']['improdutivas']['statusIds'][i] = improdutivas[i].id
        }       

        res.json(statusTabulacao)
        
    }

    updateTipoStatus(req,res){
        const idLista = parseInt(req.params.idLista)
        const idStatus = req.body.idStatus
        const origem = req.body.origem.columName
        const posOrigem = req.body.origem.posicao
        const destino =  req.body.destino.columName
        const posDestino = req.body.destino.posicao

        _Tabulacoes2.default.updateTipoStatus(idStatus,idLista,destino,posOrigem,posDestino,(e,r)=>{
            if(e) throw e
                                      
            res.json(true)
        })             
    }
}

exports. default = new TabulacaoController()