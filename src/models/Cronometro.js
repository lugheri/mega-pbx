import connect from '../Config/dbConnection';

class Cronometro{
    //Query Sync
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    //TEMPO DE ESPERA (OCIOSIDADE)
    //Inicia contagem do tempo de espera do agente ao iniciar o discador
    async iniciaDiscador(ramal){
        const sql = `INSERT INTO tempo_espera (idAgente,entrada) VALUES (${ramal},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem de ociosidade do sistema ao sair do discador
    async pararDiscador(ramal){
        const sql = `UPDATE tempo_espera SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(sql);
    }
    //Inicia contagem do tempo de espera do agente ao iniciar a tabulacao
    async iniciaTabulacao(ramal){
        const sql = `INSERT INTO tempo_espera (idAgente,entrada) VALUES (${ramal},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem de ociosidade do sistema ao concluir a tabulacao
    async encerrouTabulacao(idCampanha,ramal){
        const sql = `UPDATE tempo_espera 
                       SET idCampanha=${idCampanha},saida=NOW(),tempo_total=TIMESTAMPDIFF(SECOND, entrada, NOW()) 
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(sql);
    } 

    //TEMPO DE PAUSA (OCIOSIDADE)
    //Inicia contagem do tempo de pausa
    async entrouEmPausa(idPausa,idAgente){
        const sql = `INSERT INTO tempo_pausa (idAgente,idPausa,entrada) VALUES (${idAgente},${idPausa},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem do tempo de pausa
    async saiuDaPausa(idAgente){
        const sql = `UPDATE tempo_pausa SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                     WHERE idAgente=${idAgente} AND saida is null`
        return await this.querySync(sql);
    } 

    //TEMPO DE FILA
    //Inicia contagem do tempo de espera na fila
    async entrouNaFila(idCampanha,idMailing,idRegistro,numero){
        const sql = `INSERT INTO tempo_fila (idCampanha,idMailing,idRegistro,numero,entrada) 
                                     VALUES (${idCampanha},${idMailing},${idRegistro},${numero},now())`
        return await this.querySync(sql);
    }
    //Encerra a contagem do tempo de espera na fila
    async saiuDaFila(numero){
        const sql = `UPDATE tempo_fila SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE numero=${numero} AND saida is null`
        return await this.querySync(sql);
    } 

    //TEMPO DE ATENDIMENTO 
    //Inicia contagem do tempo de atendimento
    async iniciouAtendimento(idCampanha,idMailing,idRegistro,numero,ramal,uniqueid){
        const sql = `INSERT INTO tempo_ligacao 
                                 (idCampanha,idMailing,idRegistro,numero,idAgente,uniqueid,entrada) 
                          VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},${uniqueid},now())`
        return await this.querySync(sql);
    }
    //Encerra contagem do tempo de atendimento
    async saiuLigacao(idCampanha,numero,ramal){
        const sql = `UPDATE tempo_ligacao SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                      WHERE idCampanha=${idCampanha} AND numero=${numero} AND idAgente=${ramal} AND saida is null`
        return await this.querySync(sql);
    } 
   

    

    //TEMPO DE TABULACAO (Ociosidade)
    async iniciaTabulacao(idCampanha,idMailing,idRegistro,numero,ramal){
        const sql = `INSERT INTO tempo_tabulacao 
                                 (idCampanha,idMailing,idRegistro,numero,idAgente,entrada) 
                          VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},now())`
        await this.querySync(sql);
    }

    async encerrouTabulacao(idCampanha,numero,ramal,idTabulacao){
        const sql = `UPDATE tempo_tabulacao 
                        SET idTabulacao=${idTabulacao}, 
                            saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                      WHERE idCampanha=${idCampanha} 
                        AND numero=${numero} 
                        AND idAgente=${ramal} 
                        AND saida is null`
        await this.querySync(sql);
    } 


}

export default new Cronometro()