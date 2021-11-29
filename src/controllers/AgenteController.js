import Agente from '../models/Agente'
import User from '../models/User'
import Report from '../models/Report'
import Campanhas from '../models/Campanhas'
import Pausas from '../models/Pausas'
import Discador from '../models/Discador'
import Redis from '../Config/Redis'
import moment from 'moment'

class AgenteController{
    //Inicia discador do agente
    async iniciarDiscador(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const er = await Agente.statusRamal(empresa,ramal)
        const estadoRamal = er['estado']
        //Verifica estado atual
        if(estadoRamal==1){
            const rt={}
                  rt['error']=true
                  rt['message']=`O agente ${ramal} já esta disponível!'`
            res.send(rt)
            return false 
        }
        const estado = 1//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await Agente.alterarEstadoAgente(empresa,ramal,estado,pausa)
        //await Cronometro.iniciaDiscador(empresa,ramal)
        res.json(true);
    }

    //Retorna o estado atual do agente
    async statusRamal(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        let estado = 0
        let tempo = 0        
        const estadoRamal = await Agente.statusRamal(empresa,ramal)
        estado = estadoRamal['estado'];
        const now = moment(new Date());         
        const duration = moment.duration(now.diff(estadoRamal['hora']))
        tempo=await Report.converteSeg_tempo(duration.asSeconds())       
    
        const estados=['deslogado','disponivel','em pausa','falando','indisponivel','tela reg.','ch manual','lig. manual'];
        const status = {}
            status['idEstado']=estado
            status['estado']=estados[estado]
            status['tempo']=tempo             
        res.json(status);
    }
    async statusDeChamadaManual(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 6
        const pausa = 0
        await Agente.alterarEstadoAgente(empresa,ramal,estado,pausa)
        res.json(true);
    }

    //Parando o Discador do agente
    async pararDiscador(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 4//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await Redis.delete(`${empresa}:atendimentoAgente:${ramal}`)
        await Agente.alterarEstadoAgente(empresa,ramal,estado,pausa)        
        res.json(true);               
    }

    //Verifica o modo de atendimento assim que uma nova chamada eh recebida 
    async modoAtendimento(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        //console.log(ramal)
        const dadosChamada = await Redis.getter(`${empresa}:chamadasSimultaneas`)

        console.log('> > > > > > > > > > > > > > > > > > > > dados chamada',dadosChamada)
        if((dadosChamada===null)||(dadosChamada.length==0)){
            const mode={}
                mode['sistemcall']=false
                mode['dialcall']=false
                mode['config'] = {}
                mode['config']['origem']="interna"
                mode['config']['modo_atendimento']="manual"
            res.json(mode)
            return false;
        }else{
           
            const modo_atendimento = 'auto'// atendimentoAgente['modo_atendimento']
            const numero = dadosChamada[0].numero
            const idMailing = dadosChamada[0].id_mailing
            const tipo_discador = dadosChamada[0].tipo_discador
            const tipo= dadosChamada[0].tipo
            const idReg = dadosChamada[0].id_registro
            const id_numero = dadosChamada[0].id_numero
            const tabela_dados = dadosChamada[0].tabela_dados
            const tabela_numeros = dadosChamada[0].tabela_numeros
            const idCampanha = dadosChamada[0].id_campanha
            const protocolo = dadosChamada[0].idAtendimento            
            let sistemcall=false
            let dialcall=false
            //Caso a chamada nao possua id de registro
            if(idReg==0){           
                res.json({"sistemcall":sistemcall,"dialcall":dialcall})             
            }
            if(tipo=='Discador'){
                sistemcall=false
                dialcall=true
            }else if(tipo=='interna'){
                sistemcall=true
                dialcall=false
            }else{
                sistemcall=false
                dialcall=false
            }

            const info = {};
            info['sistemcall']=sistemcall
            info['dialcall']=dialcall

            info['dados']={}
            info['dados']['sistemcall']=sistemcall
            info['dados']['dialcall']=dialcall
            info['dados']['idAtendimento']=protocolo
            
                    
            info['dados']['integracao']=await Discador.integracoes(empresa,numero,idCampanha,ramal,idMailing,idReg,tabela_dados)
            info['dados']['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(empresa,idCampanha)
            info['dados']['tipo_discador']=tipo_discador
            info['dados']['retorno']=false
            info['dados']['modo_atendimento']=modo_atendimento
            info['dados']['idMailing']=idMailing              
            info['dados']['tipo_ligacao']=tipo
            info['dados']['protocolo']=protocolo
            const nomeCliente = await Discador.campoNomeRegistro(empresa,idMailing,idReg,tabela_dados)
            info['dados']['nome_registro']=nomeCliente
            info['dados']['campos']={}
            info['dados']['campos']['idRegistro']=idReg
            info['dados']['campos']['Nome']=nomeCliente
            const numeros = await Discador.infoChamada_byDialNumber(empresa,idCampanha,idReg,id_numero,tabela_numeros,numero)
            info['dados']['numeros'] = numeros['numeros']
            info['dados']['id_numeros_discado'] = numeros['id_numeros_discado']
            info['dados']['numeros_discado'] = numeros['numeros_discado']
            info['dados']['dadosCampanha'] = numeros['dadosCampanha']
            info['config'] = {}
            info['config']['origem']="discador"
            info['config']['modo_atendimento']=modo_atendimento

            res.json(info)              
        }
    }

    //Atende chamada, e muda o estado do agente para falando
    async atenderChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        const estadoAgente = await Agente.infoEstadoAgente(empresa,ramal)
        if(estadoAgente!=3){
            await Agente.alterarEstadoAgente(empresa,ramal,estado,pausa)
        }
        res.json(true)      
    }

