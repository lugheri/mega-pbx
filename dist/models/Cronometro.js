"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);

class Cronometro{
    //Query Sync
    querySync(sql,empresa){
        return new Promise(async(resolve,reject)=>{
            const hostEmp = await _Clients2.default.serversDbs(empresa)
            const connection = _dbConnection2.default.poolConta(empresa,hostEmp)
            connection.query(sql,(e,rows)=>{
                if(e) reject(e);
               
                resolve(rows)                
            })
            connection.end()
           
        })
    }

    //TEMPO DE ESPERA (OCIOSIDADE)
    //Inicia contagem do tempo de espera do agente ao iniciar o discador
    async iniciaOciosidade(empresa,ramal){
        const sql = `INSERT INTO ${empresa}_dados.tempo_ociosidade
                                 (idAgente,entrada) 
                          VALUES (${ramal},now())`
        return await this.querySync(sql,empresa);
    }
    //Encerra a contagem de ociosidade do sistema ao sair do discador
    async pararOciosidade(empresa,ramal){
        const sql = `UPDATE ${empresa}_dados.tempo_ociosidade 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(sql,empresa);
    }  
   

    //TEMPO DE PAUSA (OCIOSIDADE)
    //Inicia contagem do tempo de pausa
    async entrouEmPausa(empresa,idPausa,idAgente){
        const sql = `INSERT INTO ${empresa}_dados.tempo_pausa 
                                 (idAgente,idPausa,entrada)
                          VALUES (${idAgente},${idPausa},now())`
        return await this.querySync(sql,empresa);
    }
    //Encerra a contagem do tempo de pausa
    async saiuDaPausa(empresa,idAgente){
        const sql = `UPDATE ${empresa}_dados.tempo_pausa 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                     WHERE idAgente=${idAgente} AND saida is null`
        return await this.querySync(sql,empresa);
    } 

    //TEMPO DE FILA
    //Inicia contagem do tempo de espera na fila
    async entrouNaFila(empresa,idCampanha,idMailing,idRegistro,numero){
        const sql = `INSERT INTO ${empresa}_dados.tempo_fila 
                                (idCampanha,idMailing,idRegistro,numero,entrada) 
                         VALUES (${idCampanha},${idMailing},${idRegistro},${numero},now())`
        return await this.querySync(sql,empresa);
    }
    //Encerra a contagem do tempo de espera na fila
    async saiuDaFila(empresa,numero){
        const sql = `UPDATE ${empresa}_dados.tempo_fila 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE numero=${numero} AND saida is null`
        return await this.querySync(sql,empresa);
    } 

    //TEMPO DE ATENDIMENTO 
    //Inicia contagem do tempo de atendimento
    async iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,tipoChamada,numero,ramal,uniqueid){
        const sql = `INSERT INTO ${empresa}_dados.tempo_ligacao 
                                 (idCampanha,idMailing,idRegistro,tipoDiscador,numero,idAgente,uniqueid,entrada) 
                          VALUES (${idCampanha},${idMailing},${idRegistro},'${tipoChamada}',${numero},${ramal},${uniqueid},now())`
        return await this.querySync(sql,empresa);
    }
    
    //Encerra contagem do tempo de atendimento
    async saiuLigacao(empresa,idCampanha,numero,ramal){
        const sql = `UPDATE ${empresa}_dados.tempo_ligacao 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE idCampanha=${idCampanha} AND numero=${numero} AND idAgente=${ramal} AND saida is null`
        return await this.querySync(sql,empresa);
    } 
   

     //Inicia contagem do tempo de espera do agente ao iniciar a tabulacao
    /* async iniciaTabulacao(empresa,ramal){
        const sql = `INSERT INTO ${empresa}_dados.tempo_espera 
                                 (idAgente,entrada) 
                          VALUES (${ramal},now())`
        return await this.querySync(sql,empresa);
    }*/

    //TEMPO DE TABULACAO (Ociosidade)
    async iniciaTabulacao(empresa,idCampanha,idMailing,idRegistro,numero,ramal){
        let sql = `UPDATE ${empresa}_dados.user_ramal SET tabulando=1 WHERE userId=${ramal}`
        await this.querySync(sql,empresa);
        sql = `INSERT INTO ${empresa}_dados.tempo_tabulacao 
                                 (idCampanha,idMailing,idRegistro,numero,idAgente,entrada) 
                          VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},now())`
        await this.querySync(sql,empresa);
    }

    async encerrouTabulacao(empresa,idCampanha,numero,ramal,idTabulacao){
        let sql = `UPDATE ${empresa}_dados.user_ramal SET tabulando=0 WHERE userId=${ramal}`
        await this.querySync(sql,empresa);
        sql = `UPDATE ${empresa}_dados.tempo_tabulacao 
                        SET idTabulacao=${idTabulacao}, 
                            saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                      WHERE idCampanha=${idCampanha} 
                        AND numero=${numero} 
                        AND idAgente=${ramal} 
                        AND saida is null`
        await this.querySync(sql,empresa);
    } 

    /* //Encerra a contagem de ociosidade do sistema ao concluir a tabulacao
     async encerrouTabulacao(empresa,idCampanha,ramal){
        letsql = `UPDATE ${empresa}_dados.tempo_espera 
                       SET idCampanha=${idCampanha},
                           saida=NOW(),
                           tempo_total=TIMESTAMPDIFF(SECOND, entrada, NOW()) 
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(sql,empresa);
    } */



    



}

exports. default = new Cronometro()