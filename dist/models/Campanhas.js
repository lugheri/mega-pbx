"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Asterisk = require('./Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _User = require('./User'); var _User2 = _interopRequireDefault(_User);

class Campanhas{
    querySync(sql,args){
        return new Promise ((resolve,reject) =>{
            _dbConnection2.default.banco.query(sql,args,(err,rows)=>{
                if(err)
                    return reject(err);
                resolve(rows);
            })
        })
    }
    
    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    
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
    listarCampanhasAtivas(callback){
        const sql = "SELECT * FROM campanhas WHERE estado=1 AND status=1 ORDER BY status ASC, id ASC"
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


    //TABULACOES
    //######################Gestão das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    addListaTabulacaoCampanha(idCampanha,idListaTabulacao,callback){
        //Removendo listas anteriores
        const sql = `DELETE FROM campanhas_listastabulacao_selecionadas WHERE idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `INSERT INTO campanhas_listastabulacao_selecionadas (idCampanha,idListaTabulacao) VALUES (${idCampanha},${idListaTabulacao})`
            _dbConnection2.default.banco.query(sql,callback)
        })         
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

    //INTEGRAÇÕES
    //######################Gestão das integrações######################
    //Cria Integração
    criarIntegracao(dados,callback){
        const sql = `INSERT INTO campanhas_integracoes (idCampanha,url,descricao,modoAbertura) VALUES (0,'${dados.url}','${dados.descricao}','${dados.modoAbertura}')`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Listar integracao
    listarIntegracoes(callback){
        const sql = `SELECT * FROM campanhas_integracoes`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Atualiza Integracao
    atualizarIntegracao(idIntegracao,dados,callback){
        const sql = `UPDATE campanhas_integracoes SET url='${dados.url}',descricao='${dados.descricao}',modoAbertura='${dados.modoAbertura}' WHERE id=${idIntegracao}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Dados integracao
    dadosIntegracao(idIntegracao,callback){
        const sql = `SELECT * FROM  campanhas_integracoes WHERE id=${idIntegracao}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Remove Integracao
    removerIntegracao(idIntegracao,callback){
        const sql = `DELETE FROM campanhas_integracoes WHERE id=${idIntegracao}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Selecionar integracao
    inserirIntegracaoCampanha(dados,callback){
        const sql = `UPDATE campanhas_integracoes SET idCampanha='${dados.idCampanha}' WHERE id=${dados.idIntegracao}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //DISCADOR
    //######################Configuração do discador da campanha######################
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

    //FILAS
    //Listar filas da campanha
    listarFilasCampanha(idCampanha,callback){
        const sql = `SELECT id as idFila, nomeFila FROM campanhas_filas WHERE idCampanha='${idCampanha}'`
        _dbConnection2.default.banco.query(sql,callback)
    }    
    //Incluir fila a campanhas
    addFila(idCampanha,nomeFila,callback){
        const sql = `INSERT INTO campanhas_filas (idCampanha,nomeFila) VALUES (${idCampanha},'${nomeFila}')`
        _dbConnection2.default.banco.query(sql,callback)
    }

    dadosFila(idFila,callback) {
        const sql = `SELECT * FROM campanhas_filas WHERE id=${idFila} AND idCampanha=0`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Remove uma determinada fila da campanha
    removerFilaCampanha(idCampanha,nomeFila,callback){
        const sql = `DELETE FROM campanhas_filas WHERE idCampanha=${idCampanha} AND nomeFila='${nomeFila}'`
        _dbConnection2.default.banco.query(sql,callback)
    }    

    //MAILING
    //ADICIONA O MAILING A UMA CAMPANHA
    addMailingCampanha(idCampanha,idMailing,callback){
        //verifica se mailing ja existem na campanha
        const sql = `SELECT id FROM campanhas_mailing WHERE idCampanha=${idCampanha} AND idMailing=${idMailing}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if (e) throw e;

            if(r.length==0){
                const sql = `INSERT INTO campanhas_mailing (idCampanha,idMailing) VALUES ('${idCampanha}','${idMailing}')`
                _dbConnection2.default.banco.query(sql,callback)
            }            
        })
    }

