import connect from '../Config/dbConnection'

import User from '../models/User'
import Asterisk from '../models/Asterisk'

class Filas{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    //CRUD FILAS
    //Criar nova filas
    async criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat){
        const sql = `INSERT INTO asterisk.queues (name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitor_type,monitor_format) VALUES ('${name}','${musiconhold}','${strategy}','${timeout}','${retry}','${autopause}','${maxlen}','${monitorType}','${monitorFormat}')`
        await this.querySync(sql)
        return true
    }
   
    //Exibe os dads da fila
    async dadosFila(nomeFila){
        const sql = `SELECT * FROM asterisk.queues WHERE name='${nomeFila}'`
        return await this.querySync(sql)
    }
    //Listar Filas
    async listar(){
        const sql = `SELECT * FROM asterisk.queues`
        return await this.querySync(sql)
    }   
    //Edita os dados da fila
    async editarFila(nomeFila,dados){
        const sql = `UPDATE asterisk.queues SET musiconhold='${dados.musiconhold}',strategy='${dados.strategy}',timeout='${dados.timeout}',retry='${dados.retry}',autopause='${dados.autopause}',maxlen='${dados.maxlen}' WHERE name='${nomeFila}'`
        return await this.querySync(sql)
    }

    async editarNomeFila(nomeFilaAtual,name){
        const sql = `UPDATE asterisk.queues SET name='${name}' WHERE name='${nomeFilaAtual}'`
        return await this.querySync(sql)
    }

     //Remove a fila
     async removerFila(nomeFila){
        const sql = `DELETE FROM asterisk.queues WHERE name='${nomeFila}'`
        await this.querySync(sql)
        const sql2 = `DELETE FROM asterisk.queue_members WHERE queue_name='${nomeFila}'`
        await this.querySync(sql2)
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

    membrosForaFila(idFila){
        return new Promise((resolve,reject)=>{
            const sql = `SELECT u.id as ramal FROM users AS u LEFT OUTER JOIN agentes_filas AS f ON u.id=f.ramal WHERE status=1 AND (fila IS null OR fila !=${idFila}) ORDER BY u.ordem ASC;`
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
            const sql = `UPDATE users SET ordem=ordem-1 WHERE ordem>${posOrigem} AND ordem<=${posDestino}`
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
        console.log('idAgente',idAgente)
        console.log('fila',fila)
        console.log('ordemOrigem',ordemOrigem)
        console.log('ordem',ordem)
        if(ordemOrigem<ordem){
            console.log('aumenta ordem')
            const sql = `UPDATE agentes_filas SET ordem=ordem-1 WHERE fila=${fila} AND ordem>${ordemOrigem} AND ordem<=${ordem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE agentes_filas SET ordem=${ordem} WHERE ramal=${idAgente} AND fila=${fila}`
                connect.banco.query(sql,callback)
            })
        }else{
            console.log('diminui ordem')
            const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE fila=${fila} AND ordem>=${ordem} AND ordem<${ordemOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE agentes_filas SET ordem=${ordem} WHERE ramal=${idAgente} AND fila=${fila}`
                connect.banco.query(sql,callback)
            })
        }      
        
    }

    //AddMembro
    addMembroFila(idAgente,idFila,ordemOrigem,ordem,callback){
        //console.log('addMembro',`idAgente: ${idAgente},idFila: ${idFila},ordemOrigem: ${ordemOrigem},ordem: ${ordem}`)
        this.verificaMembroFila(idAgente,idFila,(e,r)=>{
            if(e) throw e 

            if(r.length === 0){//Caso agente nao exista
                //aumenta ordem dos agentes com ordenacao maior
                const sql = `UPDATE agentes_filas SET ordem=ordem+1 WHERE ordem>${ordemOrigem} AND ordem<=${ordem} AND id=${idFila}`
                connect.banco.query(sql,async (e,r)=>{  
                    if(e) throw e      
                    const estado = await this.estadoRamal(idAgente)
                    console.log('estado',estado[0].estado)
                    const sql = `INSERT INTO agentes_filas (ramal,fila,estado,ordem) VALUES (${idAgente},${idFila},${estado[0].estado},${ordem})`
                    connect.banco.query(sql,(e,r)=>{   
                        if(e) throw e     

                        const sql = `SELECT nome FROM filas WHERE id=${idFila}`
                        connect.banco.query(sql,(e,r)=>{
                            if(e) throw e

                            const queue_name = r[0].nome
                            const queue_interface = `PJSIP/${idAgente}`
                            const membername = idAgente
                            const state_interface = ''//`${queue_interface}@megatrunk`
                            const penalty = 0

                            Asterisk.addMembroFila(queue_name,queue_interface,membername,state_interface,penalty,callback)
                        })
                    })  
                })              
            }else{//Caso o agente ja pertenca a fila
                this.reordenaMembrosDentroFila(idAgente,idFila,ordemOrigem,ordem,callback)
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

                const sql = `SELECT nome FROM filas WHERE id=${idFila}`
                connect.banco.query(sql,(e,r)=>{
                    if(e) throw e

                    const nomeFila = r[0].nome
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
                await this.querySync(sql)
            }

            const sql = `SELECT u.id FROM users AS u LEFT OUTER JOIN agentes_filas AS f ON u.id=f.ramal WHERE status=1 AND (fila IS null OR fila !=${idFila}) ORDER BY u.ordem ASC;`
            connect.banco.query(sql,async (e,rowsFila)=>{
                if(e) throw e

                for(let i=0; i<rowsFila.length; i++){
                    const sql = `UPDATE users SET ordem=${i} WHERE id=${rowsFila[i].id}`
                    await this.querySync(sql)
                }
            })
        })
    }



}

export default new Filas();