import Discador from '../models/Discador'
import Asterisk from '../models/Asterisk'
import Campanhas from '../models/Campanhas'


import User from '../models/User'
import Clients from '../models/Clients';
import moment from 'moment';
import Redis from '../Config/Redis';

class DiscadorController{
    async campanhasAtivasAgente(req,res){
        const empresa = await User.getEmpresa(req)      
        const agente = req.params.agente
        const campanhas = await Discador.campanhasAtivasAgente(empresa,agente)
        const hoje = moment().format("YYYY-MM-DD")

        const chamadasManuais = await Discador.tentativasChamadasManuais(empresa,hoje)

        const retorno={}
              retorno["campanhasAtivas"]=campanhas
              retorno["clicksChamadasManuais"]=chamadasManuais['cliques']
              retorno["ligacoesManuais"]=chamadasManuais['chamadas']
        res.json(retorno)
    }
    async checkAccounts(){ 
        let clientesAtivos=await Redis.getter('empresas')    
        if(!clientesAtivos){
            clientesAtivos=await Clients.clientesAtivos()
            await Redis.setter('empresas',clientesAtivos,600)
        }        
       
        const clientes = clientesAtivos;  
        for(let i=0;i<clientes.length;++i){
            const empresa = clientes[i].prefix 
            const horaAtual = moment().format("HH:mm")
            if(horaAtual=='23:59'){//Desloga todos usuarios as 23h59
                await User.logoffUsersExpire(empresa)
                //await User.logoffUsersExpire('megaconecta')
            }     
            this.campanhasEmpresa(empresa)
        }
        setTimeout(async ()=>{             
            await this.checkAccounts();
        },5000)
    }

