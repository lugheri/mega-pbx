"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);

var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Dashboard = require('../models/Dashboard'); var _Dashboard2 = _interopRequireDefault(_Dashboard);

class DashboardController{
    async painel(req,res){
        const empresa = await _User2.default.getEmpresa(req)

        const panelData= await _Dashboard2.default.painel(empresa)
        res.json(panelData)
    }
    
    async usersRealTime(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const totalLogados = await _User2.default.totalAgentesLogados(empresa)
        res.json(totalLogados)
    }
    
    async logadosPorDia(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const limit = parseInt(req.params.limit)
        const logados = await _User2.default.logadosPorDia(empresa,limit)
        res.json(logados)
    }

    //Funcoes de informacoes dos agentes
    async usersByStatus(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        //Agentes em ligacao
        const falando = await _Campanhas2.default.agentesFalando(empresa,req)
        const agentes_falando = parseInt(falando.length)
        
        //Agentes em pausa
        const emPausa = await _Campanhas2.default.agentesEmPausa(empresa)
        const agentes_emPausa = parseInt(emPausa.length)

        //Agentes Disponíveis
        const disponiveis = _Campanhas2.default.agentesDisponiveis(empresa)
        let agentes_disponiveis=0
        if(disponiveis.length>=1){
            agentes_disponiveis = disponiveis.length
        }       

        const retorno={}
              retorno['ligando']=agentes_falando
              retorno['pausa']=agentes_emPausa
              retorno['disponiveis']=agentes_disponiveis
        res.json(retorno)
    }

    async listUsersByStatus(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const status = req.params.status
        const agentes=[]

        if(status=='ligando'){
            const falando = await _Campanhas2.default.agentesFalando(empresa)
            if(falando.length ==0){
               res.json({})
               return false
            }
            for(let i = 0; i<falando.length; i++){
                let ramal = falando[i].agentes
                const infoUser = await _User2.default.resumoUser(empresa,ramal);
                agentes.push(infoUser[0])
            }
        }

        if(status=='pausa'){
            const emPausa = await _Campanhas2.default.agentesEmPausa(empresa)
            if(emPausa.length ==0){
                res.json({})
                return false;
            }
            for(let i = 0; i<emPausa.length; i++){
                let ramal = emPausa[i].agentes
                const infoUser = await _User2.default.resumoUser(empresa,ramal);
                agentes.push(infoUser[0])
            }
        }

        if(status=='disponiveis'){
            const disponiveis = await _Campanhas2.default.agentesDisponiveis(empresa)
            if(disponiveis.length ==0){
                res.json({})
                return false;
            }
            for(let i = 0; i<disponiveis.length; i++){
                let ramal = disponiveis[i].agentes
                const infoUser = await _User2.default.resumoUser(empresa,ramal)
                agentes.push(infoUser[0])
            }
        }
        res.json(agentes)        
    }
    
    //Funcoes de informacoes das Campanhas
    async campainsRealTime(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const campanhasAtivas = await _Campanhas2.default.totalCampanhasAtivas(empresa)
        res.json(campanhasAtivas)
    }

    async campanhasByDay(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const limit = parseInt(req.params.limit)
        const campByDay = await _Campanhas2.default.campanhasByDay(empresa,limit)
        res.json(campByDay)
    }

    async campanhasByStatus(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        //Campanhas Ativas
        const ativas = await _Campanhas2.default.campanhasAtivas(empresa)
        const campanhas_ativas = parseInt(ativas.length)
        //Campanhas pausadas
        const pausadas = await _Campanhas2.default.campanhasPausadas(empresa)
        const campanhas_pausadas = parseInt(pausadas.length)
        //Campanhas paradas
        const paradas = await _Campanhas2.default.campanhasParadas(empresa)
        const campanhas_paradas = parseInt(paradas.length)

        const retorno={}
              retorno['ativas']=campanhas_ativas
              retorno['pausadas']=campanhas_pausadas
              retorno['paradas']=campanhas_paradas
        res.json(retorno)
    }

    async listCampanhasByStatus(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const status = req.params.status
        let campanhas = {}
        if(status=="ativas"){
            campanhas = await _Campanhas2.default.campanhasAtivas(empresa)
        }
        if(status=="pausadas"){
            campanhas = await _Campanhas2.default.campanhasPausadas(empresa)
        }
        if(status=="paradas"){
            campanhas = await _Campanhas2.default.campanhasParadas(empresa)
        }
        res.json(campanhas)
    }

     //Mailing de todas as campanha
     async mailingCampanhas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const total_reg = await _Campanhas2.default.totalMailings(empresa)
        let total = 0
        if(total_reg[0].total !== null){
            total = parseInt(total_reg[0].total)
        }
        
        const ja_contatados = await  _Campanhas2.default.mailingsContatados(empresa)
        const contatados = parseInt(ja_contatados[0].contatados)
        
