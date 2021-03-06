import connect from '../Config/dbConnection';
import Mailing from './Mailing';
import moment from 'moment';
import Redis from '../Config/Redis'

//Mongo models
import mongoose from 'mongoose'
import Mailings from '../database/Mailings'
import MailingCampanha from '../database/MailingCampanha'
import MailingsTypeFields from '../database/MailingsTypeFields'
import FiltrosDiscagem from '../database/FiltrosDiscagem'
import dddsMailing from '../database/dddsMailing'
import schemaNumerosMailing from '../database/schemaNumerosMailing'

class Campanhas{ 
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err){ 
                    console.error({"errorCode":err.code,"message":err.message,"stack":err.stack, "sql":sql}) 
                    resolve(false);
                }
                resolve(rows)
            })
        })
    }     
    //STATUS DE EVOLUCAO DE CAMPANHA
    async totalMailingsCampanha(empresa,idCampanha){
        connect.mongoose(empresa)
        const mailing = await MailingCampanha.find({idCampanha:idCampanha})
        if(mailing.length==0){
            return []
        }
        const idMailing = mailing[0].idMailing
        const infoMailng = await Mailings.find({id:idMailing})

        const totalMailingCampanha={}
              totalMailingCampanha['total']=infoMailng[0].totalNumeros
              totalMailingCampanha['idMailing']=idMailing
        return [totalMailingCampanha]     
    }

    async mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,status){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT count(id) AS total 
                               FROM ${empresa}_dados.historico_atendimento 
                              WHERE contatado='${status}' AND campanha=${idCampanha} AND mailing=${idMailing}`
                const total_mailing= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1079', err)
                })
                resolve(total_mailing[0].total)
            })
        })
    }
    async mailingsAnteriores(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT DISTINCT mailing 
                            FROM ${empresa}_dados.historico_atendimento 
                            WHERE campanha=${idCampanha}`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1079', err)
                })
                resolve(rows)
            })
        })        
    }
    async mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,status){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let queryFilter="";
                if(status==1){
                    queryFilter=`AND produtivo=1`
                }else{
                    queryFilter=`AND (produtivo=0 OR produtivo is null)`
                }
                const sql = `SELECT count(id) AS total 
                            FROM ${empresa}_dados.historico_atendimento 
                            WHERE campanha=${idCampanha} AND mailing=${idMailing} ${queryFilter}`
                const total_mailing= await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1079', err)
                })
                resolve(total_mailing[0].total)
            })
        })
    }  

    async idCampanhaByNome(empresa,nomeCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT id
                               FROM ${empresa}_dados.campanhas 
                              WHERE nome='${nomeCampanha}'
                               AND status=1`
                const rows =  await this.querySync(conn,sql) 
                if(rows.length==0){
                    resolve(false)
                    return
                }
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 59', err)
                })
                resolve(rows[0].id) 
            })
        })
    }

    //######################CONFIGURA????O DE CAMPANHA ATIVA################################
    
    //######################Operacoes b??sicas das campanhas (CRUD)######################
    //Criar Campanha
    async criarCampanha(empresa,tipo,nome,descricao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `INSERT INTO ${empresa}_dados.campanhas 
                                        (dataCriacao,tipo,nome,descricao,estado,status) 
                                VALUES (now(),'${tipo}','${nome}','${descricao}',0,1)`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 59', err)
                })
                resolve(rows) 
            })
        })
    }
    //Lista campanhas
    async listarCampanhas(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas 
                      WHERE status=1 
                      ORDER BY status ASC, id ASC`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 77', err)
                })
                resolve(rows) 
            })
        })
    }
    async listarCampanhasAtivas(empresa){
        const campanhasAtivas = await Redis.getter(`${empresa}:campanhasAtivas`)
        if(campanhasAtivas!==null){
            return campanhasAtivas
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas 
                            WHERE estado=1 
                              AND status=1 
                        ORDER BY status ASC, id ASC`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 138', err)
                })
                await Redis.setter(`${empresa}:campanhasAtivas`,rows)
                resolve(rows) 
            })
        })         
    }
    //Retorna Campanha
    async dadosCampanha(empresa,idCampanha){
        const dadosCampanha = await Redis.getter(`${empresa}:dadosCampanha:${idCampanha}`)
        if(dadosCampanha!==null){
            return dadosCampanha
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * FROM ${empresa}_dados.campanhas
                            WHERE id='${idCampanha}' AND status=1`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 154', err)
                })
                await Redis.setter(`${empresa}:dadosCampanha:${idCampanha}`,rows,360)
                resolve(rows) 
            })
        })          
    }
    //Atualiza campanha
    async atualizaCampanha(empresa,idCampanha,valores){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `UPDATE ${empresa}_dados.campanhas 
                                SET tipo='${valores.tipo}',
                                    nome='${valores.nome}',
                                    descricao='${valores.descricao}',
                                    estado=${valores.estado},
                                    status=${valores.status} 
                            WHERE id=${idCampanha}`
                await this.atualizaMembrosFilaCampanha(empresa,valores.estado,idCampanha)
                //Limpando cache das campanhas
                await Redis.delete(`${empresa}:campanhasAtivas`)   
                await Redis.delete(`${empresa}:campanhasAtivas_comInformacoes`)
                await Redis.delete(`${empresa}:mailingsCampanhasAtivas`)
                await Redis.delete(`${empresa}:dadosCampanha:${idCampanha}`)                
                await Redis.delete(`${empresa}:totalMailingsCampanha:${idCampanha}`)  
                await Redis.delete(`${empresa}:agendamentoCampanha`)
                await Redis.delete(`${empresa}:infoCampanha:${idCampanha}`)      
                
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 176', err)
                })
                resolve(rows) 
            })
        })       
    }
    //TABULACOES
    //######################Gest??o das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    async addListaTabulacaoCampanha(empresa,idCampanha,idListaTabulacao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //Removendo listas anteriores
                let sql = `DELETE FROM ${empresa}_dados.campanhas_listastabulacao
                                WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
        
                sql = `INSERT INTO ${empresa}_dados.campanhas_listastabulacao 
                                (idCampanha,idListaTabulacao,maxTime) 
                            VALUES (${idCampanha},${idListaTabulacao},15)`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 254', err)
                })
                resolve(true)
            })
        })         
    }
    //Exibe listas de tabulacao da campanhas
    async listasTabulacaoCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT cl.id as idListaNaCampanha, t.nome AS nomeListaTabulacao, idCampanha, idListaTabulacao, maxTime 
                               FROM ${empresa}_dados.campanhas_listastabulacao AS cl 
                          LEFT JOIN ${empresa}_dados.tabulacoes_listas AS t ON t.id=cl.idListaTabulacao
                              WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 271', err)
                })
                resolve(rows)
            })
        }) 
    }
    //Remove listas de tabulacao da campanha
    async removerListaTabulacaoCampanha(empresa,idListaNaCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `DELETE FROM ${empresa}_dados.campanhas_listastabulacao 
                                WHERE id=${idListaNaCampanha}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 294', err)
                })
            })
        })   
    }
    async setMaxTimeStatusTab(empresa,idCampanha,time){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `UPDATE ${empresa}_dados.campanhas_listastabulacao 
                                SET maxTime=${time} 
                            WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 309', err)
                })
            })
        })   
    }
    async getMaxTimeStatusTab(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT maxTime 
                            FROM ${empresa}_dados.campanhas_listastabulacao 
                            WHERE idCampanha=${idCampanha}`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 324', err)
                })
                resolve(rows)
            })
        })  
    }
    //INTEGRA????ES
    //######################Gest??o das integra????es######################
    //Cria Integra????o
    async criarIntegracao(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `INSERT INTO ${empresa}_dados.campanhas_integracoes_disponiveis 
                                        (url,descricao,modoAbertura)
                                VALUES ('${dados.url}','${dados.descricao}','${dados.modoAbertura}')`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 343', err)
                })
                resolve(rows)
            })
        })  
    }
    //Listar integracao
    async listarIntegracoes(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_integracoes_disponiveis`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 359', err)
                })
                resolve(rows)
            })
        })  
    }
    //Atualiza Integracao
    async atualizarIntegracao(empresa,idIntegracao,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `UPDATE ${empresa}_dados.campanhas_integracoes_disponiveis 
                            SET url='${dados.url}',
                                descricao='${dados.descricao}',
                                modoAbertura='${dados.modoAbertura}' 
                            WHERE id=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 378', err)
                })
                resolve(rows)
            })
        })  
    }
    //Dados integracao
    async dadosIntegracao(empresa,idIntegracao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_integracoes_disponiveis 
                            WHERE id=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 395', err)
                })
                resolve(rows)
            })
        })  
    }
    //Remove Integracao
    async removerIntegracao(empresa,idIntegracao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes_disponiveis WHERE id=${idIntegracao}`
                await this.querySync(conn,sql) 
                
                sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes WHERE idIntegracao=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 413', err)
                })
                resolve(rows)
            })
        }) 
    }
    //Selecionar integracao
    async inserirIntegracaoCampanha(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql = `SELECT id FROM ${empresa}_dados.campanhas_integracoes
                            WHERE idCampanha=${dados.idCampanha}`
                const r = await this.querySync(conn,sql) 
                if(r.length>=1){
                    pool.end((err)=>{ console.log(err)})
                    resolve(false)
                    return
                }
                sql = `INSERT INTO ${empresa}_dados.campanhas_integracoes (idCampanha,idIntegracao) 
                            VALUES (${dados.idCampanha},${dados.idIntegracao})`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 438', err)
                })
                resolve(rows)
            })
        })  
    }
    //Listar Integracoes de uma campanhas
    async listaIntegracaoCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT i.* 
                            FROM ${empresa}_dados.campanhas_integracoes AS c 
                            JOIN ${empresa}_dados.campanhas_integracoes_disponiveis AS i ON i.id=c.idIntegracao 
                            WHERE c.idCampanha=${idCampanha}`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 456', err)
                })
                resolve(rows)
            })
        })  
    }
    //remove integracao campannha
    async removerIntegracaoCampanha(empresa,idCampanha,idIntegracao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes 
                            WHERE idCampanha=${idCampanha}
                                AND idIntegracao=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 473', err)
                })
                resolve(rows)
            })
        })  
    }
    //DISCADOR
    //######################Configura????o do discador da campanha######################
    //Configurar discador da campanha
    async configDiscadorCampanha(empresa,idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,modo_atendimento,saudacao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const conf = await this.verConfigDiscadorCampanha(empresa,idCampanha)
                if(conf.length ===0){
                    const sql = `INSERT INTO  ${empresa}_dados.campanhas_discador 
                                            (idCampanha,tipo_discador,agressividade,ordem_discagem,tipo_discagem,modo_atendimento,saudacao) 
                                    VALUES (${idCampanha},'${tipoDiscador}',${agressividade},'${ordemDiscagem}','${tipoDiscagem}','${modo_atendimento}','${saudacao}')`
                    const rows = await this.querySync(conn,sql) 
                    pool.end((err)=>{
                        if(err) console.error('Campanhas.js 494', err)
                    })
                    resolve(rows)
                }else{
                    const sql = `UPDATE ${empresa}_dados.campanhas_discador 
                                    SET tipo_discador='${tipoDiscador}',
                                        agressividade=${agressividade},
                                        ordem_discagem='${ordemDiscagem}',
                                        tipo_discagem='${tipoDiscagem}',
                                        modo_atendimento='${modo_atendimento}',
                                        saudacao='${saudacao}'
                                WHERE idCampanha = ${idCampanha}`
                    const rows = await this.querySync(conn,sql)  
                    pool.end((err)=>{
                        if(err) console.error('Campanhas.js 508', err)
                    })
                    resolve(rows)    
                }               
            })
        })  
    }
    //Ver configuracoes do discador
    async verConfigDiscadorCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_discador 
                            WHERE idCampanha = ${idCampanha}`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 525', err)
                })
                resolve(rows)                           
            })
        })  
    }
     //FILAS
    //Listar filas da campanha
    async listarFilasCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT idFila, nomeFila, apelido
                            FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha='${idCampanha}'`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 544', err)
                })
                resolve(rows)   
                           
            })
        })   
    }    
    async dadosFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT id,apelido as nome, nome as nomeFila, descricao 
                            FROM ${empresa}_dados.filas 
                            WHERE id=${idFila}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1250', err)
                })
                resolve(rows)   
                        
            })
        })  
    } 
    //Incluir fila a campanhas
    async addFila(empresa,idCampanha,idFila,apelido,nomeFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql = `DELETE FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)  
                sql = `INSERT INTO ${empresa}_dados.campanhas_filas 
                                (idCampanha,idFila,nomeFila,apelido) 
                        VALUES (${idCampanha},${idFila},'${nomeFila}','${apelido}')`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 564', err)
                })
                resolve(rows)   
                           
            })
        })   
    }
    //Remove uma determinada fila da campanha
    async removerFilaCampanha(empresa,idCampanha,idFila){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `DELETE FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha} AND idFila='${idFila}'`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 581', err)
                })
                resolve(rows)                              
            })
        })   
    }  

    //MAILING
    //ADICIONA O MAILING A UMA CAMPANHA
    async addMailingCampanha(empresa,idCampanha,idMailing){
        connect.mongoose(empresa)
        const mailingCampanha = await MailingCampanha.find({idMailing:idMailing,idCampanha:idCampanha});
        if(mailingCampanha.length == 1) {
            return mailingCampanha
        }
        await Redis.delete(`${empresa}:mailingCampanha:${idCampanha}`)
        const dadosMailing = await MailingsTypeFields.find({idMailing:idMailing}).sort({ordem:1})
        const campos = []
        for(let i = 0; i < dadosMailing.length; i++){
            const campo={}
                  campo['nome']=dadosMailing[i].nome_original_campo
                  campo['apelido']=dadosMailing[i].apelido
                  campo['tipo']=dadosMailing[i].tipo
                  campo['habilitado']=1
            campos.push(campo)
        }

        //Insere Mailing na Campanha
        const infoMailingCampanha = {}
              infoMailingCampanha['id']=moment().format("YYYYMMDDHHmmss")
              infoMailingCampanha['idMailing'] = idMailing
              infoMailingCampanha['idCampanha'] = idCampanha
              infoMailingCampanha['retrabalho'] = false
              infoMailingCampanha['camposMailing'] = campos
        await MailingCampanha.create(infoMailingCampanha)

        return infoMailingCampanha
    }


    async addNumerosCampanha(empresa,idMailing,idCampanha){
        connect.mongoose(empresa)
        
        


        //modelNumeros
        delete mongoose.connection.models[`numerosmailing_${idMailing}`];
        const modelNumerosBase = mongoose.model(`numerosmailing_${idMailing}`,schemaNumerosMailing)
        const numeros = await modelNumerosBase.find({valido:true});
       

        //Criando collection campanha
        delete mongoose.connection.models[`numeroscampanha_${idCampanha}`];
        const modelnumerosCampanha = mongoose.model(`numeroscampanha_${idCampanha}`,schemaNumerosMailing)

        let insertNumber=[]
        for(let n=0;n<numeros.length;n++){
            const m = n%1000
            insertNumber.push(numeros[n])
            if(m==0){
                await modelnumerosCampanha.insertMany(insertNumber)
                insertNumber=[]
            }
        }
        //await Redis.setter(`${empresa}:numerosMailingCampanha:${idCampanha}`,numeros)

        //console.log('Contando Numeros')
        //const numerosAdd = await Redis.getter(`${empresa}:numerosMailingCampanha:${idCampanha}`)
        //console.log('Numeros Adicionados',numerosAdd.length)

        console.log(numeros.length);
        return true
    }

    async idMailingCampanha(empresa,idCampanha){
        connect.mongoose(empresa)

        const mailingCampanha = await MailingCampanha.find({idCampanha:idCampanha});
        console.log(mailingCampanha)
        return mailingCampanha[0].idMailing

    }


    //Lista os mailings adicionados em uma campanha
    async listarMailingCampanha(empresa,idCampanha){
        connect.mongoose(empresa)
        const mailingCampanha = await Redis.getter(`${empresa}:mailingCampanha:${idCampanha}`)       
        if(mailingCampanha!=null){
            return mailingCampanha
        }
        const infoMailingCampanha = await MailingCampanha.find({idCampanha:idCampanha})
        
        await Redis.setter(`${empresa}:mailingCampanha:${idCampanha}`,infoMailingCampanha)
        return infoMailingCampanha
    }

    //Remove o mailing de uma campanha
    async removeMailingCampanha(empresa,idCampanha){
        connect.mongoose(empresa)    
        const infoCampanha = await MailingCampanha.find({idCampanha:idCampanha})   
        const idMailing=infoCampanha[0].idMailing
        delete mongoose.connection.models[`numerosMailing_${idCampanha}`];
        const modelNumerosMailing = mongoose.model(`numerosMailing_${idMailing}`,schemaNumerosMailing)
        await modelNumerosMailing.updateMany({tratado:true},{tratado:false})


        //Remove Filtros
        //Remove Campos tela agente
        await Redis.delete(`${empresa}:mailingCampanha:${idCampanha}`)  
        await MailingCampanha.deleteOne({idCampanha:idCampanha})
        delete mongoose.connection.models[`retrabalhocampanha_${idCampanha}`];
        const modelRetrabalhoRegistros = mongoose.model(`retrabalhocampanha_${idCampanha}`,schemaNumerosMailing)
        await modelRetrabalhoRegistros.collection.drop()
        return true
    }

    //FILTROS DE DISCAGEM ##################################################################################
    //Aplica/remove um filtro de discagem
    async filtrarRegistrosCampanha(empresa,parametros){  
        connect.mongoose(empresa)
        const idCampanha = parametros['idCampanha']
        const filtro = parametros['tipo']
        const valor = parametros['valor']
        const regiao = parametros['regiao']

        //Verificando Filtros de Discagem
        const filtros = await FiltrosDiscagem.find({idCampanha:idCampanha,filtro:`${filtro}`,valor:`${valor}`,regiao:`${regiao}`})
        if(filtros.length==0){
            await FiltrosDiscagem.create({idCampanha:idCampanha,filtro:`${filtro}`,valor:`${valor}`,regiao:`${regiao}`})
        }else{
            const id = filtros[0]._id
            console.log('id',id)
            await FiltrosDiscagem.deleteOne({_id:id})
        }
        return true    
    }
     //Retorna todas as informa????es de um mailing que esta atribuido em uma campanha
     async infoMailingCampanha(empresa,idCampanha){
        connect.mongoose(empresa)
        const mailingCampanha = await MailingCampanha.find({idCampanha:idCampanha})
        const idMailing = mailingCampanha[0].idMailing
        const infoMailing = await Mailing.infoMailing(empresa,idMailing)
        return infoMailing
    }
     //Conta o total de numeros de uma tabela pelo UF, ou DDD
     async totalNumeros(empresa,idMailing,uf,ddd){
        connect.mongoose(empresa)
        if(ddd){
           const infoDDD = await dddsMailing.find({idMailing:idMailing,ddd:ddd})
           return infoDDD[0].totalNumerosDDD
        }
        if(uf!=0){
            const infoUF = await dddsMailing.find({idMailing:idMailing,uf:`${uf.toUpperCase()}`})  
            return infoUF[0].totalNumerosUF
        }
        return 0
    }
     //Conta o total de registros filtrados de uma tabela pelo us
     async numerosFiltrados(empresa,idCampanha,totalNumeros){
        connect.mongoose(empresa)
        const filtros = await FiltrosDiscagem.find({idCampanha:idCampanha})
        if(filtros.length==0){
            return totalNumeros
        }else{
            return 0
        }
        
    }
    //Retorna os DDDS de uma tabela de numeros
    async dddsMailings(empresa,idMailing,uf){
        connect.mongoose(empresa)
        return await dddsMailing.distinct("ddd",{idMailing:idMailing,uf:`${uf.toUpperCase()}`})
    }
    //Checa se existe algum filtro de DDD aplicado
    async checkTypeFilter(empresa,idCampanha,totalNumeros,filtro,valor,uf){  
        connect.mongoose(empresa)
        const filtros = await FiltrosDiscagem.find({idCampanha:idCampanha,filtro:`${filtro}`,valor:`${valor}`,regiao:`${uf}`})
        if(filtros.length==0){
            return totalNumeros
        }else{
            const mailingCampanha = await MailingCampanha.find({idCampanha:idCampanha})
            const idMailing = mailingCampanha[0].idMailing

            delete mongoose.connection.models[`numerosmailing_${idMailing}`];
            const NumerosMailing = mongoose.model(`numerosmailing_${idMailing}`,schemaNumerosMailing)
            const buscarfiltros={}
                  buscarfiltros[`${filtro}`]=`${valor}`
            if(uf){
                  buscarfiltros['uf']=`${uf.toUpperCase()}`
            }
            console.log('Filtros',buscarfiltros)
            const numeros = await NumerosMailing.find(buscarfiltros).count()
            return numeros           

        }
    }

    async totalNumeros_porTipo(empresa,idMailing,uf,tipo){
        connect.mongoose(empresa)
        delete mongoose.connection.models[`numerosmailing_${idMailing}`];
        const modelNumerosMailing = mongoose.model(`numerosmailing_${idMailing}`,schemaNumerosMailing)
        const numeros = await modelNumerosMailing.find({uf:`${uf.toUpperCase()}`,tipo:`${tipo}`}).count()
        console.log('numeros',numeros)
        return numeros
    }
    //CONFIGURAR TELA DO AGENTE    
     //Lista todos os campos que foram configurados do mailing
     async camposConfiguradosDisponiveis(empresa,idCampanha){
        connect.mongoose(empresa)
        const dadosCampanha = await MailingCampanha.find({idCampanha:idCampanha})
        return dadosCampanha[0].camposMailing
    }

    async atualizaCamposTelaAgente(empresa,idCampanha,camposConf){
        connect.mongoose(empresa)
        await MailingCampanha.updateOne({idCampanha:idCampanha},{camposMailing:camposConf})
    }
    /*
    //Verifica se o campo esta selecionado
    async campoSelecionadoTelaAgente(empresa,campo,tabela,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_dados.campanhas_campos_tela_agente 
                            WHERE idCampo=${campo} AND idCampanha=${idCampanha} AND tabela='${tabela}'
                            ORDER BY ordem ASC`
                const total = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) throw err
                })    
                if(total[0].total===0){
                    resolve(false)
                    return
                }
                resolve(true)
            })
        })
    }
     //Adiciona campo na tela do agente
     async addCampoTelaAgente(empresa,idCampanha,tabela,idCampo){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `INSERT INTO ${empresa}_dados.campanhas_campos_tela_agente 
                                        (idCampanha,tabela,idCampo,ordem) 
                                VALUES (${idCampanha},'${tabela}',${idCampo},0)`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1048', err)
                })
                resolve(rows)
            })
        })
    }*/
    async camposTelaAgente(empresa,idCampanha,tabela){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT t.id AS idJoin, m.id, m.campo, m.apelido, m.tipo 
                            FROM ${empresa}_dados.campanhas_campos_tela_agente AS t 
                            JOIN ${empresa}_dados.mailing_tipo_campo AS m ON m.id=t.idCampo
                            WHERE t.idCampanha=${idCampanha} AND t.tabela='${tabela}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1064', err)
                })
                resolve(rows)
            })
        })
    }
    //Remove campo da campanha
    async delCampoTelaAgente(empresa,idCampanha,idCampo){
        console.log('idCampanha',idCampanha,'idCampo',idCampo)
        return true
    }
    //AGENDAMENTO DE CAMPANHAS
    //Agenda campanha
    async agendarCampanha(empresa,idCampanha,dI,dT,hI,hT){ 
        await Redis.delete(`${empresa}:dataCampanha:${idCampanha}`)
        await Redis.delete(`${empresa}:horarioCampanha:${idCampanha}`)

        const hoje = moment().format("Y-MM-DD")
        let dataInicio = dI
        let dataFinal = dT

        let setData_I = `inicio='${dataInicio}',`
        let setData_F = `termino='${dataFinal}',`
        let setHora_I = `hora_inicio='${hI}',`
        let setHora_F = `hora_termino='${hT}',`
        if((dI=="0000-00-00")||(dI=="")){setData_I="";dataInicio=hoje}
        if((dT=="0000-00-00")||(dT=="")){setData_F="";dataFinal=hoje}
        if((hI=="00:00:00")||(hI=="")){setHora_I="";}
        if((hT=="00:00:00")||(hT=="")){setHora_F="";}        
       
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //verifica se a campanha ja possui agendamento
                const r = await this.verAgendaCampanha(empresa,idCampanha)
                if(r.length ===0){
                    const sql = `INSERT INTO ${empresa}_dados.campanhas_horarios 
                                            (id_campanha,inicio,termino,hora_inicio,hora_termino) 
                                    VALUES (${idCampanha},'${dataInicio}','${dataFinal}','${hI}','${hT}')`
                    const rows = await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.error('Campanhas.js 1167', err)
                    })
                    resolve(rows)
                }else{
                    const sql = `UPDATE ${empresa}_dados.campanhas_horarios 
                                    SET ${setData_I}${setData_F}${setHora_I}${setHora_F}id_campanha='${idCampanha}'
                                WHERE id_campanha='${idCampanha}'`
                               //console.log('sql',sql)
                    const rows = await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.error('Campanhas.js 1176', err)
                    })
                    resolve(rows)
                }
            })
        })
    }
    //Ver Agendamento da campanha
    async verAgendaCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT id,id_campanha,
                                    DATE_FORMAT(inicio, '%Y-%m-%d') as inicio,
                                    DATE_FORMAT(termino, '%Y-%m-%d') as termino,
                                    hora_inicio,hora_termino
                            FROM ${empresa}_dados.campanhas_horarios 
                            WHERE id_campanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1196', err)
                })
                resolve(rows)
            })
        })
    }
    //#########  F I L A S  ############
    async novaFila(empresa,idEmpresa,apelido,descricao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                let sql = `SELECT id 
                            FROM ${empresa}_dados.filas 
                            WHERE apelido='${apelido}'`
                const r = await this.querySync(conn,sql)
                if(r.length>=1){
                    resolve(0)
                    return false
                }
                sql = `INSERT INTO ${empresa}_dados.filas 
                                  (apelido,descricao) 
                            VALUES('${apelido}','${descricao}')`
                const f = await this.querySync(conn,sql)
                const idFila = f['insertId']
                const nomeFila = `${idEmpresa}00${idFila}`
                sql = `UPDATE ${empresa}_dados.filas 
                          SET nome='${nomeFila}'
                        WHERE id='${idFila}'`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1218', err)
                })
                resolve(nomeFila)
            })
        })
    }

    async listarFilas(empresa){
        return new Promise (async (resolve,reject)=>{
           const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});

                const sql = `SELECT id,apelido as nome, descricao  FROM ${empresa}_dados.filas ORDER BY id DESC`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1233', err)
                })
                resolve(rows)   
                        
            })
        })  
    } 

    

    async nomeFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT nome 
                            FROM ${empresa}_dados.filas 
                            WHERE id=${idFila}`
                const n = await this.querySync(conn,sql)

                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1267', err)
                })
                if(n.length==0){
                    resolve("")
                    return    
                }

                resolve(n[0].nome)   
                        
            })
        })  
    } 

    async editarFila(empresa,idFila,dados){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `UPDATE ${empresa}_dados.filas 
                                SET apelido='${dados.name}',
                                    descricao='${dados.description}' 
                                WHERE id='${idFila}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1285', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

    async removerFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `DELETE FROM ${empresa}_dados.filas 
                            WHERE id='${idFila}'`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1301', err)
                })
                resolve(true)   
                        
            })
        })  
    }
    
    async totalRegistrosCampanha(empresa,idCampanha){
        const totalRegistrosCampanha = await Redis.getter(`${empresa}:totalRegistrosCampanha:${idCampanha}`)
        if(totalRegistrosCampanha!==null){
            return totalRegistrosCampanha
        }
        connect.mongoose(empresa)
        const mailingCampanha = await MailingCampanha.find({idCampanha:idCampanha})
        const idMailing = mailingCampanha[0].idMailing
        const infoMailing = await Mailings.find({id:idMailing}) 
        const total = infoMailing['totalNumeros']
        await Redis.setter(`${empresa}:totalRegistrosCampanha:${idCampanha}`,total)
    }   
    //Lista Mailings das campanhas ativas
    async listarMailingCampanhasAtivas(empresa){
        const mailingsCampanhasAtivas = await Redis.getter(`${empresa}:mailingsCampanhasAtivas`)
        if(mailingsCampanhasAtivas!==null){
            return mailingsCampanhasAtivas
        }
        connect.mongoose(empresa)
        






        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT m.id, m.nome, m.totalNumeros, m.numerosInvalidos
                            FROM ${empresa}_dados.mailings AS m 
                            JOIN ${empresa}_dados.campanhas_mailing AS cm ON m.id=cm.idMailing
                            JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS c ON c.id=cm.idCampanha
                        ORDER BY m.id DESC
                            LIMIT 10;`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 650', err)
                })
                await Redis.setter(`${empresa}:mailingsCampanhasAtivas`,rows)
                resolve(rows)
            })
        })       
    }
    async dataUltimoRegMailingNaCampanha(empresa,idCampanha,idMailing){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT  DATE_FORMAT(data,'%d/%m/%Y') AS ultimaData
                            FROM ${empresa}_dados.historico_atendimento 
                            WHERE campanha=${idCampanha} AND mailing=${idMailing} ORDER BY data DESC`
                const d= await this.querySync(conn,sql)
                if(d.length==0){
                    return ""
                }
                
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1079', err)
                })
                resolve(d[0].ultimaData)
            })
        })
    }   
    async membrosCampanhas(empresa,idCampanha){
        const sql = `SELECT a.ramal 
                       FROM ${empresa}_dados.agentes_filas a
                       JOIN ${empresa}_dados.campanhas_filas AS c 
                       ON c.idFila=a.fila
                    WHERE c.idCampanha=${idCampanha}`
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //Fila da campanha 
                const agentes=await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 165', err)
                })
                resolve(agentes);
            })
        })
    }

    async checklistaTabulacaoCampanha(empresa,idCampanha){
        const lista = await this.listasTabulacaoCampanha(empresa,idCampanha)
        if(lista.length==0){
            return false
        }
        return lista[0].idListaTabulacao
    }
    















