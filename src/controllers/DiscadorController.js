import Discador  from '../models/Discador'
import Agente    from '../models/Agente'
import Campanhas from '../models/Campanhas'
import User      from '../models/User'
import Clients   from '../models/Clients';
import moment    from 'moment';
import Redis     from '../Config/Redis';

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
        //console.log(` \n \n \n:: ::: ::: ::: I N I C I O ::: ::: ::: ::: \n[ ❗] Iniciando Discador ${hoje} - ${hora}`,'[ ❗]\n ')
        
        //Tratando estados das chamadas manuais
        await Discador.chamadasSimultaneasManuais(empresa)
<<<<<<< HEAD

        //Checando se existem retornos agendados
        const followUps = await Discador.checaAgendamento(empresa,hoje,hora);
=======
       
        //Checando se existem retornos agendados
        const followUps = await Discador.checaAgendamento(empresa,hoje,hora);
        
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        if(followUps.length>0){
            await Discador.abreRegistroAgendado(empresa,followUps[0].id)//Abre a tela de retorno para o agente
        }

        //Iniciando verificação das campanhas ativas
<<<<<<< HEAD
        const campanhasAtivas = await Discador.campanhasAtivas(empresa);
        //console.log(`${campanhasAtivas.length} campanhas ativas`)
        if(campanhasAtivas.length === 0){
            return false
        }

        for(let i=0; i<campanhasAtivas.length; i++){
            const idCampanha     = campanhasAtivas[i].id
            const idFila         = campanhasAtivas[i].idFila
            const nomeFila       = campanhasAtivas[i].nomeFila
            const idMailing      = campanhasAtivas[i].idMailing
            const tabela_dados   = campanhasAtivas[i].tabela_dados    
            const tabela_numeros = campanhasAtivas[i].tabela_numeros
=======
        const campanhasAtivas = await Discador.campanhasAtivas(empresa);      
        //console.log('\n[ ❗] Verificador-> [',empresa,'] fnc->','campanhasAtivas',campanhasAtivas) 
        //console.log(`${campanhasAtivas.length} campanhas ativas`)
        if(campanhasAtivas.length === 0){
            return false
        }       

        for(let i=0; i<campanhasAtivas.length; i++){           
            const idCampanha     = campanhasAtivas[i].id
            const idFila         = campanhasAtivas[i].idFila
            const nomeFila       = campanhasAtivas[i].nomeFila           
          
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
            const parametrosDiscador={}
                  parametrosDiscador['tipo_discador']    = campanhasAtivas[i].tipo_discador
                  parametrosDiscador['agressividade']    = campanhasAtivas[i].agressividade
                  parametrosDiscador['tipo_discagem']    = campanhasAtivas[i].tipo_discagem
                  parametrosDiscador['ordem_discagem']   = campanhasAtivas[i].ordem_discagem
                  parametrosDiscador['modo_atendimento'] = campanhasAtivas[i].modo_atendimento
                  parametrosDiscador['saudacao']         = campanhasAtivas[i].saudacao  
            //Conta chamadas simultaneas e agressividade e compara com os agentes disponiveis              
            const agendamento = await Discador.agendamentoCampanha(empresa,idCampanha)//Verifica se a campanha possui horário de agendamento        
            if(agendamento.length==0){
                const msg = "Esta campanha não tem um horário de funcionamento definido!"
                const estado = 3
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            }else{
                const dataAgenda = await Discador.agendamentoCampanha_data(empresa,idCampanha)//Verifica se a campanha ativas esta dentro da data de agendamento  
                if((dataAgenda['inicio']>hoje)||(dataAgenda['termino']<=hoje)){
                    const msg = "Esta campanha esta fora da sua data de agendamento!"
                    const estado = 2
                    await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                }else{
                    const horarioAgenda = await Discador.agendamentoCampanha_horario(empresa,idCampanha) 
                    if((horarioAgenda['hora_inicio']>=hora)||(horarioAgenda['hora_termino']<=hora)){
                        const msg = "Esta campanha esta fora do seu horário de agendamento!"
                        const estado = 2
                        await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                    }else{
                        await this.iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,parametrosDiscador)
                    }
                }
            }    
        }
    }

