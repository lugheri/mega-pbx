"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);

var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);

class DiscadorController{

    checandoCampanhasProntas(req,res){
        console.log('Discador Automático iniciado')
        _Discador2.default.registrarChamadasSimultaneas()
       
        //Verifica se existem campanhas ativas
        _Campanhas2.default.campanhasAtivasHabilitadas((e,campanhasAtivas)=>{
            if(e) throw e

            if(campanhasAtivas.length != 0 ){
                console.log(`${campanhasAtivas.length} campanhas ativas`)

                //Percorrendo todas as campanhas ativas
                for(let i=0; i<campanhasAtivas.length; i++){
                    //Verifica se a campanha possui uma fila atribuida
                    let idCampanha = campanhasAtivas[i].id
                    let nomeCampanha = campanhasAtivas[i].nome

                    _Campanhas2.default.listarFilasCampanha(idCampanha,(e,filas)=>{
                        if(e) throw e 

                        if(filas.length === 0){
                            //Atualiza o novo status da campanha
                            const msg = "Nenhuma fila de atendimento atribuída a esta campanha!"
                            const estado = 2
                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                if(e) throw e 
                            })
                        }else{
                            let idFila = filas[0].idFila
                            let fila = filas[0].nomeFila
                            //Verifica se existe mailing adicionado 
                            _Campanhas2.default.mailingCampanha(idCampanha,(e,mailing)=>{
                                if(e) throw e

                                if(mailing.length === 0){
                                    //Atualiza o novo status da campanha
                                    const msg = "Nenhum mailing foi atribuido na campanha!"
                                    const estado = 2
                                    _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                        if(e) throw e 
                                    })
                                }else{
                                    //Verifica se o mailing adicionado esta configurado
                                    let idMailing = mailing[0].idMailing
                                    //Verificando se o Mailing esta configuradoo
                                    _Campanhas2.default.mailingConfigurado(idMailing,(e,mailingConfigurado)=>{
                                        if(e) throw e                  

                                        if(mailingConfigurado.length === 0){
                                            //Atualiza o novo status da campanha
                                            const msg = "O mailing adicionado nesta campanha não teve seus campos configurados!"
                                            const estado = 2
                                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                if(e) throw e 
                                            })
                                        }else{ 
                                            const tabela = mailingConfigurado[0].tabela   

                                            //Verifica se a campanha possui Agendamento
                                            _Campanhas2.default.agendamentoCampanha(idCampanha,(e,agendamento)=>{
                                                if(e) throw e

                                                if(agendamento.length === 0){
                                                    //Dados da campamha verificados, iniciando discador
                                                    this.discadorAutomatico(idCampanha,idFila,fila,idMailing,tabela)
                                                }else{
                                                    const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
                                                    const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
                                                    //Verifica se a campanha ativas esta dentro da data de agendamento
                                                    _Campanhas2.default.dataCampanha(idCampanha,hoje,(e,dataAgendamento)=>{
                                                        if(e) throw e

                                                        if(dataAgendamento.length === 0){
                                                            //Atualiza o novo status da campanha
                                                            const msg = "Esta campanha esta fora da sua data de agendamento"
                                                            const estado = 2                                                    
                                                            _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                if(e) throw e 
                                                            })
                                                        }else{
                                                            //Verifica se a campanha ativas esta dentro do horario de agendamento
                                                            _Campanhas2.default.horarioCampanha(idCampanha,agora,(e,horarioAgendamento)=>{ 
                                                                if(e) throw e  

                                                                if(horarioAgendamento.length === 0){
                                                                    //Atualiza o novo status da campanha
                                                                    const msg = "Esta campanha esta fora do horário de agendamento"
                                                                    const estado = 2                                                    
                                                                    _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                        if(e) throw e 
                                                                    })
                                                                }else{        
                                                                    //Dados da campamha verificados, iniciando discador                                                          
                                                                    this.discadorAutomatico(idCampanha,idFila,fila,idMailing,tabela)
                                                                }
                                                            })//horarioCampanha
                                                        }
                                                    })//dataCampanha
                                                }
                                            })//agendamentoCampanha                                            
                                        }
                                    })  //mailingConfigurado                       
                                }                                
                            })// mailingCampanha                           
                        }
                    })//listarFilasCampanha
                }               
            }            
        })//campanhasAtivasHabilitadas

        setTimeout(()=>{this.checandoCampanhasProntas(req,res)},10000)
    }

    discadorAutomatico(idCampanha,idFila,fila,idMailing,tabela){
       //verifica se existem agentes na fila
       
        _Discador2.default.agentesFila(fila,(e,agentes)=>{
            if(e) throw e  

            if(agentes.length ==0){                                                                    
                let msg='Nenhum agente na fila'
                let estado = 2
                _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                    if(e) throw e
                }) 
            }else{
                //verificando se os agentes estao logados e disponiveis
                _Discador2.default.agentesDisponiveis(idFila,(e,agentesDisponiveis)=>{
                    if(e) throw e

                    if(agentesDisponiveis.length ==0){   
                        let msg='Nenhum agente disponível'
                        let estado = 2
                        _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                            if(e) throw e
                        })
                    }else{ 
                        const totalAgentesDisponiveis = agentesDisponiveis.length

                        _Discador2.default.parametrosDiscador(idCampanha,(e,parametros)=>{
                            if(e) throw e

                            if(parametros==0){
                                let msg='Configure o discador da campanha'
                                let estado = 2
                                _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                    if(e) throw e
                                })
                            }else{

                                const tipoDiscador = parametros[0].tipo_discador
                                const agressividade = parametros[0].agressividade
                                const ordemDiscagem = parametros[0].ordem_discagem
                                const tipoDiscagem = parametros[0].tipo_discagem
                                const maxTentativas = parametros[0].tentativas

                                //Verificando se a qtd de agentes disponivel eh equivalente as chamadas
                                _Discador2.default.chamadasSimultaneas(idCampanha,(e,chamadasSimultaneas)=>{
                                    if(e) throw e

                                    const totalDisponivel = totalAgentesDisponiveis * agressividade                                        
                                    if(chamadasSimultaneas.length < totalDisponivel){
                                        //Filtragem do registro para discagem
                                            
                                        _Discador2.default.filtrarRegistro(idCampanha,maxTentativas,ordemDiscagem,(e,registroFiltrado)=>{
                                            if(e) throw e
                                                
                                            if(registroFiltrado.length ==0){
                                                let msg='Nenhum registro disponível'
                                                let estado = 3
                                                _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                    if(e) throw e
                                                })                               
                                            }else{
                                                //Envia registro para discagem
                                                let msg='Campanha discando'
                                                let estado = 1
                                                _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                    if(e) throw e

                                                    this.discar(idCampanha,idMailing,tabela,registroFiltrado[0].idRegistro,fila) 
                                                })                                                                                               
                                            }
                                        })//filtrarRegistro   
                                    }else{
                                        let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
                                        let estado = 2
                                        _Campanhas2.default.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                            if(e) throw e
                                        })
                                    }
                                })//chamadasSimultaneas                                    
                                }
                            })//parametrosDiscador                            
                        //}
                    }
                })//agentesDisponiveis
            }
        })//agentesFila        
    }

    discar(idCampanha,idMailing,tabela,registroFiltrado,fila){
        _Discador2.default.pegarTelefone(registroFiltrado,tabela,(e,contato)=>{
            if(e) throw e

            let telefone
            if(contato[0].ddd){
                 telefone = contato[0].ddd+contato[0].numero
            }else{
                 telefone = contato[0].numero
            }
            //console.log(`Numero do telefone: ${telefone}`)
        
            _Discador2.default.registraChamada(0,idCampanha,idMailing,tabela,registroFiltrado,telefone,fila,(e,r)=>{
                if(e) throw e

                _Discador2.default.ligar(0,telefone,(e,ligacao)=>{
                    if(e) throw e


                    console.log(ligacao)
                    console.log(telefone)  



                    console.log('Dados registrados')
                }) //registraChamada              
            })//ligar       
        })//pegarTelefone
    }
}

exports. default = new DiscadorController()