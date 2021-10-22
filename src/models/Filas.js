import connect from '../Config/dbConnection'
import Clients from './Clients'
import User from '../models/User'
import Asterisk from '../models/Asterisk'

class Filas{
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
      }   

    //CRUD FILAS
    //Criar nova filas
    async criarFila(empresa,nomeFila,musiconhold,monitorType,monitorFormat,announce_frequency,announce_holdtime,announce_position,autofill,autopause,autopausebusy,autopausedelay,autopauseunavail,joinempty,leavewhenempty,maxlen,memberdelay,penaltymemberslimit,periodic_announce_frequency,queue_callswaiting,queue_thereare,queue_youarenext,reportholdtime,retry,ringinuse,servicelevel,strategy,timeout,timeoutpriority,timeoutrestart,weight,wrapuptime){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{   
                const sql = `INSERT INTO asterisk.queues 
                                        (name,
                                        musiconhold,
                                        strategy,
                                        timeout,
                                        retry,
                                        autopause,
                                        maxlen,
                                        monitor_type,
                                        monitor_format,
                                        announce_frequency,
                                        announce_holdtime,
                                        announce_position,
                                        autofill,
                                        autopausebusy,
                                        autopausedelay,
                                        autopauseunavail,
                                        joinempty,
                                        leavewhenempty,
                                        memberdelay,
                                        penaltymemberslimit,
                                        periodic_announce_frequency,
                                        queue_callswaiting,
                                        queue_thereare,
                                        queue_youarenext,
                                        reportholdtime,
                                        ringinuse,
                                        servicelevel,
                                        timeoutpriority,
                                        timeoutrestart,
                                        weight,
                                        wrapuptime) 
                                VALUES ('${nomeFila}',
                                        '${musiconhold}',
                                        '${strategy}',
                                        '${timeout}',
                                        '${retry}',
                                        '${autopause}',
                                        '${maxlen}',
                                        '${monitorType}',
                                        '${monitorFormat}',
                                        '${announce_frequency}',
                                        '${announce_holdtime}',
                                        '${announce_position}',
                                        '${autofill}',
                                        '${autopausebusy}',
                                        '${autopausedelay}',
                                        '${autopauseunavail}',
                                        '${joinempty}',
                                        '${leavewhenempty}',
                                        '${memberdelay}',
                                        '${penaltymemberslimit}',
                                        '${periodic_announce_frequency}',
                                        '${queue_callswaiting}',
                                        '${queue_thereare}',
                                        '${queue_youarenext}',
                                        '${reportholdtime}',
                                        '${ringinuse}',
                                        '${servicelevel}',
                                        '${timeoutpriority}',
                                        '${timeoutrestart}',
                                        '${weight}',
                                        '${wrapuptime}')`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(true)
            })
        })      

    }
   
    //Exibe os dads da fila
    async dadosFila(empresa,nomeFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * FROM asterisk.queues 
                            WHERE name='${nomeFila}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //Listar Filas
    async listar(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * FROM asterisk.queues`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }   
    //Edita os dados da fila
    async editarFila(empresa,nomeFila,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE asterisk.queues 
                                SET musiconhold='${dados.musiconhold}',
                                    strategy='${dados.strategy}',
                                    timeout='${dados.timeout}',
                                    retry='${dados.retry}',
                                    autopause='${dados.autopause}',
                                    maxlen='${dados.maxlen}' 
                            WHERE name='${nomeFila}'`
                const rows =  await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async editarNomeFila(empresa,nomeFilaAtual,name){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE asterisk.queues SET name='${name}' WHERE name='${nomeFilaAtual}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }

     //Remove a fila
     async removerFila(empresa,nomeFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'asterisk')
            pool.getConnection(async (err,conn)=>{   
                let sql = `DELETE FROM asterisk.queues WHERE name='${nomeFila}'`
                await this.querySync(conn,sql)
                sql = `DELETE FROM asterisk.queue_members WHERE queue_name='${nomeFila}'`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
            })
        })      
    }

    async filaCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT idFila, nomeFila 
                            FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
        
    }


    async agentesAtivos(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * 
                            FROM ${empresa}_dados.users 
                            WHERE status=1 ORDER BY ordem ASC`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async estadoRamal(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT estado 
                            FROM ${empresa}_dados.user_ramal 
                            WHERE userId=${idAgente}`
                const rows= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async membrosNaFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT u.nome, f.ramal 
                            FROM ${empresa}_dados.agentes_filas AS f 
                            JOIN ${empresa}_dados.users AS u ON f.ramal=u.id 
                            WHERE fila=${idFila}  
                            ORDER BY f.id ASC;`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async membrosForaFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT u.id as ramal, u.nome 
                            FROM ${empresa}_dados.users AS u 
                            WHERE status=1  
                        ORDER BY u.nome ASC;`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })       
    }

    

    //AddMembro
    async addMembroFila(empresa,ramal,idFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const check = await this.verificaMembroFila(empresa,ramal,idFila)
                if(check){
                    pool.end((err)=>{
                        if(err) console.log('Filas ...', err)
                    })
                    resolve(false)
                    return false
                }
                const estado = await this.estadoRamal(empresa,ramal)
                let sql = `INSERT INTO ${empresa}_dados.agentes_filas 
                                    (ramal,fila,estado,ordem) 
                            VALUES (${ramal},${idFila},${estado[0].estado},0)`
                await this.querySync(conn,sql)
                sql = `SELECT nome 
                        FROM ${empresa}_dados.filas 
                        WHERE id=${idFila}`
                const fila = await this.querySync(conn,sql)
                const queue_name = fila[0].nome
                const queue_interface = `PJSIP/${ramal}`
                const membername = ramal
                const state_interface = ''//`${queue_interface}@megatrunk`
                const penalty = 0
                const rows = await Asterisk.addMembroFila(empresa,queue_name,queue_interface,membername,state_interface,penalty)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    }
    
    ///remove membros da fila
    async removeMembroFila(empresa,ramal,idFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `DELETE FROM ${empresa}_dados.agentes_filas
                            WHERE ramal=${ramal} AND fila=${idFila}`
                await this.querySync(conn,sql)
                
                sql = `SELECT nome 
                        FROM ${empresa}_dados.filas 
                        WHERE id=${idFila}`
                const fila = await this.querySync(conn,sql)
                const nomeFila = fila[0].nome
                const rows = await Asterisk.removeMembroFila(empresa,nomeFila,ramal)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(rows)
            })
        })      
    } 

    //verifica se membro pertence a filas
    async verificaMembroFila(empresa,idAgente,idFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * 
                            FROM ${empresa}_dados.agentes_filas 
                            WHERE ramal=${idAgente} AND fila=${idFila}`
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Filas ...', err)
                })
                resolve(r.length)
            })
        })        
    }

   



}

export default new Filas();