<<<<<<< HEAD
    async iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador){
        const hoje = moment().format("YYYY-MM-DD")
        const hora = moment().format("HH:mm:ss")
=======
    async iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,parametrosDiscador){        
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        //console.log(` \n::: ::: ::: ::: P R E P A R A N D O   D I S C A D O R ::: ::: ::: ::: \n[ ❗] Iniciando Preparação do Discador ${hoje} - ${hora}`,'[ ❗]\n ')
        
        //Remove chamadas encerradas e conta as chamadas simultaneas
        const qtdChamadasSimultaneas=await Discador.totalChamadasSimultaneas(empresa,idCampanha)
<<<<<<< HEAD
        
=======
      
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        //Verificando agentes na fila da campanha
        const agentes = await Discador.agentesNaFila(empresa,idFila)
        if(agentes==0){
            const msg = "Nenhum agente na fila"
            const estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado) 
            return false;            
        }

        //Verificando agentes disponiveis da fila
        const agentesDisponiveis = await Discador.agentesDisponiveis(empresa,idFila) 
        if(agentesDisponiveis == 0){   
            let msg='Nenhum agente disponível'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }

        //Verificando plano da empresa
        const planoEmpresa = await Clients.planoEmpresa(empresa)
        if(planoEmpresa==0){   
            let msg='Plano/Canais não definidos, consulte suporte!'
            let estado = 3
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const ilimitado   = planoEmpresa.ilimitado
        const maxCanais   = planoEmpresa.total_channels

        //Setando variáveis do Discador        
        let agressividade = parametrosDiscador['agressividade']
        let tipoDiscagem  = parametrosDiscador['tipo_discagem']
        let tipoDiscador  = parametrosDiscador['tipo_discador']
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

        //Calcula o limite de registros disponiveis para discagem
        limitRegistros=limiteDiscagem-qtdChamadasSimultaneas

        //Seta os canais disponiveis como o limite de registros
        let canaisDisponiveis = limitRegistros
        if(ilimitado==1){
            //Em caso de plano ilimitado, calcula o restante de canais disponiveis
            canaisDisponiveis = maxCanais-qtdChamadasSimultaneas
        } 
<<<<<<< HEAD


=======
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        //console.log(" \n== == == == VÁRIAVEIS DO DISCADOR == == == ==")
        //console.log(empresa,`Campanha: ${idCampanha}`)
        //console.log("> agentesDisponiveis",agentesDisponiveis)
        //console.log("> agressividade",agressividade)
        //console.log("> tipoDiscagem",tipoDiscagem)
        //console.log("> tipoDiscador",tipoDiscador)
        //console.log("> ordemDiscagem",ordemDiscagem)
        //console.log("> tipo_discador",parametrosDiscador['tipo_discador'])         
        //console.log("> limiteDiscagem",limiteDiscagem)
        //console.log("> limitRegistros",limitRegistros)
        //console.log("> canaisDisponiveis",canaisDisponiveis)
        //console.log("== == == == VÁRIAVEIS DO DISCADOR == == == ==\n ")

<<<<<<< HEAD


=======
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        if(canaisDisponiveis<limitRegistros){
            limitRegistros=canaisDisponiveis
            if(limitRegistros==0){
                let msg='Todos os canais de atendimento estão em uso!'
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }
        }

        //Inicia filtragem do registro
<<<<<<< HEAD
        await this.separarRegistros(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros)
    }

    async separarRegistros(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros){
        const hoje = moment().format("YYYY-MM-DD")
        const hora = moment().format("HH:mm:ss")
        //console.log(` \n::: ::: ::: ::: S E P A R A Ç Ã O   D E   R E G I S T R O S ::: ::: ::: ::: \n[ ❗] Iniciando Filtragem de registros ${hoje} - ${hora}`,'[ ❗]\n ')
        
=======
        await this.separarRegistros(empresa,idCampanha,parametrosDiscador,limitRegistros,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem)
    }

    async separarRegistros(empresa,idCampanha,parametrosDiscador,limitRegistros,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem){      
        //console.log(` \n::: ::: ::: ::: S E P A R A Ç Ã O   D E   R E G I S T R O S ::: ::: ::: ::: \n[ ❗] Iniciando Filtragem de registros ${hoje} - ${hora}`,'[ ❗]\n ')
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        //VERIFICA QUANTOS REGISTROS PRECISAM SER SELECIONADOS
        let limit=limitRegistros;
        if(limitRegistros<0){
            limit=0
        }else if(limitRegistros>10){
            limit=10
<<<<<<< HEAD
        }
        
        if(tipoDiscador!="power"){
            limit=1
        }

        //console.log('Limit Final',limit)

        //SELECIONA OS NUMEROS DISPONIVEIS
        await Discador.selecionaNumerosCampanha(empresa,idCampanha,tabela_numeros,idMailing,limit) 

        //CONFERE DUPLICIDADE DE NUMEROS

        //CONFERE DUPLICIDADE DE REGISTROS



        return true
    }


    async old_iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador){
        
        //Verifica se existem registros nao trabalhados ou com o nº de tentativas abaixo do limite
        const registros = await Discador.filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros)
        if(registros.length==0){
=======
        }        
        if(parametrosDiscador['tipoDiscador']!="power"){
            limit=1
        }
        //console.log('Limit Final',limit)
        //SELECIONA OS NUMEROS DISPONIVEIS
        const registros = await Discador.selecionaNumerosCampanha(empresa,idCampanha,limitRegistros) 
        console.log('Filtrando Registros',registros)

        if((registros==false)||(registros==[])){
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
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

        //CONFERE DUPLICIDADE DE NUMEROS
        const numerosSeparados = []
        for(let i=0; i<registros.length; i++){
            const numero = registros[i].numero
            //Verificando Numero
            if(numerosSeparados.includes(numero)==false){
                numerosSeparados.push(numero)
                const registro = registros[i]
                let msg=`Campanha discando`
                let estado = 1
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                this.prepararDiscagem(empresa,idCampanha,parametrosDiscador,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem)
            }
        }            
    }

