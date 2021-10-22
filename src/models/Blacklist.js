import connect from '../Config/dbConnection'
import Clients from './Clients'
import csv from 'csvtojson';
const Json2csvParser = require("json2csv").Parser;
import fs from 'fs';

class Blacklist{
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
    } 

    async novaLista(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `INSERT INTO ${empresa}_mailings.blacklists 
                                        (nome,descricao,padrao) 
                                VALUES ('${dados.nome}','${dados.descricao}','${dados.default}')`;
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
    }

    async listarBlacklists(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT id,nome,descricao,padrao as 'default'
                            FROM ${empresa}_mailings.blacklists`;
                const rows = await this.queryTest(sql,empresa)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
    }

    async verDadosLista(empresa,idLista){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT nome,descricao,padrao as 'default' 
                            FROM ${empresa}_mailings.blacklists 
                            WHERE id=${idLista}`;
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
    }

    async editarDadosLista(empresa,idLista,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `UPDATE ${empresa}_mailings.blacklists 
                                SET nome='${dados.nome}',
                                    descricao='${dados.descricao}',
                                    padrao=${dados.default} 
                            WHERE id=${idLista}`;
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
    }

    async removerBlacklist(empresa,idLista){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `DELETE FROM ${empresa}_mailings.blacklists
                                WHERE id=${idLista}`;
                await this.querySync(conn,sql)
                const sql2 = `DELETE FROM ${empresa}_mailings.blacklist_numeros
                                    WHERE idLista=${idLista}`;
                await this.querySync(sql2,empresa)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(true) 
            })
        })       
    }

    async importarNumeros(empresa,idLista,file){
        return await csv({delimiter:';'}).fromFile(file).then(async(jsonFile)=>{
            let importados=0
            let keys = Object.keys(jsonFile[0])
            for(let i=0; i<jsonFile.length; i++){
                let data={}
                let numero = jsonFile[i][keys] 
                if(numero!==undefined){
                    if(numero.length<=12){   

                        data['idLista']=idLista;
                        data['ddd']=0;
                        data['numero']=numero
                        
                        if(numero.length>9){                    
                            data['ddd']=numero.slice(0,2) 
                            data['numero']=numero.slice(2)                  
                        }  
                        let r = await this.addNumero(empresa,data)     
                        
                        if(r===true){
                            importados++
                        } 
                    }
                }
            }
            fs.unlinkSync(file)
            return importados
        })
    }

    modeloArquivo(res){
        const file='tmp/files/modelo.txt'
        const data='teste'
        const jsonData = "Numeros\n11998855665\n21985634152\n3152698547\n5522556699"
       
        fs.writeFile(file, jsonData, (err) => {
            if (err) throw err;
            console.log('O arquivo foi criado!');

            res.download(file)
        });


    }

    async addNumero(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const idLista = dados.idLista
                const ddd = dados.ddd
                let numero = dados.numero
                
                let tipo="fixo"
                if((numero.length==9)&&(parseInt(numero[0])>=7)){
                    tipo="celular"
                }        
                if(ddd>10){
                    numero=ddd+numero
                }
                const duplicidade = await this.buscarNumero(idLista,numero)
                if(duplicidade==0){
                    const sql = `INSERT INTO ${empresa}_mailings.blacklist_numeros 
                                            (idLista,dataBloqueio,ddd,numero,tipo) 
                                    VALUES (${idLista},now(),'${ddd}','${numero}','${tipo}')`
                    await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.log(err)
                    })
                    resolve(true) 
                    return true
                }
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(false) 
            })
        })       
    }

    async buscarNumero(empresa,idLista,numero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT id,idLista,DATE_FORMAT(dataBloqueio,'%d/%m/%Y') AS inclusao, ddd,numero,tipo 
                            FROM ${empresa}_mailings.blacklist_numeros 
                            WHERE numero LIKE '%${numero}%' AND idLista=${idLista}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
    }

    async numerosBloqueados(empresa,inicio,limit){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT DATE_FORMAT(dataBloqueio,'%d/%m/%Y') AS inclusao,ddd,numero,tipo 
                            FROM ${empresa}_mailings.blacklist_numeros LIMIT ${inicio},${limit}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
     }

    async removerNumero(empresa,idLista,numero){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `DELETE FROM ${empresa}_mailings.blacklist_numeros 
                            WHERE numero='${numero}' AND idLista=${idLista}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
            })
        })       
    }

    async addBlacklistCampanha(empresa,idBlacklist,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sqlTest = `SELECT idBlacklist 
                                FROM ${empresa}_dados.campanhas_blacklists 
                                WHERE idCampanha=${idCampanha} AND idBlacklist=${idBlacklist} `
                const test = await this.querySync(sqlTest)
                if(test.length>=1){
                    pool.end((err)=>{
                        if(err) console.log(err)
                    })
                    resolve(false) 
                    return false
                }
                const sql = `INSERT INTO ${empresa}_dados.campanhas_blacklists 
                                        (idCampanha,idBlacklist) 
                                VALUES (${idCampanha},${idBlacklist})`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(true) 
            })
        })       
    }

    async blacklistsCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT b.id as idBlacklist, b.nome
                                FROM ${empresa}_dados.campanhas_blacklists as c
                                JOIN ${empresa}_mailings.blacklists as b ON b.id=c.idBlacklist
                            WHERE idCampanha=${idCampanha}`
                const rows =  await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(rows) 
            })
        })       
    }

    async removerBlacklistCampanha(empresa,idBlacklist,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `DELETE FROM ${empresa}_dados.campanhas_blacklists 
                WHERE idCampanha=${idCampanha} AND idBlacklist=${idBlacklist}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log(err)
                }) 
            })
        })       
    }
}

export default new Blacklist();