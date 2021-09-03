"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _Tabulacoes = require('../models/Tabulacoes'); var _Tabulacoes2 = _interopRequireDefault(_Tabulacoes);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);

class DiscadorController{     
    async debug(title="",msg=""){
        const debug= await _Discador2.default.mode()        
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
        await _Discador2.default.registrarChamadasSimultaneas() 

        //#2 Verifica possiveis chamadas presas e remove das chamadas simultâneas
        await _Discador2.default.clearCalls()  

        //#3 Verifica se existem campanhas ativas
        const campanhasAtivas = await _Discador2.default.campanhasAtivas();  
        if(campanhasAtivas.length === 0){
            this.debug('[!]','Nenhuma campanha ativa![!]')
        }else{    
            //percorrendo campanhas ativas
            for(let i=0; i<campanhasAtivas.length; i++){
                const idCampanha = campanhasAtivas[i].id
                this.debug(` . . Campanha Id: ${idCampanha}`)
                //#4 Verifica a fila da Campanha   
                const filasCampanha = await _Discador2.default.filasCampanha(idCampanha)
                if(filasCampanha.length === 0){
                   //Atualiza o novo status da campanha
                   const msg = "Nenhuma fila de atendimento atribuída a esta campanha!"
                    const estado = 2
                    await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                }else{  
                    const idFila = filasCampanha[0].idFila
                    const nomeFila = filasCampanha[0].nomeFila
                    //#5 Verifica se existe mailing adicionado  
                    const idMailing = await _Discador2.default.verificaMailing(idCampanha)   
                    if(idMailing.length === 0){
                        const msg = "Nenhum mailing foi atribuido na campanha!"
                        const estado = 2
                        await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                    }else{     
                        //#6 Verifica se o mailing adicionado esta configurado
                        const mailingConfigurado = await _Discador2.default.mailingConfigurado(idMailing[0].idMailing) 
                        if(mailingConfigurado.length==0){
                            const msg = "O mailing da campanha não esta configurado!"
                            const estado = 2
                            await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                        }else{
                            const tabela_dados = mailingConfigurado[0].tabela_dados    
                            const tabela_numeros = mailingConfigurado[0].tabela_numeros
                            //#7 Verifica se a campanha possui Agendamento   
                            const agendamento = await _Discador2.default.agendamentoCampanha(idCampanha)
                            if(agendamento.length==0){
                                //Iniciando Passo 2     
                                await this.iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing[0].idMailing)
                            }else{
                                //#8 Verifica se a campanha ativas esta dentro da data de agendamento 
                                const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
                                const dataAgenda = await _Discador2.default.agendamentoCampanha_data(idCampanha,hoje)
                                if(dataAgenda.length === 0){
                                    const msg = "Esta campanha esta fora da sua data de agendamento!"
                                    const estado = 2
                                    await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                                }else{
                                    const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
                                    const horarioAgenda = await _Discador2.default.agendamentoCampanha_horario(idCampanha,agora)
                                    if(horarioAgenda.length === 0){
                                        const msg = "Esta campanha esta fora do horario de agendamento!"
                                         const estado = 2
                                         await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
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
        setTimeout(()=>{this.dial(req,res)},5000)
    }

    async iniciaPreparacaoDiscador(idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing){
        //PASSO 2 - PREPARAÇÃO DO DISCADOR
        this.debug(' ')
        this.debug(' . . . . . . PASSO 2 - PREPARAÇÃO DO DISCADOR')

        //#1 Verifica se existem agentes na fila 
        const agentes = await _Discador2.default.agentesNaFila(idFila)
        if(agentes.length ==0){            
            const msg = "Nenhum agente na fila"
            const estado = 2
            await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
        }else{
            //#2 Verificando se os agentes estao logados e disponiveis
            const agentesDisponiveis = await _Discador2.default.agentesDisponiveis(idFila) 
            if(agentesDisponiveis.length === 0){   
                let msg='Nenhum agente disponível'
                let estado = 2
                await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
            }else{ 
                //#3 Verifica as configurações do discador
                const parametrosDiscador = await _Discador2.default.parametrosDiscador(idCampanha)
                if(parametrosDiscador.length === 0){   
                    let msg='Configure o discador da campanha'
                    let estado = 2
                    await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                }else{ 
                    const tipoDiscador = parametrosDiscador[0].tipo_discador
                    let agressividade = parametrosDiscador[0].agressividade
                    let tipoDiscagem = parametrosDiscador[0].tipo_discagem
                    if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
                        //Caso o discador seja clicktocall ou preview a agressividade eh sempre 1
                        agressividade=1
                        tipoDiscagem = "horizontal"
                    }  
                    const ordemDiscagem = parametrosDiscador[0].ordem_discagem                    
                    const modo_atendimento = parametrosDiscador[0].modo_atendimento  
                    if(tipoDiscador=='preditivo'){
                        let msg="O Discador Preditivo ainda não está disponível!";
                        let estado = 2
                        await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                    }else{
                        //#4 Conta chamadas simultaneas e agressividade e compara com os agentes disponiveis
                        this.debug(' . . . . . . . . . . PASSO 2.4 - Calculando chamadas simultaneas x agentes disponiveis')
                        const limiteDiscagem = agentesDisponiveis.length * agressividade 
                        const qtdChamadasSimultaneas = await _Discador2.default.qtdChamadasSimultaneas(idCampanha)
                        if(qtdChamadasSimultaneas[0].total>=limiteDiscagem){
                            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
                            let estado = 2
                            await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                        }else{
                            //#5 Verifica se existem registros nao trabalhados ou com o nº de tentativas abaixo do limite
                            const registro = await _Discador2.default.filtrarRegistro(idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscagem,ordemDiscagem)
                            if(registro.length ==0){
                                let msg='Todos os registros do mailing já foram trabalhados!'
                                let estado = 3
                                await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
                                this.dial(null,null)
                            }else{                            
                                let msg='Campanha discando'
                                let estado = 1
                                await _Discador2.default.atualizaStatus(idCampanha,msg,estado)
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
        await _Discador2.default.registraNumero(idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros)
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
            const agenteDisponivel = await _Discador2.default.agenteDisponivel(idFila)
            if(agenteDisponivel==0){
                return true;
            }else{               
                await _Discador2.default.registraChamada(agenteDisponivel,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numero,nomeFila,tratado,atendido)
                const estado = 5 //Estado do agente quando ele esta aguardando a discagem da tela
                await _Discador2.default.alterarEstadoAgente(agenteDisponivel,estado,0)
                //Registra chamada simultânea
            }            
        }else if(tipoDiscador=="power"){
            //Registra chamada simultânea                                   
            const tratado=0
            const atendido=0
            await _Discador2.default.registraChamada(0,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numero,nomeFila,tratado,atendido)
            /*
             * INICIAR Discagem */           
            const dataCall=await _Discador2.default.discar(0,numero)
            //console.log('Ligando...',`Modo: ${parametrosDiscador[0].tipo_discagem} idReg:${idRegistro} Numero: ${numero}`)
        }        
        this.debug(' ')
        this.debug(' . . . . . . . . . . . . . PASSO 3 CONCLUÍDO')
    }
                                  
    
    /*Importar Audio */  


    /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FUNCOES DA TELA DO AGENTE
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */
    //Inicia discador do agente
    async iniciarDiscador(req,res){
        const ramal = req.params.ramal
        //Verifica estado atual
        if(await _Discador2.default.statusRamal(ramal)==1){
            const rt={}
                  rt['error']=true
                  rt['message']=`O agente ${ramal} já esta disponível!'`
            res.send(rt)
            return false 
        }
        const estado = 1//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await _Discador2.default.alterarEstadoAgente(ramal,estado,pausa)
        await _Cronometro2.default.iniciaDiscador(ramal)
        res.json(true);
    }
    //Retorna o estado atual do agente
    async statusRamal(req,res){
        const ramal = req.params.ramal
        const estadoRamal = await _Discador2.default.statusRamal(ramal)
        const estados=['deslogado','disponivel','em pausa','falando','indisponivel'];
        const status = {}
              status['idEstado']=estadoRamal
              status['estado']=estados[estadoRamal]
              const client = process.env.client_id
              status['client']=client
        res.json(status);
    }
    //Parando o Discador do agente
    async pararDiscador(req,res){
        const ramal = req.params.ramal
        const estado = 4//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await _Discador2.default.alterarEstadoAgente(ramal,estado,pausa)
        await _Cronometro2.default.pararDiscador(ramal)
        res.json(true);               
    }
    //Verifica o modo de atendimento assim que uma nova chamada eh recebida 
    async modoAtendimento(req,res){
        const ramal = req.params.ramal
        const dadosChamada = await _Discador2.default.modoAtendimento(ramal)
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
            const infoChamada = await _Discador2.default.infoChamada_byIdAtendimento(idAtendimento)
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
        const estadoAgente = await _Discador2.default.infoEstadoAgente(ramal)
        if(estadoAgente!=3){
            await _Discador2.default.alterarEstadoAgente(ramal,estado,pausa)
        }


        //Verifica se ramal ja esta atribuido

        const dados = await _Discador2.default.atendeChamada(ramal)
        res.json(dados); 
    }

    async dadosChamadaAtendida(req,res){
        const ramal = req.params.ramal
        const dados = await _Discador2.default.dadosChamadaAtendida(ramal)
        res.json(dados); 
    }

    //Historico do id do registro
    async historicoRegistro(req,res){
        const idMailing = req.params.idMailing
        const idReg = req.params.idRegistro
        
        const historico = await _Discador2.default.historicoRegistro(idMailing,idReg)
        res.json(historico)
    }
    //Historico do agente
    async historicoChamadas(req,res){
        const ramal = req.params.ramal
        const historico = await _Discador2.default.historicoChamadas(ramal)
        const historicoRegistro=[]
        for(let i = 0; i < historico.length; i++){
            let registro={}
                registro['dadosAtendimento']={}
                registro['dadosAtendimento']['protocolo']=historico[i].protocolo
                registro['dadosAtendimento']['data']=historico[i].dia
                registro['dadosAtendimento']['hora']=historico[i].horario
                registro['dadosAtendimento']['contatado']=historico[i].contatado
                registro['dadosAtendimento']['produtivo']=historico[i].produtivo
                registro['dadosAtendimento']['tabulacao']=historico[i].tabulacao
                registro['dadosAtendimento']['observacoes']=historico[i].obs_tabulacao                
                
                const agente = await _Discador2.default.infoAgente(ramal)
                registro['informacoesAtendente']={}
                registro['informacoesAtendente'] = agente[0]

                registro['dadosRegistro']={}
                registro['dadosRegistro']['nome']=historico[i].nome_registro
                registro['dadosRegistro']['numeroDiscado']=historico[i].numero_discado
            historicoRegistro.push(registro)
        }
        res.json(historicoRegistro)
    }

    //Chama os status de tabulacao da chamada
    async statusTabulacaoChamada(req,res){
        const ramal = req.params.ramal
        const dadosAtendimento = await _Discador2.default.infoChamada(ramal)
        if(dadosAtendimento.length==0){
            const error={}
              error['message']=`Nenhuma chamada em atendimento para o ramal ${ramal}`
              error['error']=true
            res.json(error)
            return false
        }
        const idCampanha = dadosAtendimento[0].id_campanha
        const idAtendimento = dadosAtendimento[0].id

        const nome = await _Discador2.default.campoNomeRegistro(dadosAtendimento[0].id_mailing,dadosAtendimento[0].id_registro,dadosAtendimento[0].tabela_dados);
        
        const tabulacoesCampanha = await _Discador2.default.tabulacoesCampanha(nome,idCampanha)
        if(tabulacoesCampanha===false){
            const error={}
            error['message']="Nenhum status de tabulacao disponivel"
            error['error']=true
            res.json(error)
            return false
        }

        //Atualiza registro como tabulando e retorna id da campanha
        await _Discador2.default.preparaRegistroParaTabulacao(idAtendimento)
                        
        //Pega os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
        return true
    }

    //Tabulando a chamada
    async tabularChamada(req,res){
        const idAtendimento = req.body.idAtendimento
        const ramal = req.body.ramal
        const status_tabulacao = req.body.status_tabulacao
        const observacao = req.body.obs_tabulacao
        const contatado = req.body.contatado
        const id_numero = req.body.id_numero
        const removeNumero = req.body.removeNumero
        let produtivo
        if(req.body.tipo_tabulacao=='produtivo'){
            produtivo=1      
                  
        }else{
            produtivo=0
        }        
        const r = await _Discador2.default.tabulaChamada(idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
        res.json(r); 
    }

    

    //Desligando a Chamada
    async desligarChamada(req,res){
        const ramal = req.body.ramal
        const dadosChamadaDesligada = await _Discador2.default.desligaChamada(ramal)
        let nome=""
        
        const errors={}
        if(dadosChamadaDesligada === false){
             //Atualiza estado do agente para disponivel    
            await _Discador2.default.alterarEstadoAgente(ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Nenhuma chamada encontrada em atendimento com o agente ${ramal} `
            errors['warning']=true

            res.json(errors)
            return false
        };
        //Para cronometro do atendimento
        await _Cronometro2.default.saiuLigacao(dadosChamadaDesligada[0].id_campanha,dadosChamadaDesligada[0].numero,ramal)
        
        //Inicia verificacao se a chamada ja esta tabulada
        if(dadosChamadaDesligada[0].tabulado==1){
            //Remove chamada simultanea 
            await _Discador2.default.clearCallsAgent(ramal);
            //Atualiza estado do agente para disponivel
            await _Discador2.default.alterarEstadoAgente(ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Chamada em atendimento pelo ramal ${ramal} ja estava tabulada!`            
            errors['warning']=true
            res.json(errors)
            return false
        }

        //Verificando se a campanha possui tabulacao configurada
        nome = await _Discador2.default.campoNomeRegistro(dadosChamadaDesligada[0].id_mailing,dadosChamadaDesligada[0].id_registro,dadosChamadaDesligada[0].tabela_dados);
        
        const tabulacoesCampanha = await _Discador2.default.tabulacoesCampanha(nome,dadosChamadaDesligada[0].id_campanha)
        if(tabulacoesCampanha==false){
            //Registra uma tabulacao padrão
            const contatado = 'S'
            const produtivo = 0
            const status_tabulacao=0
            const observacao = ''
            const r = await _Discador2.default.tabulaChamada(dadosChamadaDesligada[0].id,contatado,status_tabulacao,observacao,produtivo,ramal)
            //Remove chamada simultanea 
            await _Discador2.default.clearCallsAgent(ramal);
            //Atualiza estado do agente para disponivel
            await _Discador2.default.alterarEstadoAgente(ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Campanha da chamada em atendimento não possui lista de tabulação!`
            errors['warning']=true
            res.json(errors)
            return false
        }

        //Lista os status de tabulacao
        const idAtendimento = dadosChamadaDesligada[0].id
        const idCampanha = dadosChamadaDesligada[0].id_campanha
        const idMailing = dadosChamadaDesligada[0].id_mailing
        const idRegistro = dadosChamadaDesligada[0].id_registro
        const numeroDiscado  = dadosChamadaDesligada[0].numero
        //Atualiza registro como tabulando e retorna id da campanha
        await _Discador2.default.preparaRegistroParaTabulacao(idAtendimento)
                    
        //Inicia a contagem da tabulacao 
        await _Cronometro2.default.iniciaTabulacao(idCampanha,idMailing,idRegistro,numeroDiscado,ramal)

        //Retorna os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
    }


   

    //######################PAUSAS DO AGENTE ######################
    //PausasListas
    //Lista as pausas disponíveis para o agente
    async listarPausasCampanha(req,res){
        const listaPausa = 1
        const r = await _Pausas2.default.listarPausas(listaPausa)
        res.send(r)
    }

    //Pausa o agente com o status selecionado
    async pausarAgente(req,res){
        const ramal = req.body.ramal
        const idPausa = parseInt(req.body.idPausa)
        const infoPausa = await _Pausas2.default.dadosPausa(idPausa)
        
        const pausa = infoPausa[0].nome
        const descricao = infoPausa[0].descricao
        const tempo = infoPausa[0].tempo
            
        await _Discador2.default.alterarEstadoAgente(ramal,2,idPausa)
        const tempoPausa = await _Cronometro2.default.entrouEmPausa(idPausa,ramal)
        res.send(true)
        
    }

    //Exibe o estado e as informacoes da pausa do agente
    async statusPausaAgente(req,res){
        const ramal = req.params.ramal
        const infoPausa = await _Discador2.default.infoPausaAgente(ramal)
        const statusPausa={}
        if(infoPausa.length==0){
            statusPausa['status']="agente disponivel"
            res.send(statusPausa)
            return false;
        }

        const idPausa = infoPausa[0].idPausa
        const dadosPausa = await _Pausas2.default.dadosPausa(idPausa)
        const inicio = infoPausa[0].inicio
        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
        const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
        const termino = infoPausa[0].termino
        const nome = infoPausa[0].nome
        const descricao = infoPausa[0].descricao
        const tempo = dadosPausa[0].tempo

        //Tempo passado
        let startTime = _moment2.default.call(void 0, `${hoje}T${inicio}`).format();
        let endTime = _moment2.default.call(void 0, `${hoje}T${agora}`).format();
        let duration = _moment2.default.duration(_moment2.default.call(void 0, endTime).diff(startTime));
    
        let horasPass = duration.hours(); //hours instead of asHours
        let minPass = duration.minutes(); //minutes instead of asMinutes
        let segPass = duration.seconds(); //minutes instead of asMinutes
        
        const tempoPassado = horasPass+':'+minPass+':'+segPass
        const minutosTotais = (horasPass*60)+minPass+(segPass/60)
        const percentual = (minutosTotais/tempo)*100

        //Tempo restante
        let startTime_res = _moment2.default.call(void 0, `${hoje}T${agora}`).format();
        let endTime_res = _moment2.default.call(void 0, `${hoje}T${termino}`).format();
        let duration_res = _moment2.default.duration(_moment2.default.call(void 0, endTime_res).diff(startTime_res));

        let horasRes = duration_res.hours(); //hours instead of asHours
        let minRes = duration_res.minutes(); //minutes instead of asMinutes
        let segRes = duration_res.seconds(); //minutes instead of asMinutes

        const tempoRestante = horasRes+':'+minRes+':'+segRes

        statusPausa['idPausa']=idPausa
        statusPausa['nome']=nome
        statusPausa['descricao']=descricao
        statusPausa['tempoTotal']=tempo
        statusPausa['tempoPassado']=tempoPassado
        statusPausa['tempoRestante']=tempoRestante
        statusPausa['porcentagem']=percentual.toFixed(1)

        res.send(statusPausa)
       
    }

    //Tira o agente da pausa
    async removePausaAgente(req,res){
        const ramal = req.body.ramal
        await _Discador2.default.alterarEstadoAgente(ramal,1,0)
        await _Cronometro2.default.saiuDaPausa(ramal)
        res.send(true)
    }
    

    //Pula Registro atual
    async pularChamada(req,res){
        const ramal = req.params.ramal
        await _Discador2.default.alterarEstadoAgente(ramal,1,0)
        res.send(true)
    }


       
    
//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD

    //DISCADOR DO AGENTE
    //ESTADO DO AGENTE
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

        _Discador2.default.dadosAtendimento(idAtendimento,(e,atendimento)=>{
            const tabela = atendimento[0].tabela_mailing
            const idRegistro = atendimento[0].id_reg
            const idMailing = atendimento[0].id_mailing
            const idCampanha = atendimento[0].id_campanha
            _Discador2.default.tabulandoContato(tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,(e,r)=>{
                if(e) throw e
              
                res.json(r);
            })
        })
    }
    
    
}

exports. default = new DiscadorController()