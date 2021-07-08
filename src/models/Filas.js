import connect from '../Config/dbConnection'

import User from '../models/User'
import Asterisk from '../models/Asterisk'

class Filas{
    querySync(sql,database){
        return new Promise((resolve,reject)=>{
            connect.base(database).query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    //CRUD FILAS
    //Criar nova filas
    async criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat){
        const sql = `INSERT INTO queues (name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitor_type,monitor_format) VALUES ('${name}','${musiconhold}','${strategy}','${timeout}','${retry}','${autopause}','${maxlen}','${monitorType}','${monitorFormat}')`
        await this.querySync(sql,'asterisk')
        return true
    }
    //Remove a fila
    async removerFila(nomeFila){
        const sql = `DELETE FROM queues WHERE name='${nomeFila}'`
        await this.querySync(sql,'asterisk')
        const sql2 = `DELETE FROM queue_members WHERE queue_name='${nomeFila}'`
        await this.querySync(sql2,'asterisk')
    }
    //Exibe os dads da fila
    async dadosFila(nomeFila){
        const sql = `SELECT * FROM queues WHERE name='${nomeFila}'`
        return await this.querySync(sql,'asterisk')
    }
    //Listar Filas
    async listar(){
        const sql = `SELECT * FROM queues`
        return await this.querySync(sql,'asterisk')
    }   
    //Edita os dados da fila
    async editarFila(nomeFila,dados){
        const sql = `UPDATE queues SET name='${dados.name}',musiconhold='${dados.musiconhold}',strategy='${dados.strategy}',timeout='${dados.timeout}',retry='${dados.retry}',autopause='${dados.autopause}',maxlen='${dados.maxlen}' WHERE name='${nomeFila}'`
        return await this.querySync(sql,'asterisk')
    }


    agentesAtivos(){
        return new Promise((resolve,reject)=>{
            const sql = `SELECT * FROM users WHERE status=1 ORDER BY ordem ASC`
            connect.banco.query(sql,(e,r)=>{
                if(e) reject(e)

                resolve(r)
            })
        })
    }

    estadoRamal(idAgente){
        return new Promise((resolve,reject)=>{
            const sql = `SELECT estado FROM user_ramal WHERE userId=${idAgente}`
            connect.banco.query(sql,(e,r)=>{
                if(e) reject(e)

                resolve(r)
            })
        })
    }

    membrosNaFila(idFila){
        return new Promise((resolve,reject)=>{
            const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
            connect.banco.query(sql,(e,r)=>{
                if(e) reject(e)

                resolve(r)
            })
        })        
    }

    //Reordena fora da fila
    reordenaMembrosForaFila(idAgente,idFila,posOrigem,posDestino,callback){
         //caso a origem seja menor que o destino
         if(posOrigem<posDestino){
            const sql = `UPDATE users SET ordem=ordem-1 WHERE ordem<=${posDestino} AND ordem>${posOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE users SET ordem=${posDestino} WHERE id=${idAgente}`
                connect.banco.query(sql,callback)
            })
         }else{
            const sql = `UPDATE users SET ordem=ordem+1 WHERE ordem>=${posDestino} AND ordem<${posOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE users SET ordem=${posDestino} WHERE id=${idAgente}`
                connect.banco.query(sql,callback)
            })
        }
    }   
    
    //Reordena dentro fila    
    reordenaMembrosDentroFila(idAgente,fila,ordemOrigem,ordem,callback){
        //caso a origem seja menor que o destino
        if(ordemOrigem<ordem){
            const sql = `UPDATE agentes_filas SET ordem=ordem-1 WHERE fila=${fila} AND ordem<=${ordem} AND ordem>${ordemOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE agentes_filas SET ordem=${ordem} WHERE id=${idAgente}`
                connect.banco.query(sql,callback)
            })
        }else{
            const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE fila=${fila} AND ordem>=${ordem} AND ordem<${ordemOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE agentes_filas SET ordem=${ordem} WHERE id=${idAgente}`
                connect.banco.query(sql,callback)
            })
        }      
        
    }

    //AddMembro
    addMembroFila(idAgente,idFila,ordemOrigem,ordem,callback){
        console.log('addMembro',`idAgente: ${idAgente},idFila: ${idFila},ordemOrigem: ${ordemOrigem},ordem: ${ordem}`)
        this.verificaMembroFila(idAgente,idFila,(e,r)=>{
            if(e) throw e 

            if(r.length === 0){//Caso agente nao exista
                //aumenta ordem dos agentes com ordenacao maior
                const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE ordem>= ${ordem} AND id=${idFila}`
                connect.banco.query(sql,async (e,r)=>{  
                    if(e) throw e      
                    const estado = await this.estadoRamal(idAgente)
                    console.log('estado',estado[0].estado)
                    const sql = `INSERT INTO agentes_filas (ramal,fila,estado,ordem) VALUES (${idAgente},${idFila},${estado[0].estado},${ordem})`
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
            }else{//Caso o agente ja pertenca a fila
                this.atualizaOrdemAgenteFila(idFila,ordemOrigem,ordem,(e,r)=>{
                    if(e) throw e 

                    const sql = `UPDATE agentes_filas SET ordem=${ordem} WHERE ramal=${idAgente} AND fila=${idFila}`
                    connect.banco.query(sql,callback)
                })
            }
        })
    }

    ///remove membros da fila
    removeMembroFila(idAgente,posOrigem,idFila,callback){
        //diminui ordem dos agentes com ordenacao maior
        const sql = `UPDATE agentes_filas SET ordem=ordem-1 WHERE ordem>= ${posOrigem}`
        connect.banco.query(sql,async (e,r)=>{  

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
        })
    } 

    //verifica se membro pertence a filas
    verificaMembroFila(idAgente,idFila,callback){
        const sql = `SELECT * FROM agentes_filas WHERE ramal=${idAgente} AND fila=${idFila}`
        connect.banco.query(sql,callback)
    }

    normalizaOrdem(idFila){
        const sql = `SELECT id FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC`
        connect.banco.query(sql,async (e,rowsFila)=>{
            if(e) throw e

            for(let i=0; i<rowsFila.length; i++){
                const sql = `UPDATE agentes_filas SET ordem=${i} WHERE id=${rowsFila[i].id}`
                await this.querySync(sql,'mega_conecta')
            }

            const sql = `SELECT id FROM users WHERE status=1 ORDER BY ordem ASC`
            connect.banco.query(sql,async (e,rowsFila)=>{
                if(e) throw e

                for(let i=0; i<rowsFila.length; i++){
                    const sql = `UPDATE users SET ordem=${i} WHERE id=${rowsFila[i].id}`
                    await this.querySync(sql,'mega_conecta')
                }
            })
        })
    }



}

export default new Filas();