        const nao_Contatados = await _Campanhas2.default.mailingsNaoContatados(empresa)
        const naoContatados = parseInt(nao_Contatados[0].nao_contatados)

        const trabalhados = contatados + naoContatados
        let perc_trabalhados = 0
        let perc_contatados = 0
        let perc_naoContatados = 0

        if(total!=0){
            perc_trabalhados = parseFloat((trabalhados / total)*100).toFixed(1)
            perc_contatados = parseFloat((contatados / total)*100).toFixed(1)
            perc_naoContatados = parseFloat((naoContatados / total)*100).toFixed(1)
        }             
        
        const retorno = {}
              retorno['trabalhado']=perc_trabalhados
              retorno['contatados']=perc_contatados
              retorno['nao_contatados']=perc_naoContatados
        res.json(retorno)
    }

    //chamadasSimultaneas
    async chamadasSimultaneas(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const limit = parseInt(req.params.limit)
        const chamadas_simultaneas = await _Discador2.default.log_chamadasSimultaneas(empresa,limit,'total')
        //Total de chamadas simultaneas
        const chamadas_conectadas = await _Discador2.default.log_chamadasSimultaneas(empresa,limit,'conectadas')
        const retorno = {}
              retorno['chamadas_simultaneas']=[]
              for (let i = 0; i < chamadas_simultaneas.length; i++) {
                   retorno['chamadas_simultaneas'].push(chamadas_simultaneas[i].chamadas);
              }                                        
              retorno['conectados']=[]
              for (let i = 0; i < chamadas_conectadas.length; i++) {
                   retorno['conectados'].push(chamadas_conectadas[i].chamadas);
              }                        
        res.json(retorno)
   }

    fraseologia(req,res){
        const all = req.params.all
        
        const frases=[]
        frases.push('Quando o difunto morre')
        frases.push('Controle remoto sem fio')
        frases.push('Se você olhar você vai ver')
        frases.push('Voltou de volta')
        frases.push('Vai ficar louco agora doido')
        frases.push('Estamos adiando o adiavél')
        frases.push('Antes estava desligado tá ligado!')
        frases.push('Nunca use, senão você vai virar usuário')
        frases.push('Parece Parecido')
        frases.push('Se eu fosse eu')
        frases.push('Essa é uma questão de configuração que temos que configurar')
        frases.push('Querendo ou não, este atraso atrasou')
        frases.push('Caiu vento no meu olho')
        frases.push('Agora vou mexer agora')
        frases.push('Falsa ilusão')
        frases.push('Desistiu por desistência')
        frases.push('No caso se faz necessário a necessidade')
        frases.push('Comprar um violão para aprender a tocar violão')
        frases.push('Só nao esquece para nao esquecer')
        frases.push('Esse barulho faz um barulho')
        frases.push('Você não vai ter onde ter')
        frases.push('Pensando pra pensar')
        frases.push('Se eu fosse escrever não escreveria palavras')
        frases.push('As pessoas estavam reunidas separadamente')
        frases.push('É só abrir que ele reabre')
        frases.push('Tem um nome na química que fala o nome')
        frases.push('Tudo que você tem que fazer é pegar uma bola redonda')
        frases.push('Essa função que le o arquivo do arquivo!')
        frases.push('Com Python você deve conseguir conseguir')
        frases.push('O problema do problema tá no método...')
        frases.push('Sr. o seu inglês é de brasileiro!')
        frases.push('Um filtro que esta filtrado')
        frases.push('Apenas em casos extremamente extremos!')
        frases.push('O Final acabou com a série!')
        frases.push('Até o time feminino das mulheres!')
        frases.push('Eu acho que eu estou achando!')
        frases.push('Reunião semanal toda semana!')
        frases.push('Se ele não sobreviver ele morre!')
        frases.push('Tem que fazer o reconhecimento facial da cara!')
        frases.push('Cara, ou o serviço deles caiu ou deve estar fora do ar!')
        frases.push('Ai você me manda a rota na rota!')
        frases.push('Temos que ver porque essa demora esta demorando!')
        frases.push('Então ele ia lá e ia!')
        frases.push('Eu vou fazer um teste aqui só pra testar!')
        frases.push('Se a empresa Sair pra fora!')
        frases.push('Ele não deixou de deixar!')
        frases.push('Quanto mais curto menor!')
        frases.push('Eu sou uma pessoa que me julgo que tenho um bom julgamento!')
        frases.push('Eu acho que com certeza!')
        frases.push('Só conseguimos ver até onde conseguimos enxergar!')


        let numero
        if(parseInt(all)>=1){            
            numero=all-1
        }else{
            numero = Math.floor(Math.random() * (frases.length - 0 + 1)) + 0;
        }

        if(all=="all"){
            res.json(frases)
        }else{
            res.json(frases[numero])
        }
        

    }
}

exports. default = new DashboardController();