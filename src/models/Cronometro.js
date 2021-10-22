import connect from '../Config/dbConnection';
import Clients from '../models/Clients'

class Cronometro{
    //Query Sync
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
      }   

    //TEMPO DE ESPERA (OCIOSIDADE)
    //Inicia contagem do tempo de espera do agente ao iniciar o discador
    async iniciaOciosidade(empresa,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `INSERT INTO ${empresa}_dados.tempo_ociosidade
                                        (idAgente,entrada) 
                                VALUES (${ramal},now())`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }
    //Encerra a contagem de ociosidade do sistema ao sair do discador
    async pararOciosidade(empresa,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE ${empresa}_dados.tempo_ociosidade 
                                SET saida=NOW(), 
                                    tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                            WHERE idAgente=${ramal} AND saida is null`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }  
   

    //TEMPO DE PAUSA (OCIOSIDADE)
    //Inicia contagem do tempo de pausa
    async entrouEmPausa(empresa,idPausa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `INSERT INTO ${empresa}_dados.tempo_pausa 
                                        (idAgente,idPausa,entrada)
                                VALUES (${idAgente},${idPausa},now())`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })          
    }
    //Encerra a contagem do tempo de pausa
    async saiuDaPausa(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
        const sql = `UPDATE ${empresa}_dados.tempo_pausa 
                        SET saida=NOW(), 
                            tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                     WHERE idAgente=${idAgente} AND saida is null`
        const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    } 

    //TEMPO DE FILA
    //Inicia contagem do tempo de espera na fila
    async entrouNaFila(empresa,idCampanha,idMailing,idRegistro,numero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `INSERT INTO ${empresa}_dados.tempo_fila 
                                        (idCampanha,idMailing,idRegistro,numero,entrada) 
                                VALUES (${idCampanha},${idMailing},${idRegistro},${numero},now())`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }
    //Encerra a contagem do tempo de espera na fila
    async saiuDaFila(empresa,numero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE ${empresa}_dados.tempo_fila 
                                SET saida=NOW(), 
                                    tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                            WHERE numero=${numero} AND saida is null`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    } 

    //TEMPO DE ATENDIMENTO 
    //Inicia contagem do tempo de atendimento
    async iniciouAtendimento(empresa,idCampanha,idMailing,idRegistro,tipoChamada,numero,ramal,uniqueid){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `INSERT INTO ${empresa}_dados.tempo_ligacao 
                                        (idCampanha,idMailing,idRegistro,tipoDiscador,numero,idAgente,uniqueid,entrada) 
                                VALUES (${idCampanha},${idMailing},${idRegistro},'${tipoChamada}',${numero},${ramal},${uniqueid},now())`
               const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }
    
    //Encerra contagem do tempo de atendimento
    async saiuLigacao(empresa,idCampanha,numero,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE ${empresa}_dados.tempo_ligacao 
                                SET saida=NOW(), 
                                    tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW())
                            WHERE idCampanha=${idCampanha} AND numero=${numero} AND idAgente=${ramal} AND saida is null`
               const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    } 
   

     //Inicia contagem do tempo de espera do agente ao iniciar a tabulacao
    /* async iniciaTabulacao(empresa,ramal){
        const sql = `INSERT INTO ${empresa}_dados.tempo_espera 
                                 (idAgente,entrada) 
                          VALUES (${ramal},now())`
        return await this.querySync(conn,sql);
    }*/

    //TEMPO DE TABULACAO (Ociosidade)
    async iniciaTabulacao(empresa,idCampanha,idMailing,idRegistro,numero,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `UPDATE ${empresa}_dados.user_ramal SET tabulando=1 WHERE userId=${ramal}`
                await this.querySync(conn,sql);
                sql = `INSERT INTO ${empresa}_dados.tempo_tabulacao 
                                        (idCampanha,idMailing,idRegistro,numero,idAgente,entrada) 
                                VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},now())`
                await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
            })
        })      
    }

    async encerrouTabulacao(empresa,idCampanha,numero,ramal,idTabulacao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `UPDATE ${empresa}_dados.user_ramal SET tabulando=0 WHERE userId=${ramal}`
                await this.querySync(conn,sql);
                sql = `UPDATE ${empresa}_dados.tempo_tabulacao 
                                SET idTabulacao=${idTabulacao}, 
                                    saida=NOW(), 
                                    tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) 
                            WHERE idCampanha=${idCampanha} 
                                AND numero=${numero} 
                                AND idAgente=${ramal} 
                                AND saida is null`
                await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
            })
        })      
    } 

    /* //Encerra a contagem de ociosidade do sistema ao concluir a tabulacao
     async encerrouTabulacao(empresa,idCampanha,ramal){
        letsql = `UPDATE ${empresa}_dados.tempo_espera 
                       SET idCampanha=${idCampanha},
                           saida=NOW(),
                           tempo_total=TIMESTAMPDIFF(SECOND, entrada, NOW()) 
                      WHERE idAgente=${ramal} AND saida is null`
        return await this.querySync(conn,sql);
    } */



    



}

export default new Cronometro()