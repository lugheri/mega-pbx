import connect from '../Config/dbConnection'
import Clients from './Clients'
import csv from 'csvtojson';
const Json2csvParser = require("json2csv").Parser;
import fs from 'fs';

class Blacklist{
    /*
    async querySync(sql,empresa){
        const hostEmp = await Clients.serversDbs(empresa)
        const connection = connect.poolConta(hostEmp)
        const promisePool =  connection.promise();
        const result = await promisePool.query(sql)
        promisePool.end();
        return result[0];       
    }*/
    
    async querySync(sql,empresa){
        return new Promise(async(resolve,reject)=>{
            const hostEmp = await Clients.serversDbs(empresa)
            const conn = connect.poolConta(hostEmp)
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
            conn.end()                        
        })
    }

    async novaLista(empresa,dados){
        const sql = `INSERT INTO ${empresa}_mailings.blacklists 
                                 (nome,descricao,padrao) 
                          VALUES ('${dados.nome}','${dados.descricao}','${dados.default}')`;
        const rows = await this.querySync(sql,empresa)
    }

    async listarBlacklists(empresa){
        const sql = `SELECT id,nome,descricao,padrao as 'default'
                       FROM ${empresa}_mailings.blacklists`;
        return await this.queryTest(sql,empresa)
    }

    async verDadosLista(empresa,idLista){
        const sql = `SELECT nome,descricao,padrao as 'default' 
                       FROM ${empresa}_mailings.blacklists 
                      WHERE id=${idLista}`;
        return await this.querySync(sql,empresa)
    }

    async editarDadosLista(empresa,idLista,dados){
        const sql = `UPDATE ${empresa}_mailings.blacklists 
                        SET nome='${dados.nome}',
                            descricao='${dados.descricao}',
                            padrao=${dados.default} 
                      WHERE id=${idLista}`;
        return await this.querySync(sql,empresa)
    }

    async removerBlacklist(empresa,idLista){
        const sql = `DELETE FROM ${empresa}_mailings.blacklists
                           WHERE id=${idLista}`;
        await this.querySync(sql,empresa)
        const sql2 = `DELETE FROM ${empresa}_mailings.blacklist_numeros
                            WHERE idLista=${idLista}`;
        await this.querySync(sql2,empresa)
        return true
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
            await this.querySync(sql,empresa)
            return true
        }
        return false
    }

    async buscarNumero(empresa,idLista,numero){
        const sql = `SELECT id,idLista,DATE_FORMAT(dataBloqueio,'%d/%m/%Y') AS inclusao, ddd,numero,tipo 
                       FROM ${empresa}_mailings.blacklist_numeros 
                       WHERE numero LIKE '%${numero}%' AND idLista=${idLista}`
        return await this.querySync(sql,empresa)
    }

    async numerosBloqueados(empresa,inicio,limit){
        const sql = `SELECT DATE_FORMAT(dataBloqueio,'%d/%m/%Y') AS inclusao,ddd,numero,tipo 
                      FROM ${empresa}_mailings.blacklist_numeros LIMIT ${inicio},${limit}`
        return await this.querySync(sql,empresa)
     }

    async removerNumero(empresa,idLista,numero){
        const sql = `DELETE FROM ${empresa}_mailings.blacklist_numeros 
                      WHERE numero='${numero}' AND idLista=${idLista}`
        await this.querySync(sql,empresa)
    }

    async addBlacklistCampanha(empresa,idBlacklist,idCampanha){
        const sqlTest = `SELECT idBlacklist 
                           FROM ${empresa}_dados.campanhas_blacklists 
                           WHERE idCampanha=${idCampanha} AND idBlacklist=${idBlacklist} `
        const test = await this.querySync(sqlTest)
        if(test.length>=1){
            return false
        }
        const sql = `INSERT INTO ${empresa}_dados.campanhas_blacklists 
                                 (idCampanha,idBlacklist) 
                          VALUES (${idCampanha},${idBlacklist})`
        await this.querySync(sql,empresa)
        return true
    }

    async blacklistsCampanha(empresa,idCampanha){
        const sql = `SELECT b.id as idBlacklist, b.nome
                        FROM ${empresa}_dados.campanhas_blacklists as c
                        JOIN ${empresa}_mailings.blacklists as b ON b.id=c.idBlacklist
                       WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql,empresa)
    }

    async removerBlacklistCampanha(empresa,idBlacklist,idCampanha){
        const sql = `DELETE FROM ${empresa}_dados.campanhas_blacklists 
        WHERE idCampanha=${idCampanha} AND idBlacklist=${idBlacklist}`
        await this.querySync(sql,empresa)
    }
}

export default new Blacklist();