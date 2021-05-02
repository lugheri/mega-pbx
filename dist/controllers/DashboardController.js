"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

class DashboardController{

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
        _Campanhas2.default.mailingsNaoTrabalhados((e,nao_Trabalhados)=>{
            if(e) throw e
            
            const naoTrabalhados = parseInt(nao_Trabalhados[0].nao_trabalhados)
            _Campanhas2.default.mailingsContatados((e,ja_contatados)=>{
                if(e) throw e

                const contatados = parseInt(ja_contatados[0].contatados)
                _Campanhas2.default.mailingsNaoContatados((e,nao_Contatados)=>{
                    if(e) throw e

                    const naoContatados = parseInt(nao_Contatados[0].nao_contatados)

                    const trabalhados = contatados + naoContatados
                    const total = naoTrabalhados + trabalhados

                    let perc_trabalhados = 0
                    let perc_contatados = 0
                    let perc_naoContatados = 0
                    let perc_naoTrabalhados = 0

                    if(total!=0){
                        perc_trabalhados = parseFloat((trabalhados / total)*100).toFixed(1)
                        perc_contatados = parseFloat((contatados / total)*100).toFixed(1)
                        perc_naoContatados = parseFloat((naoContatados / total)*100).toFixed(1)
                        perc_naoTrabalhados = parseFloat((naoTrabalhados / total)*100).toFixed(1)
                    }             
                    

                    let retorno = '{'
                        retorno += `"trabalhado": ${perc_trabalhados},`
                        retorno += `"contatados": ${perc_contatados},`
                        retorno += `"nao_contatados": ${perc_naoContatados}`
                        retorno += '}'                  
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
}

exports. default = new DashboardController();