/*------------------------------------------------------------------------------------------------------------------------------------------------------*/
 //Status dos agentes das campanhas
 async agentesFalando(empresa){
    const agentesFalando = await Redis.getter(`${empresa}:agentesFalando`)
    if(agentesFalando!==null){
        return agentesFalando
    }

    return new Promise (async (resolve,reject)=>{
        const pool = await connect.pool(empresa,'dados')
         pool.getConnection(async (err,conn)=>{ 
             if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
            //Estado 2 = Em Pausa
            const sql = `SELECT DISTINCT a.ramal AS agentes 
                        FROM ${empresa}_dados.agentes_filas AS a 
                        JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                        JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                        WHERE c.estado=1 AND c.status=1 AND a.estado=3`
            const rows = await this.querySync(conn,sql)
            pool.end((err)=>{
                if(err) console.error('Campanhas.js 1508', err)
            })
            await Redis.setter(`${empresa}:agentesFalando`,rows)
            resolve(rows)   
                    
        })
    })  
} 
async agentesEmPausa(empresa){
    const agentesEmPausa = await Redis.getter(`${empresa}:agentesEmPausa`)
    if(agentesEmPausa!==null){
        return agentesEmPausa
    }

    return new Promise (async (resolve,reject)=>{
        const pool = await connect.pool(empresa,'dados')
         pool.getConnection(async (err,conn)=>{ 
             if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
            //Estado 2 = Em Pausa
            const sql = `SELECT DISTINCT a.ramal AS agentes 
                          FROM ${empresa}_dados.agentes_filas AS a 
                          JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                          JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                        WHERE c.estado=1 AND c.status=1 AND a.estado=2`
            const rows = await this.querySync(conn,sql)
            pool.end((err)=>{
                if(err) console.error('Campanhas.js 1508', err)
            })
            await Redis.setter(`${empresa}:agentesEmPausa`,rows)
            resolve(rows)                           
        })
    })  
}

