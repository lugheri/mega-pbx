import connect from '../Config/dbConnection';
import Asterisk from './Asterisk';
import User from './User';

class Campanhas{
    //INFORMACOES DO STATUS DA CAMPANHA EM TEMPO REAL
     //Atualizacao de status das campanhas pelo discador
     atualizaStatus(idCampanha,msg,estado,callback){
        //verificando se a campanha ja possui status
        this.statusCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            console.log(`Campanha: ${idCampanha} msg: ${msg}`)
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

    //Status da campanha
    statusCampanha(idCampanha,callback){
        const sql =`SELECT * FROM campanhas_status WHERE idCampanha = ${idCampanha}`
        connect.banco.query(sql,callback) 
    }

    //total de campanhas que rodaram por dia
    campanhasByDay(limit,callback){
        const sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia FROM historico_atendimento GROUP BY data ORDER BY data DESC LIMIT ${limit}`
        connect.banco.query(sql,callback)
    }
    
    //Total de campanhas ativas
    campanhasAtivas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado=1`
        connect.banco.query(sql,callback)
    }

    //Total de campanhas em pausa
    campanhasPausadas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=2 OR c.estado=1 AND s.estado=2`
        connect.banco.query(sql,callback)
    }

    //Total de campanhas paradas
    campanhasParadas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=3 OR c.estado=1 AND s.estado=3`
        connect.banco.query(sql,callback)
    }
        

    

    //######################Operacoes básicas das campanhas (CRUD)######################
    //Criar Campanha
    criarCampanha(tipo,nome,descricao,callback){
        const sql = `INSERT INTO campanhas (dataCriacao,tipo,nome,descricao,estado,status) VALUES (now(),'${tipo}','${nome}','${descricao}',0,1)`
        connect.banco.query(sql,callback)
    }   
   

    //Lista campanhas
    listarCampanhas(callback){
        const sql = "SELECT * FROM campanhas WHERE status=1 ORDER BY status ASC, id ASC"
        connect.banco.query(sql,callback)
    }

    //Retorna Campanha
    dadosCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas WHERE id='${idCampanha}' AND status=1`
        connect.banco.query(sql,callback)
    }

    //Atualiza campanha
    atualizaCampanha(idCampanha,valores,callback){
        const sql = 'UPDATE campanhas SET ? WHERE id=?'
        connect.banco.query(sql,[valores,idCampanha],callback)
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
                connect.banco.query(sql,callback)
            }else{
                const sql = `UPDATE campanhas_horarios SET inicio='${dI}',termino='${dT}',hora_inicio='${hI}',hora_termino='${hT}' WHERE id_campanha='${idCampanha}'`
                connect.banco.query(sql,callback)
            }
        })
    }

    //Ver Agendamento da campanha
    verAgendaCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_horarios WHERE id_campanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    //######################Gestão das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    addListaTabulacaoCampanha(idCampanha,idListaTabulacao,callback){
        const sql = `INSERT INTO campanhas_listastabulacao_selecionadas (idCampanha,idListaTabulacao) VALUES (${idCampanha},${idListaTabulacao})`
        connect.banco.query(sql,callback)
    }

    //Exibe listas de tabulacao da campanhas
    listasTabulacaoCampanha(idCampanha,callback){
        const sql = `SELECT id as idListaNaCampanha, idCampanha, idListaTabulacao FROM campanhas_listastabulacao_selecionadas WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    //Remove listas de tabulacao da campanha
    removerListaTabulacaoCampanha(idListaNaCampanha,callback){
        const sql = `DELETE FROM campanhas_listastabulacao_selecionadas WHERE id=${idListaNaCampanha}`
        connect.banco.query(sql,callback)
    }

    //######################Gestão das integrações das campanhas######################