    async dadosChamadaAtendida(req,res){
        console.log('Dados Chamada')
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        console.log('Chave',`${empresa}:atendimentoAgente:${ramal}`)
        const atendimentoAgente = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if(atendimentoAgente===null){
            const mode={}
                mode['sistemcall']=false
                mode['dialcall']=false
                mode['config'] = {}
                mode['config']['origem']="interna"
                mode['config']['modo_atendimento']="manual"

                console.log('Sem Dados',mode)
            res.json(mode)
            return false;
        }
        const modo_atendimento = atendimentoAgente['modo_atendimento']
        const numero = atendimentoAgente['numero']
        const idAtendimento = atendimentoAgente['idAtendimento']
        const idMailing = atendimentoAgente['id_mailing']
        const tipo_discador = atendimentoAgente['tipo_discador']
        const tipo_ligacao= atendimentoAgente['tipo_ligacao']
        const retorno = atendimentoAgente['retorno']
        const idReg = atendimentoAgente['id_registro']
        const id_numero = atendimentoAgente['id_numero']
        const tabela_dados = atendimentoAgente['tabela_dados']
        const tabela_numeros = atendimentoAgente['tabela_numeros']
        const idCampanha = atendimentoAgente['id_campanha']
        const protocolo = atendimentoAgente['protocolo']

        //Caso a chamada nao possua id de registro
        if(idReg==0){           
            console.log('Sem id')
            res.json({"sistemcall":false,"dialcall":false})             
        }

        const info = {};
        if((tipo_ligacao=='discador')||(tipo_ligacao==='retorno')){
            info['sistemcall']=false
            info['dialcall']=true
        }else if(tipo_ligacao=='interna'){
            info['sistemcall']=true
            info['dialcall']=false
        }else{
            info['sistemcall']=false
            info['dialcall']=false
        }
        //Integração  
        info['integracao']=await Discador.integracoes(empresa,numero,idCampanha,ramal,idMailing,idReg,tabela_dados)
        info['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(empresa,idCampanha)  
        info['tipo_discador']=tipo_discador
        if(retorno==1){
            info['retorno']=true
        }else{
            info['retorno']=false
        }
        info['modo_atendimento']=modo_atendimento
        info['idMailing']=idMailing  
        info['tipo_ligacao']=tipo_ligacao
        info['protocolo']=protocolo
        const nomeCliente = await Discador.campoNomeRegistro(empresa,idMailing,idReg,tabela_dados)
        info['nome_registro']=nomeCliente
        info['campos']={}
        info['campos']['idRegistro']=idReg
        info['campos']['Nome']=nomeCliente
        const camposMailing = await Discador.camposMailing(empresa,idMailing,idCampanha)
        for(let i=0; i<camposMailing.length; i++){
            let apelido=''
            if(camposMailing[i].apelido === null){
                apelido=camposMailing[i].campo
            }else{
                apelido=camposMailing[i].apelido
            }  
            //console.log('Info Chamada - Valor do Campo',campos_dados[i].campo)
            let nomeCampo = camposMailing[i].campo;
            const apelidoCampo = await Discador.apelidoCampo(empresa,nomeCampo,tabela_dados,idReg)
            info['campos'][apelido]=apelidoCampo
        }      

        const numeros = await Discador.infoChamada_byDialNumber(empresa,idCampanha,idReg,id_numero,tabela_numeros,numero)
        info['numeros'] = numeros['numeros']
        info['id_numeros_discado'] = numeros['id_numeros_discado']
        info['numeros_discado'] = numeros['numeros_discado']
        info['dadosCampanha'] = numeros['dadosCampanha']
        info['config'] = {}
        info['config']['origem']="discador"
        info['config']['modo_atendimento']=modo_atendimento

        console.log('Info',info)
        res.json(info) 
    }

    //Historico do id do registro
    async historicoRegistro(req,res){
        const empresa = await User.getEmpresa(req)
        const estadoAgente = await User.estadoAgente(req)
        if(estadoAgente>=6){
            res.json([])
            return false
        }
        const idMailing = req.params.idMailing
        if(idMailing==0){
            res.json([])
            return 
        }
        const idReg = req.params.idRegistro        
        const historico = await Agente.historicoRegistro(empresa,idMailing,idReg)
        res.json(historico)
    }

    async historicoChamadaManual(req,res){
        const empresa = await User.getEmpresa(req)
        const numero = req.params.numero
        const agente = req.params.idAgente
        
        const historico = await Agente.historicoRegistroChamadaManual(empresa,numero,agente)
        res.json(historico)
    }

    //Historico do agente
    async historicoChamadas(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const historico = await Agente.historicoChamadas(empresa,ramal)
        const historicoRegistro=[]
        for(let i = 0; i < historico.length; i++){
            let registro={}
                registro['dadosAtendimento']={}
                registro['dadosAtendimento']['idHistorico']=historico[i].id
                registro['dadosAtendimento']['protocolo']=historico[i].protocolo
                registro['dadosAtendimento']['data']=historico[i].dia
                registro['dadosAtendimento']['hora']=historico[i].horario
                registro['dadosAtendimento']['discagem']=historico[i].tipo
                registro['dadosAtendimento']['contatado']=historico[i].contatado
                registro['dadosAtendimento']['produtivo']=historico[i].produtivo
                registro['dadosAtendimento']['tabulacao']=historico[i].tabulacao
                registro['dadosAtendimento']['observacoes']=historico[i].obs_tabulacao                
                
                const agente = await Agente.infoAgente(empresa,ramal)
                registro['informacoesAtendente']={}
                registro['informacoesAtendente'] = agente[0]

                registro['dadosRegistro']={}
                registro['dadosRegistro']['nome']=historico[i].nome_registro
                registro['dadosRegistro']['numeroDiscado']=historico[i].numero_discado
            historicoRegistro.push(registro)
        }
        res.json(historicoRegistro)
    }

    async nomeContatoHistoico_byNumber(req,res){
        const empresa = await User.getEmpresa(req)
        const numero = req.params.numero
        const nome = await Discador.nomeContatoHistoico_byNumber(empresa,numero)        
        res.json(nome)
    }

    async gravaDadosChamadaManual(req,res){
        const empresa = await User.getEmpresa(req)
        const numero = req.body.numero
        const nome = req.body.nome
        const observacoes = req.body.observacoes
        const r = await Agente.gravaDadosChamadaManual(empresa,numero,nome,observacoes)
        res.json(r)
    }

    //Chama os status de tabulacao da chamada
    async statusTabulacaoChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)     

