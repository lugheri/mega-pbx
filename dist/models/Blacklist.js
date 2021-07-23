"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _csvtojson = require('csvtojson'); var _csvtojson2 = _interopRequireDefault(_csvtojson);
const Json2csvParser = require("json2csv").Parser;
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);

class Blacklist{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    async novaLista(dados){
        const sql = `INSERT INTO mailings.blacklists (nome,descricao,padrao) VALUES ('${dados.nome}','${dados.descricao}','${dados.default}')`;
        const rows = await this.querySync(sql)
    }

    async listarBlacklists(){
        const sql = `SELECT id,nome,descricao,padrao as 'default' FROM mailings.blacklists`;
        return await this.querySync(sql)
    }

    async verDadosLista(idLista){
        const sql = `SELECT nome,descricao,padrao as 'default' FROM mailings.blacklists WHERE id=${idLista}`;
        return await this.querySync(sql)
    }

    async editarDadosLista(idLista,dados){
        const sql = `UPDATE mailings.blacklists SET nome='${dados.nome}',descricao='${dados.descricao}',padrao=${dados.default} WHERE id=${idLista}`;
        return await this.querySync(sql)
    }

    async removerBlacklist(idLista){
        const sql = `DELETE FROM mailings.blacklists WHERE id=${idLista}`;
        await this.querySync(sql)
        const sql2 = `DELETE FROM mailings.blacklist_numeros WHERE idLista=${idLista}`;
        await this.querySync(sql2)
        return true
    }

    async importarNumeros(idLista,file){
        return await _csvtojson2.default.call(void 0, {delimiter:';'}).fromFile(file).then(async(jsonFile)=>{
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
                        let r = await this.addNumero(data)     
                        
                        if(r===true){
                            importados++
                        } 
                    }
                }
            }
            _fs2.default.unlinkSync(file)
            return importados
        })
    }

    modeloArquivo(res){
        const file='tmp/files/modelo.txt'
        const data='teste'

        const jsonData = "Numeros\n11998855665\n21985634152\n3152698547\n5522556699"
       
        _fs2.default.writeFile(file, jsonData, (err) => {
            if (err) throw err;
            console.log('O arquivo foi criado!');

            res.download(file)
        });


    }

    async addNumero(dados){
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
            const sql = `INSERT INTO mailings.blacklist_numeros (idLista,dataBloqueio,ddd,numero,tipo) VALUES (${idLista},now(),'${ddd}','${numero}','${tipo}')`
            await this.querySync(sql)
            return true
        }
        return false
    }

    async buscarNumero(idLista,numero){
        const sql = `SELECT id,idLista,DATE_FORMAT(dataBloqueio,'%d/%m/%Y') AS inclusao, ddd,numero,tipo FROM mailings.blacklist_numeros WHERE numero LIKE '%${numero}%' AND idLista=${idLista}`
        return await this.querySync(sql)
    }

    async numerosBloqueados(inicio,limit){
        const sql = `SELECT DATE_FORMAT(dataBloqueio,'%d/%m/%Y') AS inclusao,ddd,numero,tipo FROM mailings.blacklist_numeros LIMIT ${inicio},${limit}`
        return await this.querySync(sql)
     }

    async removerNumero(idLista,numero){
        const sql = `DELETE FROM mailings.blacklist_numeros WHERE numero='${numero}' AND idLista=${idLista}`
        await this.querySync(sql)
    }

    async addBlacklistCampanha(idBlacklist,idCampanha){
        const sqlTest = `SELECT idBlacklist FROM campanhas_blacklists WHERE idCampanha=${idCampanha} AND idBlacklist=${idBlacklist} `
        const test = await this.querySync(sqlTest)
        if(test.length>=1){
            return false
        }
        const sql = `INSERT INTO campanhas_blacklists 
                                 (idCampanha,idBlacklist) 
                          VALUES (${idCampanha},${idBlacklist})`
        await this.querySync(sql)
        return true
    }

    async blacklistsCampanha(idCampanha){
        const sql = `SELECT b.id as idBlacklist, b.nome
                        FROM campanhas_blacklists as c
                        JOIN mailings.blacklists as b ON b.id=c.idBlacklist
                       WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)
    }

    async removerBlacklistCampanha(idBlacklist,idCampanha){
        const sql = `DELETE FROM campanhas_blacklists WHERE idCampanha=${idCampanha} AND idBlacklist=${idBlacklist}`
        await this.querySync(sql)
    }
}

exports. default = new Blacklist();