async agentesDisponiveis(empresa){
    const agentesDisponiveis = await Redis.getter(`${empresa}:agentesDisponiveis`)
    if(agentesDisponiveis==null){
        return agentesDisponiveis
    }
    return new Promise (async (resolve,reject)=>{
        const pool = await connect.pool(empresa,'dados')
         pool.getConnection(async (err,conn)=>{ 
             if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
            //Estado 1 = Dispon??vel
            //Estado 0 = Deslogado
            const sql = `SELECT DISTINCT a.ramal AS agentes 
                        FROM ${empresa}_dados.agentes_filas AS a 
                        JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                        JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                        WHERE c.estado=1 AND c.status=1 AND a.estado=1`
                        
            const rows = await this.querySync(conn,sql)
            pool.end((err)=>{
                if(err) console.error('Campanhas.js 1530', err)
            })
            await Redis.setter(`${empresa}:agentesDisponiveis`,rows)
            resolve(rows)                           
        })
    })  
}

//Total de campanhas ativas
async totalCampanhasAtivas(empresa){
    return new Promise (async (resolve,reject)=>{
        const pool = await connect.pool(empresa,'dados')
         pool.getConnection(async (err,conn)=>{ 
             if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
            const sql = `SELECT COUNT(id) as total 
                        FROM ${empresa}_dados.campanhas
                        WHERE status=1 AND estado=1`
            const rows = await this.querySync(conn,sql)
            pool.end((err)=>{
                if(err) console.error('Campanhas.js 1350', err)
            })
            resolve(rows)  
        })
    })  
}
    
    
   

    async infoCampanha(empresa,idCampanha){
        const infoCampanha = await Redis.getter(`${empresa}:infoCampanha:${idCampanha}`)
        if(infoCampanha!==null){
            return infoCampanha
        }
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT c.nome, s.estado,
                                    DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,
                                    DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio,
                                    DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,
                                    DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino
                            FROM ${empresa}_dados.campanhas AS c 
                            JOIN ${empresa}_dados.campanhas_horarios AS h ON c.id=h.id_campanha
                            JOIN ${empresa}_dados.campanhas_status AS s ON s.idCampanha=c.id
                            WHERE c.id=${idCampanha}`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 99', err)
                })
                await Redis.setter(`${empresa}:infoCampanha:${idCampanha}`,rows)
                resolve(rows) 
            })
        })
   }

    async nomeCampanhas(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas 
                            WHERE id=${idCampanha}`
                const c = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 115', err)
                })
                if(c.length==0){
                    resolve("")
                    return
                }
                if(!c[0].nome) {
                    resolve("/")
                    return 
                }
                resolve(c[0].nome)          
                
            })
        })
    }

    

    

    

    

    //Atualiza os status dos agentes da campanha de acordo com o status da mesma
    async atualizaMembrosFilaCampanha(empresa,estado,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                //Fila da campanha 
                let sql = `SELECT idFila, nomeFila 
                            FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha}`
                const fila = await this.querySync(conn,sql) 
                if(fila.length==0){
                    pool.end((err)=>{
                        if(err) console.error('Campanhas.js 165', err)
                    })
                    resolve(false);
                    return
                }
                const idFila=fila[0].idFila
                const nomeFila=fila[0].nomeFila

                const poolAsterisk = await connect.pool(empresa,'asterisk')
                poolAsterisk.getConnection(async (err,connAst)=>{
                    if(estado==1){
                        //Retira pausa do asterisk dos agentes disponiveis no sistema
                        sql = `SELECT ramal 
                                FROM ${empresa}_dados.agentes_filas
                                WHERE fila=${idFila}
                                AND estado=1`
                        const agentes=await this.querySync(conn,sql)
                   
                        for(let i=0; i<agentes.length; i++){
                            const agente = agentes[i].ramal
                            sql = `UPDATE asterisk.queue_members 
                                    SET paused=0 
                                    WHERE membername='${agente}'`
                            await this.querySync(connAst,sql)  
                            await Redis.delete(`${empresa}:campanhasAtivasAgente:${agente}`)
                        }
                    }else{
                        //Pausa os agentes no asterisk
                        sql = `UPDATE asterisk.queue_members 
                                SET paused=1 
                                    WHERE queue_name='${nomeFila}'`
                        await this.querySync(connAst,sql)
                    }
                    poolAsterisk.end((err)=>{
                        if(err) console.error('Campanhas.js 225', err)
                    })
                    resolve(true)
                })
            })
        })
    } 

    

    

     

    //Campos adicionados na tela do agente
    /*async camposAdicionadosNaTelaAgente(idCampanha,tabela){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}'`
        return await this.querySync(conn,sql)
    }*/

    //BLACKLIST

    //#########  B A S E S  ############

    ////////////////////OLD

    //total de campanhas que rodaram por dia
    async campanhasByDay(empresa,limit){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia 
                            FROM ${empresa}_dados.historico_atendimento 
                            GROUP BY data 
                            ORDER BY data DESC 
                            LIMIT ${limit}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1332', err)
                })
                resolve(rows)   
                        
            })
        })  
    }
    
    
    async campanhasAtivas(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo 
                            FROM ${empresa}_dados.campanhas AS c 
                        LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha
                            WHERE c.status=1 AND c.estado=1 AND s.estado=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1368', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

    //Total de campanhas em pausa
    async campanhasPausadas(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo
                            FROM ${empresa}_dados.campanhas AS c 
                        LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha 
                            WHERE c.status=1 AND c.estado=2 OR c.estado=1 AND s.estado=2`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1387', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

    //Total de campanhas paradas
    async campanhasParadas(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo 
                            FROM ${empresa}_dados.campanhas AS c 
                        LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha 
                            WHERE c.status=1 AND c.estado=3 OR c.estado=1 AND s.estado=3`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1406', err)
                })
                resolve(rows)   
                        
            })
        })  
    }
        

    

   
    
    //######################Operacoes de agendamento das campanhas######################
    

    

    //######################Gest??o das integra????es das campanhas######################

    //######################Setup do discador das campanhas######################
    

    //######################Configura????o das filas das campanhas######################
   /* membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }


    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a 
                       JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
        connect.banco.query(sql,callback)
    }*/
    

   /* atualizaEstadoAgente(ramal,estado,idPausa,callback){
        const sql = `UPDATE agentes_filas SET estado=${estado}, idpausa=${idPausa} WHERE ramal=${ramal}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `UPDATE user_ramal SET estado=${estado} WHERE ramal=${ramal}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                if(estado==2){
                    const sql = `UPDATE queue_members SET paused=1 WHERE membername=${ramal}`
                    connect.asterisk.query(sql,callback)
                }else{
                    const sql = `UPDATE queue_members SET paused=0 WHERE membername=${ramal}`
                    connect.asterisk.query(sql,callback)
                }
            })
        })
    }*/

