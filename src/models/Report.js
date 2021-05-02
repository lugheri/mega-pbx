import connect from '../Config/dbConnection';

class Report{
    criarRelatorio(data,callback){
        const sql = `INSERT INTO report_info (data,nome,descricao,status) VALUES (NOW(),'${data.nome}','${data.descricao}',1) ` 
        connect.banco.query(sql,callback)
    }

    listarRelatorios(callback){
        const sql = "SELECT * FROM report_info WHERE status=1";
        connect.banco.query(sql,callback)
    }

    infoRelatorio(idRelatorio,callback){
        const sql = `SELECT * FROM report_info WHERE id='${idRelatorio}'`;
        connect.banco.query(sql,callback)
    }

    editarRelatorio(idRelatorio,dados,callback){
        const sql = `UPDATE report_info SET nome='${dados.nome}', descricao='${dados.descricao}', status='${dados.status}' WHERE id='${idRelatorio}'`
        connect.banco.query(sql,callback)
    }

    addCampoDisponiveis(dados,callback){
        const sql = `INSERT INTO report_campos_disponiveis (campo,descricao,sintetico,charts,status) VALUES ('${dados.campo}','${dados.descricao}','${dados.sintetico}','${dados.charts}','${dados.status}')`
        connect.banco.query(sql,callback)
    }

    listCamposDisponiveis(callback){
        const sql = "SELECT * FROM report_campos_disponiveis";
        connect.banco.query(sql,callback)
    }

    editarCampoDisponiveis(idCampoDisponivel,dados,callback){
        const sql = `UPDATE report_campos_disponiveis SET campo='${dados.campo}',descricao='${dados.descricao}',sintetico='${dados.sintetico}',charts='${dados.charts}',status='${dados.status}' WHERE id='${idCampoDisponivel}'`
        connect.banco.query(sql,callback)
    }

    delCampoDisponiveis(idCampoDisponivel,callback){
        const sql = `DELETE FROM report_campos_disponiveis WHERE id='${idCampoDisponivel}'`
        connect.banco.query(sql,callback) 
    }

    


    addCampoRelatorio(dados,callback){
        const sql = `INSERT INTO report_campos (idreport,idcampo,sintetico,chart) VALUES ('${dados.idreport}','${dados.idcampo}','${dados.sintetico}','${dados.chart}')`
        connect.banco.query(sql,callback)
    }

    listarCamposRelatorio(idRelatorio,callback){
        const sql = `SELECT * FROM report_campos WHERE idreport=${idRelatorio}`;
        connect.banco.query(sql,callback)
    }

    infoCamposRelatorio(idCampoRelatorio,callback){
        const sql = `SELECT * FROM report_campos WHERE id=${idCampoRelatorio}`;
        connect.banco.query(sql,callback)
    }
    
    editCampoRelatorio(idCampoRelatorio,dados,callback){
        const sql = `UPDATE report_campos SET sintetico='${dados.sintetico}', chart='${dados.chart}' WHERE id='${idCampoRelatorio}'`
        connect.banco.query(sql,callback)
    }
    
    delCampoRelatorio(idCampoRelatorio,callback){
        const sql = `DELETE FROM report_campos WHERE id='${idCampoRelatorio}'`
        connect.banco.query(sql,callback)
    }




}
export default new Report()