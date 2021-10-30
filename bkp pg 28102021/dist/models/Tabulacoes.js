"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Clients = require('./Clients'); var _Clients2 = _interopRequireDefault(_Clients);
class Tabulacoes{
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

    //LISTA DE TABULACOES 
    //Criar Lista de Tabulacaoes
    async novaLista(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});

                const sql = `INSERT INTO ${empresa}_dados.tabulacoes_listas 
                                        (data,nome,descricao,status) 
                                VALUES (now(),'${dados.nome}','${dados.descricao}',1)`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //Listar listas de tabulacoes
    async listasTabulacao(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT id,DATE_FORMAT(data,'%d/%m/%Y') as data,nome,descricao,status 
                            FROM ${empresa}_dados.tabulacoes_listas
                            WHERE status = 1`
                const rows= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //Dados da Lista de Tabulacaoes
    async dadosListaTabulacao(empresa,idLista) {
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT id,DATE_FORMAT(data,'%d/%m/%Y') as data,nome,descricao,status 
                            FROM ${empresa}_dados.tabulacoes_listas 
                            WHERE id=${idLista}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //Editar Lista de Tabulacaoes
    async editarListaTabulacao(empresa,idLista,valores) {
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const nome = valores.nome
                const descricao = valores.descricao
                const status = valores.status
                const sql = `UPDATE ${empresa}_dados.tabulacoes_listas 
                                SET nome='${nome}',
                                    descricao='${descricao}',
                                    status=${status}
                            WHERE id=${idLista}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //STATUS DE TABULACOES
    //Criar Status
    async criarStatusTabulacao(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql=`SELECT id 
                        FROM ${empresa}_dados.tabulacoes_status 
                        WHERE idLista=${dados.idLista} 
                        ORDER BY ordem DESC 
                        LIMIT 1`
                const r =  await this.querySync(conn,sql)
                let contatado = 'S'
                let removeNumero = 0
                if(dados.tipo=='improdutivo'){
                    contatado = dados.contatado
                    removeNumero = dados.removeNumero
                }
                const ordem=r.length+1
                sql=`INSERT INTO ${empresa}_dados.tabulacoes_status 
                                (idLista,tabulacao,descricao,tipo,contatado,removeNumero,venda,followUp,ordem,maxTentativas,tempoRetorno,status) 
                        VALUES (${dados.idLista},'${dados.tabulacao}','${dados.descricao}','${dados.tipo}','${contatado}',${removeNumero},${dados.venda},${dados.followUp},${ordem},${dados.maxTentativas},'${dados.tempoRetorno}',1)`
            
                const result = await this.querySync(conn,sql)
                await this.reordenaStatus(empresa,dados.idLista)
                if(result.affectedRows==1){
                    pool.end((err)=>{
                        if(err) console.log('Tabulacoes ...', err)
                    })
                    resolve(result)
                    return ;

                }
               
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(false)
            })
        })      
    }   
    //Listar Status
    async listarStatusTabulacao(empresa,idLista){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.tabulacoes_status 
                            WHERE idLista=${idLista} AND status=1 
                            ORDER BY ordem ASC`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //Lista status por tipo
    async statusPorTipo(empresa,idLista,tipo){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT id
                            FROM ${empresa}_dados.tabulacoes_status 
                            WHERE idLista=${idLista} AND tipo='${tipo}' AND status=1 
                            ORDER BY ordem ASC`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }
    //Ver status
    async infoStatus(empresa,idStatus){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.tabulacoes_status 
                            WHERE id=${idStatus}`
                const rows= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async nomeStatus(empresa,idStatus){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT tabulacao 
                            FROM ${empresa}_dados.tabulacoes_status 
                            WHERE id=${idStatus}`
                const t = await this.querySync(conn,sql)
            
                if(t.length==0){
                    pool.end((err)=>{
                        if(err) console.log('Tabulacoes ...', err)
                    })
                    resolve("")
                    return
                }
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(t[0].tabulacao)
            })
        })      
    }
    //Editar status
    async editarStatusTabulacao(empresa,idStatus,valores){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const idLista = valores.idLista
                const tabulacao = valores.tabulacao
                const descricao = valores.descricao
                const tipo = valores.tipo
                const contatado = valores.contatado
                const removeNumero = valores.removeNumero
                const venda = valores.venda
                const followUp = valores.followUp
                const tempoRetorno = valores.tempoRetorno
                const maxTentativas = valores.maxTentativas
                const sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                                SET idLista=${idLista},
                                    tabulacao='${tabulacao}',
                                    descricao='${descricao}',
                                    tipo='${tipo}',
                                    contatado='${contatado}',
                                    removeNumero=${removeNumero},
                                    venda=${venda},
                                    followUp=${followUp},
                                    tempoRetorno='${tempoRetorno}',
                                    maxTentativas=${maxTentativas}
                            WHERE id=${idStatus}`
                const r = await this.querySync(conn,sql)
                if(r.affectedRows==1){
                    pool.end((err)=>{
                        if(err) console.log('Tabulacoes ...', err)
                    })
                    resolve(true)
                    return true
                }
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(false)
            })
        })      
    }
    //Remove status de tabulacao
    async removeStatusTabulacao(empresa,idStatus){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                                SET status=0 
                            WHERE id=${idStatus}`
                const r = await this.querySync(conn,sql)
                if(r.affectedRows==1){
                    pool.end((err)=>{
                        if(err) console.log('Tabulacoes ...', err)
                    })
                    resolve(true)
                    return true
                }
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(false)
            })
        })      
    }

    //Normaliza ordem
    async reordenaStatus(empresa,idLista){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //Desativados
                let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                            SET ordem=-1 
                            WHERE status=0`
                await this.querySync(conn,sql)
                //Produtivos
                const statusProd = await this.statusPorTipo(empresa,idLista,'produtivo')
                for(let i = 0; i < statusProd.length; i++){
                    let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                                SET ordem=${i} 
                                WHERE id=${statusProd[i].id}`
                    
                    await this.querySync(conn,sql)
                }
                //Improdutivos
                const statusImprod = await this.statusPorTipo(empresa,idLista,'improdutivo')
                for(let i = 0; i < statusImprod.length; i++){
                    let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                                SET ordem=${i} 
                                WHERE id=${statusImprod[i].id}`
                    
                    await this.querySync(conn,sql)
                }
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(true)
            })
        })      
    }

    async reordenarTipoStatus(empresa,idLista,idStatus,origem,posOrigem,posDestino){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql

                if(posOrigem>posDestino){
                    sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                            SET ordem=ordem+1 
                            WHERE ordem>=${posDestino} AND ordem<${posOrigem} AND idLista=${idLista} AND tipo='${origem}' AND status=1`
                    await this.querySync(conn,sql)
                }else{
                    sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                            SET ordem=ordem-1 
                            WHERE ordem >${posOrigem} AND ordem<=${posDestino} AND idLista=${idLista} AND tipo='${origem}' AND status=1`
                    await this.querySync(conn,sql)
                }
                sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                        SET ordem=${posDestino} 
                        WHERE id=${idStatus}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(true)
            })
        })      
    }
                           
    async alterarTipoStatus(empresa,idLista,idStatus,origem,destino,posDestino){
        console.log('posDestino',posDestino)
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
        
                let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                            SET ordem=ordem+1 
                            WHERE ordem>=${posDestino} AND idLista=${idLista} AND tipo='${destino}' AND status=1`
                await this.querySync(conn,sql)

                sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                        SET ordem=${posDestino}, tipo='${destino}'
                        WHERE id=${idStatus}`
                await this.querySync(conn,sql)
            
                pool.end((err)=>{
                    if(err) console.log('Tabulacoes ...', err)
                })
                resolve(true)
            })
        })      
    }


}
exports. default = new Tabulacoes();