/*
    chamadasTravadas(callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE tratado is null`
        connect.banco.query(sql,callback)
    }

    //Atualiza um registro como disponivel na tabulacao mailing
    liberaRegisto(idCampanha,idMailing,idRegistro,callback){ 
     const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Dispon??vel' 
                   WHERE idCampanha=${idCampanha},idMailing=${idMailing},idRegistro=${idRegistro}`
     connect.mailings.query(sql,callback)
    }

    removeChamadaSimultanea(idChamadaSimultanea,callback){
        const sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamadaSimultanea}`
        connect.banco.query(sql,callback)
    }
*/
    //######################Gest??o do Mailing das Campanhas ######################
    

    async campanhaDoMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT m.idCampanha,c.nome 
                            FROM ${empresa}_dados.campanhas_mailing AS m 
                            JOIN ${empresa}_dados.campanhas AS c ON m.idCampanha=c.id
                            WHERE idMailing=${idMailing} AND c.status=1
                            LIMIT 1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1570', err)
                })
                resolve(rows)   
                        
            })
        })  
    }
/*
    mailingConfigurado(empresa,idMailing,callback){
        const sql = `SELECT tabela_dados 
                       FROM ${empresa}_dados.mailings 
                       WHERE id=${idMailing} AND configurado=1`
        connect.banco.query(sql,callback)
    }
*/
    

     //Status dos Mailings das campanhas ativas
    /*mailingsNaoTrabalhados(callback){
        const sql = `SELECT count(t.id) AS nao_trabalhados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado is null AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }*/
    async totalMailings(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT SUM(totalReg) AS total 
                            FROM ${empresa}_dados.mailings as m 
                            JOIN ${empresa}_dados.campanhas_mailing AS cm ON cm.idMailing=m.id 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=cm.idCampanha 
                            WHERE c.estado=1 AND c.status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1603', err)
                })
                resolve(rows)   
                        
            })
        })
    }

   

    async mailingsContatados(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT count(t.id) AS contatados 
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=t.idCampanha 
                            WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1640', err)
                })
                resolve(rows)   
                        
            })
        })
    }

    async mailingsNaoContatados(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                 if(err) return console.error({"errorCode":err.code,"message":err.message,"stack":err.stack});
                const sql = `SELECT count(t.id) AS nao_contatados 
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                            JOIN ${empresa}_dados.campanhas AS c 
                                ON c.id=t.idCampanha 
                            WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.error('Campanhas.js 1659', err)
                })
                resolve(rows)
            })
        })
    }

    //Status dos Mailings por campanha
    /*camposConfiguradosDisponiveis(tabela,idCampanha,callback){
        const sql = `SELECT m.id, m.campo, m.apelido, m.tipo ,t.idCampanha FROM mailing_tipo_campo AS m LEFT JOIN campanhas_campos_tela_agente AS t ON m.id = t.idCampo WHERE m.tabela='${tabela}' AND (t.idCampanha=${idCampanha} OR t.idCampanha != ${idCampanha} OR t.idCampanha is null) AND m.conferido=1`
        connect.banco.query(sql,callback)
    }
    
     //INFORMACOES DO STATUS DA CAMPANHA EM TEMPO REAL
     //Atualizacao de status das campanhas pelo discador
     atualizaStatus(idCampanha,msg,estado,callback){
        //verificando se a campanha ja possui status
        this.statusCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            //console.log(`Campanha: ${idCampanha} msg: ${msg}`)
            if(r.length!=0){
                //Caso sim atualiza o mesmo
                const sql = `UPDATE campanhas_status SET data=now(), mensagem='${msg}', estado=${estado} WHERE idCampanha=${idCampanha}`
                connect.banco.query(sql,callback)
            }else{
                //Caso nao, insere o status
                const sql = `INSERT INTO campanhas_status (idCampanha,data,mensagem,estado) VALUES (${idCampanha},now(),'${msg}',${estado})`               
                connect.banco.query(sql,callback)
            }
        })        
    }


    //Campos Nao Selecionados
    camposNaoSelecionados(idCampanha,tabela,callback){
        const sql = `SELECT DISTINCT m.id AS campo FROM mailing_tipo_campo AS m LEFT OUTER JOIN campanhas_campos_tela_agente AS s ON m.id=s.idCampo WHERE m.tabela='${tabela}' AND conferido=1 AND m.id NOT IN (SELECT idCampo FROM campanhas_campos_tela_agente WHERE tabela='${tabela}' AND idCampanha=${idCampanha})`
        connect.banco.query(sql,callback) 
    }

    campoSelecionado(campo,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE tabela='${tabela}' AND idCampo='${campo}';`
        connect.banco.query(sql,callback)
    }    

    //Campos Selecionados na tela do agente
    camposSelecionados(idCampanha,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}' ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }

    //Reordena campos disponiveis do mailing                         
    reordenaCamposMailing(idCampo,tabela,posOrigen,posDestino,callback){
        //Caso ele tenha descido
        if(posOrigen<posDestino){
            //diminui a ordem de todos que sao menores ou iguais ao destino
            const sql = `UPDATE mailings_tipo_campo campo SET ordem=ordem-1 WHERE tabela='${tabela}' AND ordem<=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE mailings_tipo_campo SET ordem=${posDestino} WHERE id=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }else{//Caso ele tenha subido
            //aumenta a ordem de todos que sao maiores ou iguais ao destino
            const sql = `UPDATE mailings_tipo_campo SET ordem=ordem+1 WHERE tabela='${tabela}' AND ordem>=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE mailings_tipo_campo SET ordem=${posDestino} WHERE id=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }
    }

    //Reordena campos selecionados da tela do agente
    reordenaCampoTelaAgente(idCampanha,tabela,idCampo,posOrigen,posDestino,callback){
        //Caso ele tenha descido
        if(posOrigen<posDestino){
            //diminui a ordem de todos que sao menores ou iguais ao destino
            const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem-1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem<=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE campanhas_campos_tela_agente SET ordem=${posDestino} WHERE idCampo=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }else{//Caso ele tenha subido
            //aumenta a ordem de todos que sao maiores ou iguais ao destino
            const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem+1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem>=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE campanhas_campos_tela_agente SET ordem=${posDestino} WHERE idCampo=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }
    }


    //Adicionando campo na tela do agente
    addCampoTelaAgente(idCampanha,tabela,idCampo,ordem,callback){
        const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem+1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem>=${ordem}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,tabela,idCampo,ordem) VALUES (${idCampanha},'${tabela}',${idCampo},${ordem})`
            connect.banco.query(sql,callback)
        })
    }

    //Removendo campo selecionado da tela do agente
    removeCampoTelaAgente(idCampanha,tabela,idCampo,callback){
        const sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND idCampo=${idCampo}`
        connect.banco.query(sql,callback)
    }
    */


    
    
