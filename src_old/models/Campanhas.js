import connect from '../Config/dbConnection';
class Campanhas{
      
    //Criar Campanha
    criarCampanha(dados,callback){
        const sql = `INSERT INTO campanhas (dataCriacao,tipo,nome,descricao,estado,status) VALUES (now(),'${dados.tipo}','${dados.nome}','${dados.descricao}',0,1)`
        connect.query(sql,callback)
    }
    //Lista campanhas
    listarCampanhas(callback){
        const sql = "SELECT * FROM campanhas WHERE status=1"
        connect.query(sql,callback)
    }

    //Retorna Campanha
    dadosCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas WHERE id='${idCampanha}' AND status=1`
        connect.query(sql,callback)
    }

    //Atualiza campanha
    atualizaCampanha(idCampanha,valores,callback){
        const sql = 'UPDATE campanhas SET ? WHERE id=?'
        connect.query(sql,[valores,idCampanha],callback)
    }
    
    //Remove Campanha
    //A campanha é removida quando seu status é setado para zero
    
      
}
export default new Campanhas();