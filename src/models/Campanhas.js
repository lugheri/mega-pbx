import connect from '../Config/dbConnection';
import Mailing from './Mailing';
import Clients from './Clients';

class Campanhas{   
    /*
    async querySync(conn,sql){
        const hostEmp = await Clients.serversDbs(empresa)
        const connection = connect.poolConta(hostEmp)
        const promisePool =  connection.promise();
        const result = await promisePool.query(sql)
        promisePool.end();
        return result[0];       
    }*/
    /*
    async querySync(conn,sql){
        return new Promise(async(resolve,reject)=>{
            const hostEmp = await Clients.serversDbs(empresa)
            const conn = connect.poolConta(hostEmp)
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
            conn.end()                        
        })
    }
   
    
    async querySync_astdb(sql){
        const connection = connect.poolAsterisk
        const promisePool =  connection.promise();
        const result = await promisePool.query(sql)
        //promisePool.end();
        return result[0];
    }*/

    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
    } 
    
    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    
    //######################Operacoes básicas das campanhas (CRUD)######################
    //Criar Campanha
    async criarCampanha(empresa,tipo,nome,descricao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `INSERT INTO ${empresa}_dados.campanhas 
                                        (dataCriacao,tipo,nome,descricao,estado,status) 
                                VALUES (now(),'${tipo}','${nome}','${descricao}',0,1)`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 59', err)
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
                const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas 
                      WHERE status=1 
                      ORDER BY status ASC, id ASC`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 77', err)
                })
                resolve(rows) 
            })
        })
    }

    async infoCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
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
                    if(err) console.log('Campanhas.js 99', err)
                })
                resolve(rows) 
            })
        })
   }

    async nomeCampanhas(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas 
                            WHERE id=${idCampanha}`
                const c = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 115', err)
                })
                if(c.length==0){
                    resolve("")
                }
                resolve(c[0].nome)          
                
            })
        })
    }


    async listarCampanhasAtivas(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas 
                            WHERE estado=1 
                                AND status=1 
                        ORDER BY status ASC, id ASC`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 138', err)
                })
                resolve(rows) 
            })
        })         
    }

    //Retorna Campanha
    async dadosCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT * FROM ${empresa}_dados.campanhas
                            WHERE id='${idCampanha}' AND status=1`
                            const rows =  await this.querySync(conn,sql) 
                            pool.end((err)=>{
                                if(err) console.log('Campanhas.js 154', err)
                            })
                            resolve(rows) 
                        })
                    })          
    }

    //Atualiza campanha
    async atualizaCampanha(empresa,idCampanha,valores){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `UPDATE ${empresa}_dados.campanhas 
                                SET tipo='${valores.tipo}',
                                    nome='${valores.nome}',
                                    descricao='${valores.descricao}',
                                    estado=${valores.estado},
                                    status=${valores.status} 
                            WHERE id=${idCampanha}`
                await this.atualizaMembrosFilaCampanha(empresa,valores.estado,idCampanha)              
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 176', err)
                })
                resolve(rows) 
            })
        })       
    }

    //Atualiza os status dos agentes da campanha de acordo com o status da mesma
    async atualizaMembrosFilaCampanha(empresa,estado,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                //Fila da campanha 
                let sql = `SELECT idFila, nomeFila 
                            FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha}`
                const fila = await this.querySync(conn,sql) 
                if(fila.length==0){
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
                        }
                    }else{
                        //Pausa os agentes no asterisk
                        sql = `UPDATE asterisk.queue_members 
                                SET paused=1 
                                    WHERE queue_name='${nomeFila}'`
                        await this.querySync(connAst,sql)
                    }
                    poolAsterisk.end((err)=>{
                        if(err) console.log('Campanhas.js 225', err)
                    })
                    resolve(true)
                })
            })
        })
    } 

    //Remove Campanha
    //A campanha é removida quando seu status é setado para zero


    //TABULACOES
    //######################Gestão das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    async addListaTabulacaoCampanha(empresa,idCampanha,idListaTabulacao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                //Removendo listas anteriores
                let sql = `DELETE FROM ${empresa}_dados.campanhas_listastabulacao
                                WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
        
                sql = `INSERT INTO ${empresa}_dados.campanhas_listastabulacao 
                                (idCampanha,idListaTabulacao,maxTime) 
                            VALUES (${idCampanha},${idListaTabulacao},15)`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 254', err)
                })
            })
        })         
    }

    //Exibe listas de tabulacao da campanhas
    async listasTabulacaoCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT cl.id as idListaNaCampanha, t.nome AS nomeListaTabulacao, idCampanha, idListaTabulacao, maxTime 
                            FROM ${empresa}_dados.campanhas_listastabulacao AS cl 
                        LEFT JOIN ${empresa}_dados.tabulacoes_listas AS t ON t.id=cl.idListaTabulacao
                            WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 271', err)
                })
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

    //Remove listas de tabulacao da campanha
    async removerListaTabulacaoCampanha(empresa,idListaNaCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `DELETE FROM ${empresa}_dados.campanhas_listastabulacao 
                                WHERE id=${idListaNaCampanha}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 294', err)
                })
            })
        })   
    }

    async setMaxTimeStatusTab(empresa,idCampanha,time){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `UPDATE ${empresa}_dados.campanhas_listastabulacao 
                                SET maxTime=${time} 
                            WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 309', err)
                })
            })
        })   
    }

    async getMaxTimeStatusTab(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT maxTime 
                            FROM ${empresa}_dados.campanhas_listastabulacao 
                            WHERE idCampanha=${idCampanha}`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 324', err)
                })
                resolve(rows)
            })
        })  
    }

    //INTEGRAÇÕES
    //######################Gestão das integrações######################
    //Cria Integração
    async criarIntegracao(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `INSERT INTO ${empresa}_dados.campanhas_integracoes_disponiveis 
                                        (url,descricao,modoAbertura)
                                VALUES ('${dados.url}','${dados.descricao}','${dados.modoAbertura}')`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 343', err)
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
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_integracoes_disponiveis`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 359', err)
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
                const sql = `UPDATE ${empresa}_dados.campanhas_integracoes_disponiveis 
                            SET url='${dados.url}',
                                descricao='${dados.descricao}',
                                modoAbertura='${dados.modoAbertura}' 
                            WHERE id=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 378', err)
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
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_integracoes_disponiveis 
                            WHERE id=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 395', err)
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
                let sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes_disponiveis WHERE id=${idIntegracao}`
                await this.querySync(conn,sql) 
                
                sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes WHERE idIntegracao=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 413', err)
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
                    if(err) console.log('Campanhas.js 438', err)
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
                const sql = `SELECT i.* 
                            FROM ${empresa}_dados.campanhas_integracoes AS c 
                            JOIN ${empresa}_dados.campanhas_integracoes_disponiveis AS i ON i.id=c.idIntegracao 
                            WHERE c.idCampanha=${idCampanha}`
                const rows =  await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 456', err)
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
                const sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes 
                            WHERE idCampanha=${idCampanha}
                                AND idIntegracao=${idIntegracao}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 473', err)
                })
                resolve(rows)
            })
        })  
    }

    //DISCADOR
    //######################Configuração do discador da campanha######################
    //Configurar discador da campanha
    async configDiscadorCampanha(empresa,idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,modo_atendimento,saudacao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const conf = await this.verConfigDiscadorCampanha(empresa,idCampanha)
                if(conf.length ===0){
                    const sql = `INSERT INTO  ${empresa}_dados.campanhas_discador 
                                            (idCampanha,tipo_discador,agressividade,ordem_discagem,tipo_discagem,modo_atendimento,saudacao) 
                                    VALUES (${idCampanha},'${tipoDiscador}',${agressividade},'${ordemDiscagem}','${tipoDiscagem}','${modo_atendimento}','${saudacao}')`
                    const rows = await this.querySync(conn,sql) 
                    pool.end((err)=>{
                        if(err) console.log('Campanhas.js 494', err)
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
                        if(err) console.log('Campanhas.js 508', err)
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
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_discador 
                            WHERE idCampanha = ${idCampanha}`
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 525', err)
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
                const sql = `SELECT idFila, nomeFila
                            FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha='${idCampanha}'`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 544', err)
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
                let sql = `DELETE FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)  
                sql = `INSERT INTO ${empresa}_dados.campanhas_filas 
                                (idCampanha,idFila,nomeFila,apelido) 
                        VALUES (${idCampanha},${idFila},'${nomeFila}','${apelido}')`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 564', err)
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
                const sql = `DELETE FROM ${empresa}_dados.campanhas_filas 
                            WHERE idCampanha=${idCampanha} AND idFila='${idFila}'`
                const rows = await this.querySync(conn,sql)  
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 581', err)
                })
                resolve(rows)   
                           
            })
        })   
    }    

    //MAILING
    //ADICIONA O MAILING A UMA CAMPANHA
    async addMailingCampanha(empresa,idCampanha,idMailing){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const infoMailing = await Mailing.infoMailing(empresa,idMailing)
                const tabelaDados = infoMailing[0].tabela_dados
                const tabelaNumeros = infoMailing[0].tabela_numeros
                //verifica se mailing ja existem na campanha
                let sql = `SELECT id 
                            FROM ${empresa}_dados.campanhas_mailing 
                            WHERE idCampanha=${idCampanha} 
                            AND idMailing=${idMailing}`
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 605', err)
                })
                if(r.length==1){
                    resolve(false)
                    return
                }
                
                   
                           
            })
        })   
        
    }

    //Lista os mailings adicionados em uma campanha
    async listarMailingCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_mailing 
                            WHERE idCampanha=${idCampanha}
                            LIMIT 1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 630', err)
                })
                resolve(rows)
            })
        })                
    }

    //Lista Mailings das campanhas ativas
    async listarMailingCampanhasAtivas(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT m.id, m.nome, m.totalNumeros, m.numerosInvalidos
                            FROM ${empresa}_dados.mailings AS m 
                            JOIN ${empresa}_dados.campanhas_mailing AS cm ON m.id=cm.idMailing
                            JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS c ON c.id=cm.idCampanha
                        ORDER BY m.id DESC
                            LIMIT 10;`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 650', err)
                })
                resolve(rows)
            })
        })       
    }

    //Remove o mailing de uma campanha
    async removeMailingCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const infoMailing = await this.infoMailingCampanha(empresa,idCampanha)

                //Recuperando o id da campanha
                let sql = `SELECT idCampanha 
                            FROM ${empresa}_dados.campanhas_mailing 
                            WHERE idCampanha=${idCampanha}`
                const r = await this.querySync(conn,sql)
                if(r.length==0){
                    return false
                }
                //Removendo coluna da campanha no mailing
                sql = `ALTER TABLE ${empresa}_mailings.${infoMailing[0].tabela_numeros} 
                        DROP COLUMN campanha_${idCampanha}`
                await this.querySync(conn,sql)
            
                //Removendo informacao do mailing da campanha
                sql = `DELETE FROM ${empresa}_dados.campanhas_mailing 
                        WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
                //Removendo filtros do mailing na campanha
                sql = `DELETE FROM ${empresa}_dados.campanhas_mailing_filtros 
                            WHERE idCampanha=${idCampanha}`
                await this.querySync(conn,sql)
                //removendo campos do mailing na campanha
                sql = `DELETE FROM ${empresa}_dados.campanhas_campos_tela_agente 
                        WHERE idCampanha=${idCampanha}` 
                await this.querySync(conn,sql)
               
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 691', err)
                })
                resolve(true)
            })
        })       
    }

    //FILTROS DE DISCAGEM ##################################################################################
    //Aplica/remove um filtro de discagem
    async filtrarRegistrosCampanha(empresa,parametros){  
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{     
                const idCampanha = parametros.idCampanha;
                const infoMailing = await this.infoMailingCampanha(empresa,idCampanha)//informacoes do mailing
        
                const idMailing = infoMailing[0].id;
                const tabelaNumeros = infoMailing[0].tabela_numeros;
                const tipo = parametros.tipo;
                const valor = parametros.valor
                const regiao = parametros.regiao 

        
                if(infoMailing.length==0){
                    //console.log('Mailing nao encontrado')
                    return false
                }
                const checkFilter = await this.checkFilter(empresa,idCampanha,idMailing,tipo,valor,regiao)//Verificando se ja existe filtro aplicado
        
                //verifica se filtro ja esta aplicado
                if(checkFilter===true){
                    //console.log('checkFilter true')
                    let sql=""
                    if(regiao==""){//remo
                        //console.log(`Removendo filtro ${tipo}=${valor}`)
                        sql=`DELETE FROM ${empresa}_dados.campanhas_mailing_filtros 
                            WHERE idCampanha=${idCampanha}
                            AND idMailing=${idMailing}
                            AND tipo='${tipo}'
                            AND valor='${valor}'`
                    }else{
                        //console.log(`Removendo filtros ${tipo}=${valor}`)
                        sql=`DELETE FROM ${empresa}_dados.campanhas_mailing_filtros 
                                WHERE idCampanha=${idCampanha}
                                    AND idMailing=${idMailing}
                                    AND tipo='${tipo}'
                                    AND valor='${valor}'
                                    AND regiao='${regiao}'`
                    }
                    //console.log(`Removendo filtros sql`,sql)   
           
                    await this.querySync(conn,sql)      
            
            
                    this.delFilterDial(empresa,tabelaNumeros,idCampanha,tipo,valor,regiao)
                    //Listar filtros restantes
                    sql = `SELECT * 
                            FROM ${empresa}_dados.campanhas_mailing_filtros 
                            WHERE idCampanha=${idCampanha} AND idMailing=${idMailing}`
                    const fr = await this.querySync(conn,sql)//Filtros Restantes
            
                    if(fr.length>=1){
                        for (let i = 0; i < fr.length; i++) {
                            this.addFilterDial(empresa,tabelaNumeros,idCampanha,fr[i].tipo,fr[i].valor,fr[i].regiao)
                        }
                    }
                    pool.end((err)=>{
                        if(err) console.log('Campanhas.js 758', err)
                    })
                    resolve(true)
                }
                let sql=`INSERT INTO ${empresa}_dados.campanhas_mailing_filtros 
                                (idCampanha,idMailing,tipo,valor,regiao)
                        VALUES (${idCampanha},${idMailing},'${tipo}','${valor}','${regiao}')`
                        //console.log(`last sql`,sql)          
                 await this.querySync(conn,sql)
                this.addFilterDial(empresa,tabelaNumeros,idCampanha,tipo,valor,regiao)
                
                pool.end((err)=>{
                    if(err) console.log(err)
                })
                resolve(true)
            })
        })      
    }


    //Retorna todas as informações de um mailing que esta atribuido em uma campanha
    async infoMailingCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql =`SELECT m.* 
                            FROM ${empresa}_dados.mailings AS m
                            JOIN ${empresa}_dados.campanhas_mailing AS c
                                ON c.idMailing=m.id
                            WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 790', err)
                })
                resolve(rows)
            })
        })
    }
    //Checa se já existe algum filtro aplicado com os parametros informados
    async checkFilter(empresa,idCampanha,idMailing,tipo,valor,regiao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql =`SELECT id 
                            FROM ${empresa}_dados.campanhas_mailing_filtros 
                            WHERE idCampanha=${idCampanha}
                            AND idMailing=${idMailing}
                            AND tipo='${tipo}'
                            AND valor='${valor}'
                            AND regiao='${regiao}'`
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 810', err)
                })
                if(r.length==0){
                    resolve(false)
                    return
                }                
                resolve(true)
            })
        })  
    }
    //Remove um filtro de uma tabela
    async delFilterDial(empresa,tabela,idCampanha,tipo,valor,regiao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                //console.log(`delFilterDial ${tipo}=${valor}`)
                let filter=""
                filter+=`${tipo}='${valor}'`
                if(regiao!=0){ filter+=` AND uf='${regiao}'`}
            
                let sql = `UPDATE ${empresa}_mailings.${tabela} 
                            SET campanha_${idCampanha}=1 
                            WHERE ${filter}`       
                console.log(`delFilter sql`,sql)
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 836', err)
                })
                resolve(true)
            })
        })
    }
    //Aplica um filtro a uma tabela
    async addFilterDial(empresa,tabela,idCampanha,tipo,valor,regiao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                //console.log(`addFilterDial ${tipo}=${valor}`)
                let filter=""
                filter+=`${tipo}='${valor}'`
                if(regiao!=0){ filter+=` AND uf='${regiao}'`}       
                let sql = `UPDATE ${empresa}_mailings.${tabela} 
                            SET campanha_${idCampanha}=0 
                            WHERE ${filter}`          
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 856', err)
                })
                resolve(true)
            })
        })
    }

    //Conta o total de numeros de uma tabela pelo UF, ou DDD
    async totalNumeros(empresa,tabela,uf,ddd){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                let filter=""
                if(uf!=0){ filter += ` AND uf="${uf}"` }
                if(ddd!=undefined){ filter += ` AND ddd=${ddd}`}
                const sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_mailings.${tabela}
                            WHERE valido=1 ${filter}` 
                
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 877', err)
                })
                resolve(r[0].total)
            })
        })
    }
    async totalNumeros_porTipo(empresa,tabela,uf,tipo){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                let filter=""
                if(uf!=0){ filter += ` AND uf="${uf}"` }
                if(tipo!=undefined){ filter += ` AND tipo='${tipo}'`}
                const sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_mailings.${tabela} 
                            WHERE valido=1 ${filter}`       
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 895', err)
                })
                resolve(r[0].total)
            })
        })
    }
    //Conta o total de registros filtrados de uma tabela pelo us
    async numerosFiltrados(empresa,idMailing,tabelaNumeros,idCampanha,uf){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                let filter=""
                if(uf!=0){ filter += ` AND uf="${uf}"` }
                const sql = `SELECT COUNT(id) AS total
                            FROM ${empresa}_mailings.${tabelaNumeros}
                            WHERE valido=1 AND campanha_${idCampanha}=1 ${filter}`
                const r = await this.querySync(conn,sql)
                
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 914', err)
                })
                resolve(r[0].total)
            })
        })
        
        //Verifica os filtros de uma campanha
        /*let regiao="";
        if(uf!=0){
            regiao=` AND regiao='${uf}'`
        }
        let sql = `SELECT * FROM campanhas_mailing_filtros WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ${regiao}`
        const filtros = await this.querySync(conn,sql)      
        let numerosFiltrados = 0
        let filters=""
        for(let i=0;i<filtros.length;i++){
            let tipo=filtros[i].tipo
            let valor = filtros[i].valor
            //console.log(`[${i}] tipo`,tipo)
            let temUf=0
            if(tipo=='uf'){
             //   console.log('tem uf',tipo)
                temUf=valor
            }else{
                filters+=` AND ${tipo}='${valor}'`
            }
            if(temUf!=0){
                filters=` AND uf='${temUf}'`
            }
        }
       
        if(uf!=0){filters+=` AND uf='${uf}'`}
        
       // console.log('filters',filters)
        sql = `SELECT COUNT(id) AS numerosFiltrados
                 FROM ${connect.db.mailings}.${tabelaNumeros}
                WHERE valido=1 ${filters}`
        const numeros = await this.querySync(conn,sql)
        return numeros[0].numerosFiltrados*/
    }
    //Retorna os DDDS de uma tabela de numeros
    async dddsMailings(empresa,tabela,uf){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                let filter=""
                if(uf!=0){ filter = `WHERE uf='${uf}'` }
                let sql = `SELECT DISTINCT ddd 
                            FROM ${empresa}_mailings.${tabela} ${filter}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 965', err)
                })
                resolve(rows)
            })
        })
    }
    //Checa se existe algum filtro de DDD aplicado
    async checkTypeFilter(empresa,idCampanha,tipo,valor,uf){  
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{     
                let filter  =""
                if(tipo!='uf'){
                    filter=` AND regiao = "${uf}"`
                }
                const sql =`SELECT id 
                            FROM ${empresa}_dados.campanhas_mailing_filtros 
                            WHERE idCampanha=${idCampanha}
                            AND tipo='${tipo}' AND valor='${valor}'
                            ${filter}`
                            //  console.log('sql filtro',sql)
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 988', err)
                })
                if(r.length==0){
                    resolve(false);
                    return
                }
                resolve(true);
               
            })
        })
    }

    //CONFIGURAR TELA DO AGENTE    
     //Lista todos os campos que foram configurados do mailing
     async camposConfiguradosDisponiveis(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT id,campo,apelido,tipo
                            FROM ${empresa}_dados.mailing_tipo_campo 
                            WHERE idMailing='${idMailing}' AND conferido=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1011', err)
                })
                resolve(rows)
            })
        })
    }
    //Verifica se o campo esta selecionado
    async campoSelecionadoTelaAgente(empresa,campo,tabela,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
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
                const sql = `INSERT INTO ${empresa}_dados.campanhas_campos_tela_agente 
                                        (idCampanha,tabela,idCampo,ordem) 
                                VALUES (${idCampanha},'${tabela}',${idCampo},0)`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1048', err)
                })
                resolve(rows)
            })
        })
    }
    async camposTelaAgente(empresa,idCampanha,tabela){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT t.id AS idJoin, m.id, m.campo, m.apelido, m.tipo 
                            FROM ${empresa}_dados.campanhas_campos_tela_agente AS t 
                            JOIN ${empresa}_dados.mailing_tipo_campo AS m ON m.id=t.idCampo
                            WHERE t.idCampanha=${idCampanha} AND t.tabela='${tabela}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1064', err)
                })
                resolve(rows)
            })
        })
    }
    //Remove campo da campanha
    async delCampoTelaAgente(empresa,idCampanha,idCampo){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `DELETE FROM ${empresa}_dados.campanhas_campos_tela_agente 
                            WHERE idCampanha=${idCampanha} AND idCampo=${idCampo}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1079', err)
                })
                resolve(rows)
            })
        })
    }


    //Campos adicionados na tela do agente
    /*async camposAdicionadosNaTelaAgente(idCampanha,tabela){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}'`
        return await this.querySync(conn,sql)
    }*/



    //BLACKLIST

    /*

    //STATUS DE EVOLUCAO DE CAMPANHA
    async totalMailingsCampanha(empresa,idCampanha){
        
        const sql = `SELECT m.totalNumeros-m.numerosInvalidos AS total, m.id AS idMailing
                      FROM ${empresa}_dados.mailings as m 
                      JOIN ${empresa}_dados.campanhas_mailing AS cm 
                        ON cm.idMailing=m.id 
                      WHERE cm.idCampanha=${idCampanha}`
        return await this.querySync(conn,sql)
        
    }

    async mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,status){
        const sql = `SELECT count(id) AS total 
                      FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE contatado='${status}' AND idCampanha=${idCampanha} AND idMailing=${idMailing}`
        const total_mailing= await this.querySync(conn,sql)
        return total_mailing[0].total
    }   

   
    async mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,status){
        let queryFilter="";
        if(status==1){
            queryFilter=`AND produtivo=1`
        }else{
            queryFilter=`AND (produtivo=0 OR produtivo is null)`
        }
        const sql = `SELECT count(id) AS total 
                      FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ${queryFilter}`
        const total_mailing= await this.querySync(conn,sql)
        return total_mailing[0].total
    }   

    async dataUltimoRegMailingNaCampanha(empresa,idCampanha,idMailing){
        const sql = `SELECT  DATE_FORMAT(data,'%d/%m/%Y') AS ultimaData
                      FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ORDER BY data DESC`
        const d= await this.querySync(conn,sql)
        if(d.length==0){
            return ""
        }
        return d[0].ultimaData
    }   

    async mailingsAnteriores(empresa,idCampanha){
        const sql = `SELECT DISTINCT idMailing 
                       FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE idCampanha=${idCampanha}`
        return await this.querySync(conn,sql);
        
    }*/

    //AGENDAMENTO DE CAMPANHAS
    //Agenda campanha
    async agendarCampanha(empresa,idCampanha,dI,dT,hI,hT){ 
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                //verifica se a campanha ja possui agendamento
                const r = await this.verAgendaCampanha(empresa,idCampanha)
                if(r.length ===0){
                    const sql = `INSERT INTO ${empresa}_dados.campanhas_horarios 
                                            (id_campanha,inicio,termino,hora_inicio,hora_termino) 
                                    VALUES (${idCampanha},'${dI}','${dT}','${hI}','${hT}')`
                    const rows = await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.log('Campanhas.js 1167', err)
                    })
                    resolve(rows)
                }else{
                    const sql = `UPDATE ${empresa}_dados.campanhas_horarios 
                                    SET inicio='${dI}',termino='${dT}',hora_inicio='${hI}',hora_termino='${hT}' 
                                WHERE id_campanha='${idCampanha}'`
                    const rows = await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.log('Campanhas.js 1176', err)
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
                const sql = `SELECT id,id_campanha,
                                    DATE_FORMAT(inicio, '%Y-%m-%d') as inicio,
                                    DATE_FORMAT(termino, '%Y-%m-%d') as termino,
                                    hora_inicio,hora_termino
                            FROM ${empresa}_dados.campanhas_horarios 
                            WHERE id_campanha=${idCampanha}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1196', err)
                })
                resolve(rows)
            })
        })
    }
   
    //#########  F I L A S  ############
    async novaFila(empresa,nomeFila,apelido,descricao){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                let sql = `SELECT id 
                            FROM ${empresa}_dados.filas 
                            WHERE nome='${nomeFila}'`
                const r = await this.querySync(conn,sql)
                if(r.length>=1){
                    return false
                }
                sql = `INSERT INTO ${empresa}_dados.filas (nome,apelido,descricao) VALUES('${nomeFila}','${apelido}','${descricao}')`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1218', err)
                })
                resolve(true)
            })
        })
    }

    async listarFilas(empresa){
        return new Promise (async (resolve,reject)=>{
           const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  

                const sql = `SELECT id,apelido as nome, descricao  FROM ${empresa}_dados.filas ORDER BY id DESC`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1233', err)
                })
                resolve(rows)   
                        
            })
        })  
    } 

    async dadosFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT id,apelido as nome, nome as nomeFila, descricao 
                            FROM ${empresa}_dados.filas 
                            WHERE id=${idFila}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1250', err)
                })
                resolve(rows)   
                        
            })
        })  
    } 

    async nomeFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT nome 
                            FROM ${empresa}_dados.filas 
                            WHERE id=${idFila}`
                const n = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1267', err)
                })
                resolve(n[0].nome)   
                        
            })
        })  
    } 

    async editarFila(empresa,idFila,dados){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `UPDATE ${empresa}_dados.filas 
                                SET apelido='${dados.name}',
                                    descricao='${dados.description}' 
                                WHERE id='${idFila}'`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1285', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

    async removerFila(empresa,idFila){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `DELETE FROM ${empresa}_dados.filas 
                            WHERE id='${idFila}'`
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1301', err)
                })
                resolve(true)   
                        
            })
        })  
    }

     


    //#########  B A S E S  ############

    



    ////////////////////OLD

    //total de campanhas que rodaram por dia
    async campanhasByDay(empresa,limit){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia 
                            FROM ${empresa}_dados.historico_atendimento 
                            GROUP BY data 
                            ORDER BY data DESC 
                            LIMIT ${limit}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1332', err)
                })
                resolve(rows)   
                        
            })
        })  
    }
    
    //Total de campanhas ativas
    async totalCampanhasAtivas(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT COUNT(id) as total 
                            FROM ${empresa}_dados.campanhas
                            WHERE status=1 AND estado=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1350', err)
                })
                resolve(rows)   
                        
            })
        })  
    }
    
    async campanhasAtivas(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo 
                            FROM ${empresa}_dados.campanhas AS c 
                        LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha
                            WHERE c.status=1 AND c.estado=1 AND s.estado=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1368', err)
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
                const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo
                            FROM ${empresa}_dados.campanhas AS c 
                        LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha 
                            WHERE c.status=1 AND c.estado=2 OR c.estado=1 AND s.estado=2`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1387', err)
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
                const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo 
                            FROM ${empresa}_dados.campanhas AS c 
                        LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha 
                            WHERE c.status=1 AND c.estado=3 OR c.estado=1 AND s.estado=3`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1406', err)
                })
                resolve(rows)   
                        
            })
        })  
    }
        

    

   
    
    //######################Operacoes de agendamento das campanhas######################
    

    

    //######################Gestão das integrações das campanhas######################

    //######################Setup do discador das campanhas######################
    

    //######################Configuração das filas das campanhas######################
   /* membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }

      
   

    

    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a 
                       JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
        connect.banco.query(sql,callback)
    }*/
    
    

    



    

    

    
    //Status dos agentes das campanhas
    async agentesFalando(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                //Estado 3 = Falando
                const sql = `SELECT DISTINCT ramal AS agentes 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE falando=1`
                const rows = this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1468', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

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

    async agentesEmPausa(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                //Estado 2 = Em Pausa
                const sql = `SELECT DISTINCT a.ramal AS agentes 
                            FROM ${empresa}_dados.agentes_filas AS a 
                            JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                            WHERE c.estado=1 AND c.status=1 AND a.estado=2`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1508', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

    async agentesDisponiveis(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                //Estado 1 = Disponível
                //Estado 0 = Deslogado
                const sql = `SELECT DISTINCT a.ramal AS agentes 
                            FROM ${empresa}_dados.agentes_filas AS a 
                            JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                            WHERE c.estado=1 AND c.status=1 AND a.estado=1`
                            
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1530', err)
                })
                resolve(rows)   
                        
            })
        })  
    }

