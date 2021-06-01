"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Asterisk = require('./Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _User = require('./User'); var _User2 = _interopRequireDefault(_User);

class Campanhas{
    //INFORMACOES DO STATUS DA CAMPANHA EM TEMPO REAL
     //Atualizacao de status das campanhas pelo discador
     atualizaStatus(idCampanha,msg,estado,callback){
        //verificando se a campanha ja possui status
        this.statusCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            //console.log(`Campanha: ${idCampanha} msg: ${msg}`)
            if(r.length!=0){
                //Caso sim atualiza o mesmo
                const sql = `UPDATE campanhas_status SET data=now(), mensagem='${msg}', estado=${estado} WHERE idCampanha=${idCampanha}`
                _dbConnection2.default.banco.query(sql,callback)
            }else{
                //Caso nao, insere o status
                const sql = `INSERT INTO campanhas_status (idCampanha,data,mensagem,estado) VALUES (${idCampanha},now(),'${msg}',${estado})`               
                _dbConnection2.default.banco.query(sql,callback)
            }
        })        
    }

    //Status da campanha
    statusCampanha(idCampanha,callback){
        const sql =`SELECT * FROM campanhas_status WHERE idCampanha = ${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback) 
    }

    //total de campanhas que rodaram por dia
    campanhasByDay(limit,callback){
        const sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia FROM historico_atendimento GROUP BY data ORDER BY data DESC LIMIT ${limit}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    //Total de campanhas ativas
    totalCampanhasAtivas(callback){
        const sql = `SELECT COUNT(id) as total FROM campanhas WHERE status=1 AND estado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    campanhasAtivas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Total de campanhas em pausa
    campanhasPausadas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=2 OR c.estado=1 AND s.estado=2`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Total de campanhas paradas
    campanhasParadas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=3 OR c.estado=1 AND s.estado=3`
        _dbConnection2.default.banco.query(sql,callback)
    }
        

    

    //######################Operacoes básicas das campanhas (CRUD)######################
    //Criar Campanha
    criarCampanha(tipo,nome,descricao,callback){
        const sql = `INSERT INTO campanhas (dataCriacao,tipo,nome,descricao,estado,status) VALUES (now(),'${tipo}','${nome}','${descricao}',0,1)`
        _dbConnection2.default.banco.query(sql,callback)
    }   
   

    //Lista campanhas
    listarCampanhas(callback){
        const sql = "SELECT * FROM campanhas WHERE status=1 ORDER BY status ASC, id ASC"
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Retorna Campanha
    dadosCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas WHERE id='${idCampanha}' AND status=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Atualiza campanha
    atualizaCampanha(idCampanha,valores,callback){
        const sql = 'UPDATE campanhas SET ? WHERE id=?'
        _dbConnection2.default.banco.query(sql,[valores,idCampanha],callback)
    }

    //Remove Campanha
    //A campanha é removida quando seu status é setado para zero
    
    //######################Operacoes de agendamento das campanhas######################
    //Agenda campanha
    agendarCampanha(idCampanha,dI,dT,hI,hT,callback){ 
        //verifica se a campanha ja possui agendamento
        this.verAgendaCampanha(idCampanha,(e,r)=>{
            if(e) throw e            

            if(r.length ===0){
                const sql = `INSERT INTO campanhas_horarios (id_campanha,inicio,termino,hora_inicio,hora_termino) VALUES (${idCampanha},'${dI}','${dT}','${hI}','${hT}')`
                _dbConnection2.default.banco.query(sql,callback)
            }else{
                const sql = `UPDATE campanhas_horarios SET inicio='${dI}',termino='${dT}',hora_inicio='${hI}',hora_termino='${hT}' WHERE id_campanha='${idCampanha}'`
                _dbConnection2.default.banco.query(sql,callback)
            }
        })
    }

    //Ver Agendamento da campanha
    verAgendaCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_horarios WHERE id_campanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //######################Gestão das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    addListaTabulacaoCampanha(idCampanha,idListaTabulacao,callback){
        const sql = `INSERT INTO campanhas_listastabulacao_selecionadas (idCampanha,idListaTabulacao) VALUES (${idCampanha},${idListaTabulacao})`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Exibe listas de tabulacao da campanhas
    listasTabulacaoCampanha(idCampanha,callback){
        const sql = `SELECT id as idListaNaCampanha, idCampanha, idListaTabulacao FROM campanhas_listastabulacao_selecionadas WHERE idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Remove listas de tabulacao da campanha
    removerListaTabulacaoCampanha(idListaNaCampanha,callback){
        const sql = `DELETE FROM campanhas_listastabulacao_selecionadas WHERE id=${idListaNaCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //######################Gestão das integrações das campanhas######################

    //######################Setup do discador das campanhas######################
    //Configurar discador da campanha
    configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,tentativas,modo_atendimento,callback){
        this.verConfigDiscadorCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            if(r.length ===0){
                const sql = `INSERT INTO campanhas_discador (idCampanha,tipo_discador,agressividade,ordem_discagem,tipo_discagem,tentativas,modo_atendimento) VALUES (${idCampanha},'${tipoDiscador}',${agressividade},'${ordemDiscagem}','${tipoDiscagem}',${tentativas},'${modo_atendimento}')`
                _dbConnection2.default.banco.query(sql,callback)
            }else{
                const sql = `UPDATE campanhas_discador SET tipo_discador='${tipoDiscador}',agressividade=${agressividade},ordem_discagem='${ordemDiscagem}',tipo_discagem='${tipoDiscagem}',tentativas=${tentativas},modo_atendimento='${modo_atendimento}' WHERE idCampanha = ${idCampanha}`
                _dbConnection2.default.banco.query(sql,callback)     
            }
        })       
    }

    //Ver configuracoes do discador
    verConfigDiscadorCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_discador WHERE idCampanha = ${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //######################Configuração das filas das campanhas######################
    membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Reordena fora da fila
    reordenaMembrosForaFila(idAgente,idFila,posOrigen,posDestino,callback){
        //se o destino eh maior que a origem
        if(posOrigen>posDestino){
            //aumenta todas as ordens maiores ou iguais ao destino que o destino
            const sql = `UPDATE users SET ordem=ordem+1 WHERE ordem>=${posDestino}`
            _dbConnection2.default.banco.query(sql,(e,r)=>{
                //atualiza o id atual para a ordem correta
                const sql = `UPDATE users SET ordem=${posDestino} WHERE id=${idAgente}`
                _dbConnection2.default.banco.query(sql,callback)
            })
        }

        //se a origem eh maior que o destino
        if(posOrigen<posDestino){
             //diminui todas as ordens menores ou iguais ao destino que o destino
             const sql = `UPDATE users SET ordem=ordem-1 WHERE ordem<=${posDestino}`
             _dbConnection2.default.banco.query(sql,(e,r)=>{
                 //atualiza o id atual para a ordem correta
                 const sql = `UPDATE users SET ordem=${posDestino} WHERE id=${idAgente}`
                 _dbConnection2.default.banco.query(sql,callback)
             })
        }
    }   
    
    //Reordena dentro fila
    atualizaOrdemAgenteFila(fila,ordemOrigem,ordem,callback){
        if(ordemOrigem>ordem){
            const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE fila=${fila} AND ordem>=${ordem}`;
            _dbConnection2.default.banco.query(sql,callback)
        }
        if(ordemOrigem<ordem){
            const sql = `UPDATE agentes_filas SET ordem=ordem-1 WHERE fila=${fila} AND ordem <= ${ordem}`;
            _dbConnection2.default.banco.query(sql,callback)
        }
        
    }

    //AddMembro
    addMembroFila(idAgente,idFila,ordemOrigem,ordem,callback){
        this.verificaMembroFila(idAgente,idFila,(e,r)=>{
            if(e) throw e 

            if(r.length === 0){//Caso agente nao exista
                _User2.default.agenteLogado(idAgente,(e,logado)=>{
                    if(e) throw e 
                    const estado = logado[0].logado  
                    const sql = `INSERT INTO agentes_filas (ramal,fila,estado,ordem) VALUES (${idAgente},${idFila},${estado},${ordem})`
                    _dbConnection2.default.banco.query(sql,(e,r)=>{   
                        if(e) throw e 
                        
                        const sql = `SELECT nomeFila FROM campanhas_filas WHERE id=${idFila}`
                        _dbConnection2.default.banco.query(sql,(e,r)=>{
                            if(e) throw e

                            const queue_name = r[0].nomeFila
                            const queue_interface = `PJSIP/${idAgente}`
                            const membername = idAgente
                            const state_interface = ''//`${queue_interface}@megatrunk`
                            const penalty = 0

                            _Asterisk2.default.addMembroFila(queue_name,queue_interface,membername,state_interface,penalty,callback)
                        })
                    })
                })
            }else{//Caso o agente ja pertenca a fila
                this.atualizaOrdemAgenteFila(idFila,ordemOrigem,ordem,(e,r)=>{
                    if(e) throw e 

                    const sql = `UPDATE agentes_filas SET ordem=${ordem} WHERE ramal=${idAgente} AND fila=${idFila}`
                    _dbConnection2.default.banco.query(sql,callback)
                })
            }
        })
    }

    ///remove membros da fila
    removeMembroFila(idAgente,idFila,callback){
        const sql = `DELETE FROM agentes_filas WHERE ramal=${idAgente} AND fila=${idFila}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `SELECT nomeFila FROM campanhas_filas WHERE id=${idFila}`
            _dbConnection2.default.banco.query(sql,(e,r)=>{
                if(e) throw e

                const nomeFila = r[0].nomeFila
                _Asterisk2.default.removeMembroFila(nomeFila,idAgente,callback)
            })
        })
    }   
   

    

    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }
    

    



    //verifica se membro pertence a filas
    verificaMembroFila(idAgente,idFila,callback){
        const sql = `SELECT * FROM agentes_filas WHERE ramal=${idAgente} AND fila=${idFila}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Incluir fila a campanhas
     addFila(idCampanha,nomeFila,callback){
        const sql = `INSERT INTO  campanhas_filas (idCampanha,nomeFila) VALUES ('${idCampanha}','${nomeFila}')`
        _dbConnection2.default.banco.query(sql,callback)
    }    

    //Listar filas da campanha
    listarFilasCampanha(idCampanha,callback){
        const sql = `SELECT id as idFila, nomeFila FROM campanhas_filas WHERE idCampanha='${idCampanha}'`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Remove uma determinada fila da campanha
    delFilaCampanha(idCampanha,nomeFila,callback){
        const sql = `DELETE FROM campanhas_filas WHERE idCampanha='${idCampanha}' AND nomeFila = '${nomeFila}'`
        _dbConnection2.default.banco.query(sql,callback)
    }    

    iniciarDiscador(ramal,callback){
        const sql = `UPDATE agentes_filas SET estado=1 WHERE ramal=${ramal}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    statusRamal(ramal,callback){
        const sql = `SELECT estado FROM agentes_filas WHERE ramal=${ramal}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    
    pararDiscador(ramal,callback){
        const sql = `UPDATE agentes_filas SET estado=4 WHERE ramal=${ramal}`
        _dbConnection2.default.banco.query(sql,callback)
    }  

    //Status dos agentes das campanhas
    agentesFalando(callback){
        //Estado 3 = Falando
        const sql = `SELECT DISTINCT ramal AS agentes FROM campanhas_chamadas_simultaneas WHERE falando=3`
        _dbConnection2.default.banco.query(sql,callback)
    }

    atualizaEstadoAgente(ramal,estado,idPausa,callback){
        const sql = `UPDATE agentes_filas SET estado=${estado}, idpausa=${idPausa} WHERE ramal=${ramal}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            if(estado==2){
                const sql = `UPDATE queue_members SET paused=1 WHERE membername=${ramal}`
                _dbConnection2.default.asterisk.query(sql,callback)
            }else{
                const sql = `UPDATE queue_members SET paused=0 WHERE membername=${ramal}`
                _dbConnection2.default.asterisk.query(sql,callback)
            }
        })
    }

    agentesEmPausa(callback){
        //Estado 2 = Em Pausa
        const sql = `SELECT DISTINCT a.ramal AS agentes FROM agentes_filas AS a JOIN campanhas_filas AS f ON a.fila = f.id JOIN campanhas AS c ON c.id=f.idCampanha WHERE c.estado=1 AND c.status=1 AND a.estado=2`
        _dbConnection2.default.banco.query(sql,callback)
    }

    agentesDisponiveis(callback){
        //Estado 1 = Disponível
        //Estado 0 = Deslogado
        const sql = `SELECT DISTINCT a.ramal AS agentes FROM agentes_filas AS a JOIN campanhas_filas AS f ON a.fila = f.id JOIN campanhas AS c ON c.id=f.idCampanha WHERE c.estado=1 AND c.status=1 AND a.estado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }


    //######################Gestão do Mailing das Campanhas ######################
    mailingCampanha(idCampanha,callback){
        const sql = `SELECT idMailing FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    mailingConfigurado(idMailing,callback){
        const sql = `SELECT tabela FROM mailings WHERE id=${idMailing} AND configurado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Recupera o nome da tabela pelo id da campanha
    nomeTabela_byIdCampanha(idCampanha,callback){
        const sql = `SELECT m.tabela FROM mailings AS m JOIN campanhas_mailing AS c ON m.id=c.idMailing WHERE c.idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

     //Status dos Mailings das campanhas ativas
    /*mailingsNaoTrabalhados(callback){
        const sql = `SELECT count(t.id) AS nao_trabalhados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado is null AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }*/
    totalMailings(callback){
        const sql = `SELECT SUM(totalReg) AS total FROM mailings as m JOIN campanhas_mailing AS cm ON cm.idMailing=m.id JOIN campanhas AS c ON c.id=cm.idCampanha WHERE c.estado=1 AND c.status=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    mailingsContatados(callback){
        const sql = `SELECT count(t.id) AS contatados FROM mailings.campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    mailingsNaoContatados(callback){
        const sql = `SELECT count(t.id) AS nao_contatados FROM mailings.campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Status dos Mailings por campanha
    /*camposConfiguradosDisponiveis(tabela,idCampanha,callback){
        const sql = `SELECT m.id, m.campo, m.apelido, m.tipo ,t.idCampanha FROM mailing_tipo_campo AS m LEFT JOIN campanhas_campos_tela_agente AS t ON m.id = t.idCampo WHERE m.tabela='${tabela}' AND (t.idCampanha=${idCampanha} OR t.idCampanha != ${idCampanha} OR t.idCampanha is null) AND m.conferido=1`
        connect.banco.query(sql,callback)
    }*/

    //Lista todos os campos que foram configurados do mailing
    camposConfiguradosDisponiveis(tabela,callback){
        const sql = `SELECT id,campo,apelido,tipo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND conferido=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    camposAdicionadosNaTelaAgente(idCampanha,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}'`
        _dbConnection2.default.banco.query(sql,callback)
    }


    addCampoTelaAgente(idCampanha,tabela,idCampo,callback){
        const sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,tabela,idCampo) VALUES (${idCampanha},'${tabela}',${idCampo})`
        _dbConnection2.default.banco.query(sql,callback)
    }

    camposTelaAgente(idCampanha,tabela,callback){
        const sql = `SELECT t.id AS idJoin, m.id, m.campo, m.apelido, m.tipo FROM campanhas_campos_tela_agente AS t JOIN mailing_tipo_campo AS m ON m.id=t.idCampo WHERE t.idCampanha=${idCampanha} AND t.tabela='${tabela}'`
        _dbConnection2.default.banco.query(sql,callback)
    }

    delCampoTelaAgente(idCampanha,idCampo,callback){
        const sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND idCampo=${idCampo}`
        _dbConnection2.default.banco.query(sql,callback)
    }
  
   
    /*
    //Campos Nao Selecionados
    camposNaoSelecionados(idCampanha,tabela,callback){
        const sql = `SELECT DISTINCT m.id AS campo FROM mailing_tipo_campo AS m LEFT OUTER JOIN campanhas_campos_tela_agente AS s ON m.id=s.idCampo WHERE m.tabela='${tabela}' AND conferido=1 AND m.id NOT IN (SELECT idCampo FROM campanhas_campos_tela_agente WHERE tabela='${tabela}' AND idCampanha=${idCampanha})`
        connect.banco.query(sql,callback) 
    }

    campoSelecionado(campo,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE tabela='${tabela}' AND idCampo='${campo}';`
        connect.banco.query(sql,callback)
    }    

    //Campos Selecionados na tela do agente
    camposSelecionados(idCampanha,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}' ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }

    //Reordena campos disponiveis do mailing                         
    reordenaCamposMailing(idCampo,tabela,posOrigen,posDestino,callback){
        //Caso ele tenha descido
        if(posOrigen<posDestino){
            //diminui a ordem de todos que sao menores ou iguais ao destino
            const sql = `UPDATE mailings_tipo_campo campo SET ordem=ordem-1 WHERE tabela='${tabela}' AND ordem<=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE mailings_tipo_campo SET ordem=${posDestino} WHERE id=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }else{//Caso ele tenha subido
            //aumenta a ordem de todos que sao maiores ou iguais ao destino
            const sql = `UPDATE mailings_tipo_campo SET ordem=ordem+1 WHERE tabela='${tabela}' AND ordem>=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE mailings_tipo_campo SET ordem=${posDestino} WHERE id=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }
    }

    //Reordena campos selecionados da tela do agente
    reordenaCampoTelaAgente(idCampanha,tabela,idCampo,posOrigen,posDestino,callback){
        //Caso ele tenha descido
        if(posOrigen<posDestino){
            //diminui a ordem de todos que sao menores ou iguais ao destino
            const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem-1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem<=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE campanhas_campos_tela_agente SET ordem=${posDestino} WHERE idCampo=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }else{//Caso ele tenha subido
            //aumenta a ordem de todos que sao maiores ou iguais ao destino
            const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem+1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem>=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE campanhas_campos_tela_agente SET ordem=${posDestino} WHERE idCampo=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }
    }


    //Adicionando campo na tela do agente
    addCampoTelaAgente(idCampanha,tabela,idCampo,ordem,callback){
        const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem+1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem>=${ordem}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,tabela,idCampo,ordem) VALUES (${idCampanha},'${tabela}',${idCampo},${ordem})`
            connect.banco.query(sql,callback)
        })
    }

    //Removendo campo selecionado da tela do agente
    removeCampoTelaAgente(idCampanha,tabela,idCampo,callback){
        const sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND idCampo=${idCampo}`
        connect.banco.query(sql,callback)
    }
    */


    
    totalMailingsCampanha(idCampanha,callback){
        const sql = `SELECT SUM(totalReg) AS total FROM mailings as m JOIN campanhas_mailing AS cm ON cm.idMailing=m.id WHERE cm.idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }


    mailingsContatados_porCampanha(idCampanha,callback){
        const sql = `SELECT count(id) AS contatados FROM campanhas_tabulacao_mailing WHERE contatado='S' AND idCampanha=${idCampanha}`
        _dbConnection2.default.mailings.query(sql,callback)
    }

    mailingsNaoContatados_porCampanha(idCampanha,callback){
        const sql = `SELECT count(id) AS nao_contatados FROM campanhas_tabulacao_mailing WHERE contatado='N' AND idCampanha=${idCampanha}`
        _dbConnection2.default.mailings.query(sql,callback)
    }

    
    //######################Funções para funcionamento do discador######################
    campanhasAtivasHabilitadas(callback){
        //Estados de Campanhas
        //0 - Inativa
        //1 - Ativa
        //2 - Pausadas
        //3 - Parada

        const sql = `SELECT * FROM campanhas WHERE tipo = 'a' AND status = 1 AND estado = 1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Verifica se uma determinada campanha tem mailing adicionado e configurado
    mailingProntoParaDiscagem(idCampanha,callback){
        const sql = `SELECT m.id FROM campanhas_mailing AS cm JOIN mailings AS m ON m.id=cm.idMailing WHERE cm.idCampanha=${idCampanha} AND m.configurado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Verifica se a campanha possui Agendamento
    agendamentoCampanha(idCampanha,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha='${idCampanha}'`;
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    dataCampanha(idCampanha,hoje,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha = '${idCampanha}' AND inicio <= '${hoje}' AND termino >='${hoje}'`;
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Verifica se agora esta dentro do horário de agendamento de uma campanha
    horarioCampanha(idCampanha,hora,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha = '${idCampanha}' AND hora_inicio <= '${hora}' AND hora_termino >='${hora}'`;
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Busca a fila da campanha atendida
    getQueueByNumber(numero,callback){
        const sql = `SELECT id,fila AS Fila FROM campanhas_chamadas_simultaneas WHERE numero='${numero}' ORDER BY id DESC LIMIT 1`
        _dbConnection2.default.banco.query(sql,callback);
    }

    setaRegistroNaFila(idChamada,callback){
       
        const sql = `UPDATE campanhas_chamadas_simultaneas SET na_fila=1, tratado=1 WHERE id='${idChamada}'`
        _dbConnection2.default.banco.query(sql,callback) 
    }

    historicoRegistro(idReg,callback){
        const sql = `SELECT agente, u.nome, protocolo,DATE_FORMAT (data,'%d/%m/%Y') AS dia,status_tabulacao,obs_tabulacao FROM historico_atendimento AS h left JOIN users AS u ON u.id=h.agente WHERE id_registro=${idReg} ORDER BY h.id DESC LIMIT 50`
        _dbConnection2.default.banco.query(sql,callback) 
    }
    
    historicoChamadas(ramal,callback){
        const sql = `SELECT agente, u.nome, protocolo,DATE_FORMAT (data,'%d/%m/%Y') AS dia,status_tabulacao,obs_tabulacao FROM historico_atendimento AS h JOIN users AS u ON u.id=h.agente WHERE agente='${ramal}' ORDER BY h.id DESC LIMIT 50`
        _dbConnection2.default.banco.query(sql,callback) 
    }

   






    //Old
   
      
   

    

  

    
    
    
    

    

   




    removendoChamadasOciosas(callback){
        let date = new Date();
        let data = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        console.log(`Agora eh ${data}`)
        
    }


}
exports. default = new Campanhas();