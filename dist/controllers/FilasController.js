"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Filas = require('../models/Filas'); var _Filas2 = _interopRequireDefault(_Filas);

class FilasController{
    dadosFila(req,res){
        const idFila = parseInt(req.params.idFila)
        _Filas2.default.dadosFila(idFila,(e,filas)=>{
            if(e) throw e

            res.json(filas)
        })
    }
    //Listar Filas
    listarFilas(req,res){
        _Filas2.default.listar((e,filas)=>{
            if(e) throw e

            res.json(filas)
        })
    }
    //agentesFila
    async agentesFila(req,res){
        const idFila = req.params.idFila            
        const agentes = {}

        const agentesForaFila = await _Filas2.default.membrosForaFila(idFila)
              agentes['agentesForaDaFila']=[]
              for(let i=0; i<agentesForaFila.length; i++){              
                let agente={}
                    agente['ramal']=agentesForaFila[i].ramal
                    agente['nome']=agentesForaFila[i].nome
                    agente['destino']='D'
                    agentes['agentesForaDaFila'].push(agente)
              }

        const agentesNaFila = await _Filas2.default.membrosNaFila(idFila)    
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
            const r = await _Filas2.default.addMembroFila(ramal,idFila)
            res.json(r)  
            return false;          
        }
        if(destino=="F"){//Remove membro da fila caso destino nao seja 'D'
            const r = _Filas2.default.removeMembroFila(ramal,idFila)
            res.json(true)
            return false;          
        }     
        res.json(false)   
    }

    async moveAllMembers(req, res){
        const idFila = req.params.idFila
        const destino = req.params.destino
        if(destino=="D"){
            const agentesForaFila = await _Filas2.default.membrosForaFila(idFila)
            for(let i=0; i<agentesForaFila.length; i++){
                await _Filas2.default.addMembroFila(agentesForaFila[i].ramal,idFila)
            }
        }
        if(destino=="F"){
            const agentesNaFila = await _Filas2.default.membrosNaFila(idFila) 
            for(let i=0; i<agentesNaFila.length; i++){
                await _Filas2.default.removeMembroFila(agentesNaFila[i].ramal,idFila)
                
            }   
        }
        res.json(true) 

    }
}
exports. default = new FilasController();