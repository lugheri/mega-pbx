import Filas from '../models/Filas'

class FilasController{
    dadosFila(req,res){
        const idFila = parseInt(req.params.idFila)
        Filas.dadosFila(idFila,(e,filas)=>{
            if(e) throw e

            res.json(filas)
        })
    }

    //Listar Filas
    listarFilas(req,res){
        Filas.listar((e,filas)=>{
            if(e) throw e

            res.json(filas)
        })
    }

    //get member fila
    async getMembersFila(req,res){
        const idFila = req.params.idFila
        const agentes = await Filas.agentesAtivos()
        const membros = {}
              membros['agentes']={}
        for(let i=0; i<agentes.length; i++){
            membros['agentes'][`${agentes[i].id}`]={}
            membros['agentes'][`${agentes[i].id}`]['id']=`${agentes[i].id}`
            membros['agentes'][`${agentes[i].id}`]['content']=agentes[i].nome
        }  
        membros['columns']={}
        const agentesNaFila = await Filas.membrosNaFila(idFila)
        const naFila=[]
        for(let i=0; i<agentesNaFila.length; i++) {
            naFila[i] = agentesNaFila[i].ramal
        }   

        const foraDaFila=[]
        for(let i=0; i<agentes.length; i++){
            if(naFila.indexOf(agentes[i].id)<0){
                foraDaFila.push(agentes[i].id)
            }
            console.log(agentes[i].id,naFila.indexOf(agentes[i].id))
        }  

        membros['columns']['foraDaFila']={}
        membros['columns']['foraDaFila']['id']='foraDaFila'
        membros['columns']['foraDaFila']['agentesIds']=foraDaFila
        
        membros['columns']['dentroDaFila']={}
        membros['columns']['dentroDaFila']['id']='dentroDaFila'
        membros['columns']['dentroDaFila']['agentesIds']=naFila
           
        res.json(membros)
    }

    //Atualizar membros da campanha
    updateMemberFila(req,res){
        const idFila = parseInt(req.params.idFila)
        const idAgente = req.body.idAgente
        const origem = req.body.origem.columName
        const posOrigem = req.body.origem.posicao
        const destino =  req.body.destino.columName
        const posDestino = req.body.destino.posicao

        console.log('IdFila',idFila)
       
        //reordena fora da fila
        if((origem == 'foraDaFila')&&(destino == 'foraDaFila')){           
            Filas.reordenaMembrosForaFila(idAgente,idFila,posOrigem,posDestino,(e,r)=>{
                if(e) throw e
                
                Filas.normalizaOrdem(idFila)
                res.json(true)
            })
        }
        //insere na fila
        if((origem == 'foraDaFila')&&(destino == 'dentroDaFila')){
            Filas.addMembroFila(idAgente,idFila,posOrigem,posDestino,(e,r)=>{
                if(e) throw e

                Filas.normalizaOrdem(idFila)  
                res.json(true)
            })
        }

        //reordena dentro da fila
        if((origem == 'dentroDaFila')&&(destino == 'dentroDaFila')){                
            Filas.reordenaMembrosDentroFila(idAgente,idFila,posOrigem,posDestino,(e,r)=>{
                if(e) throw e
                
                Filas.normalizaOrdem(idFila)                
                res.json(true)
            })
        }

        //remove da fila
        if((origem == 'dentroDaFila')&&(destino == 'foraDaFila')){
            Filas.removeMembroFila(idAgente,posOrigem,idFila,(e,r)=>{
                if(e) throw e

                Filas.normalizaOrdem(idFila)
                res.json(true)
            })
        }        
    }
}
export default new FilasController();