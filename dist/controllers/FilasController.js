"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Filas = require('../models/Filas'); var _Filas2 = _interopRequireDefault(_Filas);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class FilasController{
    async dadosFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = parseInt(req.params.idFila)
        const filas = await _Filas2.default.dadosFila(empresa,idFila)
        res.json(filas)
    }
    //Listar Filas
    async listarFilas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const filas = await _Filas2.default.listar(empresa)
        res.json(filas)
    }
    //agentesFila
    async agentesFila(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila            
        const agentes = {}

        const agentesForaFila = await _Filas2.default.membrosForaFila(empresa,idFila)
              agentes['agentesForaDaFila']=[]
              for(let i=0; i<agentesForaFila.length; i++){   
                 const ck=await _Filas2.default.verificaMembroFila(empresa,agentesForaFila[i].ramal,idFila)  
                 if(ck==0){         
                    let agente={}
                        agente['ramal']=agentesForaFila[i].ramal
                        agente['nome']=agentesForaFila[i].nome
                        agente['destino']='D'
                        agentes['agentesForaDaFila'].push(agente)
                 }
              }

        const agentesNaFila = await _Filas2.default.membrosNaFila(empresa,idFila)    
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
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = parseInt(req.params.idFila)
        const ramal = req.body.ramal
        const destino =  req.body.destino

        if(destino=="D"){//Adiciona membro a fila
            console.log('empresa',empresa)
            console.log('ramal',ramal)
            console.log('idFila',idFila)
            const r = await _Filas2.default.addMembroFila(empresa,ramal,idFila)
            console.log(r)
            res.json(r)  
            return false;          
        }
        if(destino=="F"){//Remove membro da fila caso destino nao seja 'D'
            const r = _Filas2.default.removeMembroFila(empresa,ramal,idFila)
            res.json(true)
            return false;          
        }     
        res.json(false)   
    }

    async moveAllMembers(req, res){
        const empresa = await _User2.default.getEmpresa(req)
        const idFila = req.params.idFila
        const destino = req.params.destino
        if(destino=="D"){
            const agentesForaFila = await _Filas2.default.membrosForaFila(empresa,idFila)
            for(let i=0; i<agentesForaFila.length; i++){
                await _Filas2.default.addMembroFila(empresa,agentesForaFila[i].ramal,idFila)
            }
        }
        if(destino=="F"){
            const agentesNaFila = await _Filas2.default.membrosNaFila(empresa,idFila) 
            for(let i=0; i<agentesNaFila.length; i++){
                await _Filas2.default.removeMembroFila(empresa,agentesNaFila[i].ramal,idFila)
                
            }   
        }
        res.json(true) 

    }
}
exports. default = new FilasController();