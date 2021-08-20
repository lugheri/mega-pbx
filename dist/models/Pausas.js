"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
class Pausas{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    //LISTA DE PAUSAS 
    
    //Criar Lista de Pausas
    novaLista(dados,callback){
        const sql = `INSERT INTO pausas_listas (nome,descricao,status) VALUES ('${dados.nome}','${dados.descricao}',1)`
        _dbConnection2.default.banco.query(sql,dados,callback);
    }

    //Editar Lista de Pausas
    editarListaPausa(idLista,valores,callback) {
        const sql = 'UPDATE pausas_listas SET ? WHERE id = ?'
        _dbConnection2.default.banco.query(sql,[valores,idLista],callback);
    }
    //Dados da Lista de Pausas
    dadosListaPausa(idLista,callback) {
        const sql = 'SELECT * FROM pausas_listas WHERE id=?'
        _dbConnection2.default.banco.query(sql,idLista,callback);
    }
    //Listar listas de Pausas
    listasPausa(callback){
        const sql = 'SELECT * FROM pausas_listas WHERE status = 1'
        _dbConnection2.default.banco.query(sql,callback);
    }

    //PAUSAS
    //Criar pausa
    async criarPausa(dados){
        const tipo = 'manual';
        const sql = `INSERT INTO pausas (idLista,nome,descricao,tipo,tempo,status) 
                                 VALUES ('1','${dados.nome}','${dados.descricao}','${tipo}','${dados.tempo}',1)`
        return await this.querySync(sql)
    }
    //Editar pausa
    async editarPausa(id,valores){
        const sql = `UPDATE pausas 
                        SET nome='${valores.nome}',
                            descricao='${valores.descricao}',
                            tipo='${valores.tipo}',
                            tempo='${valores.tempo}'
                      WHERE id=${id}`
        return await this.querySync(sql)
    }

    async removerPausa(id){        
        const sql = `UPDATE pausas 
                        SET status=0
                      WHERE id=${id}`
        await this.querySync(sql)
        return true
    }
    //Ver pausa
    async dadosPausa(id){
        const sql = `SELECT * FROM pausas WHERE id=${id}`
        return await this.querySync(sql)
    }

    //Listar pausa
    async listarPausas(idLista){
        const sql = `SELECT * FROM pausas WHERE idLista=1 AND status=1`
        return await this.querySync(sql)
    }  
    
    async idPausaByTipo(tipo){
        const sql = `SELECT id FROM pausas WHERE tipo='${tipo}' AND status=1`
        const r = await this.querySync(sql)
       
        return r[0].id
    }

}
exports. default = new Pausas();