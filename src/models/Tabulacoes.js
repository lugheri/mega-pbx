import connect from '../Config/dbConnection';
class Tabulacoes{
    querySync(sql,database){
        return new Promise((resolve,reject)=>{
            connect.base(database).query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    //LISTA DE TABULACOES 
    //Criar Lista de Tabulacaoes
    novaLista(dados,callback){
        const sql = `INSERT INTO campanhas_listas_tabulacoes (data,nome,descricao,status) VALUES (now(),'${dados.nome}','${dados.descricao}',1)`
        connect.banco.query(sql,dados,callback);
    }

    //Editar Lista de Tabulacaoes
    editarListaTabulacao(idLista,valores,callback) {
        const sql = 'UPDATE campanhas_listas_tabulacoes SET ? WHERE id = ?'
        connect.banco.query(sql,[valores,idLista],callback);
    }
    
    //Dados da Lista de Tabulacaoes
    dadosListaTabulacao(idLista,callback) {
        const sql = 'SELECT * FROM campanhas_listas_tabulacoes WHERE id=?'
        connect.banco.query(sql,idLista,callback);
    }
    
    //Listar listas de tabulacoes
    listasTabulacao(callback){
        const sql = 'SELECT * FROM campanhas_listas_tabulacoes WHERE status = 1'
        connect.banco.query(sql,callback);
    }

    //STATUS DE TABULACOES
    //Criar Status
    criarStatusTabulacao(dados,callback){
        const sql=`SELECT ordem FROM campanhas_status_tabulacao WHERE idLista=${dados.idLista} ORDER BY ordem DESC LIMIT 1`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e
            const ordem=r[0].ordem+1
            const sql=`INSERT INTO campanhas_status_tabulacao (idLista,tabulacao,descricao,tipo,venda,followUp,ordem,status) VALUES ('${dados.idLista}','${dados.tabulacao}','${dados.descricao}','${dados.tipo}',${dados.venda},${dados.followUp},${ordem},1)`
            connect.banco.query(sql,callback)
        })        
    }
    //Editar status
    editarStatusTabulacao(id,valores,callback){
        const sql = 'UPDATE campanhas_status_tabulacao SET ? WHERE id=?'
        connect.banco.query(sql,[valores,id],callback)
    }
    //Ver status
    statusTabulacao(id,callback){
        const sql = 'SELECT * FROM campanhas_status_tabulacao WHERE id=?'
        connect.banco.query(sql,id,callback)
    }

    //Listar Status
    listarStatusTabulacao(idLista){
        return new Promise((resolve,reject) =>{
            const sql = `SELECT id,tabulacao,followUp,venda FROM campanhas_status_tabulacao WHERE idLista=${idLista} AND status=1 ORDER BY ordem ASC`
            connect.banco.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    listarStatusTabulacaoPorTipo(idLista,tipo){
        return new Promise((resolve,reject) =>{
            const sql = `SELECT id FROM campanhas_status_tabulacao WHERE idLista=${idLista} AND tipo="${tipo}" AND status=1 ORDER BY ordem ASC`
            connect.banco.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    //updateStatusTabulacao
    updateTipoStatus(idStatus,idLista,destino,posOrigem,posDestino,callback){
        //caso a origem seja menor que o destino
        if(posOrigem<posDestino){
            const sql = `UPDATE campanhas_status_tabulacao SET ordem=ordem-1 WHERE idLista=${idLista} AND ordem<=${posDestino} AND ordem>${posOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE campanhas_status_tabulacao SET ordem=${posDestino}, tipo="${destino}" WHERE id=${idStatus}`
                connect.banco.query(sql,callback)
            })
        }else{
            const sql = `UPDATE campanhas_status_tabulacao SET ordem=ordem+1 WHERE idLista=${idLista} AND ordem>=${posDestino} AND ordem<${posOrigem}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql=`UPDATE campanhas_status_tabulacao SET ordem=${posDestino}, tipo="${destino}" WHERE id=${idStatus}`
                connect.banco.query(sql,callback)
            })
        }
    }   

}
export default new Tabulacoes();