<<<<<<< HEAD
    async old_prepararDiscagem(empresa,idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem){
        const idRegistro = registro['id_registro']
=======
    async prepararDiscagem(empresa,idCampanha,parametrosDiscador,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem){
        const idRegistro = registro['idRegistro']
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        const numero = registro['numero']
        const idNumero = registro['idNumero']
        const date =  moment().format("YMMDDHHmmss")
        const idAtendimento = `${idCampanha}${date}${idRegistro}${idNumero}`
<<<<<<< HEAD
        ////console.log('ID NUMERO', idNumero)        
=======
        //CONFERE DUPLICIDADE DE REGISTROS
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
        const checkReg = await Discador.checandoRegistro(empresa,idRegistro,idCampanha)
        if(checkReg === true){  
            let msg='O registro selecionado esta em atendimento'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const checkNum = await Discador.checaNumeroOcupado(empresa,idCampanha,numero)//Verifica se o numero selecionado ja nao esta em atendimento
        if(checkNum === true){  
            let msg='O numero selecionado esta em atendimento'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        if(limiteDiscagem<qtdChamadasSimultaneas){
            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis!'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const tipoDiscador = parametrosDiscador['tipo_discador']
        let modoAtendimento= 'auto'
        if(parametrosDiscador['modo_atendimento']!=undefined){
             modoAtendimento = parametrosDiscador['modo_atendimento']
        }
<<<<<<< HEAD
        //CONTINUAR . . .

        




        ////console.log('Ligando para o numero',idRegistro,idNumero,numero)
        ////console.log('Ligando para o Id Registro',idRegistro)
        ////console.log('Ligando para o Id Registro',idNumero)
        ////console.log('Ligando para o Numero',numero)
        ////console.log('Ligando para o Id Atendimento',idAtendimento) 

        //await Discador.registraNumero(empresa,idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros)
        

        
=======
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d

        console.log(registro)
        console.log('\n[ ❗] Verificador-> [',empresa,'] fnc->','prepararDiscagem',registro)
      
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
            const idMailing = await Campanhas.idMailingCampanha(empresa,idCampanha)  
            await Discador.registraChamada(empresa,agenteDisponivel,idAtendimento,0,idMailing,idCampanha,modoAtendimento,tipoDiscador,idRegistro,idNumero,numeroDiscado,nomeFila,0)
            
            const estado = 5 //Estado do agente quando ele esta aguardando a discagem da tela
            await Agente.alterarEstadoAgente(empresa,agenteDisponivel,estado,0)  

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
                ////console.log('==>> D I S C A R = > = >') 
                ////console.log('Discando',idAtendimento)
<<<<<<< HEAD
                await Discador.discar(empresa,0,idAtendimento,numero,nomeFila,modoAtendimento,saudacao,aguarde,idCampanha,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero)          
=======
                const idMailing = await Campanhas.idMailingCampanha(empresa,idCampanha) 
                await Discador.discar(empresa,0,idAtendimento,numero,nomeFila,modoAtendimento,saudacao,aguarde,idCampanha,idMailing,idRegistro,idNumero)          
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
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