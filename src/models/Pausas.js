import connect from '../Config/dbConnection';
import Clients from './Clients'

class Pausas{
    //Query Sync
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
      }   
    //LISTA DE PAUSAS 
    
    //Criar Lista de Pausas
    async novaLista(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `INSERT INTO ${empresa}_dados.pausas_listas 
                                        (nome,descricao,status) 
                                VALUES ('${dados.nome}','${dados.descricao}',1)`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }

    //Editar Lista de Pausas
    async editarListaPausa(empresa,idLista,valores) {
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE ${empresa}_dados.pausas_listas 
                                SET nome='${valores.nome}',
                                    descricao='${valores.descricao}',
                                    status='${valores.status}'
                            WHERE id = ${idLista}`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }
    //Dados da Lista de Pausas
    async dadosListaPausa(empresa,idLista) {
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * 
                            FROM ${empresa}_dados.pausas_listas 
                            WHERE id=${idLista}` 
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }
    //Listar listas de Pausas
    async listasPausa(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * 
                            FROM ${empresa}_dados.pausas_listas 
                            WHERE status = 1`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }

    //PAUSAS
    //Criar pausa
    async criarPausa(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const tipo = 'manual';
                const sql = `INSERT INTO ${empresa}_dados.pausas 
                                        (idLista,nome,descricao,tipo,tempo,status) 
                                VALUES ('1','${dados.nome}','${dados.descricao}','${tipo}','${dados.tempo}',1)`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }
    //Editar pausa
    async editarPausa(empresa,id,valores){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE ${empresa}_dados.pausas 
                                SET nome='${valores.nome}',
                                    descricao='${valores.descricao}',
                                    tipo='${valores.tipo}',
                                    tempo='${valores.tempo}'
                            WHERE id=${id}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }

    async removerPausa(empresa,id){     
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{      
                const sql = `UPDATE ${empresa}_dados.pausas 
                                SET status=0
                            WHERE id=${id}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(true)
            })
        })      
    }
    //Ver pausa
    async dadosPausa(empresa,id){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * FROM ${empresa}_dados.pausas WHERE id=${id}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }

    //Listar pausa
    async listarPausas(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT * FROM ${empresa}_dados.pausas WHERE idLista=1 AND status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows)
            })
        })      
    }  
    
    async idPausaByTipo(empresa,tipo){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT id 
                            FROM ${empresa}_dados.pausas 
                            WHERE tipo='${tipo}' AND status=1`
                const r = await this.querySync(conn,sql)
            
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(r[0].id)
            })
        })      

    }

}
export default new Pausas();