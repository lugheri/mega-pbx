"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Clients = require('./Clients'); var _Clients2 = _interopRequireDefault(_Clients);

class Pausas{
    querySync(sql,empresa){
        return new Promise(async(resolve,reject)=>{
            const hostEmp = await _Clients2.default.serversDbs(empresa)
            const connection = _dbConnection2.default.poolConta(empresa,hostEmp)
            connection.query(sql,(e,rows)=>{
                if(e) reject(e);
               
                resolve(rows)                
            })
            connection.end()
           
        })
    }
    //LISTA DE PAUSAS 
    
    //Criar Lista de Pausas
    async novaLista(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.pausas_listas 
                                 (nome,descricao,status) 
                          VALUES ('${dados.nome}','${dados.descricao}',1)`
        return await this.querySync(sql,empresa);
    }

    //Editar Lista de Pausas
    async editarListaPausa(empresa,idLista,valores) {
        const sql = `UPDATE ${empresa}_dados.pausas_listas 
                        SET nome='${valores.nome}',
                            descricao='${valores.descricao}',
                            status='${valores.status}'
                     WHERE id = ${idLista}`
        return await this.querySync(sql,empresa);
    }
    //Dados da Lista de Pausas
    async dadosListaPausa(empresa,idLista) {
        const sql = `SELECT * 
                       FROM ${empresa}_dados.pausas_listas 
                       WHERE id=${idLista}` 
        return await this.querySync(sql,empresa);
    }
    //Listar listas de Pausas
    async listasPausa(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.pausas_listas 
                      WHERE status = 1`
        return await this.querySync(sql,empresa);
    }

    //PAUSAS
    //Criar pausa
    async criarPausa(empresa,dados){
        const tipo = 'manual';
        const sql = `INSERT INTO ${empresa}_dados.pausas 
                                 (idLista,nome,descricao,tipo,tempo,status) 
                          VALUES ('1','${dados.nome}','${dados.descricao}','${tipo}','${dados.tempo}',1)`
        return await this.querySync(sql,empresa)
    }
    //Editar pausa
    async editarPausa(empresa,id,valores){
        const sql = `UPDATE ${empresa}_dados.pausas 
                        SET nome='${valores.nome}',
                            descricao='${valores.descricao}',
                            tipo='${valores.tipo}',
                            tempo='${valores.tempo}'
                      WHERE id=${id}`
        return await this.querySync(sql,empresa)
    }

    async removerPausa(empresa,id){        
        const sql = `UPDATE ${empresa}_dados.pausas 
                        SET status=0
                      WHERE id=${id}`
        await this.querySync(sql,empresa)
        return true
    }
    //Ver pausa
    async dadosPausa(empresa,id){
        const sql = `SELECT * FROM ${empresa}_dados.pausas WHERE id=${id}`
        return await this.querySync(sql,empresa)
    }

    //Listar pausa
    async listarPausas(empresa){
        const sql = `SELECT * FROM ${empresa}_dados.pausas WHERE idLista=1 AND status=1`
        return await this.querySync(sql,empresa)
    }  
    
    async idPausaByTipo(empresa,tipo){
        const sql = `SELECT id 
                       FROM ${empresa}_dados.pausas 
                      WHERE tipo='${tipo}' AND status=1`
        const r = await this.querySync(sql,empresa)
       
        return r[0].id
    }

}
exports. default = new Pausas();