    //Lista os mailings adicionados em uma campanha
    listarMailingCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Remove o mailing de uma campanha
    removeMailingCampanha(id,callback){
        //Recuperando o id da campanha
        const sql = `SELECT idCampanha FROM campanhas_mailing WHERE id=${id}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e;

            const idCampanha = r[0].idCampanha
            //Removendo integracao do mailing com a campanha
            const sql = `DELETE FROM campanhas_mailing WHERE id=${id}`
            _dbConnection2.default.banco.query(sql,callback)
        })
    }
   
    //Configuracao da tela do agente
    //Recupera o nome da tabela pelo id da campanha
    async nomeTabela_byIdCampanha(idCampanha){
        const sql = `SELECT m.tabela FROM mailings AS m JOIN campanhas_mailing AS c ON m.id=c.idMailing WHERE c.idCampanha=${idCampanha}`
        const tabela = await this.querySync(sql)
        if(tabela.length==0){
            return false;
        }
        return tabela[0].tabela
    }
    //Lista todos os campos que foram configurados do mailing
    async camposConfiguradosDisponiveis(tabela){
        const sql = `SELECT id,campo,apelido,tipo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND conferido=1`
        return await this.querySync(sql)
    }
    //Verifica se o campo esta selecionado
    async campoSelecionadoTelaAgente(campo,tabela,idCampanha){
        const sql = `SELECT COUNT(id) AS total FROM campanhas_campos_tela_agente WHERE idCampo=${campo} AND idCampanha=${idCampanha} AND tabela='${tabela}' ORDER BY ordem ASC`
        const total = await this.querySync(sql)     
        if(total[0].total===0){
            return false;
        }
        return true; 
    }
    //Campos adicionados na tela do agente
    async camposAdicionadosNaTelaAgente(idCampanha,tabela){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}'`
        return await this.querySync(sql)
    }

    async addCampoTelaAgente(idCampanha,tabela,idCampo){
        const sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,tabela,idCampo,ordem) VALUES (${idCampanha},'${tabela}',${idCampo},${idCampo})`
        return await this.querySync(sql)
    }

    async camposTelaAgente(idCampanha,tabela){
        const sql = `SELECT t.id AS idJoin, m.id, m.campo, m.apelido, m.tipo FROM campanhas_campos_tela_agente AS t JOIN mailing_tipo_campo AS m ON m.id=t.idCampo WHERE t.idCampanha=${idCampanha} AND t.tabela='${tabela}'`
        return await this.querySync(sql)
    }

    async delCampoTelaAgente(idCampanha,idCampo){
        const sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND idCampo=${idCampo}`
        return await this.querySync(sql)
    }

    //BLACKLIST

    //STATUS DE EVOLUCAO DE CAMPANHA
    async totalMailingsCampanha(idCampanha){
        const sql = `SELECT SUM(totalReg) AS total FROM mailings as m JOIN campanhas_mailing AS cm ON cm.idMailing=m.id WHERE cm.idCampanha=${idCampanha}`
        const total_mailing= await this.querySync(sql)
        if(total_mailing[0].total == null){
            return 0
        }
        return parseInt(total_mailing[0].total)
    }

    async mailingsContatadosPorCampanha(idCampanha,status){
        const sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE contatado='${status}' AND idCampanha=${idCampanha}`
        const total_mailing= await this.querySync(sql)
        return total_mailing[0].total
    }   

    //AGENDAMENTO DE CAMPANHAS
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
   
    //#########  F I L A S  ############
    async novaFila(nomeFila){
        const sql = `INSERT INTO campanhas_filas (idCampanha,nomeFila) VALUES(0,'${nomeFila}')`
        await this.querySync(sql)
        return true
    }

    async removerFila(nomeFila){
        const sql = `DELETE FROM campanhas_filas WHERE nomeFila='${nomeFila}'`
        await this.querySync(sql)
        return true
    }

    async listarFilas(){
        const sql = `SELECT * FROM campanhas_filas where idCampanha=0`
        return await this.querySync(sql)
    }   


    //#########  B A S E S  ############

    



    ////////////////////OLD

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
        

    

   
    
    //######################Operacoes de agendamento das campanhas######################
    

    

    //######################Gestão das integrações das campanhas######################

    //######################Setup do discador das campanhas######################
    

    //######################Configuração das filas das campanhas######################
    membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        _dbConnection2.default.banco.query(sql,callback)
    }

      
   

    

    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
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

            const sql = `UPDATE user_ramal SET estado=${estado} WHERE ramal=${ramal}`
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

    chamadasTravadas(callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE tratado is null`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Atualiza um registro como disponivel na tabulacao mailing
    liberaRegisto(idCampanha,idMailing,idRegistro,callback){ 
     const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Disponível' WHERE idCampanha=${idCampanha},idMailing=${idMailing},idRegistro=${idRegistro}`
     _dbConnection2.default.mailings.query(sql,callback)
    }

    removeChamadaSimultanea(idChamadaSimultanea,callback){
        const sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamadaSimultanea}`
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
    }
    
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
                connect.banco.query(sql,callback)
            }else{
                //Caso nao, insere o status
                const sql = `INSERT INTO campanhas_status (idCampanha,data,mensagem,estado) VALUES (${idCampanha},now(),'${msg}',${estado})`               
                connect.banco.query(sql,callback)
            }
        })        
    }


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

   
}
exports. default = new Campanhas();