        console.log('dados Atendimento',`${empresa}:atendimentoAgente:${ramal}`,dadosAtendimento)
        if(dadosAtendimento===null){
            const error={}
                error['message']=`Nenhuma chamada em atendimento para o ramal ${ramal}`
                error['error']=true
            res.json(error)
            return false
        }
        const idCampanha = dadosAtendimento['id_campanha']
        const idMailing = dadosAtendimento['id_mailing']
        const idRegistro = dadosAtendimento['id_registro']
        const tabelaDados = dadosAtendimento['tabela_dados']
        const numero = dadosAtendimento['numero']
        const nome = await Discador.campoNomeRegistro(empresa,idMailing,idRegistro,tabelaDados);
        
        const tabulacoesCampanha = await Discador.tabulacoesCampanha(empresa,nome,idCampanha)
        if(tabulacoesCampanha===false){
            const error={}
            error['message']="Nenhum status de tabulacao disponivel"
            error['error']=true
            res.json(error)
            return false
        }

        dadosAtendimento['event_tabulando']=1
        await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,dadosAtendimento)
                        
        //Pega os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
        return true
    }

    //Tabulando a chamada
    async tabularChamada(req,res){
        const empresa = await User.getEmpresa(req)
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
        const r = await Discador.tabulaChamada(empresa,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
        res.json(r); 
    }

    async voltaRegistro(req,res){
        const empresa = await User.getEmpresa(req)
        const idHistorico = req.params.idHistorico
        const r =  await Discador.voltaRegistro(empresa,idHistorico)
        res.json(r)
    }

    //Desligando a Chamada
    async desligarChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.body.ramal
        const dadosChamadaDesligada = await Agente.desligaChamada(empresa,ramal)
        let nome=""
        
        const errors={}
        if(dadosChamadaDesligada === false){
            //Atualiza estado do agente para disponivel    
            await Agente.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Nenhuma chamada encontrada em atendimento com o agente ${ramal} `
            errors['warning']=true

            res.json(errors)
            return false
        };
        
        //Inicia verificacao se a chamada ja esta tabulada
        if(dadosChamadaDesligada['event_tabulada']==1){
            //Remove chamada simultanea 
            await Agente.clearCallsAgent(empresa,ramal);
            //Atualiza estado do agente para disponivel
            await Agente.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Chamada em atendimento pelo ramal ${ramal} ja estava tabulada!`            
            errors['warning']=true
            res.json(errors)
            return false
        }

        //Verificando se a campanha possui tabulacao configurada
        nome = await Discador.campoNomeRegistro(empresa,dadosChamadaDesligada['id_mailing'],dadosChamadaDesligada['id_registro'],dadosChamadaDesligada['tabela_dados']);
        
        const tabulacoesCampanha = await Discador.tabulacoesCampanha(empresa,nome,dadosChamadaDesligada['id_campanha'])
        if(tabulacoesCampanha==false){
            //Registra uma tabulacao padrão
            const contatado = 'S'
            const produtivo = 0
            const status_tabulacao=0
            const observacao = ''
            const r = await Discador.tabulaChamada(empresa,contatado,status_tabulacao,observacao,produtivo,ramal,dadosChamadaDesligada['id_numero'],0)
            //Remove chamada simultanea 
            await Agente.clearCallsAgent(empresa,ramal);
            //Atualiza estado do agente para disponivel
            await Agente.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Campanha da chamada em atendimento não possui lista de tabulação!`
            errors['warning']=true
            res.json(errors)
            return false
        }

        //Lista os status de tabulacao
        const idCampanha = dadosChamadaDesligada['id_campanha']
        const idMailing = dadosChamadaDesligada['id_mailing']
        const idRegistro = dadosChamadaDesligada['id_registro']
        const numeroDiscado  = dadosChamadaDesligada['numero']
                    
        //Inicia a contagem da tabulacao 
        dadosChamadaDesligada['event_tabulada']==1
        await Redis.setter(`${empresa}:atendimentoAgente:${ramal}`,dadosChamadaDesligada,43200)

        //Retorna os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
    }

    //######################PAUSAS DO AGENTE ######################
    //PausasListas
    //Lista as pausas disponíveis para o agente
    async listarPausasCampanha(req,res){
        const empresa = await User.getEmpresa(req)
        const listaPausa = 1
        const r = await Pausas.listarPausas(empresa,listaPausa)
        res.send(r)
    }
    //Pausa o agente com o status selecionado
    async pausarAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.body.ramal
        const idPausa = parseInt(req.body.idPausa)
        const infoPausa = await Pausas.dadosPausa(empresa,idPausa)
        
        const pausa = infoPausa[0].nome
        const descricao = infoPausa[0].descricao
        const tempo = infoPausa[0].tempo
            
        await Agente.alterarEstadoAgente(empresa,ramal,2,idPausa)       
        res.send(true)        
    }
    //Exibe o estado e as informacoes da pausa do agente
    async statusPausaAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const infoPausa = await Agente.infoPausaAgente(empresa,ramal)
        const statusPausa={}
        if(infoPausa.length==0){
            statusPausa['status']="agente disponivel"
            res.send(statusPausa)
            return false;
        }

        const idPausa = infoPausa[0].idPausa
        const dadosPausa = await Pausas.dadosPausa(empresa,idPausa)
        const inicio = moment(infoPausa[0].inicio, "HH:mm:ss").format("HH:mm:ss") 
        const hoje = moment().format("YYYY-MM-DD")
        const agora = moment().format("HH:mm:ss") 
        const termino = moment(infoPausa[0].termino, "HH:mm:ss").format("HH:mm:ss")
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
        let endTime_res = moment(`${hoje}T${termino}`).format();
        let duration_res = moment.duration(moment(endTime_res).diff(startTime_res));

        let horasRes = duration_res.hours(); //hours instead of asHours
        let minRes = duration_res.minutes(); //minutes instead of asMinutes
        let segRes = duration_res.seconds(); //minutes instead of asMinutes

        const tempoRestante = horasRes+':'+minRes+':'+segRes

        //console.log('Tempo Restante',tempoRestante,horasRes,minRes,segRes)

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
        const empresa = await User.getEmpresa(req)
        const ramal = req.body.ramal
        await Agente.alterarEstadoAgente(empresa,ramal,1,0)
        res.send(true)
    }


    //Pula Registro atual
    async pularChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        await Agente.alterarEstadoAgente(empresa,ramal,1,0)
        res.send(true)
    }

    async marcarRetorno(req,res){
        const empresa = await User.getEmpresa(req)
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
        const dadosAtendimento = await Redis.getter(`${empresa}:atendimentoAgente:${ramal}`)
        if((dadosAtendimento===null)&&(dadosAtendimento=={})){
            res.json(false);
            return false
        }
        const id_numero = dadosAtendimento['id_numero']
        const id_registro = dadosAtendimento['id_registro']
        const removeNumero = 0
        const campanha = dadosAtendimento['id_campanha']
        const mailing= dadosAtendimento['id_mailing']
        
        await Agente.agendandoRetorno(empresa,ramal,campanha,mailing,id_numero,id_registro,numero,data,hora)
        const r = await Discador.tabulaChamada(empresa,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
        
        res.json(r);
    }   

}
export default new AgenteController()