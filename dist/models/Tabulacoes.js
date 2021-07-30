"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
class Tabulacoes{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
   
    //LISTA DE TABULACOES 
    //Criar Lista de Tabulacaoes
    async novaLista(dados){
        const sql = `INSERT INTO tabulacoes_listas (data,nome,descricao,status) VALUES (now(),'${dados.nome}','${dados.descricao}',1)`
        return await this.querySync(sql);
    }
    //Listar listas de tabulacoes
    async listasTabulacao(){
        const sql = `SELECT id,DATE_FORMAT(data,'%d/%m/%Y') as data,nome,descricao,status FROM tabulacoes_listas WHERE status = 1`
        return await this.querySync(sql);
    }
    //Dados da Lista de Tabulacaoes
    async dadosListaTabulacao(idLista) {
        const sql = `SELECT id,DATE_FORMAT(data,'%d/%m/%Y') as data,nome,descricao,status FROM tabulacoes_listas WHERE id=${idLista}`
        return await this.querySync(sql);
    }
    //Editar Lista de Tabulacaoes
    async editarListaTabulacao(idLista,valores) {
        const nome = valores.nome
        const descricao = valores.descricao
        const status = valores.status
        const sql = `UPDATE tabulacoes_listas SET nome='${nome}',descricao='${descricao}',status=${status} WHERE id=${idLista}`
        return await this.querySync(sql);
    }
    //STATUS DE TABULACOES
    //Criar Status
    async criarStatusTabulacao(dados){
        let sql=`SELECT id FROM tabulacoes_status WHERE idLista=${dados.idLista} ORDER BY ordem DESC LIMIT 1`
        const r =  await this.querySync(sql);
        const ordem=r.length+1
        sql=`INSERT INTO tabulacoes_status 
                         (idLista,tabulacao,descricao,tipo,venda,followUp,ordem,maxTentativas,tempoRetorno,status) 
                  VALUES (${dados.idLista},'${dados.tabulacao}','${dados.descricao}','${dados.tipo}',${dados.venda},${dados.followUp},${ordem},${dados.maxTentativas},'${dados.tempoRetorno}',1)`
      
        const result = await this.querySync(sql);
        await this.reordenaStatus(dados.idLista)
        if(result.affectedRows==1){
            return result;
        }
        return false
    }   
    //Listar Status
    async listarStatusTabulacao(idLista){
        const sql = `SELECT * FROM tabulacoes_status WHERE idLista=${idLista} AND status=1 ORDER BY ordem ASC`
        return await this.querySync(sql);
    }
    //Lista status por tipo
    async statusPorTipo(idLista,tipo){
        const sql = `SELECT id FROM tabulacoes_status WHERE idLista=${idLista} AND tipo='${tipo}' AND status=1 ORDER BY ordem ASC`
        return await this.querySync(sql);
    }
    //Ver status
    async infoStatus(idStatus){
        const sql = `SELECT * FROM tabulacoes_status WHERE id=${idStatus}`
        return await this.querySync(sql);
    }
    //Editar status
    async editarStatusTabulacao(idStatus,valores){
        const idLista = valores.idLista
        const tabulacao = valores.tabulacao
        const descricao = valores.descricao
        const tipo = valores.tipo
        const venda = valores.venda
        const followUp = valores.followUp
        const tempoRetorno = valores.tempoRetorno
        const maxTentativas = valores.maxTentativas
        const sql = `UPDATE tabulacoes_status 
                        SET idLista=${idLista},
                            tabulacao='${tabulacao}',
                            descricao='${descricao}',
                            tipo='${tipo}',
                            venda=${venda},
                            followUp=${followUp},
                            tempoRetorno='${tempoRetorno}',
                            maxTentativas=${maxTentativas}
                      WHERE id=${idStatus}`
        const r = await this.querySync(sql);
        if(r.affectedRows==1){
            return true
        }
        return false
    }
    //Remove status de tabulacao
    async removeStatusTabulacao(idStatus){
        const sql = `UPDATE tabulacoes_status SET status=0 WHERE id=${idStatus}`
        const r = await this.querySync(sql);
        if(r.affectedRows==1){
            return true
        }
        return false
    }

    //Normaliza ordem
    async reordenaStatus(idLista){
        //Desativados
        let sql = `UPDATE tabulacoes_status SET ordem=-1 WHERE status=0`
        await this.querySync(sql);
        //Produtivos
        const statusProd = await this.statusPorTipo(idLista,'produtivo')
        for(let i = 0; i < statusProd.length; i++){
            let sql = `UPDATE tabulacoes_status SET ordem=${i} WHERE id=${statusProd[i].id}`
            
            await this.querySync(sql);
        }
        //Improdutivos
        const statusImprod = await this.statusPorTipo(idLista,'improdutivo')
         for(let i = 0; i < statusImprod.length; i++){
             let sql = `UPDATE tabulacoes_status SET ordem=${i} WHERE id=${statusImprod[i].id}`
             
             await this.querySync(sql);
         }
        return true
    }

    async reordenarTipoStatus(idLista,idStatus,origem,posOrigem,posDestino){
        let sql
        if(posOrigem>posDestino){
            sql = `UPDATE tabulacoes_status SET ordem=ordem+1 WHERE ordem>=${posDestino} AND ordem<${posOrigem} AND idLista=${idLista} AND tipo='${origem}' AND status=1`
            await this.querySync(sql);
        }else{
            sql = `UPDATE tabulacoes_status SET ordem=ordem-1 WHERE ordem >${posOrigem} AND ordem<=${posDestino} AND idLista=${idLista} AND tipo='${origem}' AND status=1`
            await this.querySync(sql);
        }
        sql = `UPDATE tabulacoes_status SET ordem=${posDestino} WHERE id=${idStatus}`
        await this.querySync(sql);
        return true
    }
                           
    async alterarTipoStatus(idLista,idStatus,origem,destino,posDestino){
        console.log('posDestino',posDestino)
        
        let sql = `UPDATE tabulacoes_status SET ordem=ordem+1 
                    WHERE ordem>=${posDestino} AND idLista=${idLista} AND tipo='${destino}' AND status=1`
        await this.querySync(sql);

        sql = `UPDATE tabulacoes_status SET ordem=${posDestino}, tipo='${destino}' WHERE id=${idStatus}`
        await this.querySync(sql);
       
        return true
    }


}
exports. default = new Tabulacoes();