    //######################Setup do discador das campanhas######################
    //Configurar discador da campanha
    configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,tentativas,callback){
        this.verConfigDiscadorCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            if(r.length ===0){
                const sql = `INSERT INTO campanhas_discador (idCampanha,tipo_discador,agressividade,ordem_discagem,tipo_discagem,tentativas) VALUES (${idCampanha},'${tipoDiscador}',${agressividade},'${ordemDiscagem}','${tipoDiscagem}',${tentativas})`
                connect.banco.query(sql,callback)
            }else{
                const sql = `UPDATE campanhas_discador SET tipo_discador='${tipoDiscador}',agressividade=${agressividade},ordem_discagem='${ordemDiscagem}',tipo_discagem='${tipoDiscagem}',tentativas=${tentativas} WHERE idCampanha = ${idCampanha}`
                connect.banco.query(sql,callback)    
            }
        })       
    }

    //Ver configuracoes do discador
    verConfigDiscadorCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_discador WHERE idCampanha = ${idCampanha}`
        connect.banco.query(sql,callback)
    }

    //######################Configuração das filas das campanhas######################
    
    
    membrosForaFila(idFila,callback){
        const sql = `SELECT DISTINCT u.id AS agente FROM users AS u LEFT OUTER JOIN agentes_filas AS f ON u.id=f.ramal WHERE u.status=1 AND u.id NOT IN (SELECT ramal FROM agentes_filas WHERE fila=${idFila})`
        connect.banco.query(sql,callback)              
    }   


    membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }

    //adiciona membros a fila
    addMembroFila(idAgente,idFila,ordemOrigem,ordem,callback){
        this.verificaMembroFila(idAgente,idFila,(e,r)=>{
            if(e) throw e 

            if(r.length === 0){
                //Verifica se a ordem ja existe e atualiza as restantes
                this.atualizaOrdemAgenteFila(idFila,ordem+1,ordem,(e,r)=>{
                    if(e) throw e 

                    User.agenteLogado(idAgente,(e,logado)=>{
                        if(e) throw e 

                        const estado = logado[0].logado                   

                        const sql = `INSERT INTO agentes_filas (ramal,fila,estado,ordem) VALUES (${idAgente},${idFila},${estado},${ordem})`
                        connect.banco.query(sql,(e,r)=>{
                            if(e) throw e 
        
                            const sql = `SELECT nomeFila FROM campanhas_filas WHERE id=${idFila}`
                            connect.banco.query(sql,(e,r)=>{
                                if(e) throw e
        
                                const queue_name = r[0].nomeFila
                                const queue_interface = `PJSIP/${idAgente}`
                                const membername = idAgente
                                const state_interface = ''//`${queue_interface}@megatrunk`
                                const penalty = 0
                                Asterisk.addMembroFila(queue_name,queue_interface,membername,state_interface,penalty,callback)
                            })
                        })
                    })
                })                
            }else{
                this.atualizaOrdemAgenteFila(idFila,ordemOrigem,ordem,(e,r)=>{
                    if(e) throw e 

                    const sql = `UPDATE agentes_filas SET ordem=${ordem} WHERE ramal=${idAgente} AND fila=${idFila}`
                    connect.banco.query(sql,callback)
                })
            }
        })
    }

    atualizaOrdemAgenteFila(fila,ordemOrigem,ordem,callback){
        if(ordemOrigem>ordem){
            const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE fila=${fila} AND ordem>=${ordem}`;
            connect.banco.query(sql,callback)
        }else{
            const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE fila=${fila} AND ordem>=${ordem} AND ordem <= ${ordemOrigem}`;
            connect.banco.query(sql,callback)
        }
        
    }

    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
        connect.banco.query(sql,callback)
    }
    

    //remove membros da fila
    removeMembroFila(idAgente,idFila,callback){
        const sql = `DELETE FROM agentes_filas WHERE ramal=${idAgente} AND fila=${idFila}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `SELECT nomeFila FROM campanhas_filas WHERE id=${idFila}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const nomeFila = r[0].nomeFila
                Asterisk.removeMembroFila(nomeFila,idAgente,callback)
            })
        })
    }

    //verifica se membro pertence a filas
    verificaMembroFila(idAgente,idFila,callback){
        const sql = `SELECT * FROM agentes_filas WHERE ramal=${idAgente} AND fila=${idFila}`
        connect.banco.query(sql,callback)
    }

    //Incluir fila a campanhas
     addFila(idCampanha,nomeFila,callback){
        const sql = `INSERT INTO  campanhas_filas (idCampanha,nomeFila) VALUES ('${idCampanha}','${nomeFila}')`
        connect.banco.query(sql,callback)
    }    

    //Listar filas da campanha
    listarFilasCampanha(idCampanha,callback){
        const sql = `SELECT id as idFila, nomeFila FROM campanhas_filas WHERE idCampanha='${idCampanha}'`
        connect.banco.query(sql,callback)
    }

    //Remove uma determinada fila da campanha
    delFilaCampanha(idCampanha,nomeFila,callback){
        const sql = `DELETE FROM campanhas_filas WHERE idCampanha='${idCampanha}' AND nomeFila = '${nomeFila}'`
        connect.banco.query(sql,callback)
    }    

    //Status dos agentes das campanhas
    agentesFalando(callback){
        //Estado 3 = Falando
        const sql = `SELECT DISTINCT ramal AS agentes FROM campanhas_chamadas_simultaneas WHERE falando=3`
        connect.banco.query(sql,callback)
    }

    atualizaEstadoAgente(ramal,estado,idPausa,callback){
        const sql = `UPDATE agentes_filas SET estado=${estado}, idpausa=${idPausa} WHERE ramal=${ramal}`
        connect.banco.query(sql,callback)
    }

    agentesEmPausa(callback){
        //Estado 2 = Em Pausa
        const sql = `SELECT DISTINCT a.ramal AS agentes FROM agentes_filas AS a JOIN campanhas_filas AS f ON a.fila = f.id JOIN campanhas AS c ON c.id=f.idCampanha WHERE c.estado=1 AND c.status=1 AND a.estado=2`
        connect.banco.query(sql,callback)
    }

    agentesDisponiveis(callback){
        //Estado 1 = Disponível
        //Estado 0 = Deslogado
        const sql = `SELECT DISTINCT a.ramal AS agentes FROM agentes_filas AS a JOIN campanhas_filas AS f ON a.fila = f.id JOIN campanhas AS c ON c.id=f.idCampanha WHERE c.estado=1 AND c.status=1 AND a.estado=1`
        connect.banco.query(sql,callback)
    }


    //######################Gestão do Mailing das Campanhas ######################
    mailingCampanha(idCampanha,callback){
        const sql = `SELECT idMailing FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    mailingConfigurado(idMailing,callback){
        const sql = `SELECT tabela FROM mailings WHERE id=${idMailing} AND configurado=1`
        connect.banco.query(sql,callback)
    }

     //Status dos Mailings das campanhas ativas
    mailingsNaoTrabalhados(callback){
        const sql = `SELECT count(t.id) AS nao_trabalhados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado is null AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }

    mailingsContatados(callback){
        const sql = `SELECT count(t.id) AS contatados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }

    mailingsNaoContatados(callback){
        const sql = `SELECT count(t.id) AS nao_contatados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }

     //Status dos Mailings por campanha

    mailingsNaoTrabalhados_porCampanha(idCampanha,callback){
        const sql = `SELECT count(id) AS nao_trabalhados FROM campanhas_tabulacao_mailing WHERE contatado IS NULL AND idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    mailingsContatados_porCampanha(idCampanha,callback){
        const sql = `SELECT count(id) AS contatados FROM campanhas_tabulacao_mailing WHERE contatado='S' AND idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    mailingsNaoContatados_porCampanha(idCampanha,callback){
        const sql = `SELECT count(id) AS nao_contatados FROM campanhas_tabulacao_mailing WHERE contatado='N' AND idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    
    //######################Funções para funcionamento do discador######################
    campanhasAtivasHabilitadas(callback){
        //Estados de Campanhas
        //0 - Inativa
        //1 - Ativa
        //2 - Pausadas
        //3 - Parada

        const sql = `SELECT * FROM campanhas WHERE tipo = 'a' AND status = 1 AND estado = 1`
        connect.banco.query(sql,callback)
    }

    //Verifica se uma determinada campanha tem mailing adicionado e configurado
    mailingProntoParaDiscagem(idCampanha,callback){
        const sql = `SELECT m.id FROM campanhas_mailing AS cm JOIN mailings AS m ON m.id=cm.idMailing WHERE cm.idCampanha=${idCampanha} AND m.configurado=1`
        connect.banco.query(sql,callback)
    }

    //Verifica se a campanha possui Agendamento
    agendamentoCampanha(idCampanha,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha='${idCampanha}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    dataCampanha(idCampanha,hoje,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha = '${idCampanha}' AND inicio <= '${hoje}' AND termino >='${hoje}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se agora esta dentro do horário de agendamento de uma campanha
    horarioCampanha(idCampanha,hora,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha = '${idCampanha}' AND hora_inicio <= '${hora}' AND hora_termino >='${hora}'`;
        connect.banco.query(sql,callback)
    }

    //Busca a fila da campanha atendida
    getQueueByNumber(numero,callback){
        const sql = `SELECT id,fila AS Fila FROM campanhas_chamadas_simultaneas WHERE numero = '${numero}' LIMIT 1`
        connect.banco.query(sql,callback);
    }

    atualizaStatusRegistro(idChamada){
        const sql = `UPDATE campanhas_chamadas_simultaneas SET na_fila=1 AND tratado=1 WHERE id='${idChamada}'`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e
        }) 
    }

   






    //Old
   
      
   

    

  

    
    
    
    

    

   




    removendoChamadasOciosas(callback){
        let date = new Date();
        let data = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        console.log(`Agora eh ${data}`)
        
    }


}
export default new Campanhas();