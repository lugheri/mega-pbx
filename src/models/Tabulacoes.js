import connect from '../Config/dbConnection';
class Tabulacoes{
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
        const sql = `INSERT INTO campanhas_status_tabulacao (idLista,tabulacao,descricao,tipo,status) VALUES ('${dados.idLista}','${dados.tabulacao}','${dados.descricao}','${dados.tipo}',1)`
        connect.banco.query(sql,callback)
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
    listarStatusTabulacao(idLista,callback){
        const sql = 'SELECT * FROM campanhas_status_tabulacao WHERE idLista=? AND status=1'
        connect.banco.query(sql,idLista,callback)
    }    

    //Lista status de tabulacao de uma campanha
    statusTabulacaoCampanha(idCampanha,callback){
        //verifica lista de tabulacao adicionada
        const sql = `SELECT idListaTabulacao FROM campanhas_listastabulacao_selecionadas WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            if(r.length==0){
                callback(e,"sem tabulacao")      
            }else{

                const idLista = r[0].idListaTabulacao
                const tipo = 'produtivo'
                const sql = `SELECT * FROM campanhas_status_tabulacao WHERE idLista=${idLista} AND tipo='${tipo}' AND status=1`
                connect.banco.query(sql,(e,produtivas)=>{
                    const tipo = 'improdutivo'
                    const sql = `SELECT * FROM campanhas_status_tabulacao WHERE idLista=${idLista} AND tipo='${tipo}' AND status=1`
                    connect.banco.query(sql,(e,improdutivas)=>{
                        console.log('teste listar')

                        console.log(`idCampanha ${idCampanha}`)
                        console.log(`idLista ${idLista}`)

                        let status = `{ "produtivas":[`
                        for(let i=0; i<produtivas.length; i++){
                            status += `{"idTabulacao":${produtivas[i].id},"tabulacao":"${produtivas[i].tabulacao}","descricao":"${produtivas[i].descricao}","tipo":"${produtivas[i].tipo}","follow_up":${produtivas[i].followUp}}`
                            if(i< produtivas.length-1){
                                status += ', '
                            }
                        }
                        status += `],`

                        status += `"improdutivas":[`
                        for(let i=0; i<improdutivas.length; i++){
                            status += `{"idTabulacao":${improdutivas[i].id},"tabulacao":"${improdutivas[i].tabulacao}","descricao":"${improdutivas[i].descricao}","tipo":"${improdutivas[i].tipo}","follow_up":${produtivas[i].followUp}}`
                            if(i<improdutivas.length-1){
                                status += ', '
                            }
                        }
                        status += `]}`
                        callback(e,JSON.parse(status))                    

                    })
                })
            }
        })
    }


}
export default new Tabulacoes();