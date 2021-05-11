import Campanhas from '../models/Campanhas'
import Asterisk from '../models/Asterisk'
import Discador from '../models/Discador'

import moment from 'moment';

class DiscadorController{

    checandoCampanhasProntas(req,res){
        //console.log('Discador Automático iniciado')
        Discador.registrarChamadasSimultaneas()
       
        //Verifica se existem campanhas ativas
        Campanhas.campanhasAtivasHabilitadas((e,campanhasAtivas)=>{
            if(e) throw e

            if(campanhasAtivas.length != 0 ){
                //console.log(`${campanhasAtivas.length} campanhas ativas`)

                //Percorrendo todas as campanhas ativas
                for(let i=0; i<campanhasAtivas.length; i++){
                    //Verifica se a campanha possui uma fila atribuida
                    let idCampanha = campanhasAtivas[i].id
                    let nomeCampanha = campanhasAtivas[i].nome

                    Campanhas.listarFilasCampanha(idCampanha,(e,filas)=>{
                        if(e) throw e 

                        if(filas.length === 0){
                            //Atualiza o novo status da campanha
                            const msg = "Nenhuma fila de atendimento atribuída a esta campanha!"
                            const estado = 2
                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                if(e) throw e 
                            })
                        }else{
                            let idFila = filas[0].idFila
                            let fila = filas[0].nomeFila
                            //Verifica se existe mailing adicionado 
                            Campanhas.mailingCampanha(idCampanha,(e,mailing)=>{
                                if(e) throw e

                                if(mailing.length === 0){
                                    //Atualiza o novo status da campanha
                                    const msg = "Nenhum mailing foi atribuido na campanha!"
                                    const estado = 2
                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                        if(e) throw e 
                                    })
                                }else{
                                    //Verifica se o mailing adicionado esta configurado
                                    let idMailing = mailing[0].idMailing
                                    //Verificando se o Mailing esta configuradoo
                                    Campanhas.mailingConfigurado(idMailing,(e,mailingConfigurado)=>{
                                        if(e) throw e                  

                                        if(mailingConfigurado.length === 0){
                                            //Atualiza o novo status da campanha
                                            const msg = "O mailing adicionado nesta campanha não teve seus campos configurados!"
                                            const estado = 2
                                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                if(e) throw e 
                                            })
                                        }else{ 
                                            const tabela = mailingConfigurado[0].tabela   

                                            //Verifica se a campanha possui Agendamento
                                            Campanhas.agendamentoCampanha(idCampanha,(e,agendamento)=>{
                                                if(e) throw e

                                                if(agendamento.length === 0){
                                                    //Dados da campamha verificados, iniciando discador
                                                    this.discadorAutomatico(idCampanha,idFila,fila,idMailing,tabela)
                                                }else{
                                                    const hoje = moment().format("Y-MM-DD")
                                                    const agora = moment().format("HH:mm:ss")
                                                    //Verifica se a campanha ativas esta dentro da data de agendamento
                                                    Campanhas.dataCampanha(idCampanha,hoje,(e,dataAgendamento)=>{
                                                        if(e) throw e

                                                        if(dataAgendamento.length === 0){
                                                            //Atualiza o novo status da campanha
                                                            const msg = "Esta campanha esta fora da sua data de agendamento"
                                                            const estado = 2                                                    
                                                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                                if(e) throw e 
                                                            })
                                                        }else{
                                                            //Verifica se a campanha ativas esta dentro do horario de agendamento
                                                            Campanhas.horarioCampanha(idCampanha,agora,(e,horarioAgendamento)=>{ 
                                                                if(e) throw e  

                                                                if(horarioAgendamento.length === 0){
                                                                    //Atualiza o novo status da campanha
                                                                    const msg = "Esta campanha esta fora do horário de agendamento"
                                                                    const estado = 2                                                    
                                                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
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

        setTimeout(()=>{this.checandoCampanhasProntas(req,res)},5000)
    }

    discadorAutomatico(idCampanha,idFila,fila,idMailing,tabela){
       //verifica se existem agentes na fila
       
        Discador.agentesFila(fila,(e,agentes)=>{
            if(e) throw e  

            if(agentes.length ==0){                                                                    
                let msg='Nenhum agente na fila'
                let estado = 2
                Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                    if(e) throw e
                }) 
            }else{
                //verificando se os agentes estao logados e disponiveis
                Discador.agentesDisponiveis(idFila,(e,agentesDisponiveis)=>{
                    if(e) throw e

                    if(agentesDisponiveis.length ==0){   
                        let msg='Nenhum agente disponível'
                        let estado = 2
                        Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                            if(e) throw e
                        })
                    }else{ 
                        const totalAgentesDisponiveis = agentesDisponiveis.length

                        Discador.parametrosDiscador(idCampanha,(e,parametros)=>{
                            if(e) throw e

                            if(parametros==0){
                                let msg='Configure o discador da campanha'
                                let estado = 2
                                Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                    if(e) throw e
                                })
                            }else{
                                const tipoDiscador = parametros[0].tipo_discador
                                const agressividade = parametros[0].agressividade
                                const ordemDiscagem = parametros[0].ordem_discagem
                                const tipoDiscagem = parametros[0].tipo_discagem
                                const maxTentativas = parametros[0].tentativas

                                //Verificando se a qtd de agentes disponivel eh equivalente as chamadas
                                if(tipoDiscador=='preditivo'){
                                    console.log(`Discador ${tipoDiscador} não configurado!`)
                                    
                                }
                                if(tipoDiscador=='clicktocall'){
                                    console.log(`Discador ${tipoDiscador} não configurado!`)
                                    
                                }
                                if(tipoDiscador=='preview'){
                                    console.log(`Discador ${tipoDiscador} não configurado!`)

                                }    
                                if(tipoDiscador=='power'){                                    
                                    Discador.chamadasSimultaneas(idCampanha,(e,chamadasSimultaneas)=>{
                                        if(e) throw e

                                        const totalDisponivel = totalAgentesDisponiveis * agressividade                                        
                                        if(chamadasSimultaneas.length < totalDisponivel){
                                            //Filtragem do registro para discagem
                                                                
                                            Discador.filtrarRegistro(idCampanha,tabela,idMailing,maxTentativas,ordemDiscagem,(e,registroFiltrado)=>{
                                                if(e) throw e
                                                    
                                                if(registroFiltrado.length ==0){
                                                    let msg='Nenhum registro disponível'
                                                    let estado = 3
                                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                        if(e) throw e
                                                    })                               
                                                }else{
                                                    //Envia registro para discagem
                                                    let msg='Campanha discando'
                                                    let estado = 1
                                                    Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                        if(e) throw e

                                                        this.discar(idCampanha,idMailing,tabela,registroFiltrado[0].idRegistro,fila) 
                                                    })                                                                                               
                                                }
                                            })//filtrarRegistro   
                                        }else{
                                            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
                                            let estado = 2
                                            Campanhas.atualizaStatus(idCampanha,msg,estado,(e,r)=>{
                                                if(e) throw e
                                            })
                                        }
                                    })//chamadasSimultaneas 
                                }                                   
                            }
                        })//parametrosDiscador                            
                    }
                })//agentesDisponiveis
            }
        })//agentesFila        
    }

    //PREDITIVO
    //CLICK TO CALL
    //PREVIEW
    //POWER
    discar(idCampanha,idMailing,tabela,registroFiltrado,fila){
        Discador.pegarTelefone(registroFiltrado,tabela,(e,contato)=>{
            if(e) throw e

            let telefone
            if(contato[0].ddd){
                 telefone = contato[0].ddd+contato[0].numero
            }else{
                 telefone = contato[0].numero
            }
            //console.log(`Numero do telefone: ${telefone}`)
        
            Discador.registraChamada(0,idCampanha,idMailing,tabela,registroFiltrado,telefone,fila,(e,r)=>{
                if(e) throw e

                Discador.ligar(0,telefone,(e,ligacao)=>{
                    if(e) throw e


                    console.log(ligacao)
                    console.log(telefone)  

                    console.log('Dados registrados')
                }) //registraChamada              
            })//ligar       
        })//pegarTelefone
    }
}

export default new DiscadorController()