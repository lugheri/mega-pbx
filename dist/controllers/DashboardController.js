"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);

var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Dashboard = require('../models/Dashboard'); var _Dashboard2 = _interopRequireDefault(_Dashboard);

class DashboardController{
    async painel(req,res){
        res.json(await _Dashboard2.default.painel())
    }
    
    usersRealTime(req,res){
        _User2.default.totalAgentesLogados((e,totalLogados)=>{
            if(e) throw e

            res.json(totalLogados)

        })
    }
    
    logadosPorDia(req,res){
        const limit = parseInt(req.params.limit)
        _User2.default.logadosPorDia(limit,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //Funcoes de informacoes dos agentes
    usersByStatus(req,res){
        //Agentes em ligacao
        _Campanhas2.default.agentesFalando((e,falando)=>{
            if(e) throw e

            const agentes_falando = parseInt(falando.length)
            //Agentes em pausa
            _Campanhas2.default.agentesEmPausa((e,emPausa)=>{
                if(e) throw e

                const agentes_emPausa = parseInt(emPausa.length)
                //Agentes Disponíveis
                _Campanhas2.default.agentesDisponiveis((e,disponiveis)=>{
                    if(e) throw e
    
                    const agentes_disponiveis = parseInt(disponiveis.length)

                    let retorno = '{'
                        retorno += `"ligando": ${agentes_falando},`
                        retorno += `"pausa": ${agentes_emPausa},`
                        retorno += `"disponiveis": ${agentes_disponiveis}`
                        retorno += '}'                       
                 
                    retorno = JSON.parse(retorno)   
                    res.json(retorno)
                })                    
            })
        })
    }

    listUsersByStatus(req,res){
        const status = req.params.status

        if(status=='ligando'){
            _Campanhas2.default.agentesFalando((e,falando)=>{
                if(e) throw e

                if(falando.length ==0){
                    res.json({})
                }else{
               
                    let sql = 'SELECT u.id,u.nome,e.equipe FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id WHERE ' 
                    for(let i = 0; i<falando.length; i++){
                        let ramal = falando[i].agentes
                        sql += `u.id=${ramal}`
                        if(i<(falando.length-1)){sql += ' OR '}
                    }
                    console.log(sql)
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(e) throw e

                        res.json(r)
                    })
                }
                               
            })
        }

        if(status=='pausa'){
            _Campanhas2.default.agentesEmPausa((e,emPausa)=>{
                if(e) throw e
               
                let sql = 'SELECT u.id,u.nome,e.equipe FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id WHERE ' 
                if(emPausa.length ==0){
                    res.json({})
                }else{
                    for(let i = 0; i<emPausa.length; i++){
                        let ramal = emPausa[i].agentes
                        sql += `u.id=${ramal}`
                        if(i<(emPausa.length-1)){sql += ' OR '}
                    }
                    console.log(sql)
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(e) throw e

                        res.json(r)
                    })
                }
                               
            })
        }

        if(status=='disponiveis'){
            _Campanhas2.default.agentesDisponiveis((e,disponiveis)=>{
                if(e) throw e
                
                if(disponiveis.length ==0){
                    res.json({})
                }else{
                    let sql = 'SELECT u.id,u.nome,e.equipe FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id WHERE ' 
                    for(let i = 0; i<disponiveis.length; i++){
                        let ramal = disponiveis[i].agentes
                        sql += `u.id=${ramal}`
                        if(i<(disponiveis.length-1)){sql += ' OR '}
                    }
                    console.log(sql)
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(e) throw e

                        res.json(r)
                    })
                }
                               
            })
        }        
    }
    
    //Funcoes de informacoes das Campanhas
    campainsRealTime(req,res){
        _Campanhas2.default.totalCampanhasAtivas((e,campanhasAtivas)=>{
            if(e) throw e

            res.json(campanhasAtivas)
        })


    }
    
    campanhasByDay(req,res){
        const limit = parseInt(req.params.limit)
        _Campanhas2.default.campanhasByDay(limit,(e,r)=>{
            if(e) throw e

            res.json(r)
        })

    }

    
    campanhasByStatus(req,res){
        //Campanhas Ativas
        _Campanhas2.default.campanhasAtivas((e,ativas)=>{
            if(e) throw e

            const campanhas_ativas = parseInt(ativas.length)
            //Campanhas pausadas
            _Campanhas2.default.campanhasPausadas((e,pausadas)=>{
                if(e) throw e

                const campanhas_pausadas = parseInt(pausadas.length)
                //Campanhas paradas
                _Campanhas2.default.campanhasParadas((e,paradas)=>{
                    if(e) throw e
                    
                    const campanhas_paradas = parseInt(paradas.length)

                    let retorno = '{'
                        retorno += `"ativas": ${campanhas_ativas},`
                        retorno += `"pausadas": ${campanhas_pausadas},`
                        retorno += `"paradas": ${campanhas_paradas}`
                        retorno += '}'                       
                    retorno = JSON.parse(retorno)   
                    res.json(retorno)
                    
                })
            })
        })
    }

    listCampanhasByStatus(req,res){
        const status = req.params.status
        if(status=="ativas"){
            _Campanhas2.default.campanhasAtivas((e,ativas)=>{
                if(e) throw e

                res.json(ativas)
            })    
        }
        if(status=="pausadas"){
            _Campanhas2.default.campanhasPausadas((e,pausadas)=>{
                if(e) throw e

                res.json(pausadas)
            })    
        }
        if(status=="paradas"){
            _Campanhas2.default.campanhasParadas((e,paradas)=>{
                if(e) throw e

                res.json(paradas)
            })            
        }
    }

    //Mailing de todas as campanha
    mailingCampanhas(req,res){
        _Campanhas2.default.totalMailings((e,total_reg)=>{
            if(e) throw e

           
            let total
            if(total_reg[0].total == null){
                 total = 0
            }else{
                total = parseInt(total_reg[0].total)
            }

            
            _Campanhas2.default.mailingsContatados((e,ja_contatados)=>{
                if(e) throw e

                const contatados = parseInt(ja_contatados[0].contatados)
                _Campanhas2.default.mailingsNaoContatados((e,nao_Contatados)=>{
                    if(e) throw e

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
                    

                    let retorno = '{'
                        retorno += `"trabalhado": ${perc_trabalhados},`
                        retorno += `"contatados": ${perc_contatados},`
                        retorno += `"nao_contatados": ${perc_naoContatados}`
                        retorno += '}'     
                        
                        console.log(total)
                        console.log(contatados)
                        console.log(naoContatados)
                        console.log(trabalhados)  
                    console.log(retorno)
                     
                    retorno = JSON.parse(retorno)                  

                    res.json(retorno)

                })
            })
        })
    }

    //chamadasSimultaneas
    chamadasSimultaneas(req,res){
        const limit = parseInt(req.params.limit)
        _Discador2.default.log_chamadasSimultaneas(limit,'total',(e,chamadas)=>{
            if(e) throw e
            //Total de chamadas simultaneas
            const chamadas_simultaneas = chamadas
            _Discador2.default.log_chamadasSimultaneas(limit,'conectadas',(e,conectadas)=>{
                if(e) throw e

                const chamadas_conectadas = conectadas

                let retorno = '{'
                    retorno += `"chamadas_simultaneas": [`
                    for (let i = 0; i < chamadas_simultaneas.length; i++) {
                        retorno += chamadas_simultaneas[i].chamadas;
                        if(i<chamadas_simultaneas.length-1){
                            retorno += ', '
                        }                        
                    }                                        
                    retorno += `],`

                    retorno += `"conectados": [`
                    for (let i = 0; i < chamadas_conectadas.length; i++) {
                        retorno += chamadas_conectadas[i].chamadas;
                        if(i<chamadas_conectadas.length-1){
                            retorno += ', '
                        }                        
                    }  
                    retorno += ']}'                       
                     console.log(retorno)
                    retorno = JSON.parse(retorno)                  

                    res.json(retorno)

            })
        })
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