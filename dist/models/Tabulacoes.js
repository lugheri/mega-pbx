"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
class Tabulacoes{
    //LISTA DE TABULACOES 
    
    //Criar Lista de Tabulacaoes
    novaLista(dados,callback){
        const sql = `INSERT INTO campanhas_listas_tabulacoes (data,nome,descricao,status) VALUES (now(),'${dados.nome}','${dados.descricao}',1)`
        _dbConnection2.default.banco.query(sql,dados,callback);
    }

    //Editar Lista de Tabulacaoes
    editarListaTabulacao(idLista,valores,callback) {
        const sql = 'UPDATE campanhas_listas_tabulacoes SET ? WHERE id = ?'
        _dbConnection2.default.banco.query(sql,[valores,idLista],callback);
    }
    //Dados da Lista de Tabulacaoes
    dadosListaTabulacao(idLista,callback) {
        const sql = 'SELECT * FROM campanhas_listas_tabulacoes WHERE id=?'
        _dbConnection2.default.banco.query(sql,idLista,callback);
    }
    //Listar listas de tabulacoes
    listasTabulacao(callback){
        const sql = 'SELECT * FROM campanhas_listas_tabulacoes WHERE status = 1'
        _dbConnection2.default.banco.query(sql,callback);
    }

    //STATUS DE TABULACOES
    //Criar Status
    criarStatusTabulacao(dados,callback){
        const sql = `INSERT INTO campanhas_status_tabulacao (idLista,tabulacao,descricao,tipo,status) VALUES ('${dados.idLista}','${dados.tabulacao}','${dados.descricao}','${dados.tipo}',1)`
        _dbConnection2.default.banco.query(sql,callback)
    }
    //Editar status
    editarStatusTabulacao(id,valores,callback){
        const sql = 'UPDATE campanhas_status_tabulacao SET ? WHERE id=?'
        _dbConnection2.default.banco.query(sql,[valores,id],callback)
    }
    //Ver status
    statusTabulacao(id,callback){
        const sql = 'SELECT * FROM campanhas_status_tabulacao WHERE id=?'
        _dbConnection2.default.banco.query(sql,id,callback)
    }

    //Listar Status
    listarStatusTabulacao(idLista,callback){
        const sql = 'SELECT * FROM campanhas_status_tabulacao WHERE idLista=? AND status=1'
        _dbConnection2.default.banco.query(sql,idLista,callback)
    }    

}
exports. default = new Tabulacoes();