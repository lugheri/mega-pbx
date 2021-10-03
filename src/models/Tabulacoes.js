import connect from '../Config/dbConnection';
class Tabulacoes{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }
   
    //LISTA DE TABULACOES 
    //Criar Lista de Tabulacaoes
    async novaLista(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.tabulacoes_listas 
                                 (data,nome,descricao,status) 
                          VALUES (now(),'${dados.nome}','${dados.descricao}',1)`
        return await this.querySync(sql);
    }
    //Listar listas de tabulacoes
    async listasTabulacao(empresa){
        const sql = `SELECT id,DATE_FORMAT(data,'%d/%m/%Y') as data,nome,descricao,status 
                       FROM ${empresa}_dados.tabulacoes_listas
                      WHERE status = 1`
        return await this.querySync(sql);
    }
    //Dados da Lista de Tabulacaoes
    async dadosListaTabulacao(empresa,idLista) {
        const sql = `SELECT id,DATE_FORMAT(data,'%d/%m/%Y') as data,nome,descricao,status 
                       FROM ${empresa}_dados.tabulacoes_listas 
                      WHERE id=${idLista}`
        return await this.querySync(sql);
    }
    //Editar Lista de Tabulacaoes
    async editarListaTabulacao(empresa,idLista,valores) {
        const nome = valores.nome
        const descricao = valores.descricao
        const status = valores.status
        const sql = `UPDATE ${empresa}_dados.tabulacoes_listas 
                        SET nome='${nome}',
                            descricao='${descricao}',
                            status=${status}
                       WHERE id=${idLista}`
        return await this.querySync(sql);
    }
    //STATUS DE TABULACOES
    //Criar Status
    async criarStatusTabulacao(empresa,dados){
        let sql=`SELECT id 
                   FROM ${empresa}_dados.tabulacoes_status 
                  WHERE idLista=${dados.idLista} 
                  ORDER BY ordem DESC 
                  LIMIT 1`
        const r =  await this.querySync(sql);
        let contatado = 'S'
        let removeNumero = 0
        if(dados.tipo=='improdutivo'){
            contatado = dados.contatado
            removeNumero = dados.removeNumero
        }
        const ordem=r.length+1
        sql=`INSERT INTO ${empresa}_dados.tabulacoes_status 
                         (idLista,tabulacao,descricao,tipo,contatado,removeNumero,venda,followUp,ordem,maxTentativas,tempoRetorno,status) 
                  VALUES (${dados.idLista},'${dados.tabulacao}','${dados.descricao}','${dados.tipo}','${contatado}',${removeNumero},${dados.venda},${dados.followUp},${ordem},${dados.maxTentativas},'${dados.tempoRetorno}',1)`
      
        const result = await this.querySync(sql);
        await this.reordenaStatus(empresa,dados.idLista)
        if(result.affectedRows==1){
            return result;
        }
        return false
    }   
    //Listar Status
    async listarStatusTabulacao(empresa,idLista){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.tabulacoes_status 
                       WHERE idLista=${idLista} AND status=1 
                       ORDER BY ordem ASC`
        return await this.querySync(sql);
    }
    //Lista status por tipo
    async statusPorTipo(empresa,idLista,tipo){
        const sql = `SELECT id
                       FROM ${empresa}_dados.tabulacoes_status 
                       WHERE idLista=${idLista} AND tipo='${tipo}' AND status=1 
                       ORDER BY ordem ASC`
        return await this.querySync(sql);
    }
    //Ver status
    async infoStatus(empresa,idStatus){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.tabulacoes_status 
                      WHERE id=${idStatus}`
        return await this.querySync(sql);
    }

    async nomeStatus(empresa,idStatus){
        const sql = `SELECT tabulacao 
                       FROM ${empresa}_dados.tabulacoes_status 
                      WHERE id=${idStatus}`
        const t = await this.querySync(sql);
       
        if(t.length==0){
            return ""
        }
        return t[0].tabulacao;
    }
    //Editar status
    async editarStatusTabulacao(empresa,idStatus,valores){
        const idLista = valores.idLista
        const tabulacao = valores.tabulacao
        const descricao = valores.descricao
        const tipo = valores.tipo
        const contatado = valores.contatado
        const removeNumero = valores.removeNumero
        const venda = valores.venda
        const followUp = valores.followUp
        const tempoRetorno = valores.tempoRetorno
        const maxTentativas = valores.maxTentativas
        const sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                        SET idLista=${idLista},
                            tabulacao='${tabulacao}',
                            descricao='${descricao}',
                            tipo='${tipo}',
                            contatado='${contatado}',
                            removeNumero=${removeNumero},
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
    async removeStatusTabulacao(empresa,idStatus){
        const sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                        SET status=0 
                      WHERE id=${idStatus}`
        const r = await this.querySync(sql);
        if(r.affectedRows==1){
            return true
        }
        return false
    }

    //Normaliza ordem
    async reordenaStatus(empresa,idLista){
        //Desativados
        let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                      SET ordem=-1 
                    WHERE status=0`
        await this.querySync(sql);
        //Produtivos
        const statusProd = await this.statusPorTipo(empresa,idLista,'produtivo')
        for(let i = 0; i < statusProd.length; i++){
            let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                          SET ordem=${i} 
                        WHERE id=${statusProd[i].id}`
            
            await this.querySync(sql);
        }
        //Improdutivos
        const statusImprod = await this.statusPorTipo(empresa,idLista,'improdutivo')
         for(let i = 0; i < statusImprod.length; i++){
             let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                           SET ordem=${i} 
                         WHERE id=${statusImprod[i].id}`
             
             await this.querySync(sql);
         }
        return true
    }

    async reordenarTipoStatus(empresa,idLista,idStatus,origem,posOrigem,posDestino){
        let sql
        if(posOrigem>posDestino){
            sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                      SET ordem=ordem+1 
                    WHERE ordem>=${posDestino} AND ordem<${posOrigem} AND idLista=${idLista} AND tipo='${origem}' AND status=1`
            await this.querySync(sql);
        }else{
            sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                      SET ordem=ordem-1 
                    WHERE ordem >${posOrigem} AND ordem<=${posDestino} AND idLista=${idLista} AND tipo='${origem}' AND status=1`
            await this.querySync(sql);
        }
        sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                  SET ordem=${posDestino} 
                WHERE id=${idStatus}`
        await this.querySync(sql);
        return true
    }
                           
    async alterarTipoStatus(empresa,idLista,idStatus,origem,destino,posDestino){
        console.log('posDestino',posDestino)
        
        let sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                      SET ordem=ordem+1 
                    WHERE ordem>=${posDestino} AND idLista=${idLista} AND tipo='${destino}' AND status=1`
        await this.querySync(sql);

        sql = `UPDATE ${empresa}_dados.tabulacoes_status 
                  SET ordem=${posDestino}, tipo='${destino}'
                WHERE id=${idStatus}`
        await this.querySync(sql);
       
        return true
    }


}
export default new Tabulacoes();