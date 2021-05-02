import connect from '../Config/dbConnection';
class Tabulacoes{
    //LISTA DE TABULACOES 
    
    //Criar Lista de Tabulacaoes
    novaLista(dados,callback){
        const sql = `INSERT INTO campanhas_listas_tabulacoes (data,nome,descricao,status) VALUES (now(),'${dados.nome}','${dados.descricao}',1)`
        connect.query(sql,dados,callback);
    }

    //Editar Lista de Tabulacaoes
    editarListaTabulacao(idLista,valores,callback) {
        const sql = 'UPDATE campanhas_listas_tabulacoes SET ? WHERE id = ?'
        connect.query(sql,[valores,idLista],callback);
    }
    //Dados da Lista de Tabulacaoes
    dadosListaTabulacao(idLista,callback) {
        const sql = 'SELECT * FROM campanhas_listas_tabulacoes WHERE id=?'
        connect.query(sql,idLista,callback);
    }
    //Listar listas de tabulacoes
    listasTabulacao(callback){
        const sql = 'SELECT * FROM campanhas_listas_tabulacoes WHERE status = 1'
        connect.query(sql,callback);
    }

    //STATUS DE TABULACOES
    //Criar Status
    criarStatusTabulacao(dados,callback){
        const sql = `INSERT INTO campanhas_status_tabulacao (idLista,tabulacao,descricao,tipo,status) VALUES ('${dados.idLista}','${dados.tabulacao}','${dados.descricao}','${dados.tipo}',1)`
        connect.query(sql,callback)
    }
    //Editar status
    editarStatusTabulacao(id,valores,callback){
        const sql = 'UPDATE campanhas_status_tabulacao SET ? WHERE id=?'
        connect.query(sql,[valores,id],callback)
    }
    //Ver status
    statusTabulacao(id,callback){
        const sql = 'SELECT * FROM campanhas_status_tabulacao WHERE id=?'
        connect.query(sql,id,callback)
    }

    //Listar Status
    listarStatusTabulacao(idLista,callback){
        const sql = 'SELECT * FROM campanhas_status_tabulacao WHERE idLista=? AND status=1'
        connect.query(sql,idLista,callback)
    }    

}
export default new Tabulacoes();