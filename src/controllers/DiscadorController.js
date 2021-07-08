import Campanhas from '../models/Campanhas'
import Discador from '../models/Discador'
import Pausas from '../models/Pausas'
import Tabulacoes from '../models/Tabulacoes';
import Cronometro from '../models/Cronometro'
import moment from 'moment';

class DiscadorController{ 
    
    async debug(title="",msg=""){
        const debug= await Discador.mode()        
        if(debug==1){
            console.log(`${title}`,msg)
        }
    }
    async iniciandoDiscadorSistema(req,res){
        
        this.debug('','Iniciando Discador')
        //PASSO 1 - VERIFICAÇÃO
        this.debug('PASSO 1 - VERIFICAÇÃO')

        
        //#1 Conta as chamadas simultaneas para registrar no log
        this.debug(' . PASSO 1.1','Registrando chamadas simultaneas')
        await Discador.registrarChamadasSimultaneas()        

        //#2 Verifica possiveis chamadas presas e remove das chamadas simultâneas
        this.debug(' . PASSO 1.2','Removendo chamadas presas')
        await Discador.clearCalls()

        //#3 Verifica se existem campanhas ativas
        this.debug(' . PASSO 1.3','Verificando Campanhas Ativas')
        const campanhasAtivas = await Discador.campanhasAtivas();
        
        for(let i=0; i<campanhasAtivas.length; i++){
            const idCampanha = campanhasAtivas[i].id
            
            this.debug(` . . Campanha Id: ${idCampanha}`)

            //#4 Verifica a fila da Campanha
            this.debug(' . . . PASSO 1.4',`Verifica a fila da Campanha`)
            const filasCampanha = await Discador.filasCampanha(idCampanha)
            if(filasCampanha.length === 0){
                //Atualiza o novo status da campanha
                const msg = "Nenhuma fila de atendimento atribuída a esta campanha!"
                const estado = 2
                await Discador.atualizaStatus(idCampanha,msg,estado)
            }else{
                const idFila = filasCampanha[0].idFila
                const nomeFila = filasCampanha[0].nomeFila
                //#5 Verifica se existe mailing adicionado
                this.debug(' . . . PASSO 1.5',`Verifica se existe mailing adicionado`)
                const idMailing = await Discador.verificaMailing(idCampanha)
               

                if(idMailing.length === 0){
                    //Atualiza o novo status da campanha
                    const msg = "Nenhum mailing foi atribuido na campanha!"
                    const estado = 2
                    await Discador.atualizaStatus(idCampanha,msg,estado)
                }else{
                    //#6 Verifica se o mailing adicionado esta configurado
                    this.debug(' . . . . PASSO 1.6',`Verifica se existe mailing configurado`)
                    const mailingConfigurado = await Discador.mailingConfigurado(idMailing[0].idMailing)                    
                    
                    if(mailingConfigurado.length==0){
                        //Atualiza o novo status da campanha
                        const msg = "Nenhum mailing foi configurado na campanha!"
                        const estado = 2
                        await Discador.atualizaStatus(idCampanha,msg,estado)
                    }else{
                        const tabela = mailingConfigurado[0].tabela
                        
                        //#7 Verifica se a campanha possui Agendamento
                        this.debug(' . . . . . PASSO 1.7',`Verifica se existe mailing possui Agendamento`)
                        const agendamento = await Discador.agendamentoCampanha(idCampanha) 
                        if(agendamento.length==0){
                            this.debug(' . . . . . . Iniciando Passo 2')
                            await this.iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela,idMailing[0].idMailing)
                        }else{
                            //#8 Verifica se a campanha ativas esta dentro da data de agendamento
                            this.debug(' . . . . . . PASSO 1.8',`Verifica se a campanha esta dentro da data de agendamento`)
                            const hoje = moment().format("Y-MM-DD")
                            const dataAgenda = await Discador.agendamentoCampanha_data(idCampanha,hoje)
                            if(dataAgenda.length === 0){
                                //Atualiza o novo status da campanha
                                const msg = "Esta campanha esta fora da sua data de agendamento!"
                                const estado = 2
                                await Discador.atualizaStatus(idCampanha,msg,estado)
                            }else{
                                this.debug(' . . . . . . . PASSO 1.8.1',`Verifica se a campanha esta dentro do horario de agendamento`)
                                const agora = moment().format("HH:mm:ss")
                                const horarioAgenda = await Discador.agendamentoCampanha_horario(idCampanha,agora)
                                if(horarioAgenda.length === 0){
                                    //Atualiza o novo status da campanha
                                    const msg = "Esta campanha esta fora do horario de agendamento!"
                                    const estado = 2
                                    await Discador.atualizaStatus(idCampanha,msg,estado)
                                }else{
                                    this.debug(' . . . . . . . . Iniciando Passo 2')
                                    await this.iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela,idMailing[0].idMailing)
                                }
                            }                       
                        }
                    }
                }
            }
            
