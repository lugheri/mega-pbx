"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

class Cronometro{
    //Query Sync
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    //TEMPO DE ESPERA (OCIOSIDADE)
    //Inicia contagem do tempo de espera do agente ao iniciar o discador
    async iniciaOciosidade(empresa,ramal){
        const sql = `INSERT INTO ${empresa}_dados.tempo_ociosidade
                                 (idAgente,entrada) 
                          VALUES (${ramal},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem de ociosidade do sistema ao sair do discador
    async pararOciosidade(empresa,ramal){
        const sql = `UPDATE ${empresa}_dados.tempo_ociosidade 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(sql);
    }  
   

    //TEMPO DE PAUSA (OCIOSIDADE)
    //Inicia contagem do tempo de pausa
    async entrouEmPausa(empresa,idPausa,idAgente){
        const sql = `INSERT INTO ${empresa}_dados.tempo_pausa 
                                 (idAgente,idPausa,entrada)
                          VALUES (${idAgente},${idPausa},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem do tempo de pausa
    async saiuDaPausa(empresa,idAgente){
        const sql = `UPDATE ${empresa}_dados.tempo_pausa 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                     WHERE idAgente=${idAgente} AND saida is null`
        return await this.querySync(sql);
    } 

    //TEMPO DE FILA
    //Inicia contagem do tempo de espera na fila
    async entrouNaFila(empresa,idCampanha,idMailing,idRegistro,numero){
        const sql = `INSERT INTO ${empresa}_dados.tempo_fila 
                                (idCampanha,idMailing,idRegistro,numero,entrada) 
                         VALUES (${idCampanha},${idMailing},${idRegistro},${numero},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem do tempo de espera na fila
    async saiuDaFila(empresa,numero){
        const sql = `UPDATE ${empresa}_dados.tempo_fila 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE numero=${numero} AND saida is null`
        return await this.querySync(sql);
    } 

    //TEMPO DE ATENDIMENTO 
    //Inicia contagem do tempo de atendimento
    async iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,tipoChamada,numero,ramal,uniqueid){
        const sql = `INSERT INTO ${empresa}_dados.tempo_ligacao 
                                 (idCampanha,idMailing,idRegistro,tipoDiscador,numero,idAgente,uniqueid,entrada) 
                          VALUES (${idCampanha},${idMailing},${idRegistro},'${tipoChamada}',${numero},${ramal},${uniqueid},now())`
        return await this.querySync(sql);
    }
    
    //Encerra contagem do tempo de atendimento
    async saiuLigacao(empresa,idCampanha,numero,ramal){
        const sql = `UPDATE ${empresa}_dados.tempo_ligacao 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE idCampanha=${idCampanha} AND numero=${numero} AND idAgente=${ramal} AND saida is null`
        return await this.querySync(sql);
    } 
   

     //Inicia contagem do tempo de espera do agente ao iniciar a tabulacao
    /* async iniciaTabulacao(empresa,ramal){
        const sql = `INSERT INTO ${empresa}_dados.tempo_espera 
                                 (idAgente,entrada) 
                          VALUES (${ramal},now())`
        return await this.querySync(sql);
    }*/

    //TEMPO DE TABULACAO (Ociosidade)
    async iniciaTabulacao(empresa,idCampanha,idMailing,idRegistro,numero,ramal){
        let sql = `UPDATE ${empresa}_dados.user_ramal SET tabulando=1 WHERE userId=${ramal}`
        await this.querySync(sql);
        sql = `INSERT INTO ${empresa}_dados.tempo_tabulacao 
                                 (idCampanha,idMailing,idRegistro,numero,idAgente,entrada) 
                          VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},now())`
        await this.querySync(sql);
    }

    async encerrouTabulacao(empresa,idCampanha,numero,ramal,idTabulacao){
        let sql = `UPDATE ${empresa}_dados.user_ramal SET tabulando=0 WHERE userId=${ramal}`
        await this.querySync(sql);
        sql = `UPDATE ${empresa}_dados.tempo_tabulacao 
                        SET idTabulacao=${idTabulacao}, 
                            saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                      WHERE idCampanha=${idCampanha} 
                        AND numero=${numero} 
                        AND idAgente=${ramal} 
                        AND saida is null`
        await this.querySync(sql);
    } 

    /* //Encerra a contagem de ociosidade do sistema ao concluir a tabulacao
     async encerrouTabulacao(empresa,idCampanha,ramal){
        letsql = `UPDATE ${empresa}_dados.tempo_espera 
                       SET idCampanha=${idCampanha},
                           saida=NOW(),
                           tempo_total=TIMESTAMPDIFF(SECOND, entrada, NOW()) 
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(sql);
    } */



    //Contagem dos tempos médios
    async tempoMedioAgente(empresa,agente,tempoMedido,hoje){
        let tabela
        if(tempoMedido=="TMT"){tabela = 'tempo_tabulacao'}//Tempo médio de Tabulacao
        if(tempoMedido=="TMA"){tabela = 'tempo_ligacao'}//Tempo médio de Atendimento
        if(tempoMedido=="TMO"){tabela = 'tempo_ociosidade'}//Tempo médio de Ociosidade

        const sql = `SELECT AVG(tempo_total) as tempoMedio 
                       FROM ${empresa}_dados.${tabela} 
                      WHERE idAgente=${agente}
                        AND entrada>= '${hoje} 00:00:00' AND saida <= '${hoje} 23:59:59'`
        const tm = await this.querySync(sql)
        return Math.floor(tm[0].tempoMedio);
    }



}

exports. default = new Cronometro()