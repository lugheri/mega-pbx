import connect from '../Config/dbConnection';
import moment from 'moment';
import Clients from './Clients'

class Gravacao{
    //Query Sync
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err){ 
                    console.error({"errorCode":err.code,"message":err.message,"stack":err.stack, "sql":sql}) 
                    resolve(false);
                }
                resolve(rows)
            })
        })
      }      
    
    async listarGravacoes(empresa,inicio,limit){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                                    r.date_record,
                                    r.time_record,
                                    r.id,
                                    r.ramal as origem,
                                    r.uniqueid,
                                    r.callfilename,
                                    h.agente as ramal,
                                    h.protocolo,
                                    h.nome_registro,
                                    h.numero_discado AS numero,                            
                                    tb.tabulacao,
                                    tb.tipo,
                                    tb.venda,
                                    u.nome,
                                    e.equipe,
                                    t.tempo_total as duracao 
                            FROM ${empresa}_dados.records AS r 
                            JOIN ${empresa}_dados.historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                        LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id 
                        LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                        LEFT JOIN ${empresa}_dados.tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                        LEFT JOIN ${empresa}_dados.tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                        ORDER BY id DESC 
                            LIMIT ${inicio},${limit}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(rows)
            })
        })      
    }


    //protocolo 
    
    async buscarGravacao(empresa,minTime,maxTime,de,ate,buscarPor,parametro){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let filter=""
                //Tempo de Gravação
                if(minTime){
                    let time = minTime.split(':');
                    let horas = parseInt(time[0]*3600)
                    let minutos = parseInt(time[1]*60)
                    let segundos = parseInt(time[2])
                    let tempo = parseInt(horas+minutos+segundos)
                    
                    //console.log(`tempo minimo: ${tempo}`)
                    if(tempo>0){
                        filter += `AND t.tempo_total >= ${tempo}`
                    }            
                }
                if(maxTime){
                    let time = maxTime.split(':');
                    let horas = parseInt(time[0]*3600)
                    let minutos = parseInt(time[1]*60)
                    let segundos = parseInt(time[2])
                    let tempo = horas+minutos+segundos            
                    //console.log(`tempo maximo: ${tempo}`)
                    if(tempo>0){
                        filter += ` AND t.tempo_total <= ${tempo}`
                    }
                }
                //Data
                let sepDate_de = de.split('/')
                let data_de=`${sepDate_de[2]}-${sepDate_de[1]}-${sepDate_de[0]}`

                let sepDate_ate = ate.split('/')
                let data_ate=`${sepDate_ate[2]}-${sepDate_ate[1]}-${sepDate_ate[0]}`

                if(de){
                    filter += ` AND r.date >= "${data_de} 00:00:00"`
                }
                if(ate){
                    filter += ` AND r.date <=  "${data_ate} 23:59:59"`
                }

                if(buscarPor){
                    if(buscarPor=="protocolo"){
                        filter += ` AND h.protocolo="${parametro}"`
                    }            
                    if(buscarPor=="ramal"){
                        filter += ` AND h.agente="${parametro}"`
                    }            
                    if(buscarPor=="numero"){
                        filter += ` AND h.numero_discado LIKE "%${parametro}%"`
                    }            
                    if(buscarPor=="usuario"){
                        filter += ` AND u.nome LIKE "%${parametro}%"`
                    }
                    if(buscarPor=="equipe"){
                        filter += ` AND e.equipe="${parametro}"`
                    }
                    if(buscarPor=="tipo"){
                        filter += ` AND tb.tipo="${parametro}"`
                    }
                    if(buscarPor=="origem"){
                        filter += ` AND r.ramal="${parametro}"`
                    }
                }
        
                const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                                    r.date_record,
                                    r.time_record,
                                    r.id,
                                    r.ramal as origem,
                                    r.uniqueid,
                                    r.callfilename,
                                    h.tipo,
                                    h.agente as ramal,
                                    h.protocolo,
                                    h.numero_discado AS numero,
                                    h.nome_registro,
                                    tb.tabulacao,
                                    tb.tipo,
                                    tb.venda,
                                    u.nome,
                                    e.equipe,
                                    t.tempo_total as duracao 
                            FROM ${empresa}_dados.records AS r 
                            JOIN ${empresa}_dados.historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                        LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id 
                        LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                        LEFT JOIN ${empresa}_dados.tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                        LEFT JOIN ${empresa}_dados.tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                            WHERE 1=1 ${filter}`
                //console.log(buscarPor)
                console.log(sql)
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async infoGravacao(empresa,idGravacao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT *
                            FROM ${empresa}_dados.records
                            WHERE id=${idGravacao}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async numeroDiscadoByUniqueid(empresa,uniqueid){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT numero_discado AS numero
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE uniqueid=${uniqueid}`
                const n =  await this.querySync(conn,sql)
                if(n.length==0){
                    pool.end((err)=>{
                        if(err) console.log('Gravacao ...', err)
                    })
                    resolve(0)
                    return 0
                }
               
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(n[0].numero)
            })
        })      
    }

    async linkByUniqueid(empresa,uniqueid){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT callfilename,date_record
                            FROM ${empresa}_dados.records
                            WHERE uniqueid=${uniqueid}`
                const g =  await this.querySync(conn,sql)
                if(g.length==0){
                    pool.end((err)=>{
                        if(err) console.log('Gravacao ...', err)
                    })
                    resolve(0)
                    return 0
                }
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(g)
            })
        })      
    }

    async prefixEmpresa(idEmpresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(0,'crm')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT prefix
                            FROM clients.accounts
                            WHERE client_number=${idEmpresa}`
                const e = await this.querySync(conn,sql)

                if(e.length == 0){
                    pool.end((err)=>{
                        if(err) console.log('Gravacao ...', err)
                    })
                    resolve(false)
                    return false
                }
                
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(e[0].prefix)
            })
        })      
    }

    async linkGravacao(empresa,idRec){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                                    r.date_record,
                                    r.time_record,
                                    r.id,
                                    r.ramal as origem,
                                    r.uniqueid,
                                    r.callfilename,
                                    h.agente as ramal,
                                    h.protocolo,
                                    h.nome_registro,
                                    h.numero_discado AS numero,                            
                                    tb.tabulacao,
                                    tb.tipo,
                                    tb.venda,
                                    u.nome,
                                    e.equipe,
                                    t.tempo_total as duracao 
                            FROM ${empresa}_dados.records AS r 
                            JOIN ${empresa}_dados.historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                        LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id 
                        LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                        LEFT JOIN ${empresa}_dados.tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                        LEFT JOIN ${empresa}_dados.tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                            WHERE r.id=${idRec}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Gravacao ...', err)
                })
                resolve(rows)
            })
        })      
    }
}

export default new Gravacao();