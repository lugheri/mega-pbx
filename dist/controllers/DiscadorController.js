"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);
var _Pausas = require('../models/Pausas'); var _Pausas2 = _interopRequireDefault(_Pausas);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);
var _Cronometro = require('../models/Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _Redis = require('../Config/Redis'); var _Redis2 = _interopRequireDefault(_Redis);

class DiscadorController{         
    async debug(title="",msg="",empresa=""){     
        
        if(process.env.DEBUG=='dialer'){
            const data = _moment2.default.call(void 0, ).format("DD/MM/YYYY HH:mm:ss");
           //console.log(`${title}`,msg,`date: ${data}`)
        }
    }     

    async campanhasAtivasAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const agente = req.params.agente
        const campanhas = await _Discador2.default.campanhasAtivasAgente(empresa,agente)
        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
        const clicks_chamadasManuais = await _Discador2.default.tentativasChamadasManuais(empresa,'clicks',hoje)
        const chamadasManuais = await _Discador2.default.tentativasChamadasManuais(empresa,'chamadas',hoje)

        const retorno={}
              retorno["campanhasAtivas"]=campanhas
              retorno["clicksChamadasManuais"]=clicks_chamadasManuais
              retorno["ligacoesManuais"]=chamadasManuais
        res.json(retorno)
    }

    //Discador Otimizado:
    async checkAccounts(){
        
        let clientesAtivos=await _Redis2.default.getter('empresas')    
        
        if(!clientesAtivos){
            clientesAtivos=await _Clients2.default.clientesAtivos()
            await _Redis2.default.setter('empresas',clientesAtivos,600)
            console.log('Setando empresas ativas no Redis')           
        }       
       
        const clientes = clientesAtivos;  
       // console.log('Dial Loop',process.env.ENVIRONMENT)
        for(let i=0;i<clientes.length;++i){
            const empresa = clientes[i].prefix 
             
            //Funcoes de controle
            //Desloga todos usuarios as 23h59
            const horaAtual = _moment2.default.call(void 0, ).format("HH:mm")
            if(horaAtual=='23:59'){
                await _User2.default.logoffUsersExpire(empresa)
            }     

            setTimeout(async ()=>{  
                this.campanhasEmpresa(empresa)
            },1000)             
        }
        setTimeout(async ()=>{             
             await this.checkAccounts();
        },5000)
        
    }

    async campanhasEmpresa(empresa){
        console.log('campanha empresa',empresa)
        //PASSO 1 - VERIFICA????O
        //#1 Conta as chamadas simultaneas para registrar no log   
        const rcs = await _Discador2.default.registrarChamadasSimultaneas(empresa)
       
        //#2 Verifica possiveis chamadas presas e remove das chamadas simult??neas
        const cc = await _Discador2.default.clearCalls(empresa) 
        //console.log('TESTE',empresa,'............. ok')
        
        //# - VERIFICA SE POSSUI RETORNOS AGENDADOS
        const hoje = _moment2.default.call(void 0, ).format("Y-MM-DD")
        const hora = _moment2.default.call(void 0, ).format("HH:mm:ss")
       
        //CONSULTA DE AGENDAMENTOS
        //console.log('Verificando retornos para', `${hoje} as ${hora}`,empresa)
        const agendamento = await _Discador2.default.checaAgendamento(empresa,hoje,hora);
        if(agendamento.length >= 1){
             //await this.debug('Iniciando agendamento!',empresa)
            //seta registro para agente
            const regAgendado = await _Discador2.default.abreRegistroAgendado(empresa,agendamento[0].id)
            
            if(regAgendado!==false){
                return false 
            }
        }

        //#3 Verifica se existem campanhas ativas
        const campanhasAtivas = await _Discador2.default.campanhasAtivas(empresa);  
        //console.log('campanhas ativas',campanhasAtivas)
        //console.log(empresa,'campanhasAtivas',campanhasAtivas.length)
        if(campanhasAtivas.length === 0){
            //console.log('[!]',`Empresa: ${empresa},  ..................................STOP[!]`)
            //console.log(`[!] ${empresa} Alert:`,'Nenhuma campanha ativa!')
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
            const agendamento = await _Discador2.default.agendamentoCampanha(empresa,idCampanha)
             //await this.debug(`agendamentoCampanha:${empresa}`,agendamento,empresa)
            if(agendamento.length==0){                    
                //Iniciando Passo 2     
                 //await this.debug(`Campanha sem agendamento:${empresa}`,true,empresa)
            }
            //#8 Verifica se a campanha ativas esta dentro da data de agendamento 
            const hoje = _moment2.default.call(void 0, ).format("YYYY-MM-DD")
            //console.log(hoje)
            const dataAgenda = await _Discador2.default.agendamentoCampanha_data(empresa,idCampanha)
            if((dataAgenda['inicio']>=hoje)||(dataAgenda['termino']<=hoje)){
                const msg = "Esta campanha esta fora da sua data de agendamento!"
                const estado = 2
                await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
                //console.log(msg)
                return false
            }

            const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
            //console.log(agora)
            const horarioAgenda = await _Discador2.default.agendamentoCampanha_horario(empresa,idCampanha)
            if((horarioAgenda['hora_inicio']>=agora)||(horarioAgenda['hora_termino']<=agora)){
                const msg = "Esta campanha esta fora do seu hor??rio de agendamento!"
                const estado = 2
                await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
                //console.log(msg)
                return false
            }
            //Iniciando Passo 2
            await this.iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador)    
        }        
    }

    async iniciaPreparacaoDiscador(empresa,idCampanha,idFila,nomeFila,tabela_dados,tabela_numeros,idMailing,parametrosDiscador){
        console.log('iniciaPreparacaoDiscador')
        //PASSO 2 - PREPARA????O DO DISCADOR
        //await this.debug(' ','',empresa)
        //await this.debug(' . . . . . . PASSO 2 - PREPARA????O DO DISCADOR','',empresa)
         //await this.debug('PASSO 2 - iniciaPreparacaoDiscador',empresa,empresa)
         //await this.debug('EMPRESA PREPARA????O DO DISCADOR==>',empresa,empresa)

        //#1 Verifica se existem agentes na fila         
        const agentes = await _Discador2.default.agentesNaFila(empresa,idFila)
         //await this.debug(`agentesNaFila:${empresa}`,agentes,empresa)
        if(agentes==0){
            const msg = "Nenhum agente na fila"
            const estado = 2
            await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado) 
            return false;
        }

        //#2 Verificando se os agentes estao logados e disponiveis
        const agentesDisponiveis = await _Discador2.default.agentesDisponiveis(empresa,idFila) 
         //await this.debug(`agentesDisponiveis:${empresa}`,agentesDisponiveis,empresa)
        if(agentesDisponiveis === 0){   
            let msg='Nenhum agente dispon??vel'
            let estado = 2
            await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
            return false;
        }
        const maxCanais = await _Clients2.default.maxChannels(empresa)
        

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
        const qtdChamadasSimultaneas = await _Discador2.default.qtdChamadasSimultaneas(empresa,idCampanha)//11
        let limitRegistros = 0
         //await this.debug(`agressividade: ${empresa} ${idCampanha}`,agressividade,empresa)
         //await this.debug(`agentesDisponiveis:${empresa}`,agentesDisponiveis,empresa)
         //await this.debug(`limiteDiscagem:${empresa}`,limiteDiscagem,empresa)
         //await this.debug(`qtdChamadasSimultaneas:${empresa}`,qtdChamadasSimultaneas,empresa)
         //await this.debug(`qtdChamadasSimultaneas:${empresa}`,qtdChamadasSimultaneas,empresa)
        if(limiteDiscagem<qtdChamadasSimultaneas){//5
            limitRegistros=0
            let msg='Limite de chamadas simult??neas atingido, aumente a agressividade ou aguarde os agentes ficarem dispon??veis'
            let estado = 2
            await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
            
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
                    let msg='Todos os canais de atendimento est??o em uso!'
                     //await this.debug('Todos os canais de atendimento est??o em uso!',empresa)
                    let estado = 2
                    await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
                    return false;
                }
            }

            const tipoDiscagem=parametrosDiscador['tipo_discagem']
            const ordemDiscagem=parametrosDiscador['ordem_discagem']
            //#5 Verifica se existem registros nao trabalhados ou com o n?? de tentativas abaixo do limite
            const registros = await _Discador2.default.filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscador,tipoDiscagem,ordemDiscagem,limitRegistros)
            //console.log(empresa,'total registros filtrados',registros.length)
            //await this.debug(`filtrarRegistro:${empresa}`,registros,empresa)
            if(registros.length ==0){
                let msg='Todos os registros do mailing j?? foram trabalhados!'
                let estado = 3
                await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }

            //percorre os numeros selecionados
            for(let i=0; i<registros.length; i++){
                const registro = registros[i]
                            
                /*
                const numero = registros[i].numero
                const ocupado = await Discador.checaNumeroOcupado(empresa,numero)  
                //#6 Verifica se o numero selecionado ja nao esta em atendimento
           
                 //await this.debug(`checaNumeroOcupado:${empresa}`,ocupado,empresa)
                if(ocupado === true){  
                    let msg='O numero selecionado esta em atendimento'
                    let estado = 2
                    await Discador.atualizaStatus(empresa,idCampanha,msg,estado)
                }*/

                //Iniciar Passo 3    
                let msg='Campanha discando'
                let estado = 1
                await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)

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
        //await this.debug(' . . . . . . . . . . . . . . PASSO 3.1 - Formatando o n??mero','',empresa)
        const idNumero = registro['idNumero']
        const idRegistro = registro['id_registro']
        const numero = registro['numero']

        //await this.debug('PASSO 3 - prepararDiscagem',empresa,empresa)

        //checa blacklists

        //Checa se algum numero deste cliente esta em atendimento
        const checkReg = await _Discador2.default.checandoRegistro(empresa,idRegistro)
         //await this.debug(`filtrarRegistro:${empresa}`,registro,empresa)
        if(checkReg.length ==1){
           //  //await this.debug('registro em processo',idRegistro,empresa)
            return false;
        }
        //console.log(empresa, `Teste Final: ${limiteDiscagem} x ${qtdChamadasSimultaneas}`)
        if(limiteDiscagem<qtdChamadasSimultaneas){
            let msg='Limite de chamadas simult??neas atingido, aumente a agressividade ou aguarde os agentes ficarem dispon??veis'
            let estado = 2
            await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
            //await //await this.debug(`Parando por limite de discagem 2 chamada`,empresa)
            return false;
        }



        //Inser????o do numero na lista campanhas_tabulacao
        //await this.debug(`${empresa},${idCampanha},${idMailing},${idRegistro},${idNumero},${numero},${tabela_numeros}`,empresa)
        const rn = await _Discador2.default.registraNumero(empresa,idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros)
        //await this.debug(`registraNumero:${empresa}`,rn,empresa)

        //#2 Inicia Discagem
        //await this.debug(' . . . . . . . . . . . . . . PASSO 3.2 - Iniciando a discagem','',empresa)
        const tipoDiscador = parametrosDiscador['tipo_discador']
        const modoAtendimento = parametrosDiscador['modo_atendimento'] 

        //#3 Registra chamada simult??nea
        //await this.debug(' . . . . . . . . . . . . . . PASSO 3.3 - Registra chamada simult??nea','',empresa)
        //await this.debug('discador',tipoDiscador,empresa)
        //console.log(empresa,'tipoDiscador',tipoDiscador)
        if((tipoDiscador=="clicktocall")||(tipoDiscador=="preview")){
            //Seleciona agente disponivel a mais tempoPassado
            const tratado=1
            const atendido=1
            const agenteDisponivel = await _Discador2.default.agenteDisponivel(empresa,idFila)
            //await this.debug(`agenteDisponivel:${empresa}`,agenteDisponivel,empresa)
            if(agenteDisponivel==0){
                return true;
            }else{  
                const numeroDiscado = numero             
                const regC=await _Discador2.default.registraChamada(empresa,agenteDisponivel,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numeroDiscado,nomeFila,tratado,atendido)
                const idAtendimento = regC['insertId']
                //await this.debug(idAtendimento,empresa)
                //await this.debug(`registraChamada:${empresa}`,regC,empresa)
                const estado = 5 //Estado do agente quando ele esta aguardando a discagem da tela
                const aea=await _Discador2.default.alterarEstadoAgente(empresa,agenteDisponivel,estado,0)
                //await this.debug(`alterarEstadoAgente:${empresa}`,aea,empresa)
                //Registra chamada simult??nea
            }         
        }else if(tipoDiscador=="power"){    
        
            //Registra chamada simult??nea  
            const tratado=0
            const atendido=0 
            const numeroDiscado = numero   
            const regC = await _Discador2.default.registraChamada(empresa,0,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,idRegistro,idNumero,numeroDiscado,nomeFila,tratado,atendido)
            const idAtendimento = regC['insertId']
            //await this.debug('idAtendimento',idAtendimento,empresa)
            //await this.debug(`registraChamada:${empresa}`,regC) ,empresa 
             
            /*
            * INICIAR Discagem */
            //await this.debug('DISCAGEM EFETUADA',`EMPRESA: ${empresa} NUMERO: ${numero} FILA: ${nomeFila} `,empresa)
            const hora = _moment2.default.call(void 0, ).format("HH")
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
                let msg="O Discador Preditivo ainda n??o est?? dispon??vel!";
                let estado = 2
                await _Discador2.default.atualizaStatus(empresa,idCampanha,msg,estado)
                return false;
            }

            //Verifica se a campanha ainda esta ativa 
            const ec = await _Campanhas2.default.dadosCampanha(empresa,idCampanha)
            let estadosCampanha = 0
            if(ec.length>0){
                estadosCampanha = ec[0].estado
            }
            

            if(estadosCampanha==1){
                //Verifica se ainda existem agentes disponiveis
                const dataCall=await _Discador2.default.discar(empresa,0,numero,nomeFila,idAtendimento,saudacao,aguarde)
                 //await this.debug('Ligando...',`Modo: ${parametrosDiscador['tipo_discagem']} idReg:${idRegistro} Numero: ${numero}`,empresa)
            }
           
                  
        }
        
        //await this.debug(' ','',empresa)
        //await this.debug(' . . . . . . . . . . . . . PASSO 3 CONCLU??DO','',empresa)
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
            //console.log('Limite de chamadas simult??neas atingido, aumente a agressividade ou aguarde os agentes ficarem dispon??veis')
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
                    //console.log('Todos os canais de atendimento est??o em uso!')
                }
            }
            //console.log("limitRegistros",limitRegistros)

            //#5 Verifica se existem registros nao trabalhados ou com o n?? de tentativas abaixo do limite
            const registros = await _Discador2.default.filtrarRegistro(empresa,idCampanha,tabela_dados,tabela_numeros,idMailing,'power','vertical','ASC',limitRegistros)
            //console.log(empresa,'total registros filtrados',registros.length)
            //await this.debug(`filtrarRegistro:${empresa}`,registros,empresa)
            if(registros.length ==0){
                //console.log('Todos os registros do mailing j?? foram trabalhados!')
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
            //PASSO 1 - VERIFICA????O
            //await this.debug('PASSO 1 - VERIFICA????O','',empresa)

            //#1 Conta as chamadas simultaneas para registrar no log        
            const rcs = await Discador.registrarChamadasSimultaneas(empresa)
            //await this.debug(`registrarChamadasSimultaneas:${empresa}`,rcs,empresa)

            //#2 Verifica possiveis chamadas presas e remove das chamadas simult??neas
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
                    const msg = "Nenhuma fila de atendimento atribu??da a esta campanha!"
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
                            const msg = "O mailing da campanha n??o esta configurado!"
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

        //Reiniciando execu????o
        await this.dial(clientesAtivos,res)
        
        return false;
    }*/

     


    

    async dialPowerTest(req,res){
         //await this.debug('dialPowerTest',empresa)
        const empresa = await _User2.default.getEmpresa(req)
         //await this.debug(empresa,empresa)
        const fila='teste'
        const ramal = req.params.ramal
        const numero = req.params.numero
        const idAtendimento = 0
        const saudacao = 'feminino-bom-dia'
        const aguarde = ""
         //await this.debug(ramal,empresa)
         //await this.debug(numero,empresa)
        const d = await _Discador2.default.discar(empresa,ramal,numero,fila,idAtendimento,saudacao,aguarde)
        res.json(true)
    }
                                  
    
    /*Importar Audio */  


    /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FUNCOES DA TELA DO AGENTE
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */
    //Inicia discador do agente
    async iniciarDiscador(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const er = await _Discador2.default.statusRamal(empresa,ramal)
        const estadoRamal = er[0].estado
        
        //Verifica estado atual
        if(estadoRamal==1){
            const rt={}
                  rt['error']=true
                  rt['message']=`O agente ${ramal} j?? esta dispon??vel!'`
            res.send(rt)
            return false 
        }
        const estado = 1//Estado do Agente: 1=Dispon??vel;2=Em Pausa;3=Falando;4=Indispon??vel;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await _Discador2.default.alterarEstadoAgente(empresa,ramal,estado,pausa)
        //await Cronometro.iniciaDiscador(empresa,ramal)
        res.json(true);
    }
    //Retorna o estado atual do agente
    async statusRamal(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        let estadoRamal = await _Redis2.default.getter(`${ramal}_estadoRamal`)
        let estado = 0
        let tempo = 0        
        if(estadoRamal == null){            
            estadoRamal = await _Discador2.default.statusRamal(empresa,ramal)
            console.log('estado ramal banco',estadoRamal)
            if((estadoRamal.length>0)||(estadoRamal[0].estado!=undefined)){
                estado = estadoRamal[0].estado;
                tempo=await _Report2.default.converteSeg_tempo(estadoRamal[0].tempo)
            }
        }else{
            console.log('estado ramal Redis',estadoRamal)
            estado = estadoRamal['estado']
            const now = _moment2.default.call(void 0, new Date());         
            const duration = _moment2.default.duration(now.diff(estadoRamal['hora']))
            tempo = await _Report2.default.converteSeg_tempo(duration.asSeconds()) 
        }        
       
        const estados=['deslogado','disponivel','em pausa','falando','indisponivel','tela reg.','ch manual','lig. manual'];
        const status = {}
              status['idEstado']=estado
              status['estado']=estados[estado]
              status['tempo']=tempo 
              /*const client = process.env.client_id
              status['client']=client*/
        res.json(status);
    }

    async statusDeChamadaManual(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 6
        const pausa = 0
        await _Discador2.default.alterarEstadoAgente(empresa,ramal,estado,pausa)
        res.json(true);
    }

    //Parando o Discador do agente
    async pararDiscador(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 4//Estado do Agente: 1=Dispon??vel;2=Em Pausa;3=Falando;4=Indispon??vel;
        const pausa = 0//Caso o estado do agente seja igual a 2 informa o cod da pausa 
        await _Discador2.default.alterarEstadoAgente(empresa,ramal,estado,pausa)
        
        res.json(true);               
    }
    //Verifica o modo de atendimento assim que uma nova chamada eh recebida 
    async modoAtendimento(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        console.log(ramal)

        const dadosChamada = await _Discador2.default.modoAtendimento(empresa,ramal)
        console.log('dadosChamada',dadosChamada)
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
            console.log('idAtendimento',idAtendimento)
            const infoChamada = await _Discador2.default.infoChamada_byIdAtendimento(empresa,idAtendimento)
            console.log('infoChamada',infoChamada)
            const mode={}
            if((infoChamada['tipo_ligacao']=='discador')||(infoChamada['tipo_ligacao']==='retorno')){
                mode['sistemcall']=false
                mode['dialcall']=true
            }else if(infoChamada['tipo_ligacao']=='interna'){
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
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const estado = 3 //Estado do agente de falando
        const pausa = 0//Status da pausa de ocupado
        //atualiza para falando
        const estadoAgente = await _Discador2.default.infoEstadoAgente(empresa,ramal)
        if(estadoAgente!=3){
            await _Discador2.default.alterarEstadoAgente(empresa,ramal,estado,pausa)
        }


        //Verifica se ramal ja esta atribuido

        const dados = await _Discador2.default.atendeChamada(empresa,ramal)
        res.json(dados); 
    }

    async dadosChamadaAtendida(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const dados = await _Discador2.default.dadosChamadaAtendida(empresa,ramal)
        res.json(dados); 
    }

    //Historico do id do registro
    async historicoRegistro(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const estadoAgente = await _User2.default.estadoAgente(req)
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
        
        const historico = await _Discador2.default.historicoRegistro(empresa,idMailing,idReg)
        res.json(historico)
    }

    async historicoChamadaManual(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const numero = req.params.numero
        const agente = req.params.idAgente
        
        const historico = await _Discador2.default.historicoRegistroChamadaManual(empresa,numero,agente)
        res.json(historico)
    }
    //Historico do agente
    async historicoChamadas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const historico = await _Discador2.default.historicoChamadas(empresa,ramal)
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
                
                const agente = await _Discador2.default.infoAgente(empresa,ramal)
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
        const empresa = await _User2.default.getEmpresa(req)
        const numero = req.params.numero
        const nome = await _Discador2.default.nomeContatoHistoico_byNumber(empresa,numero)
        
        res.json(nome)
    }

    async gravaDadosChamadaManual(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const numero = req.body.numero
        const nome = req.body.nome
        const observacoes = req.body.observacoes
        const r = await _Discador2.default.gravaDadosChamadaManual(empresa,numero,nome,observacoes)
        res.json(r)
    }

    //Chama os status de tabulacao da chamada
    async statusTabulacaoChamada(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const dadosAtendimento = await _Discador2.default.infoChamada(empresa,ramal)
        if(dadosAtendimento.length==0){
            const error={}
              error['message']=`Nenhuma chamada em atendimento para o ramal ${ramal}`
              error['error']=true
            res.json(error)
            return false
        }
        const idCampanha = dadosAtendimento[0].id_campanha
        const idAtendimento = dadosAtendimento[0].id

        const nome = await _Discador2.default.campoNomeRegistro(empresa,dadosAtendimento[0].id_mailing,dadosAtendimento[0].id_registro,dadosAtendimento[0].tabela_dados);
        
        const tabulacoesCampanha = await _Discador2.default.tabulacoesCampanha(empresa,nome,idCampanha)
        if(tabulacoesCampanha===false){
            const error={}
            error['message']="Nenhum status de tabulacao disponivel"
            error['error']=true
            res.json(error)
            return false
        }

        //Atualiza registro como tabulando e retorna id da campanha
        await _Discador2.default.preparaRegistroParaTabulacao(empresa,idAtendimento)
                        
        //Pega os status de tabulacao da campanha
        res.json(tabulacoesCampanha)
        return true
    }

    //Tabulando a chamada
    async tabularChamada(req,res){
        const empresa = await _User2.default.getEmpresa(req)
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
        const r = await _Discador2.default.tabulaChamada(empresa,idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
        res.json(r); 
    }

    async voltaRegistro(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idHistorico = req.params.idHistorico
        const r =  await _Discador2.default.voltaRegistro(empresa,idHistorico)
        res.json(r)
    }
    

    //Desligando a Chamada
    async desligarChamada(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.body.ramal
        const dadosChamadaDesligada = await _Discador2.default.desligaChamada(empresa,ramal)
        let nome=""
        
        const errors={}
        if(dadosChamadaDesligada === false){
             //Atualiza estado do agente para disponivel    
            await _Discador2.default.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Nenhuma chamada encontrada em atendimento com o agente ${ramal} `
            errors['warning']=true

            res.json(errors)
            return false
        };
        

        
        //Inicia verificacao se a chamada ja esta tabulada
        if(dadosChamadaDesligada[0].tabulado==1){
            //Remove chamada simultanea 
            await _Discador2.default.clearCallsAgent(empresa,ramal);
            //Atualiza estado do agente para disponivel
            await _Discador2.default.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Chamada em atendimento pelo ramal ${ramal} ja estava tabulada!`            
            errors['warning']=true
            res.json(errors)
            return false
        }

        //Verificando se a campanha possui tabulacao configurada
        nome = await _Discador2.default.campoNomeRegistro(empresa,dadosChamadaDesligada[0].id_mailing,dadosChamadaDesligada[0].id_registro,dadosChamadaDesligada[0].tabela_dados);
        
        const tabulacoesCampanha = await _Discador2.default.tabulacoesCampanha(empresa,nome,dadosChamadaDesligada[0].id_campanha)
        if(tabulacoesCampanha==false){
            //Registra uma tabulacao padr??o
            const contatado = 'S'
            const produtivo = 0
            const status_tabulacao=0
            const observacao = ''
            const r = await _Discador2.default.tabulaChamada(empresa,dadosChamadaDesligada[0].id,contatado,status_tabulacao,observacao,produtivo,ramal)
            //Remove chamada simultanea 
            await _Discador2.default.clearCallsAgent(empresa,ramal);
            //Atualiza estado do agente para disponivel
            await _Discador2.default.alterarEstadoAgente(empresa,ramal,1,0)//Altera o status do agente para ativo
            errors['message']=`Campanha da chamada em atendimento n??o possui lista de tabula????o!`
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
        await _Discador2.default.preparaRegistroParaTabulacao(empresa,idAtendimento)
                    
        //Inicia a contagem da tabulacao 
        await _Cronometro2.default.iniciaTabulacao(empresa,idCampanha,idMailing,idRegistro,numeroDiscado,ramal)

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
            res.json({"error":true,"message":"Grava????o n??o encontrada!"})
            return false;
        }

        const gravacoes = await Gravacoes.linkRec(empresa,idRec);
        if(gravacoes.length==0){
            res.json({"error":true,"message":"Grava????o n??o encontrada!"})
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
    //Lista as pausas dispon??veis para o agente
    async listarPausasCampanha(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const listaPausa = 1
        const r = await _Pausas2.default.listarPausas(empresa,listaPausa)
        res.send(r)
    }

    //Pausa o agente com o status selecionado
    async pausarAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.body.ramal
        const idPausa = parseInt(req.body.idPausa)
        const infoPausa = await _Pausas2.default.dadosPausa(empresa,idPausa)
        
        const pausa = infoPausa[0].nome
        const descricao = infoPausa[0].descricao
        const tempo = infoPausa[0].tempo
            
        await _Discador2.default.alterarEstadoAgente(empresa,ramal,2,idPausa)       
        res.send(true)
        
    }

    //Exibe o estado e as informacoes da pausa do agente
    async statusPausaAgente(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        const infoPausa = await _Discador2.default.infoPausaAgente(empresa,ramal)
        const statusPausa={}
        if(infoPausa.length==0){
            statusPausa['status']="agente disponivel"
            res.send(statusPausa)
            return false;
        }

        const idPausa = infoPausa[0].idPausa
        const dadosPausa = await _Pausas2.default.dadosPausa(empresa,idPausa)
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
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.body.ramal
        await _Discador2.default.alterarEstadoAgente(empresa,ramal,1,0)
        res.send(true)
    }
    

    //Pula Registro atual
    async pularChamada(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const ramal = req.params.ramal
        await _Discador2.default.alterarEstadoAgente(empresa,ramal,1,0)
        res.send(true)
    }


       
    
//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD//////OLD

    //DISCADOR DO AGENTE
    //ESTADO DO AGENTE
    async marcarRetorno(req,res){
        const empresa = await _User2.default.getEmpresa(req)
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



        const atendimento = await _Discador2.default.dadosAtendimento(empresa,idAtendimento)
        if(atendimento.length==0){
            res.json(false);
            return false
        }
        const id_numero = atendimento[0].id_numero
        const id_registro = atendimento[0].id_registro
       
        const removeNumero = 0

        const campanha = atendimento[0].id_campanha
        const mailing= atendimento[0].id_mailing

        
        await _Discador2.default.agendandoRetorno(empresa,ramal,campanha,mailing,id_numero,id_registro,numero,data,hora)
        
        
        const r = await _Discador2.default.tabulaChamada(empresa,idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal,id_numero,removeNumero)
        
        res.json(r);
    }
    
    
}

exports. default = new DiscadorController()