/*
    chamadasTravadas(callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE tratado is null`
        connect.banco.query(sql,callback)
    }

    //Atualiza um registro como disponivel na tabulacao mailing
    liberaRegisto(idCampanha,idMailing,idRegistro,callback){ 
     const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Disponível' 
                   WHERE idCampanha=${idCampanha},idMailing=${idMailing},idRegistro=${idRegistro}`
     connect.mailings.query(sql,callback)
    }

    removeChamadaSimultanea(idChamadaSimultanea,callback){
        const sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamadaSimultanea}`
        connect.banco.query(sql,callback)
    }
*/
    //######################Gestão do Mailing das Campanhas ######################
    

    async campanhaDoMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT m.idCampanha,c.nome 
                            FROM ${empresa}_dados.campanhas_mailing AS m 
                            JOIN ${empresa}_dados.campanhas AS c ON m.idCampanha=c.id
                            WHERE idMailing=${idMailing} AND c.status=1
                            LIMIT 1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1570', err)
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
                const sql = `SELECT SUM(totalReg) AS total 
                            FROM ${empresa}_dados.mailings as m 
                            JOIN ${empresa}_dados.campanhas_mailing AS cm ON cm.idMailing=m.id 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=cm.idCampanha 
                            WHERE c.estado=1 AND c.status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1603', err)
                })
                resolve(rows)   
                        
            })
        })
    }

    async totalRegistrosCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT SUM(totalNumeros-numerosInvalidos) AS total 
                            FROM ${empresa}_dados.mailings as m 
                            JOIN ${empresa}_dados.campanhas_mailing AS cm ON cm.idMailing=m.id 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=cm.idCampanha 
                            WHERE c.id=${idCampanha}`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1622', err)
                })
                resolve(rows)   
                        
            })
        })
    }   

    async mailingsContatados(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT count(t.id) AS contatados 
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                            JOIN ${empresa}_dados.campanhas AS c ON c.id=t.idCampanha 
                            WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1640', err)
                })
                resolve(rows)   
                        
            })
        })
    }

    async mailingsNaoContatados(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool = await connect.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT count(t.id) AS nao_contatados 
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                            JOIN ${empresa}_dados.campanhas AS c 
                                ON c.id=t.idCampanha 
                            WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Campanhas.js 1659', err)
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
    
    //######################Funções para funcionamento do discador######################
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

    //Verifica se agora esta dentro do horário de agendamento de uma campanha
    horarioCampanha(idCampanha,hora,callback){
        const sql = `SELECT id 
                       FROM campanhas_horarios 
                       WHERE id_campanha = '${idCampanha}' AND hora_inicio <= '${hora}' AND hora_termino >='${hora}'`;
        connect.banco.query(sql,callback)
    }*/

   
}
export default new Campanhas();