/*********************************
    
    //######################Fun????es para funcionamento do discador######################
    campanhasAtivasHabilitadas(callback){
        //Estados de Campanhas
        //0 - Inativa
        //1 - Ativa
        //2 - Pausadas
        //3 - Parada

        const sql = `SELECT * FROM campanhas WHERE tipo = 'a' AND status = 1 AND estado = 1`
        connect.banco.query(sql,callback)
    }

    //Verifica se uma determinada campanha tem mailing adicionado e configurado
    mailingProntoParaDiscagem(idCampanha,callback){
        const sql = `SELECT m.id FROM campanhas_mailing AS cm 
                      JOIN mailings AS m ON m.id=cm.idMailing 
                      WHERE cm.idCampanha=${idCampanha} AND m.configurado=1`
        connect.banco.query(sql,callback)
    }

    //Verifica se a campanha possui Agendamento
    agendamentoCampanha(idCampanha,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha='${idCampanha}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    dataCampanha(idCampanha,hoje,callback){
        const sql = `SELECT id FROM campanhas_horarios 
                      WHERE id_campanha = '${idCampanha}' AND inicio <= '${hoje}' AND termino >='${hoje}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se agora esta dentro do hor??rio de agendamento de uma campanha
    horarioCampanha(idCampanha,hora,callback){
        const sql = `SELECT id 
                       FROM campanhas_horarios 
                       WHERE id_campanha = '${idCampanha}' AND hora_inicio <= '${hora}' AND hora_termino >='${hora}'`;
        connect.banco.query(sql,callback)
    }*/

   
}
export default new Campanhas();