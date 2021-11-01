import Discador from '../models/Discador'
import Campanhas from '../models/Campanhas'
import Report from '../models/Report'
import Pausas from '../models/Pausas'
import User from '../models/User'
import Clients from '../models/Clients';
import Cronometro from '../models/Cronometro'
import moment from 'moment';

class DiscadorController{         
    async debug(title="",msg="",empresa=""){     
        
        if(process.env.DEBUG=='dialer'){
            const data = moment().format("DD/MM/YYYY HH:mm:ss");
           //console.log(`${title}`,msg,`date: ${data}`)
        }
    }     

    async campanhasAtivasAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const agente = req.params.agente
        const campanhas = await Discador.campanhasAtivasAgente(empresa,agente)
        const hoje = moment().format("Y-MM-DD")
        const clicks_chamadasManuais = await Discador.tentativasChamadasManuais(empresa,'clicks',hoje)
        const chamadasManuais = await Discador.tentativasChamadasManuais(empresa,'chamadas',hoje)

        const retorno={}
              retorno["campanhasAtivas"]=campanhas
              retorno["clicksChamadasManuais"]=clicks_chamadasManuais
              retorno["ligacoesManuais"]=chamadasManuais
        res.json(retorno)
    }

    //Discador Otimizado:
    async checkAccounts(){
        const clientesAtivos = await Clients.clientesAtivos()
        
        let cache_timeout_ca
        for(let i=0;i<clientesAtivos.length;++i){
            const empresa = clientesAtivos[i].prefix 
             //await this.debug(`${empresa} - loop`,i,empresa)
           //  //await this.debug('EMPRESA==>',empresa)           ,empresa 
            //Funcoes de controle
            //Desloga todos usuarios as 23h59
            const horaAtual = moment().format("HH:mm")
            if(horaAtual=='23:59'){
                await User.logoffUsersExpire(empresa)
            }     

            setTimeout(async ()=>{  
                if(process.env.ENVIRONMENT=='dev'){
                
                    this.campanhasEmpresa('megaconecta')
                }else{
                    this.campanhasEmpresa(empresa)
                }   
            },1000) 
            
            
            
        }
        cache_timeout_ca=setTimeout(async ()=>{  
             await this.checkAccounts();
        },5000)
        
    }

    async campanhasEmpresa(empresa){
        console.log('campanha empresa',empresa)
        //await this.debug(' ',' ',empresa)
        //await this.debug('EMPRESA==>',empresa,empresa)
        
        ////await this.debug(empresa,'Iniciando Discador',empresa)
        //PASSO 1 - VERIFICAÇÃO
        //await this.debug('PASSO 1 - VERIFICAÇÃO','',empresa)
        //#1 Conta as chamadas simultaneas para registrar no log        
        const rcs = await Discador.registrarChamadasSimultaneas(empresa)
      
        
         //await this.debug(`registrarChamadasSimultaneas:${empresa}`,rcs,empresa)

        //#2 Verifica possiveis chamadas presas e remove das chamadas simultâneas
        const cc = await Discador.clearCalls(empresa) 
         //await this.debug(`clearCalls:${empresa}`,cc,empresa)
        
        //# - VERIFICA SE POSSUI RETORNOS AGENDADOS
        const hoje = moment().format("Y-MM-DD")
        const hora = moment().format("HH:mm:ss")
         //await this.debug('Verificando retornos para', `${hoje} as ${hora}`,empresa)
        const agendamento = await Discador.checaAgendamento(empresa,hoje,hora);
        if(agendamento.length >= 1){
             //await this.debug('Iniciando agendamento!',empresa)
            //seta registro para agente
            await Discador.abreRegistroAgendado(empresa,agendamento[0].id)
            return false 
        }

        //#3 Verifica se existem campanhas ativas
        const campanhasAtivas = await Discador.campanhasAtivas(empresa);  
        //await this.debug(`campanhasAtivas:${empresa}`,campanhasAtivas,empresa)
        
        if(campanhasAtivas.length === 0){
             //await this.debug('',empresa)
             //await this.debug('[!]',`Empresa: ${empresa},  ..................................STOP[!]`)      ,empresa 
             //await this.debug(`[!] ${empresa} Alert:`,'Nenhuma campanha ativa!'),empresa 
             //await this.debug('',empresa)
            //await this.debug('[!]','Nenhuma campanha ativa![!]',empresa)
             //await this.debug('continuando....',empresa)
            return false
        }

        //percorrendo campanhas ativas
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
           
            //#7 Verifica se a campanha possui Agendamento de retornos   
            const agendamento = await Discador.agendamentoCampanha(empresa,idCampanha)
             //await this.debug(`agendamentoCampanha:${empresa}`,agendamento,empresa)
            if(agendamento.length==0){                    
                //Iniciando Passo 2     
                 //await this.debug(`Campanha sem agendamento:${empresa}`,true,empresa)
            }
            //#8 Verifica se a campanha ativas esta dentro da data de agendamento 
            const hoje = moment().format("Y-MM-DD")
            const dataAgenda = await Discador.agendamentoCampanha_data(empresa,idCampanha,hoje)
             //await this.debug(`agendamentoCampanha_data:${empresa}`,dataAgenda,empresa)
            if(dataAgenda.length === 0){
                const msg = "Esta campanha esta fora da sua data de agendamento!"
                const estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            }
            const agora = moment().format("HH:mm:ss")
            const horarioAgenda = await Discador.agendamentoCampanha_horario(empresa,idCampanha,agora)
             //await this.debug(`agendamentoCampanha_horario:${empresa}`,horarioAgenda,empresa)
            if(horarioAgenda.length === 0){
                const msg = "Esta campanha esta fora do horario de agendamento!"
                const estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            }
            //Iniciando Passo 2
            setTimeout(async ()=>{  
                await this.iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador)    
            },500)     
        }
    }

    async iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador){
        
        //PASSO 2 - PREPARAÇÃO DO DISCADOR
        //await this.debug(' ','',empresa)
        //await this.debug(' . . . . . . PASSO 2 - PREPARAÇÃO DO DISCADOR','',empresa)
         //await this.debug('PASSO 2 - iniciaPreparacaoDiscador',empresa,empresa)
         //await this.debug('EMPRESA PREPARAÇÃO DO DISCADOR==>',empresa,empresa)

        //#1 Verifica se existem agentes na fila         
        const agentes = await Discador.agentesNaFila(empresa,idFila)
         //await this.debug(`agentesNaFila:${empresa}`,agentes,empresa)
        if(agentes==0){
            const msg = "Nenhum agente na fila"
            const estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado) 
            return false;
        }

        //#2 Verificando se os agentes estao logados e disponiveis
        const agentesDisponiveis = await Discador.agentesDisponiveis(empresa,idFila) 
         //await this.debug(`agentesDisponiveis:${empresa}`,agentesDisponiveis,empresa)
        if(agentesDisponiveis === 0){   
            let msg='Nenhum agente disponível'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const maxCanais = await Clients.maxChannels(empresa)
        

        let agressividade = parametrosDiscador['agressividade']
        let tipoDiscagem = parametrosDiscador['tipo_discagem']
        let tipoDiscador= parametrosDiscador['tipo_discador']
        if((parametrosDiscador['tipo_discador']=="clicktocall")||(parametrosDiscador['tipo_discador']=="preview")){
            //Caso o discador seja clicktocall ou preview a agressividade eh sempre 1
            agressividade=1
            tipoDiscagem = "horizontal"
        } 
        
        //console.log(empresa,'AGENTES',agentesDisponiveis)
        //console.log(empresa,'AGRESSIVIDADE',agressividade)
        
        //#4 Conta chamadas simultaneas e agressividade e compara com os agentes disponiveis
        //await this.debug(' . . . . . . . . . . PASSO 2.4 - Calculando chamadas simultaneas x agentes disponiveis','',empresa)
        const limiteDiscagem = agentesDisponiveis * agressividade //16
        const qtdChamadasSimultaneas = await Discador.qtdChamadasSimultaneas(empresa,idCampanha)//11
        let limitRegistros = 0
         //await this.debug(`agressividade: ${empresa} ${idCampanha}`,agressividade,empresa)
         //await this.debug(`agentesDisponiveis:${empresa}`,agentesDisponiveis,empresa)
         //await this.debug(`limiteDiscagem:${empresa}`,limiteDiscagem,empresa)
         //await this.debug(`qtdChamadasSimultaneas:${empresa}`,qtdChamadasSimultaneas,empresa)
         //await this.debug(`qtdChamadasSimultaneas:${empresa}`,qtdChamadasSimultaneas,empresa)
        if(limiteDiscagem<qtdChamadasSimultaneas){//5
            limitRegistros=0
            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            
            return false;
        }else{
            const canaisDisponiveis = maxCanais-qtdChamadasSimultaneas//29            
            
            limitRegistros=limiteDiscagem-qtdChamadasSimultaneas//5
            //console.log(empresa,'Limite de Discagem',limiteDiscagem)
            //console.log(empresa,'Chamadas Simultaneas',qtdChamadasSimultaneas)
            //console.log(empresa,'Canais Disponiveis',canaisDisponiveis)
            //console.log(empresa,'Limite Reg',limitRegistros)

            if(canaisDisponiveis<limitRegistros){
                limitRegistros=canaisDisponiveis

                if(limitRegistros==0){
                    let msg='Todos os canais de atendimento estão em uso!'
                     //await this.debug('Todos os canais de atendimento estão em uso!',empresa)
                    let estado = 2
                    await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                    return false;
                }
            }

            const tipoDiscagem=parametrosDiscador['tipo_discagem']
            const ordemDiscagem=parametrosDiscador['ordem_discagem']
            //#5 Verifica se existem registros nao trabalhados ou com o nº de tentativas abaixo do limite
            const registros = await Discador.filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros)
            //console.log(empresa,'total registros filtrados',registros.length)
            //await this.debug(`filtrarRegistro:${empresa}`,registros,empresa)
            if(registros.length ==0){
                let msg='Todos os registros do mailing já foram trabalhados!'
                let estado = 3
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }

            //percorre os numeros selecionados
            for(let i=0; i<registros.length; i++){
                const registro = registros[i]
                            
                const numero = registros[i].numero
                const ocupado = await Discador.checaNumeroOcupado(empresa,numero)  
                //#6 Verifica se o numero selecionado ja nao esta em atendimento
           
                 //await this.debug(`checaNumeroOcupado:${empresa}`,ocupado,empresa)
                if(ocupado === true){  
                    let msg='O numero selecionado esta em atendimento'
                    let estado = 2
                    await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                    return false;
                }

                //Iniciar Passo 3    
                let msg='Campanha discando'
                let estado = 1
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)

                //await this.debug(' . . . . . . . . . . . PASSO 2.6 - Separa o registro','',empresa)
                //console.log(empresa,'envia preparaDiscagem',i, registro['id_registro'])
                 this.prepararDiscagem(empresa,idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem)
              
                
            }
            return true
        }     
    } 


    //Old Dialer

    async prepararDiscagem(empresa,idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem){
        //console.log(empresa,'recebe preparaDiscagem',registro['id_registro'])
        //PASSO 3 - DISCAGEM
        //await this.debug(' ','',empresa)
        //await this.debug(' . . . . . . . . . . . . . PASSO 3 - DISCAGEM','',empresa) 
        //#1 Formata numero
        //await this.debug(' . . . . . . . . . . . . . . PASSO 3.1 - Formatando o número','',empresa)
        const idNumero = registro['idNumero']
        const idRegistro = registro['id_registro']
        const numero = registro['numero']

        //await this.debug('PASSO 3 - prepararDiscagem',empresa,empresa)

        //checa blacklists

        //Checa se algum numero deste cliente esta em atendimento
        const checkReg = await Discador.checandoRegistro(empresa,idRegistro)
         //await this.debug(`filtrarRegistro:${empresa}`,registro,empresa)
        if(checkReg.length ==1){
           //  //await this.debug('registro em processo',idRegistro,empresa)
            return false;
        }
        //console.log(empresa, `Teste Final: ${limiteDiscagem} x ${qtdChamadasSimultaneas}`)
        if(limiteDiscagem<qtdChamadasSimultaneas){
            let msg='Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis'
            let estado = 2
            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
            //await //await this.debug(`Parando por limite de discagem 2 chamada`,empresa)
            return false;
        }



        //Inserção do numero na lista campanhas_tabulacao
        //await this.debug(`${empresa},${idCampanha},${idMailing},${idRegistro},${idNumero},${numero},${tabela_numeros}`,empresa)
        const rn = await Discador.registraNumero(empresa,idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros)
        //await this.debug(`registraNumero:${empresa}`,rn,empresa)

        //#2 Inicia Discagem
        //await this.debug(' . . . . . . . . . . . . . . PASSO 3.2 - Iniciando a discagem','',empresa)
        const tipoDiscador = parametrosDiscador['tipo_discador']
        const modoAtendimento = parametrosDiscador['modo_atendimento'] 

        //#3 Registra chamada simultânea
        //await this.debug(' . . . . . . . . . . . . . . PASSO 3.3 - Registra chamada simultânea','',empresa)
        //await this.debug('discador',tipoDiscador,empresa)
        //console.log(empresa,'tipoDiscador',tipoDiscador)
        if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
            //Seleciona agente disponivel a mais tempoPassado
            const tratado=1
            const atendido=1
            const agenteDisponivel = await Discador.agenteDisponivel(empresa,idFila)
            //await this.debug(`agenteDisponivel:${empresa}`,agenteDisponivel,empresa)
            if(agenteDisponivel==0){
                return true;
            }else{  
                const numeroDiscado = numero             
                const regC=await Discador.registraChamada(empresa,agenteDisponivel,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numeroDiscado,nomeFila,tratado,atendido)
                const idAtendimento = regC['insertId']
                //await this.debug(idAtendimento,empresa)
                //await this.debug(`registraChamada:${empresa}`,regC,empresa)
                const estado = 5 //Estado do agente quando ele esta aguardando a discagem da tela
                const aea=await Discador.alterarEstadoAgente(empresa,agenteDisponivel,estado,0)
                //await this.debug(`alterarEstadoAgente:${empresa}`,aea,empresa)
                //Registra chamada simultânea
            }         
        }else if(tipoDiscador=="power"){    
        
            //Registra chamada simultânea  
            const tratado=0
            const atendido=0 
            const numeroDiscado = numero   
            const regC = await Discador.registraChamada(empresa,0,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numeroDiscado,nomeFila,tratado,atendido)
            const idAtendimento = regC['insertId']
            //await this.debug('idAtendimento',idAtendimento,empresa)
            //await this.debug(`registraChamada:${empresa}`,regC) ,empresa 
             
            /*
            * INICIAR Discagem */
            //await this.debug('DISCAGEM EFETUADA',`EMPRESA: ${empresa} NUMERO: ${numero} FILA: ${nomeFila} `,empresa)
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
            if((parametrosDiscador['saudacao']=="")||
               (parametrosDiscador['saudacao']==null)||
               (parametrosDiscador['saudacao']=="undefined")||
               (parametrosDiscador['saudacao']==undefined)){
                saudacao=`masculino-${periodo}`;
                aguarde=`masculino-aguarde`
            }else{
                saudacao=`${parametrosDiscador['saudacao']}-${periodo}`
                aguarde=`${parametrosDiscador['saudacao']}-aguarde`
            }

            if(tipoDiscador=='preditivo'){
                let msg="O Discador Preditivo ainda não está disponível!";
                let estado = 2
                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }

            //Verifica se a campanha ainda esta ativa 
            const ec = await Campanhas.dadosCampanha(empresa,idCampanha)
            let estadosCampanha = 0
            if(ec.length>0){
                estadosCampanha = ec[0].estado
            }
            

            if(estadosCampanha==1){
                //Verifica se ainda existem agentes disponiveis
                const dataCall=await Discador.discar(empresa,0,numero,nomeFila,idAtendimento,saudacao,aguarde)
                 //await this.debug('Ligando...',`Modo: ${parametrosDiscador['tipo_discagem']} idReg:${idRegistro} Numero: ${numero}`,empresa)
            }
           
                  
        }
        
        //await this.debug(' ','',empresa)
        //await this.debug(' . . . . . . . . . . . . . PASSO 3 CONCLUÍDO','',empresa)
        return true
    }



    
        
        //TESTE DE DISCADOR
        async campanhasEmpresaTest(empresa){
            //console.log('TESTE DE DISCADOR')
            const idCampanha = 37
            const idMailing = 133
            const tabela_dados = "dados_20211024235534" 
            const tabela_numeros = "numeros_20211024235534"
            

            //Iniciando Passo 2
            setTimeout(async ()=>{  
               await this.iniciaPreparacaoDiscadorTeste(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing)    
            },500)     
       }

       async iniciaPreparacaoDiscadorTeste(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing){   
           
        const agentesDisponiveis = 5
        const maxCanais = 49

        let agressividade = 10        
        //console.log(empresa,'___________________________________________________________________')
        //console.log(empresa,'AGENTES',agentesDisponiveis)
        //console.log(empresa,'AGRESSIVIDADE',agressividade)
        const limiteDiscagem = agentesDisponiveis * agressividade //16
        const qtdChamadasSimultaneas = 11
        let limitRegistros = 0

        //console.log("limitRegistros",limitRegistros)
       
        if(limiteDiscagem<qtdChamadasSimultaneas){//5
            limitRegistros=0
            //console.log('Limite de chamadas simultâneas atingido, aumente a agressividade ou aguarde os agentes ficarem disponíveis')
        }else{
            const canaisDisponiveis = maxCanais-qtdChamadasSimultaneas//29    
            limitRegistros=limiteDiscagem-qtdChamadasSimultaneas//5
            //console.log(empresa,'Limite de Discagem',limiteDiscagem)
            //console.log(empresa,'Chamadas Simultaneas',qtdChamadasSimultaneas)
            //console.log(empresa,'Canais Disponiveis',canaisDisponiveis)
            //console.log(empresa,'Limite Reg',limitRegistros)
            //console.log("limitRegistros",limitRegistros)
            if(canaisDisponiveis<limitRegistros){
                limitRegistros=canaisDisponiveis
                if(limitRegistros==0){
                    //console.log('Todos os canais de atendimento estão em uso!')
                }
            }
            //console.log("limitRegistros",limitRegistros)

            //#5 Verifica se existem registros nao trabalhados ou com o nº de tentativas abaixo do limite
            const registros = await Discador.filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,'power','vertical','ASC',limitRegistros)
            //console.log(empresa,'total registros filtrados',registros.length)
            //await this.debug(`filtrarRegistro:${empresa}`,registros,empresa)
            if(registros.length ==0){
                //console.log('Todos os registros do mailing já foram trabalhados!')
            }

            //percorre os numeros selecionados
            for(let i=0; i<registros.length; i++){
                const registro = registros[i]
                            
                const numero = registros[i].numero
                //console.log('Campanha discando',registro, numero)
                //this.prepararDiscagem(empresa,idCampanha,parametrosDiscador,idMailing,tabela_dados,tabela_numeros,registro,idFila,nomeFila,qtdChamadasSimultaneas,limiteDiscagem)
                return true                
            }
        }     
    } 

   
        
      
       

       
         

        
       
       
       
        
            

        

           

      

            

              
        
                 
                

               
                
               
               

                
        
                
                
                
                     
                
                               
            







    //Discador
    /*
    async dial(clients,res){
        

        let clientesAtivos
        if((clients === undefined)||(clients === null)||(clients === 0)){ 
            //Listando as empresas ativas
            //await this.debug('Relistando',empresa)
            clientesAtivos = await Clients.clientesAtivos()
        }else{
            //await this.debug('Reaproveitando',empresa)
            clientesAtivos=clients
        }
        //await this.debug('clientes',clientesAtivos,empresa)
        for(let i=0;i<clientesAtivos.length;++i){
            let empresa = clientesAtivos[i].prefix
             //await this.debug(' ',' ',empresa)
             //await this.debug('EMPRESA==>',empresa,empresa)
              //await this.debug('EMPRESA==>',empresa,empresa)
            //Funcoes de controle
            
           

            //Desloga todos usuarios as 23h59
            const horaAtual = moment().format("HH:mm")
            
            if(horaAtual=='23:59'){
                await User.logoffUsersExpire(empresa)
            }

            //await this.debug(empresa,'Iniciando Discador',empresa)
            //PASSO 1 - VERIFICAÇÃO
            //await this.debug('PASSO 1 - VERIFICAÇÃO','',empresa)

            //#1 Conta as chamadas simultaneas para registrar no log        
            const rcs = await Discador.registrarChamadasSimultaneas(empresa)
            //await this.debug(`registrarChamadasSimultaneas:${empresa}`,rcs,empresa)

            //#2 Verifica possiveis chamadas presas e remove das chamadas simultâneas
            const cc = await Discador.clearCalls(empresa) 
            //await this.debug(`clearCalls:${empresa}`,cc,empresa)

            //# - VERIFICA SE POSSUI RETORNOS AGENDADOS
            const hoje = moment().format("Y-MM-DD")
            const hora = moment().format("HH:mm:ss")
            

            //await this.debug('Verificando retornos para', `${hoje} as ${hora}`,empresa)
            const agendamento = await Discador.checaAgendamento(empresa,hoje,hora);
            if(agendamento.length >= 1){
                //await this.debug('Iniciando agendamento!',empresa)
                //seta registro para agente
                await Discador.abreRegistroAgendado(empresa,agendamento[0].id) 
            }

            //#3 Verifica se existem campanhas ativas
            const campanhasAtivas = await Discador.campanhasAtivas(empresa);  
            //await this.debug(`campanhasAtivas:${empresa}`,campanhasAtivas,empresa)
            if(campanhasAtivas.length === 0){
                //await this.debug('') ,empresa 
          
                //await this.debug('[!]',`Empresa: ${empresa},  ..................................STOP[!]`)      ,empresa 
                //await this.debug(`[!] ${empresa} Alert:`,'Nenhuma campanha ativa!'),empresa 
                //await this.debug(''),empresa 

                //await this.debug('[!]','Nenhuma campanha ativa![!]',empresa)
               //await this.dial(clientesAtivos,res)
               //return false;
               //await this.debug('continuando....',empresa)
            }
            //percorrendo campanhas ativas
            for(let i=0; i<campanhasAtivas.length; i++){
                const idCampanha = campanhasAtivas[i].id
                 //await this.debug(`Campanha ativa:${empresa}`, idCampanha,empresa)
                //await this.debug(` . . Campanha Id: ${idCampanha}`,'',empresa)
                
                //#4 Verifica a fila da Campanha   
                const filasCampanha = await Discador.filasCampanha(empresa,idCampanha)
                 //await this.debug(`filasCampanha:${empresa}`,filasCampanha,empresa)
                if(filasCampanha.length === 0){
                    //Atualiza o novo status da campanha
                    const msg = "Nenhuma fila de atendimento atribuída a esta campanha!"
                    const estado = 2
                    await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                    
                }else{
                    const idFila = filasCampanha[0].idFila
                    const nomeFila = filasCampanha[0].nomeFila

                    //#5 Verifica se existe mailing adicionado  
                    const idMailing = await Discador.verificaMailing(empresa,idCampanha)
                     //await this.debug(`verificaMailing:${empresa}`,idMailing,empresa)
                    if(idMailing.length === 0){
                        const msg = "Nenhum mailing foi atribuido na campanha!"
                        const estado = 2
                        await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                        
                    }else{

                        //#6 Verifica se o mailing adicionado esta configurado
                        const mailingConfigurado = await Discador.mailingConfigurado(empresa,idMailing[0].idMailing) 
                         //await this.debug(`mailingConfigurado:${empresa}`, mailingConfigurado,empresa)
                        if(mailingConfigurado.length==0){
                            const msg = "O mailing da campanha não esta configurado!"
                            const estado = 2
                            await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                            await this.dial(clientesAtivos,res)
                            return false
                        }else{
                            const tabela_dados = mailingConfigurado[0].tabela_dados    
                            const tabela_numeros = mailingConfigurado[0].tabela_numeros

                            //#7 Verifica se a campanha possui Agendamento   
                            const agendamento = await Discador.agendamentoCampanha(empresa,idCampanha)
                             //await this.debug(`agendamentoCampanha:${empresa}`,agendamento,empresa)
                            if(agendamento.length==0){                    
                                //Iniciando Passo 2     
                                 //await this.debug(`Campanha sem agendamento:${empresa}`,true,empresa)
                                
                            }

                            //#8 Verifica se a campanha ativas esta dentro da data de agendamento 
                            const hoje = moment().format("Y-MM-DD")
                            const dataAgenda = await Discador.agendamentoCampanha_data(empresa,idCampanha,hoje)
                             //await this.debug(`agendamentoCampanha_data:${empresa}`,dataAgenda,empresa)
                            if(dataAgenda.length === 0){
                                const msg = "Esta campanha esta fora da sua data de agendamento!"
                                const estado = 2
                                await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                            }else{

                                const agora = moment().format("HH:mm:ss")
                                const horarioAgenda = await Discador.agendamentoCampanha_horario(empresa,idCampanha,agora)
                                 //await this.debug(`agendamentoCampanha_horario:${empresa}`,horarioAgenda,empresa)
                                if(horarioAgenda.length === 0){
                                    const msg = "Esta campanha esta fora do horario de agendamento!"
                                    const estado = 2
                                    await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                                }else{
                                    //Iniciando Passo 2       
                                    await this.iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing[0].idMailing)    
                                }      
                                
                            }//Fim do teste de data de agendamento 
                        }//Fim do teste de configurado 
                    }//Fim do teste de mailing foi atribuido 
                }//Fim do teste de filasCampanha
            
            }//endfor campanhas ativas
        
        }//endfor das empresas ativas

        //Reiniciando execução
        await this.dial(clientesAtivos,res)
        
        return false;
    }*/

     


    

    async dialPowerTest(req,res){
         //await this.debug('dialPowerTest',empresa)
        const empresa = await User.getEmpresa(req)
         //await this.debug(empresa,empresa)
        const fila='teste'
        const ramal = req.params.ramal
        const numero = req.params.numero
        const idAtendimento = 0
        const saudacao = 'feminino-bom-dia'
        const aguarde = ""
         //await this.debug(ramal,empresa)
         //await this.debug(numero,empresa)
        const d = await Discador.discar(empresa,ramal,numero,fila,idAtendimento,saudacao,aguarde)
        res.json(true)
    }
                                  
    
    /*Importar Audio */  


    /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FUNCOES DA TELA DO AGENTE
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */
    //Inicia discador do agente
    async iniciarDiscador(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const er = await Discador.statusRamal(empresa,ramal)
        const estadoRamal = er[0].estado
        
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
        await Discador.alterarEstadoAgente(empresa,ramal,estado,pausa)
        //await Cronometro.iniciaDiscador(empresa,ramal)
        res.json(true);
    }
    //Retorna o estado atual do agente
    async statusRamal(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estadoRamal = await Discador.statusRamal(empresa,ramal)
        let estado = 0
        if(estadoRamal.length>0){
            if(estadoRamal[0].estado!=undefined){
                estado=estadoRamal[0].estado
            }
        }
        const estados=['deslogado','disponivel','em pausa','falando','indisponivel'];
        const status = {}
              status['idEstado']=estado
              status['estado']=estados[estadoRamal[0].estado]
              status['tempo']=await Report.converteSeg_tempo(estadoRamal[0].tempo) 

              const client = process.env.client_id
              status['client']=client
        res.json(status);
    }

    async statusDeChamadaManual(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 6
        const pausa = 0
        await Discador.alterarEstadoAgente(empresa,ramal,estado,pausa)
        res.json(true);
    }

    //Parando o Discador do agente
    async pararDiscador(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 4//Estado do Agente: 1=Disponível;2=Em Pausa;3=Falando;4=Indisponível;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await Discador.alterarEstadoAgente(empresa,ramal,estado,pausa)
        
        res.json(true);               
    }
    //Verifica o modo de atendimento assim que uma nova chamada eh recebida 
    async modoAtendimento(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const dadosChamada = await Discador.modoAtendimento(empresa,ramal)
        if(dadosChamada.length==0){
            const mode={}
                  mode['sistemcall']=false
                  mode['dialcall']=false
                  mode['config'] = {}
                  mode['config']['origem']="interna"
                  mode['config']['modo_atendimento']="manual"
            res.json(mode)
            return false;
        }else{
            const idAtendimento = dadosChamada[0].id
            const modo_atendimento = dadosChamada[0].modo_atendimento
            const infoChamada = await Discador.infoChamada_byIdAtendimento(empresa,idAtendimento)
            const mode={}
            if((infoChamada[0].tipo_ligacao=='discador')||(infoChamada[0].tipo_ligacao==='retorno')){
                mode['sistemcall']=false
                mode['dialcall']=true
            }else if(infoChamada[0].tipo_ligacao=='interna'){
                mode['sistemcall']=true
                mode['dialcall']=false
            }else{
                mode['sistemcall']=false
                mode['dialcall']=false
            }
                  mode['dados']=infoChamada
                  mode['config'] = {}
                  mode['config']['origem']="discador"
                  mode['config']['modo_atendimento']=modo_atendimento
            res.json(mode)
        }        
    }
    //Atende chamada, e muda o estado do agente para falando
    async atenderChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        const estadoAgente = await Discador.infoEstadoAgente(empresa,ramal)
        if(estadoAgente!=3){
            await Discador.alterarEstadoAgente(empresa,ramal,estado,pausa)
        }


        //Verifica se ramal ja esta atribuido

        const dados = await Discador.atendeChamada(empresa,ramal)
        res.json(dados); 
    }

    async dadosChamadaAtendida(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const dados = await Discador.dadosChamadaAtendida(empresa,ramal)
        res.json(dados); 
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
        
        const historico = await Discador.historicoRegistro(empresa,idMailing,idReg)
        res.json(historico)
    }

    async historicoChamadaManual(req,res){
        const empresa = await User.getEmpresa(req)
        const numero = req.params.numero
        const agente = req.params.idAgente
        
        const historico = await Discador.historicoRegistroChamadaManual(empresa,numero,agente)
        res.json(historico)
    }
    //Historico do agente
    async historicoChamadas(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const historico = await Discador.historicoChamadas(empresa,ramal)
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
                
                const agente = await Discador.infoAgente(empresa,ramal)
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
        const r = await Discador.gravaDadosChamadaManual(empresa,numero,nome,observacoes)
        res.json(r)
    }

    //Chama os status de tabulacao da chamada
    async statusTabulacaoChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const dadosAtendimento = await Discador.infoChamada(empresa,ramal)
        if(dadosAtendimento.length==0){
            const error={}
              error['message']=`Nenhuma chamada em atendimento para o ramal ${ramal}`
              error['error']=true
            res.json(error)
            return false
        }
        const idCampanha = dadosAtendimento[0].id_campanha
        const idAtendimento = dadosAtendimento[0].id

        const nome = await Discador.campoNomeRegistro(empresa,dadosAtendimento[0].id_mailing,dadosAtendimento[0].id_registro,dadosAtendimento[0].tabela_dados);
        
        const tabulacoesCampanha = await Discador.tabulacoesCampanha(empresa,nome,idCampanha)
        if(tabulacoesCampanha===false){
            const error={}
            error['message']="Nenhum status de tabulacao disponivel"
            error['error']=true
            res.json(error)
            return false
        }

        //Atualiza registro como tabulando e retorna id da campanha
        await Discador.preparaRegistroParaTabulacao(empresa,idAtendimento)
                        
        //Pega os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
        return true
    }

    //Tabulando a chamada
    async tabularChamada(req,res){
        const empresa = await User.getEmpresa(req)
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
        //await this.debug('__________________TABULANDO CHAMADA_______________________')      ,empresa 
        const r = await Discador.tabulaChamada(empresa,idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
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
        const dadosChamadaDesligada = await Discador.desligaChamada(empresa,ramal)
        let nome=""
        
        const errors={}
        if(dadosChamadaDesligada === false){
             //Atualiza estado do agente para disponivel    
            await Discador.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Nenhuma chamada encontrada em atendimento com o agente ${ramal} `
            errors['warning']=true

            res.json(errors)
            return false
        };
        

        
        //Inicia verificacao se a chamada ja esta tabulada
        if(dadosChamadaDesligada[0].tabulado==1){
            //Remove chamada simultanea 
            await Discador.clearCallsAgent(empresa,ramal);
            //Atualiza estado do agente para disponivel
            await Discador.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Chamada em atendimento pelo ramal ${ramal} ja estava tabulada!`            
            errors['warning']=true
            res.json(errors)
            return false
        }

        //Verificando se a campanha possui tabulacao configurada
        nome = await Discador.campoNomeRegistro(empresa,dadosChamadaDesligada[0].id_mailing,dadosChamadaDesligada[0].id_registro,dadosChamadaDesligada[0].tabela_dados);
        
        const tabulacoesCampanha = await Discador.tabulacoesCampanha(empresa,nome,dadosChamadaDesligada[0].id_campanha)
        if(tabulacoesCampanha==false){
            //Registra uma tabulacao padrão
            const contatado = 'S'
            const produtivo = 0
            const status_tabulacao=0
            const observacao = ''
            const r = await Discador.tabulaChamada(empresa,dadosChamadaDesligada[0].id,contatado,status_tabulacao,observacao,produtivo,ramal)
            //Remove chamada simultanea 
            await Discador.clearCallsAgent(empresa,ramal);
            //Atualiza estado do agente para disponivel
            await Discador.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
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
        await Discador.preparaRegistroParaTabulacao(empresa,idAtendimento)
                    
        //Inicia a contagem da tabulacao 
        await Cronometro.iniciaTabulacao(empresa,idCampanha,idMailing,idRegistro,numeroDiscado,ramal)

        //Retorna os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
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
            
        await Discador.alterarEstadoAgente(empresa,ramal,2,idPausa)       
        res.send(true)
        
    }

    //Exibe o estado e as informacoes da pausa do agente
    async statusPausaAgente(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        const infoPausa = await Discador.infoPausaAgente(empresa,ramal)
        const statusPausa={}
        if(infoPausa.length==0){
            statusPausa['status']="agente disponivel"
            res.send(statusPausa)
            return false;
        }

        const idPausa = infoPausa[0].idPausa
        const dadosPausa = await Pausas.dadosPausa(empresa,idPausa)
        const inicio = infoPausa[0].inicio
        const hoje = moment().format("Y-MM-DD")
        const agora = moment().format("HH:mm:ss")
        const termino = infoPausa[0].termino
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
        await Discador.alterarEstadoAgente(empresa,ramal,1,0)
        res.send(true)
    }
    

    //Pula Registro atual
    async pularChamada(req,res){
        const empresa = await User.getEmpresa(req)
        const ramal = req.params.ramal
        await Discador.alterarEstadoAgente(empresa,ramal,1,0)
        res.send(true)
    }


       
    
//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD

    //DISCADOR DO AGENTE
    //ESTADO DO AGENTE
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



        const atendimento = await Discador.dadosAtendimento(empresa,idAtendimento)
        if(atendimento.length==0){
            res.json(false);
            return false
        }
        const id_numero = atendimento[0].id_numero
        const id_registro = atendimento[0].id_registro
       
        const removeNumero = 0

        const campanha = atendimento[0].id_campanha
        const mailing= atendimento[0].id_mailing

        
        await Discador.agendandoRetorno(empresa,ramal,campanha,mailing,id_numero,id_registro,numero,data,hora)
        
        
        const r = await Discador.tabulaChamada(empresa,idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
        
        res.json(r);
    }
    
    
}

export default new DiscadorController()