    async campanhasEmpresa(empresa){
        const hoje = moment().format("YYYY-MM-DD")
        const hora = moment().format("HH:mm:ss")
       
        // Atualiza contagem de chamadas simultaneas
        //await Discador.registrarChamadasSimultaneas(empresa)

        //Checando se existem retornos agendados
        const followUps = await Discador.checaAgendamento(empresa,hoje,hora);//Confere retornos agendados
        if(followUps.length >= 1){
            const regAgendado = await Discador.abreRegistroAgendado(empresa,followUps[0].id)//Abre a tela de retorno para o agente          
            if(regAgendado!==false){
               return false 
            }
        }
        const campanhasAtivas = await Discador.campanhasAtivas(empresa);//Verifica se existem campanhas ativas
        if(campanhasAtivas.length === 0) return false
        for(let i=0; i<campanhasAtivas.length; i++){
            const idCampanha = campanhasAtivas[i].id
            const idFila = campanhasAtivas[i].idFila
            const nomeFila = campanhasAtivas[i].nomeFila
            const idMailing = campanhasAtivas[i].idMailing
            const tabela_dados = campanhasAtivas[i].tabela_dados    
            const tabela_numeros = campanhasAtivas[i].tabela_numeros
            const parametrosDiscador={}
                  parametrosDiscador['tipo_discador']= campanhasAtivas[i].tipo_discador
                  parametrosDiscador['agressividade']= campanhasAtivas[i].agressividade
                  parametrosDiscador['tipo_discagem']= campanhasAtivas[i].tipo_discagem
                  parametrosDiscador['ordem_discagem']= campanhasAtivas[i].ordem_discagem
                  parametrosDiscador['modo_atendimento']= campanhasAtivas[i].modo_atendimento
                  parametrosDiscador['saudacao']= campanhasAtivas[i].saudacao
                 
                  
            //Conta chamadas simultaneas e agressividade e compara com os agentes disponiveis
            const qtdChamadasSimultaneas=await Discador.totalChamadasSimultaneas(empresa,idCampanha)
            console.log('✅check------------------------------------------','qtdChamadasSimultaneas',qtdChamadasSimultaneas)
            const agendamento = await Discador.agendamentoCampanha(empresa,idCampanha)//Verifica se a campanha possui horário de agendamento
            if(agendamento.length==0){
                const msg = "Esta campanha não tem um horário de funcionamento definido!"
                const estado = 3
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false    
            }
            const dataAgenda = await Discador.agendamentoCampanha_data(empresa,idCampanha)//Verifica se a campanha ativas esta dentro da data de agendamento                                                                      
            if((dataAgenda['inicio']>hoje)||(dataAgenda['termino']<=hoje)){
                const msg = "Esta campanha esta fora da sua data de agendamento!"
                const estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false    
            }
            const horarioAgenda = await Discador.agendamentoCampanha_horario(empresa,idCampanha)           
            if((horarioAgenda['hora_inicio']>=hora)||(horarioAgenda['hora_termino']<=hora)){
                const msg = "Esta campanha esta fora do seu horário de agendamento!"
                const estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false
            }   
            await this.iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador,qtdChamadasSimultaneas)  
        } 
    } 
    async iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador,qtdChamadasSimultaneas){
        const agentes = await Discador.agentesNaFila(empresa,idFila)//Verifica se existem agentes na fila
        if(agentes==0){
            const msg = "Nenhum agente na fila"
            const estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado) 
            return false;            
        }

        const agentesDisponiveis = await Discador.agentesDisponiveis(empresa,idFila)//Verificando se os agentes estao logados e disponiveis 
        if(agentesDisponiveis === 0){   
            let msg='Nenhum agente disponível'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const planoEmpresa = await Clients.planoEmpresa(empresa)
        if(planoEmpresa==0){   
            let msg='Plano/Canais não definidos, consulte suporte!'
            let estado = 3
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const ilimitado = planoEmpresa.ilimitado
        const maxCanais = planoEmpresa.total_channels
        let agressividade = parametrosDiscador['agressividade']
        let tipoDiscagem = parametrosDiscador['tipo_discagem']
        let tipoDiscador = parametrosDiscador['tipo_discador']
        let ordemDiscagem = parametrosDiscador['ordem_discagem']
        if((parametrosDiscador['tipo_discador']=="clicktocall")||(parametrosDiscador['tipo_discador']=="preview")){         
            //Caso o discador seja clicktocall ou preview a agressividade eh sempre 1   
            agressividade=1
            tipoDiscagem = "horizontal"
        } 
        const limiteDiscagem = agentesDisponiveis * agressividade
        let limitRegistros = 0
        if(limiteDiscagem<qtdChamadasSimultaneas){
            limitRegistros=0
            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)            
            return false;
        }
        limitRegistros=limiteDiscagem-qtdChamadasSimultaneas//Calcula o limite de registros disponiveis para discagem
        let canaisDisponiveis = limitRegistros//Seta os canais disponiveis como o limite de registros
        if(ilimitado==1){
            //Em caso de plano ilimitado, calcula o restante de canais disponiveis
            canaisDisponiveis = maxCanais-qtdChamadasSimultaneas
        }
        if(canaisDisponiveis<limitRegistros){//Caso tenham menos canais do que limite seta o limite=canais
            limitRegistros=canaisDisponiveis
            if(limitRegistros==0){
                let msg='Todos os canais de atendimento estão em uso!'
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }
        }
        //Verifica se existem registros nao trabalhados ou com o nº de tentativas abaixo do limite
        const registros = await Discador.filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros)
        if(registros.length==0){
            if(limitRegistros==0){
                let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)            
                return false;
            }
            let msg='Todos os registros do mailing já foram trabalhados!'
            let estado = 3
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        for(let i=0; i<registros.length; i++){
            const registro = registros[i]
            const numero = registros[i].numero
            const ocupado = await Discador.checaNumeroOcupado(empresa,numero)//Verifica se o numero selecionado ja nao esta em atendimento
            if(ocupado === true){  
                let msg='O numero selecionado esta em atendimento'
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }
            let msg='Campanha discando'
            let estado = 1
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            this.prepararDiscagem(empresa,idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem)
        }
    }
    async prepararDiscagem(empresa,idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem){
        const idRegistro = registro['id_registro']
        const numero = registro['numero']
        const idNumero = registro['idNumero']
        const idAtendimento = moment().format("YMMDDHHmmss")
        //console.log('ID NUMERO', idNumero)
        const checkReg = await Discador.checandoRegistro(empresa,idRegistro)
        if(checkReg === true) return false;

        if(limiteDiscagem<qtdChamadasSimultaneas){
            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis!'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        await Discador.registraNumero(empresa,idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros)
        const tipoDiscador = parametrosDiscador['tipo_discador']
        const modoAtendimento = parametrosDiscador['modo_atendimento']
        if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
            //Seleciona agente disponivel a mais tempoPassado           
            const agenteDisponivel = await Discador.agenteDisponivel(empresa,idFila)
            if(agenteDisponivel==0){
                let msg='Nenhum agente disponivel!'
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }
            const numeroDiscado = numero             
            await Discador.registraChamada(empresa,idAtendimento,agenteDisponivel,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numeroDiscado,nomeFila)
            
            const estado = 5 //Estado do agente quando ele esta aguardando a discagem da tela
            await Discador.alterarEstadoAgente(empresa,agenteDisponivel,estado,0)  
        }else if(tipoDiscador=="power"){
            //Registra chamada simultânea       
            const hora = moment().format("HH")
            let periodo='bom-dia'
            if(hora<=12){
                periodo='bom-dia'
            }else if(hora<=18){
                periodo='boa-tarde'
            }else{  
                periodo='boa-noite'
            }
            let saudacao
            let aguarde 
            if((parametrosDiscador['saudacao']=="masculino")||(parametrosDiscador['saudacao']=="feminino")){
                saudacao=`${parametrosDiscador['saudacao']}-${periodo}`
                aguarde=`${parametrosDiscador['saudacao']}-aguarde`
            }else if(parametrosDiscador['saudacao']=="aleatorio"){
                const rand = Math.floor(Math.random() * 2);
                let voice='feminino'
                if(rand==1){
                    voice='masculino'
                }
                saudacao=`${voice}-${periodo}`
                aguarde=`${voice}-aguarde`
            }else{
                saudacao='sem-audio'
                aguarde='sem-audio'
            }
            if(tipoDiscador=='preditivo'){
                let msg="O Discador Preditivo ainda não está disponível!";
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }  
            const ec = await Campanhas.dadosCampanha(empresa,idCampanha)//Verifica se a campanha ainda esta ativa 
            let estadosCampanha = 0
            if(ec.length>0){
                estadosCampanha = ec[0].estado
            }   
            if(estadosCampanha==1){
                //console.log('==>> D I S C A R = > = >') 
                await Discador.discar(empresa,0,idAtendimento,numero,nomeFila,saudacao,aguarde,idCampanha,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero)          
            }
        }
    }

























    
   

    

   

        
       
        

   

   

    async linkGravacao(req,res){
        const hash = req.params.hash
        //const data = Buffer.from(hash).toString('base64')
        const data = Buffer.from(hash, 'base64').toString('ascii').split(':');
        const idEmpresa=data[0]
        const idRec=data[1]
        const empresa = await Gravacoes.prefixEmpresa(idEmpresa)
        if(empresa==false){
            res.json({"error":true,"message":"Gravação não encontrada!"})
            return false;
        }
        const gravacoes = await Gravacoes.linkRec(empresa,idRec);
        if(gravacoes.length==0){
            res.json({"error":true,"message":"Gravação não encontrada!"})
            return false;
        }
        const gravacao={}
              gravacao["data"]=gravacoes[0].data
              let duracao = gravacoes[0].duracao
              let horas = Math.floor(duracao / 3600);
              let minutos = Math.floor((duracao - (horas * 3600)) / 60);
              let segundos = Math.floor(duracao % 60);
              if(horas<=9){horas="0"+horas}
              if(minutos<=9){minutos="0"+minutos}
              if(segundos<=9){segundos="0"+segundos}
              gravacao["duracao"]=`${horas}:${minutos}:${segundos}`
              gravacao["protocolo"]=gravacoes[0].protocolo
              gravacao["ramal"]=gravacoes[0].ramal
              gravacao["usuario"]=gravacoes[0].nome
              gravacao["equipe"]=gravacoes[0].equipe
              gravacao["numero"]=gravacoes[0].numero
              gravacao["nome_registro"]=gravacoes[0].nome_registro
              gravacao["statusTabulacao"]=gravacoes[0].tabulacao
              gravacao["tipoTabulacao"]=gravacoes[0].tipo
              gravacao["link"]=`https://asterisk-dev.megaconecta.tec.br/api/gravacoes/${empresa}/${gravacoes[0].date_record}/${gravacoes[0].callfilename}.wav`
        res.json(gravacao)
    }
}

export default new DiscadorController()