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
    criarPausa(dados,callback){
        const tipo = 'manual';
        const sql = `INSERT INTO pausas (idLista,nome,descricao,tipo,tempo,status) VALUES ('${dados.idLista}','${dados.nome}','${dados.descricao}','${tipo}','${dados.tempo}',1)`
        _dbConnection2.default.banco.query(sql,callback)
    }
    //Editar pausa
    editarPausa(id,valores,callback){
        const sql = 'UPDATE pausas SET ? WHERE id=?'
        _dbConnection2.default.banco.query(sql,[valores,id],callback)
    }
    //Ver pausa
    dadosPausa(id,callback){
        const sql = 'SELECT * FROM pausas WHERE id=?'
        _dbConnection2.default.banco.query(sql,id,callback)
    }

    //Listar pausa
    listarPausas(idLista,callback){
        const sql = 'SELECT * FROM pausas WHERE idLista=? AND status=1'
        _dbConnection2.default.banco.query(sql,idLista,callback)
    }  
    
    async idPausaByTipo(tipo){
        const sql = `SELECT id FROM pausas WHERE tipo='${tipo}' AND status=1`
        const r = await this.querySync(sql)
       
        return r[0].id
    }

}
exports. default = new Pausas();