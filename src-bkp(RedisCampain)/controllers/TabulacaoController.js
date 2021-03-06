import Tabulacoes from '../models/Tabulacoes'
import User from '../models/User'

class TabulacaoController{
    //GRUPOS DE TABULAÇAO
    //Criar lista de tabulacao
    async criarListaTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const result = await Tabulacoes.novaLista(empresa,dados)
        res.json(result)
    }
    //Ver todas as listas de tabulacao
    async listasTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const result = await Tabulacoes.listasTabulacao(empresa)
        res.json(result)
    }
    //Ver dados da lista de tabulacao
    async dadosListaTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista;
        const result = await Tabulacoes.dadosListaTabulacao(empresa,idLista)
        res.json(result)
    }
    //Editar lista de tabulacao
    async editarListaTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista;
        const valores = req.body
        const result = await Tabulacoes.editarListaTabulacao(empresa,idLista,valores)
        res.json(result)
    }
    
    //STATUS DE TABULAÇAO
    //Criar novo status de tabulacao
    async criarStatusTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const dados = req.body
        const result = await Tabulacoes.criarStatusTabulacao(empresa,dados)
        res.json(result)
    }
    //ver todos status de tabulacao de uma lista
    async listarStatusTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const result = await Tabulacoes.listarStatusTabulacao(empresa,idLista)
        res.json(result)
    }
    //ver status de tabulacao
    async infoStatus(req,res){
        const empresa = await User.getEmpresa(req)
        const idStatus = req.params.idStatus;
        const result = await Tabulacoes.infoStatus(empresa,idStatus)
        res.json(result)
    }
    //Editar status de tabulacao
    async editarStatusTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idStatus = req.params.idStatus;
        const valores = req.body
        const r = await Tabulacoes.editarStatusTabulacao(empresa,idStatus,valores)
        res.json(r)
    }
    //Remove status de tabulacao
    async removerStatus(req,res){
        const empresa = await User.getEmpresa(req)
        const idStatus = req.params.idStatus;
        const r = await Tabulacoes.removeStatusTabulacao(empresa,idStatus)
        res.json(r)
    }
    //Reordena os status de tabulacao de uma lista
    async reordenarStatus(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista;
        const r = await Tabulacoes.reordenaStatus(empresa,idLista)
        res.json(r)
    }

    //Ordenacao de listagen e tipos (Rotas do DragDrop)
    async getStatusTabulacao(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const st = await Tabulacoes.dadosListaTabulacao(empresa,idLista)
        if(st.length==0){
            res.json(tabs)
            return false
        }
        const tabs={}
              tabs['statusTab']={}
              const status = await Tabulacoes.listarStatusTabulacao(empresa,idLista)
              for(let i = 0; i < status.length; i++){
                  tabs['statusTab'][status[i].id]={}
                  tabs['statusTab'][status[i].id]['id']=status[i].id
                  tabs['statusTab'][status[i].id]['content']=status[i].tabulacao
              }

              tabs['columns']={}
              tabs['columns']['produtivas']={}
              tabs['columns']['produtivas']['id']="produtivas"
              tabs['columns']['produtivas']['statusIds']=[]
              const produtivos = await Tabulacoes.statusPorTipo(empresa,idLista,'produtivo')
              for(let i = 0; i < produtivos.length; i++){
                tabs['columns']['produtivas']['statusIds'].push(produtivos[i].id)
              }

              tabs['columns']['improdutivas']={}
              tabs['columns']['improdutivas']['id']="improdutivas"
              tabs['columns']['improdutivas']['statusIds']=[]
              const improdutivos = await Tabulacoes.statusPorTipo(empresa,idLista,'improdutivo')
              for(let i = 0; i < improdutivos.length; i++){
                tabs['columns']['improdutivas']['statusIds'].push(improdutivos[i].id)
              }
        res.json(tabs)
    }

    async updateTipoStatus(req,res){
        const empresa = await User.getEmpresa(req)
        const idLista = req.params.idLista
        const idStatus = req.body.idStatus
        const origem = req.body.origem.columName
        const posOrigem = req.body.origem.posicao
        const destino =  req.body.destino.columName
        const posDestino = req.body.destino.posicao
        console.log('origem',origem)
        console.log('posOrigem',posOrigem)
        console.log('destino',destino)
        console.log('posDestino',posDestino)
        if(origem==destino){
            //reordena
            await Tabulacoes.reordenarTipoStatus(empresa,idLista,idStatus,origem,posOrigem,posDestino)
        }else{
            await Tabulacoes.alterarTipoStatus(empresa,idLista,idStatus,origem,destino,posDestino)
        }

        //Normaliza ordenacao
        await Tabulacoes.reordenaStatus(empresa,idLista)
        res.json(true)
    }





    
}

export default new TabulacaoController()