            this.debug(' ')
        }
        this.debug('PASSO 1 CONCLUÍDO')
        this.debug(' ')
        setTimeout(()=>{this.iniciandoDiscadorSistema(req,res)},10000)
    }
                                  
    
    async iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela,idMailing,){
        //PASSO 2 - PREPARAÇÃO DO DISCADOR
        this.debug(' ')
        this.debug(' . . . . . . PASSO 2 - PREPARAÇÃO DO DISCADOR')

        //#1 Verifica se existem agentes na fila    
        this.debug(' . . . . . .  . PASSO 2.1 - Verificando se existem agentes na fila')   
        const agentes = await Discador.agentesNaFila(idFila)
        if(agentes.length ==0){            
            const msg = "Nenhum agente na fila"
            const estado = 2
            await Discador.atualizaStatus(idCampanha,msg,estado)
        }else{
        
            //#2 Verificando se os agentes estao logados e disponiveis
            this.debug(' . . . . . . . . PASSO 2.2 - Verificando se os agentes estao logados e disponiveis')
            const agentesDisponiveis = await Discador.agentesDisponiveis(idFila)

            if(agentesDisponiveis.length === 0){   
                let msg='Nenhum agente disponível'
                let estado = 2
                await Discador.atualizaStatus(idCampanha,msg,estado)
            }else{ 

                //#3 Verifica as configurações do discador
                this.debug(' . . . . . . . . . PASSO 2.3 - Verificando configuração do discador')

                const parametrosDiscador = await Discador.parametrosDiscador(idCampanha)
                if(parametrosDiscador.length === 0){   
                    let msg='Configure o discador da campanha'
                    let estado = 2
                    await Discador.atualizaStatus(idCampanha,msg,estado)
                }else{   
                    const tipoDiscador = parametrosDiscador[0].tipo_discador
                    const agressividade = parametrosDiscador[0].agressividade
                    const ordemDiscagem = parametrosDiscador[0].ordem_discagem
                    const tipoDiscagem = parametrosDiscador[0].tipo_discagem
                    const maxTentativas = parametrosDiscador[0].tentativas
                    const modo_atendimento = parametrosDiscador[0].modo_atendimento 
                    
                    if(tipoDiscador=='preditivo'){
                        this.debug(` . . . . . . . . . !! Discador ${tipoDiscador} não configurado!`)
                    }else{
                        
                        //#4 Conta chamadas simultaneas e agressividade e compara com os agentes disponiveis
                        this.debug(' . . . . . . . . . . PASSO 2.4 - Calculando chamadas simultaneas x agentes disponiveis')
                        const limiteDiscagem = agentesDisponiveis.length * agressividade 
                        const qtdChamadasSimultaneas = await Discador.qtdChamadasSimultaneas(idCampanha)
                        if(qtdChamadasSimultaneas[0].total>=limiteDiscagem){
                            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
                            let estado = 2
                            await Discador.atualizaStatus(idCampanha,msg,estado)
                        }else{
                            //#5 Verifica se existem registros nao trabalhados ou com o nº de tentativas abaixo do limite
                            this.debug(' . . . . . . . . . . . PASSO 2.5 - Verificando se existem registros disponíveis')
                            const registro = await Discador.filtrarRegistro(idCampanha,tabela,idMailing,maxTentativas,ordemDiscagem)
                            
                            //#5.1 Filtragem da blacklist e listas de negativação
                            
                            //#6 Separa o registro
                            this.debug(' . . . . . . . . . . . PASSO 2.6 - Separa o registro')
                            if(registro.length ==0){
                                let msg='Nenhum registro disponível'
                                let estado = 3
                                await Discador.atualizaStatus(idCampanha,msg,estado)
                            }else{
                                //Envia registro para discagem
                                let msg='Campanha discando'
                                let estado = 1
                                await Discador.atualizaStatus(idCampanha,msg,estado)
                                this.debug(' . . . . . . . . . . . . Iniciando Passo 3')
                                await this.prepararDiscagem(idCampanha,parametrosDiscador,idMailing,tabela,registro,idFila,nomeFila)
                            }
                        }  
                    }                    
                }
            }
            
        }
        this.debug(' ')
        this.debug(' . . . . . . PASSO 2 CONCLUÍDO')
        
    }    
       
    async prepararDiscagem(idCampanha,parametrosDiscador,idMailing,tabela,registroFiltrado,idFila,nomeFila){
        //PASSO 3 - DISCAGEM
        this.debug(' ')
        this.debug(' . . . . . . . . . . . . . PASSO 3 - DISCAGEM')        
        
        //#1 Formata numero
        this.debug(' . . . . . . . . . . . . . . PASSO 3.1 - Formatando o número')
        const idRegistro = registroFiltrado[0].idRegistro
        const numero = await Discador.pegarTelefone(idRegistro,tabela)       
        let telefone
        if(numero[0].ddd){
             telefone = numero[0].ddd+numero[0].numero
        }else{
             telefone = numero[0].numero
        }
        //#2 Inicia Discagem
        this.debug(' . . . . . . . . . . . . . . PASSO 3.2 - Iniciando a discagem')
        const tipoDiscador = parametrosDiscador[0].tipo_discador
        const agressividade = parametrosDiscador[0].agressividade
        const ordemDiscagem = parametrosDiscador[0].ordem_discagem
        const tipoDiscagem = parametrosDiscador[0].tipo_discagem
        const maxTentativas = parametrosDiscador[0].tentativas
        const modoAtendimento = parametrosDiscador[0].modo_atendimento 

        //#3 Registra chamada simultânea
        this.debug(' . . . . . . . . . . . . . . PASSO 3.3 - Registra chamada simultânea')
        this.debug('discador',tipoDiscador)
        if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
            //Seleciona agente disponivel a mais tempoPassado
            const agenteDisponivel = await Discador.agenteDisponivel(idFila)
            await Discador.alterarEstadoAgente(agenteDisponivel,3,0)
            const tratado=1
            await Discador.registraChamada(agenteDisponivel,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela,idRegistro,telefone,nomeFila,tratado)
            
            //Registra chamada simultânea
        }else if(tipoDiscador=="power"){
            //Registra chamada simultânea
                                     //ramal,idCampanha,modoAtendimento,idMailing,tabela,id_reg,numero,fila,callback
            const tratado=0
            await Discador.registraChamada(0,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela,idRegistro,telefone,nomeFila,tratado)
            
            //Discar
            this.debug(' . . . . . . . . . . . . . . PASSO 3.4 - Discando')
            
            //const dataCall=await Discador.discar(0,telefone)
            //this.debug('datacall',dataCall)
            Discador.discarCB(0,telefone,(e,dataCall)=>{
                if(e) throw e

                this.debug('datacall',dataCall)
            })   
            
        }        
        
        this.debug(' ')
        this.debug(' . . . . . . . . . . . . . PASSO 3 CONCLUÍDO')
    }


    //DISCADOR DO AGENTE
    //ESTADO DO AGENTE
    statusRamal(req,res){
        const ramal = req.params.ramal
        Discador.statusRamal(ramal,(e,estadoRamal)=>{
            if(e) throw e
    
            const estados=['deslogado','disponivel','em pausa','falando','indisponivel'];
            res.json(JSON.parse(`{"idEstado":"${estadoRamal[0].estado}","estado":"${estados[estadoRamal[0].estado]}"}`));
        })            
    }


    //Inicia discador do agente
    async iniciarDiscador(req,res){
        const ramal = req.params.ramal
        await Discador.alterarEstadoAgente(ramal,1,0)
        Cronometro.iniciaDiscador(ramal,(e,r)=>{
            if(e) throw e

            res.json(r);
        })            
    }

    //Parando o Discador do agente
    async pararDiscador(req,res){
        const ramal = req.params.ramal
        await Discador.alterarEstadoAgente(ramal,4,0)
        Cronometro.pararDiscador(ramal,(e,r)=>{
            if(e) throw e

            res.json(r);               
        })            
    }

    async atenderChamada(req,res){
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        await Discador.alterarEstadoAgente(ramal,estado,pausa)
        Discador.atendeChamada(ramal,(e,calldata)=>{
            if(e) throw e
              
            res.json(calldata);
        }) 
    }

    dadosChamada(req,res){
        const ramal = req.params.ramal
        Discador.dadosChamada(ramal,(e,calldata)=>{
            if(e) throw e
              
            res.json(calldata);
        }) 
    }

    async desligarChamada(req,res){
        const idAtendimento =  req.body.idAtendimento
        if(idAtendimento===false){//Chamada Manual
           const ramal  =  req.body.ramal
           const estado = 1//Atualiza estado do agente para disponivel
           const pausa = 0
           await Discador.alterarEstadoAgente(ramal,estado,pausa)
        }else{//Discador
            const ramal  =  req.body.ramal
            const numeroDiscado =  req.body.numero_discado
            //Verifica se existe regra de tabulacao obrigatória
            const tabular=true
            if(tabular==true){
                const estado = 3//Atualiza estado do agente para pausado 
                const tipo='tabulacao'
                //Id de pausa tabulacao
                Pausas.idPausaByTipo(tipo,async (e,idPausa)=>{
                    if(e) throw e

                    let pausaTabulacao
                    if(idPausa.length==0){
                        pausaTabulacao = 0
                    }else{
                        pausaTabulacao = idPausa[0].id
                    }  
                    
                    await Discador.alterarEstadoAgente(ramal,estado,pausaTabulacao)
                    //Atualiza registro como tabulando e retorna id da campanha
                    Discador.preparaRegistroParaTabulacao(idAtendimento,(e,campanha)=>{
                        if(e) throw e
                            
                        if(campanha.length>0){
                            const idCampanha = campanha[0].id_campanha
                            //Pega os status de tabulacao da campanha
                            Tabulacoes.statusTabulacaoCampanha(idCampanha,(e,statusTabulacao)=>{
                                if(e) throw e

                                //Finaliza Ligacao e inicia a contagem da tabulacao 
                                Cronometro.saiuLigacao(idCampanha,numeroDiscado,ramal,(e,r)=>{
                                    if(e) throw e

                                    Discador.dadosAtendimento_byNumero(numeroDiscado, (e,dadosAtendimento)=>{
                                        if(e) throw e
                                        
                                        const idCampanha = dadosAtendimento[0].id_campanha
                                        const idMailing = dadosAtendimento[0].id_mailing
                                        const idRegistro = dadosAtendimento[0].id_reg  
                                        //Inicia contagem do tempo de tabulacao
                                        Cronometro.iniciaTabulacao(idCampanha,idMailing,idRegistro,numeroDiscado,ramal,(e,r)=>{
                                            if(e) throw e

                                            res.json(statusTabulacao)
                                        })
                                    })
                                })
                            })
                        }else{
                            res.json(true)
                        }
                    })
                })
            }else{
                //Inclui tentativa no registro e libera o agente
                const estado = 1
                const pausaTabulacao = 0
                await Discador.alterarEstadoAgente(ramal,estado,pausaTabulacao)
                
                const contatado = 'S'
                const produtivo = 0
                const status_tabulacao=0
                const observacao = ''
                //Desligando a chamada
                Discador.desligaChamada(idAtendimento,0,contatado,produtivo,status_tabulacao,observacao,(e,r)=>{
                    if(e) throw e
                    
                    res.json(r);
                })
            }            
        }
    }

    tabularChamada(req,res){
        const idAtendimento = req.body.idAtendimento
        const ramal = req.body.ramal
        const numero = req.body.numero_discado
        const status_tabulacao = req.body.status_tabulacao
        const observacao = req.body.obs_tabulacao
        const contatado = 'S'
        let produtivo
        if(req.body.tipo_tabulacao=='produtivo'){
            produtivo=1
        }else{
            produtivo=0
        } 
        const data = req.body.data
        const hora = req.body.hora

        Discador.dadosAtendimento(idAtendimento,(e,atendimento)=>{
            const tabela = atendimento[0].tabela_mailing
            const idRegistro = atendimento[0].id_reg
            const idMailing = atendimento[0].id_mailing
            const idCampanha = atendimento[0].id_campanha
            Discador.tabulandoContato(idAtendimento,tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,(e,r)=>{
                if(e) throw e
               
                Cronometro.encerrouTabulacao(idCampanha,numero,ramal,status_tabulacao,(e,r)=>{
                    if(e) throw e
    
                    res.json(r);                        
                })
               
            })
        })
    }

    marcarRetorno(req,res){
        const idAtendimento = req.body.idAtendimento
        const ramal = req.body.ramal
        const numero = req.body.numero_discado
        const status_tabulacao = req.body.status_tabulacao
        const data = req.body.data
        const hora = req.body.hora
        const observacao = req.body.obs_tabulacao
        const contatado = 'S'
        let produtivo
        if(req.body.tipo_tabulacao=='produtivo'){
            produtivo=1
        }else{
            produtivo=0
        } 

        Discador.dadosAtendimento(idAtendimento,(e,atendimento)=>{
            const tabela = atendimento[0].tabela_mailing
            const idRegistro = atendimento[0].id_reg
            const idMailing = atendimento[0].id_mailing
            const idCampanha = atendimento[0].id_campanha
            Discador.tabulandoContato(tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,(e,r)=>{
                if(e) throw e
              
                res.json(r);
            })
        })
    }

   


    //TELA DO ATENDIMENTO DO AGENTE
    //retorna as informações da chamada recebida
    modoAtendimento(req,res){
        const ramal = req.params.ramal
        Discador.modoAtendimento(ramal,(e,dadosChamada)=>{
            if(e) throw e         

            if(dadosChamada.length==0){
                let dados = '{"config":{"origem":"telefone","modo_atendimento":"manual"}}'
                res.json(JSON.parse(dados))
            }else{
                const idAtendimento = dadosChamada[0].id
                const modo_atendimento = dadosChamada[0].modo_atendimento
            
                const idCampanha = dadosChamada[0].id_campanha
                let dados = ""                
                Discador.infoChamada_byIdAtendimento(idAtendimento,(e,infoChamada)=>{
                    if(e) throw e     

                    dados += infoChamada
                    dados += `, "config":{"origem":"discador","modo_atendimento":"${modo_atendimento}"}}`
                    this.debug(dados)
                    res.json(JSON.parse(dados))
                })
            }
        })
    }

    //######################TELA DO AGENTE ######################

    //PausasListas
    //Lista as pausas disponíveis para o agente
    listarPausasCampanha(req,res){
        const listaPausa = 1
        Pausas.listarPausas(listaPausa,(e,r)=>{
            if(e) throw e

            res.send(r)
        })

    }

    //Pausa o agente com o status selecionado
    pausarAgente(req,res){
        const ramal = req.body.ramal
        const idPausa = parseInt(req.body.idPausa)
        Pausas.dadosPausa(idPausa,async (e,infoPausa)=>{
            const pausa = infoPausa[0].nome
            const descricao = infoPausa[0].descricao
            const tempo = infoPausa[0].tempo
            
            await Discador.alterarEstadoAgente(ramal,2,idPausa)
            Cronometro.entrouEmPausa(idPausa,ramal,(e,tempoPausa)=>{
                if(e) throw e

                res.send(tempoPausa)
            })
        })
    }

    //Exibe o estado e as informacoes da pausa do agente
    statusPausaAgente(req,res){
        const ramal = req.params.ramal
        Discador.infoPausaAgente(ramal,(e,infoPausa)=>{
            console.log(infoPausa.length)
            if(infoPausa.length==0){
                let retorno = '{"status":"agente disponivel"}'  
                res.send(JSON.parse(retorno))
            }else{
                const idPausa = infoPausa[0].idPausa            
                Pausas.dadosPausa(idPausa,(e,dadosPausa)=>{
                    if(e) throw e


                    const inicio = infoPausa[0].inicio
                    const hoje = moment().format("Y-MM-DD")
                    const agora = moment().format("HH:mm:ss")
                    const limite = infoPausa[0].limite
                    const nome = infoPausa[0].nome
                    const descricao = infoPausa[0].descricao
                    const tempo = dadosPausa[0].tempo

                    
                //Tempo passado
                    let startTime = moment(`${hoje}T${inicio}`).format();
                    let endTime = moment(`${hoje}T${agora}`).format();
                    let duration = moment.duration(moment(endTime).diff(startTime));
                
                    let horasPass = duration.hours(); //hours instead of asHours
                    let minPass = duration.minutes(); //minutes instead of asMinutes
                    let segPass = duration.seconds(); //minutes instead of asMinutes
                    
                    const tempoPassado = horasPass+':'+minPass+':'+segPass
                    const minutosTotais = (horasPass*60)+minPass+(segPass/60)
                    const percentual = (minutosTotais/tempo)*100

                    //Tempo restante
                    let startTime_res = moment(`${hoje}T${agora}`).format();
                    let endTime_res = moment(`${hoje}T${limite}`).format();
                    let duration_res = moment.duration(moment(endTime_res).diff(startTime_res));
                    let horasRes = duration_res.hours(); //hours instead of asHours
                    let minRes = duration_res.minutes(); //minutes instead of asMinutes
                    let segRes = duration_res.seconds(); //minutes instead of asMinutes
                    
                    const tempoRestante = horasRes+':'+minRes+':'+segRes


                    
                

                    let retorno = '{'
                        retorno += `"idPausa":${idPausa},`
                        retorno += `"nome":"${nome}",`
                        retorno += `"descricao":"${descricao}",`
                        retorno += `"tempoTotal":${tempo},`
                        retorno += `"tempoPassado":"${tempoPassado}",`
                        retorno += `"tempoRestante":"${tempoRestante}",`
                        retorno += `"porcentagem":${percentual.toFixed(1)}`
                    retorno += '}'    

                    



                    res.send(JSON.parse(retorno))
                })
            }
        })
    }

    //Tira o agente da pausa
    async removePausaAgente(req,res){
        const ramal = req.body.ramal

        await Discador.alterarEstadoAgente(ramal,1,0)
        Cronometro.saiuDaPausa(ramal,(e,tempoPausa)=>{
            if(e) throw e

            res.send(tempoPausa)
        })
    }

    //Historico do id do registro
    historicoRegistro(req,res){
        const idReg = parseInt(req.params.idRegistro)
        Discador.historicoRegistro(idReg,(e,historico)=>{
            if(e) throw e

            res.json(historico)
        })

    }

    //Historico do agente
    historicoChamadas(req,res){
        const ramal = req.params.ramal
        Discador.historicoChamadas(ramal,(e,historico)=>{
            if(e) throw e

            res.json(historico)
        })

    }
    
    

    /*OLD
    checandoCampanhasProntas(req,res){
        //this.debug('Discador Automático iniciado')
        //Grava o total de chamadas simultâneas atuais para o log de chamadas
        Discador.registrarChamadasSimultaneas()
       
        //Verifica se existem campanhas ativas
        Campanhas.campanhasAtivasHabilitadas((e,campanhasAtivas)=>{
            if(e) throw e

            if(campanhasAtivas.length != 0 ){
                //this.debug(`${campanhasAtivas.length} campanhas ativas`)

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
    */
    /*
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
                                const modo_atendimento = parametros[0].modo_atendimento

                                //Verificando se a qtd de agentes disponivel eh equivalente as chamadas
                                if(tipoDiscador=='preditivo'){
                                    this.debug(`Discador ${tipoDiscador} não configurado!`)
                                    
                                }
                                if(tipoDiscador=='clicktocall'){
                                    this.debug(`Discador ${tipoDiscador} não configurado!`)
                                    
                                }
                                if(tipoDiscador=='preview'){
                                    this.debug(`Discador ${tipoDiscador} não configurado!`)

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

                                                        this.discar(idCampanha,modo_atendimento,idMailing,tabela,registroFiltrado[0].idRegistro,fila) 
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
    discar(idCampanha,modoAtendimento,idMailing,tabela,registroFiltrado,fila){
        Discador.pegarTelefone(registroFiltrado,tabela,(e,contato)=>{
            if(e) throw e

            let telefone
            if(contato[0].ddd){
                 telefone = contato[0].ddd+contato[0].numero
            }else{
                 telefone = contato[0].numero
            }
            //this.debug(`Numero do telefone: ${telefone}`)
            
            Discador.registraChamada(0,idCampanha,modoAtendimento,idMailing,tabela,registroFiltrado,telefone,fila,(e,r)=>{
                if(e) throw e

                Discador.ligar(0,telefone,(e,ligacao)=>{
                    if(e) throw e
                  
                    this.debug('Dados registrados')
                }) //registraChamada              
            })//ligar       
        })//pegarTelefone
    }*/
}

export default new DiscadorController()