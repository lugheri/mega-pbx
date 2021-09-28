"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
class Pausas{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }
    //LISTA DE PAUSAS 
    
    //Criar Lista de Pausas
    async novaLista(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.pausas_listas 
                                 (nome,descricao,status) 
                          VALUES ('${dados.nome}','${dados.descricao}',1)`
        return await this.querySync(sql);
    }

    //Editar Lista de Pausas
    async editarListaPausa(empresa,idLista,valores) {
        const sql = `UPDATE ${empresa}_dados.pausas_listas 
                        SET nome='${valores.nome}',
                            descricao='${valores.descricao}',
                            status='${valores.status}'
                     WHERE id = ${idLista}`
        return await this.querySync(sql);
    }
    //Dados da Lista de Pausas
    async dadosListaPausa(empresa,idLista) {
        const sql = `SELECT * 
                       FROM ${empresa}_dados.pausas_listas 
                       WHERE id=${idLista}` 
        return await this.querySync(sql);
    }
    //Listar listas de Pausas
    async listasPausa(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.pausas_listas 
                      WHERE status = 1`
        return await this.querySync(sql);
    }

    //PAUSAS
    //Criar pausa
    async criarPausa(empresa,dados){
        const tipo = 'manual';
        const sql = `INSERT INTO ${empresa}_dados.pausas 
                                 (idLista,nome,descricao,tipo,tempo,status) 
                          VALUES ('1','${dados.nome}','${dados.descricao}','${tipo}','${dados.tempo}',1)`
        return await this.querySync(sql)
    }
    //Editar pausa
    async editarPausa(empresa,id,valores){
        const sql = `UPDATE ${empresa}_dados.pausas 
                        SET nome='${valores.nome}',
                            descricao='${valores.descricao}',
                            tipo='${valores.tipo}',
                            tempo='${valores.tempo}'
                      WHERE id=${id}`
        return await this.querySync(sql)
    }

    async removerPausa(empresa,id){        
        const sql = `UPDATE ${empresa}_dados.pausas 
                        SET status=0
                      WHERE id=${id}`
        await this.querySync(sql)
        return true
    }
    //Ver pausa
    async dadosPausa(empresa,id){
        const sql = `SELECT * FROM ${empresa}_dados.pausas WHERE id=${id}`
        return await this.querySync(sql)
    }

    //Listar pausa
    async listarPausas(empresa,idLista){
        const sql = `SELECT * FROM ${empresa}_dados.pausas WHERE idLista=1 AND status=1`
        return await this.querySync(sql)
    }  
    
    async idPausaByTipo(empresa,tipo){
        const sql = `SELECT id 
                       FROM ${empresa}_dados.pausas 
                      WHERE tipo='${tipo}' AND status=1`
        const r = await this.querySync(sql)
       
        return r[0].id
    }

}
exports. default = new Pausas();