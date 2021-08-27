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
            const sql = `SELECT u.nome, f.ramal FROM agentes_filas AS f 
                           JOIN users AS u ON f.ramal=u.id 
                          WHERE fila=${idFila}  
                       ORDER BY f.id ASC;`
            connect.banco.query(sql,(e,r)=>{
                if(e) reject(e)

                resolve(r)
            })
        })        
    }

    membrosForaFila(idFila){
        return new Promise((resolve,reject)=>{
            const sql = `SELECT u.id as ramal, u.nome 
                           FROM users AS u 
                          WHERE status=1  
                          ORDER BY u.nome ASC;`
            connect.banco.query(sql,(e,r)=>{
                if(e) reject(e)

                resolve(r)
            })
        })        
    }

    

    //AddMembro
    async addMembroFila(ramal,idFila){
        const check = await this.verificaMembroFila(ramal,idFila)
        if(check){
            return false
        }
        const estado = await this.estadoRamal(ramal)
        let sql = `INSERT INTO agentes_filas (ramal,fila,estado,ordem) VALUES (${ramal},${idFila},${estado[0].estado},0)`
        await this.querySync(sql)
        sql = `SELECT nome FROM filas WHERE id=${idFila}`
        const fila = await this.querySync(sql)
        const queue_name = fila[0].nome
        const queue_interface = `PJSIP/${ramal}`
        const membername = ramal
        const state_interface = ''//`${queue_interface}@megatrunk`
        const penalty = 0
        return await Asterisk.addMembroFila(queue_name,queue_interface,membername,state_interface,penalty)
    }
    
    ///remove membros da fila
    async removeMembroFila(ramal,idFila){
        let sql = `DELETE FROM agentes_filas WHERE ramal=${ramal} AND fila=${idFila}`
        await this.querySync(sql)
        
        sql = `SELECT nome FROM filas WHERE id=${idFila}`
        const fila = await this.querySync(sql)
        const nomeFila = fila[0].nome
        return await Asterisk.removeMembroFila(nomeFila,ramal)
    } 

    //verifica se membro pertence a filas
    async verificaMembroFila(idAgente,idFila){
        const sql = `SELECT * FROM agentes_filas WHERE ramal=${idAgente} AND fila=${idFila}`
        const r = await this.querySync(sql)
        return r.length
    }

   



}

export default new Filas();