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
    //agentesFila
    async agentesFila(req,res){
        const idFila = req.params.idFila            
        const agentes = {}

        const agentesForaFila = await Filas.membrosForaFila(idFila)
              agentes['agentesForaDaFila']=[]
              for(let i=0; i<agentesForaFila.length; i++){              
                let agente={}
                    agente['ramal']=agentesForaFila[i].ramal
                    agente['nome']=agentesForaFila[i].nome
                    agente['destino']='D'
                    agentes['agentesForaDaFila'].push(agente)
              }

        const agentesNaFila = await Filas.membrosNaFila(idFila)    
              agentes['agentesNaFila']=[]
              for(let i=0; i<agentesNaFila.length; i++){
                let agente={}
                agente['ramal']=agentesNaFila[i].ramal
                agente['nome']=agentesNaFila[i].nome
                agente['destino']='F'
                agentes['agentesNaFila'].push(agente)
            }

        res.json(agentes)
    }  
    //Atualizar membros da campanha
    async updateMemberFila(req,res){
        const idFila = parseInt(req.params.idFila)
        const ramal = req.body.ramal
        const destino =  req.body.destino

        if(destino=="D"){//Adiciona membro a fila
            const r = await Filas.addMembroFila(ramal,idFila)
            res.json(r)  
            return false;          
        }
        if(destino=="F"){//Remove membro da fila caso destino nao seja 'D'
            const r = Filas.removeMembroFila(ramal,idFila)
            res.json(true)
            return false;          
        }     
        res.json(false)   
    }

    async moveAllMembers(req, res){
        const idFila = req.params.idFila
        const destino = req.params.destino
        if(destino=="D"){
            const agentesForaFila = await Filas.membrosForaFila(idFila)
            for(let i=0; i<agentesForaFila.length; i++){
                await Filas.addMembroFila(agentesForaFila[i].ramal,idFila)
            }
        }
        if(destino=="F"){
            const agentesNaFila = await Filas.membrosNaFila(idFila) 
            for(let i=0; i<agentesNaFila.length; i++){
                await Filas.removeMembroFila(agentesNaFila[i].ramal,idFila)
                
            }   
        }
        res.json(true) 

    }
}
export default new FilasController();