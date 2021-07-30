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

    //Discador
    async dial(req,res){
        this.debug('','Iniciando Discador')
        
        //PASSO 1 - VERIFICAÇÃO
        this.debug('PASSO 1 - VERIFICAÇÃO')

        //#1 Conta as chamadas simultaneas para registrar no log        
        await Discador.registrarChamadasSimultaneas() 
        //#2 Verifica possiveis chamadas presas e remove das chamadas simultâneas        
        await Discador.clearCalls()     
        //#3 Verifica se existem campanhas ativas        
        const campanhasAtivas = await Discador.campanhasAtivas();  
        if(campanhasAtivas.length === 30){
            this.debug('[!]','Nenhuma campanha ativa![!]')
        }else{
            //percorrendo campanhas ativas
            for(let i=0; i<campanhasAtivas.length; i++){
                const idCampanha = campanhasAtivas[i].id
                this.debug(` . . Campanha Id: ${idCampanha}`)
                //#4 Verifica a fila da Campanha                
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
                    const idMailing = await Discador.verificaMailing(idCampanha)   
                    if(idMailing.length === 0){
                        const msg = "Nenhum mailing foi atribuido na campanha!"
                        const estado = 2
                        await Discador.atualizaStatus(idCampanha,msg,estado)
                    }else{ 
                        //#6 Verifica se o mailing adicionado esta configurado
                        const mailingConfigurado = await Discador.mailingConfigurado(idMailing[0].idMailing)  
                        if(mailingConfigurado.length==0){
                            const msg = "O mailing da campanha não esta configurado!"
                            const estado = 2
                            await Discador.atualizaStatus(idCampanha,msg,estado)
                        }else{
                            const tabela_dados = mailingConfigurado[0].tabela_dados    
                            const tabela_numeros = mailingConfigurado[0].tabela_numeros                    
                            //#7 Verifica se a campanha possui Agendamento                            
                            const agendamento = await Discador.agendamentoCampanha(idCampanha)
                            if(agendamento.length==0){
                                //Iniciando Passo 2     
                                await this.iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing[0].idMailing)
                            }else{
                                //#8 Verifica se a campanha ativas esta dentro da data de agendamento
                                const hoje = moment().format("Y-MM-DD")
                                const dataAgenda = await Discador.agendamentoCampanha_data(idCampanha,hoje)
                                if(dataAgenda.length === 0){
                                    const msg = "Esta campanha esta fora da sua data de agendamento!"
                                    const estado = 2
                                    await Discador.atualizaStatus(idCampanha,msg,estado)
                                }else{
                                    const agora = moment().format("HH:mm:ss")
                                    const horarioAgenda = await Discador.agendamentoCampanha_horario(idCampanha,agora)
                                    if(horarioAgenda.length === 0){
                                       const msg = "Esta campanha esta fora do horario de agendamento!"
                                        const estado = 2
                                        await Discador.atualizaStatus(idCampanha,msg,estado)
                                    }else{
                                        //Iniciando Passo 2                                        
                                        await this.iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing[0].idMailing)
                                    }//endif verificacao do horário de agendamento
                                }//endif verificacao da data de agendamento
                            }//endif verificacao do agendamento
                        }//endif verificacao da configuracao do mailing
                    }//endif verificacao do mailing
                }//endif filas campanha
            }//endfor campanhas ativas
        }//endif verificacao campanhas ativas
        //Reiniciando execução
        setTimeout(()=>{this.dial(req,res)},15000)
    }

    async iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing){
        //PASSO 2 - PREPARAÇÃO DO DISCADOR
        this.debug(' ')
        this.debug(' . . . . . . PASSO 2 - PREPARAÇÃO DO DISCADOR')

        //#1 Verifica se existem agentes na fila    
        const agentes = await Discador.agentesNaFila(idFila)
        if(agentes.length ==0){            
            const msg = "Nenhum agente na fila"
            const estado = 2
            await Discador.atualizaStatus(idCampanha,msg,estado)
        }else{
            //#2 Verificando se os agentes estao logados e disponiveis
            const agentesDisponiveis = await Discador.agentesDisponiveis(idFila)
            if(agentesDisponiveis.length === 0){   
                let msg='Nenhum agente disponível'
                let estado = 2
                await Discador.atualizaStatus(idCampanha,msg,estado)
            }else{ 
                //#3 Verifica as configurações do discador
                const parametrosDiscador = await Discador.parametrosDiscador(idCampanha)
                if(parametrosDiscador.length === 0){   
                    let msg='Configure o discador da campanha'
                    let estado = 2
                    await Discador.atualizaStatus(idCampanha,msg,estado)
                }else{  
                    const tipoDiscador = parametrosDiscador[0].tipo_discador
                    let agressividade = parametrosDiscador[0].agressividade
                    if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
                        //Caso o discador seja clicktocall ou preview a agressividade eh sempre 1
                        agressividade=1
                    }                    
                    const ordemDiscagem = parametrosDiscador[0].ordem_discagem
                    const tipoDiscagem = parametrosDiscador[0].tipo_discagem
                    const modo_atendimento = parametrosDiscador[0].modo_atendimento  
                    if(tipoDiscador=='preditivo'){
                        let msg="O Discador Preditivo ainda não está disponível!";
                        let estado = 2
                        await Discador.atualizaStatus(idCampanha,msg,estado)
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
                            const registro = await Discador.filtrarRegistro(idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscagem,ordemDiscagem)
                         
                            if(registro.length ==0){
                                let msg='Nenhum registro disponível'
                                let estado = 3
                                await Discador.atualizaStatus(idCampanha,msg,estado)
                            }else{
                                let msg='Campanha discando'
                                let estado = 1
                                await Discador.atualizaStatus(idCampanha,msg,estado)
                                //#6 Separa o registro                               
                                this.debug(' . . . . . . . . . . . PASSO 2.6 - Separa o registro')
                                await this.prepararDiscagem(idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila)
                            }
                        }  
                    }                    
                }
            }            
        }
        this.debug(' ')
        this.debug(' . . . . . . PASSO 2 CONCLUÍDO')        
    }  

    async prepararDiscagem(idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila){
        //PASSO 3 - DISCAGEM
        this.debug(' ')
        this.debug(' . . . . . . . . . . . . . PASSO 3 - DISCAGEM')        
        
        //#1 Formata numero
        this.debug(' . . . . . . . . . . . . . . PASSO 3.1 - Formatando o número')
        const idNumero = registro[0].idNumero
        const idRegistro = registro[0].id_registro
        const numero = registro[0].numero

        //checa blacklists
        
        //Inserção do numero na lista campanhas_tabulacao
        await Discador.registraNumero(idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros)

        //#2 Inicia Discagem
        this.debug(' . . . . . . . . . . . . . . PASSO 3.2 - Iniciando a discagem')
        const tipoDiscador = parametrosDiscador[0].tipo_discador
        const modoAtendimento = parametrosDiscador[0].modo_atendimento 

        //#3 Registra chamada simultânea
        this.debug(' . . . . . . . . . . . . . . PASSO 3.3 - Registra chamada simultânea')
        this.debug('discador',tipoDiscador)
        if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
            //Seleciona agente disponivel a mais tempoPassado
           
            const tratado=1
            const atendido=1
            await Discador.registraChamada(agenteDisponivel,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numero,nomeFila,tratado,atendido)
            const agenteDisponivel = await Discador.agenteDisponivel(idFila)
            await Discador.alterarEstadoAgente(agenteDisponivel,3,0)
            //Registra chamada simultânea
        }else if(tipoDiscador=="power"){
            //Registra chamada simultânea                                   
            const tratado=0
            const atendido=0
            await Discador.registraChamada(0,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numero,nomeFila,tratado,atendido)
            /*
             * INICIAR Discagem */           
            const dataCall=await Discador.discar(0,numero)
            //console.log('Ligando...',`Modo: ${parametrosDiscador[0].tipo_discagem} idReg:${idRegistro} Numero: ${numero}`)
        }        
        this.debug(' ')
        this.debug(' . . . . . . . . . . . . . PASSO 3 CONCLUÍDO')
    }
                                  
    
      


    /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FUNCOES DA TELA DO AGENTE
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */
    //Inicia discador do agente
    async iniciarDiscador(req,res){
        const ramal = req.params.ramal
        //Verifica estado atual
        if(await Discador.statusRamal(ramal)==1){
            const rt={}
                  rt['error']=true
                  rt['message']=`O agente ${ramal} já esta disponível!'`
            res.send(rt)
            return false 
        }
        const estado = 1//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await Discador.alterarEstadoAgente(ramal,estado,pausa)
        await Cronometro.iniciaDiscador(ramal)
        res.json(true);
    }
    //Retorna o estado atual do agente
    async statusRamal(req,res){
        const ramal = req.params.ramal
        const estadoRamal = await Discador.statusRamal(ramal)
        const estados=['deslogado','disponivel','em pausa','falando','indisponivel'];
        const status = {}
              status['idEstado']=estadoRamal
              status['estado']=estados[estadoRamal]
        res.json(status);
    }
    //Parando o Discador do agente
    async pararDiscador(req,res){
        const ramal = req.params.ramal
        const estado = 4//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await Discador.alterarEstadoAgente(ramal,estado,pausa)
        await Cronometro.pararDiscador(ramal)
        res.json(true);               
    }
    //Verifica o modo de atendimento assim que uma nova chamada eh recebida 
    async modoAtendimento(req,res){
        const ramal = req.params.ramal
        const dadosChamada = await Discador.modoAtendimento(ramal)
        if(dadosChamada.length==0){
            const mode={}
                  mode['config'] = {}
                  mode['config']['origem']="interna"
                  mode['config']['modo_atendimento']="manual"
            res.json(mode)
            return false;
        }else{
            const idAtendimento = dadosChamada[0].id
            const modo_atendimento = dadosChamada[0].modo_atendimento
            const infoChamada = await Discador.infoChamada_byIdAtendimento(idAtendimento)
            const mode={}
                  mode['dados']=infoChamada
                  mode['config'] = {}
                  mode['config']['origem']="discador"
                  mode['config']['modo_atendimento']=modo_atendimento
            res.json(mode)
        }        
    }
    //Atende chamada, e muda o estado do agente para falando
    async atenderChamada(req,res){
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        await Discador.alterarEstadoAgente(ramal,estado,pausa)
        const dados = await Discador.atendeChamada(ramal)
        res.json(dados); 
    }
    


       
    


    //DISCADOR DO AGENTE
    //ESTADO DO AGENTE
    

    

    

    

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
                            Tabulacoes.statusTabulacaoCampanha(idCampanha,async (e,statusTabulacao)=>{
                                if(e) throw e

                                //Finaliza Ligacao e inicia a contagem da tabulacao 
                                await Cronometro.saiuLigacao(idCampanha,numeroDiscado,ramal)
                                Discador.dadosAtendimento_byNumero(numeroDiscado,async (e,dadosAtendimento)=>{
                                    if(e) throw e
                                        
                                    const idCampanha = dadosAtendimento[0].id_campanha
                                    const idMailing = dadosAtendimento[0].id_mailing
                                    const idRegistro = dadosAtendimento[0].id_reg  
                                    //Inicia contagem do tempo de tabulacao
                                    await Cronometro.iniciaTabulacao(idCampanha,idMailing,idRegistro,numeroDiscado,ramal)
                                    res.json(statusTabulacao)
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
            Discador.tabulandoContato(idAtendimento,tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,async(e,r)=>{
                if(e) throw e
               
                await Cronometro.encerrouTabulacao(idCampanha,numero,ramal,status_tabulacao)
                res.json(r);                        
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
            const tempoPausa = await Cronometro.entrouEmPausa(idPausa,ramal)
            res.send(tempoPausa)
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
        const tempoPausa = await Cronometro.saiuDaPausa(ramal)
        res.send(tempoPausa)
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