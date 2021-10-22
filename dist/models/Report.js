"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Clients = require('./Clients'); var _Clients2 = _interopRequireDefault(_Clients);

//import util from 'util'


class Report{
    //Query Sync
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
      }   

    //Funcoes auxiliares 
   //FILTROS
    async filtrarAgentes(empresa,dataInicio,dataFinal,status,estado,ramal,equipe,login,pagina,registros){
        
        let filter=""       
        let reg=registros
        let pag=(pagina-1)*reg
       //Filtrando data de entrada/saida do agente
        if((dataInicio!=false)||(dataInicio!="")){filter+=` AND u.criacao>='${dataInicio} 00:00:00'`;}
        if((dataFinal!=false)||(dataFinal!="")){filter+=` AND u.criacao<='${dataFinal} 23:59:59'`;}

        if((status===1)||(status===0)){filter+=` AND u.status=${status}`;}
        if((estado!=false)||(estado!="")){filter+=` AND r.estado=${estado}`;}
        if((ramal!=false)||(ramal!="")){filter+=` AND u.id=${ramal}`;}
        if((equipe!=false)||(equipe!="")){filter+=` AND u.equipe=${equipe}`;}
        if((login===1)||(login===0)){filter+=` AND u.logado=${login}`;}

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   

                const sql = `SELECT u.id, u.nome 
                            FROM ${empresa}_dados.users AS u
                            JOIN ${empresa}_dados.user_ramal AS r ON u.id=r.userId
                            WHERE 1=1 ${filter}
                            LIMIT ${pag},${reg}`
                                
                const users = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(users)
            })
        }) 
    }

    async filtroEquipes(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT id,equipe 
                            FROM ${empresa}_dados.users_equipes 
                            WHERE status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async filtroCampanhas(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT id,nome 
                            FROM ${empresa}_dados.campanhas 
                            WHERE status=1 AND estado=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async filtroMailings(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT id,nome 
                            FROM ${empresa}_dados.mailings 
                            WHERE pronto=1 AND status=1`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })      
    } 
    
    async usuarioCampanha(empresa,idAgente,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT c.id
                            FROM ${empresa}_dados.campanhas AS c
                            JOIN ${empresa}_dados.campanhas_filas as f ON c.id=f.idCampanha
                            JOIN ${empresa}_dados.agentes_filas AS a ON a.fila=f.idFila
                            WHERE a.ramal='${idAgente}' AND c.id=${idCampanha} LIMIT 1`
                const u = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(u.length)
            })
        })      
    }

    async infoAgente(empresa,agente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT us.id as ramal, us.nome, rm.estado as cod_estado, ea.estado, eq.equipe
                            FROM ${empresa}_dados.users AS us 
                            JOIN ${empresa}_dados.user_ramal AS rm ON rm.userID=us.id
                            JOIN ${empresa}_dados.estadosAgente AS ea ON ea.cod=rm.estado
                        LEFT JOIN ${empresa}_dados.users_equipes AS eq ON eq.id=us.equipe
                            WHERE us.id=${agente}`
                            
                const user = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(user)
            })
        })      
    }

    async dadosLogin(empresa,idAgente,de,ate,acao,idLogin){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql
                if(acao=="login"){
                    sql = `SELECT id,DATE_FORMAT(data,'%Y-%m-%d') as data, hora
                            FROM ${empresa}_dados.registro_logins 
                            WHERE user_id=${idAgente} AND acao='login' AND id>${idLogin} AND data>='${de}' AND data<='${ate}'
                        ORDER BY id DESC`
                }else{
                    sql = `SELECT id,DATE_FORMAT(data,'%Y-%m-%d') as data, hora
                            FROM ${empresa}_dados.registro_logins 
                            WHERE user_id=${idAgente} AND acao='${acao}' AND id>${idLogin} AND data>='${de}' AND data<='${ate}'
                        ORDER BY id ASC 
                                LIMIT 1`
                }
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })      
    }

    async infoEstadoAgente(empresa,ramal){        
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT e.estado 
                            FROM ${empresa}_dados.user_ramal AS r
                            JOIN ${empresa}_dados.estadosAgente AS e ON r.estado=e.cod
                            WHERE r.ramal='${ramal}'`
                const e = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(e[0].estado)
            })
        })      
    }

    async calculaTempoPausa(empresa,dataInicio,dataFinal,idPausa,agente){
        let filter=""       
        
        //Filtrando data de entrada/saida do agente
        if((dataInicio!=false)||(dataInicio!="")){filter+=` AND entrada>='${dataInicio} 00:00:00'`;}
        if((dataFinal!=false)||(dataFinal!="")){filter+=` AND saida<='${dataFinal} 23:59:59'`;}

        if((idPausa!=false)||(idPausa!="")){filter+=` AND idPausa=${idPausa}`;}
        if((agente!=false)||(agente!="")){filter+=` AND idAgente=${agente}`;}

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   

                const sql = `SELECT SUM(tempo_total) AS tempo
                            FROM ${empresa}_dados.tempo_pausa 
                            WHERE 1=1 ${filter}`
                const t = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(t[0].tempo)
            })
        }) 
    }  

    async tempoEstadoAgente(empresa,ramal){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let tempo=0
                let sql = `SELECT TIMESTAMPDIFF (SECOND, datetime_estado, NOW()) as tempo
                            FROM ${empresa}_dados.user_ramal 
                            WHERE userId=${ramal}`
                const t = await this.querySync(conn,sql)
                if(t.length>0){
                    tempo=t[0].tempo
                }
                
                const tempoEstado = await this.converteSeg_tempo(tempo)
               
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(tempoEstado)
            })
        })      
    }

    async chamadasSimultaneas(empresa,dataI,dataF,hoje,ramal,equipe,campanha,mailing,numero){
        let filter=""
        if((dataI!=false)||(dataI!="")){filter+=` AND c.data>='${dataI} 00:00:00'`;}else{filter+=` AND c.data>='${hoje} 00:00:00'`;}
        if((dataF!=false)||(dataF!="")){filter+=` AND c.data<='${dataF} 23:59:59'`;}else{filter+=` AND c.data<='${hoje} 23:59:59'`;}
        if((ramal!=false)||(ramal!="")){filter+=` AND c.ramal=${ramal}`;}
        if((equipe!=false)||(equipe!="")){filter+=` AND u.equipe=${equipe}`;}
        if((campanha!=false)||(campanha!="")){filter+=` AND c.id_campanha=${campanha}`;}
        if((mailing!=false)||(mailing!="")){filter+=` AND c.id_mailing=${mailing}`;}
        if((numero!=false)||(numero!="")){filter+=` AND c.numero LIKE '%${numero}%'`;}

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
        
                const sql = `SELECT c.ramal,u.nome,c.uniqueid,
                                    DATE_FORMAT(c.data,'%d/%m/%Y') AS dataCall,
                                    DATE_FORMAT(c.data,'%H:%i') AS horaCall,
                                    c.tipo_ligacao,c.id_campanha,c.numero, c.na_fila,c.falando,c.desligada,c.tabulando,c.tabulado
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas AS c
                        LEFT JOIN ${empresa}_dados.users AS u ON c.ramal=u.id
                            WHERE tipo_ligacao='discador' `
                //console.log('chamadasSimultaneas',sql)
                const c = await this.querySync(conn,sql)     
                 
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(c)
            })
        })      
    }

    async chamadasRealizadas(empresa,dataI,dataF,hoje,ramal,equipe,campanha,mailing,numero,tipo,contatados,produtivo,tabulacao,pagina,registros){
        let filter=""
        if((dataI!=false)||(dataI!="")){filter+=` AND h.data>='${dataI}'`;}else{filter+=` AND h.data>='${hoje}'`;}
        if((dataF!=false)||(dataF!="")){filter+=` AND h.data<='${dataF}'`;}else{filter+=` AND h.data<='${hoje}'`;}
        if((ramal!=false)||(ramal!="")){filter+=` AND h.agente=${ramal}`;}
        if((equipe!=false)||(equipe!="")){filter+=` AND u.equipe=${equipe}`;}
        if((campanha!=false)||(campanha!="")){filter+=` AND h.campanha=${campanha}`;}
        if((mailing!=false)||(mailing!="")){filter+=` AND h.mailing=${mailing}`;}
        if((numero!=false)||(numero!="")){filter+=` AND h.numero_discado LIKE '%${numero}%'`;}
        if((tipo!=false)||(tipo!="")){filter+=` AND h.tipo = '${tipo}'`;}
        if((contatados!=false)||(contatados!="")){
            if(contatados==1){
                filter+=` AND h.contatado='S'`
            }else{
                filter+=` AND h.contatado<>'S'`
            }
        }
        if((produtivo!=false)||(produtivo!="")){
            if(produtivo==1){
                filter+=` AND h.produtivo=1`
            }else{
                filter+=` AND h.contatado<>1`
            }
        }
        if((tipo!=false)||(tipo!="")){filter+=` AND h.status_tabulacao = '${tabulacao}'`;}

       //Paginacao   
        let reg=registros
        let pag=(pagina-1)*reg

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
        
                const sql = `SELECT h.agente,u.nome,DATE_FORMAT(h.data,'%d/%m/%Y') AS dataCall,h.hora,h.uniqueid,h.campanha,h.tipo,h.numero_discado,h.contatado,h.produtivo,h.status_tabulacao
                            FROM ${empresa}_dados.historico_atendimento AS h
                        LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id
                            WHERE 1=1 ${filter} LIMIT ${pag},${reg}`
                //console.log('chamadasRealizadas',sql)
                const rows = await this.querySync(conn,sql)   
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })           
    }

    async statusTabulacaoChamada(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT id 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE ramal='${idAgente}' AND tabulando=1 AND desligada=1
                            LIMIT 1`
                const t = await this.querySync(conn,sql)    
                
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(t.length)
            })
        })      
    }

    async statusAtendimentoChamada(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT id 
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE ramal='${idAgente}' AND falando=1
                            LIMIT 1`
                const f = await this.querySync(conn,sql) 
               
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(f.length)
            })
        })      
    }

    async timeCall(empresa,uniqueid){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `SELECT id,saida 
                            FROM ${empresa}_dados.tempo_ligacao
                            WHERE uniqueid=${uniqueid}
                            LIMIT 1`
                const t = await this.querySync(conn,sql)
                if(t.length==0){
                    pool.end((err)=>{
                        if(err) console.log('Reports ...', err)
                    })
                    resolve(0)
                    return 0
                }
                const saida = t[0].saida
                let tempoSaida = 'saida'
                if(saida==null){
                    tempoSaida = 'NOW()' 
                }
                sql = `SELECT TIMESTAMPDIFF (SECOND, entrada, ${tempoSaida}) as tempo
                        FROM ${empresa}_dados.tempo_ligacao 
                        WHERE id=${t[0].id}`
                //console.log('timeCall',sql)
                const d = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(d[0].tempo)
            })
        })     
    }

    async totalChamadasRecebidas(empresa,idAgente,de,ate){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `SELECT SUM(tempo_total) AS tempo
                            FROM ${empresa}_dados.tempo_ligacao
                            WHERE idAgente=${idAgente} AND tipoDiscador='receptivo' AND entrada>='${de}' AND saida <= '${ate}'`
                const t = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(t[0].tempo)
            })
        })
    }

    async totalChamadasRealizadas(empresa,idAgente,de,ate){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `SELECT SUM(tempo_total) AS tempo
                            FROM ${empresa}_dados.tempo_ligacao
                            WHERE idAgente=${idAgente} AND tipoDiscador<>'receptivo' AND tipoDiscador<>'manual' AND entrada>='${de}' AND saida <= '${ate}'`
                const t = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(t[0].tempo)
            })
        })      
    }   

    async totalChamadasManuais(empresa,idAgente,de,ate){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let sql = `SELECT SUM(tempo_total) AS tempo
                            FROM ${empresa}_dados.tempo_ligacao
                            WHERE idAgente=${idAgente} AND tipoDiscador='manual' AND entrada>='${de}' AND saida <= '${ate}'`
                const t = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(t[0].tempo)
            })
        })
    }   

    async chamadasAtendidas(empresa,ramal,campanha,dataI,dataF,hoje){
        let filter=""
        if((dataI!=false)||(dataI!="")){filter+=` AND data>='${dataI}'`;}else{filter+=` AND data>='${hoje}'`;}
        if((dataF!=false)||(dataF!="")){filter+=` AND data<='${dataF}'`;}else{filter+=` AND data<='${hoje}'`;}
        if((campanha!=false)||(campanha!="")){filter+=` AND campanha=${campanha}`;}
        if((ramal!=false)||(ramal!="")){filter+=` AND agente=${ramal}`;}

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
        
                const sql = `SELECT COUNT(id) AS total
                            FROM ${empresa}_dados.historico_atendimento 
                            WHERE 1=1 ${filter}`
                            //console.log('chamadasAtendidas',sql)
                const ca = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(ca[0].total)
            })
        })
    }

    //Contagem dos tempos médios
    async tempoMedioAgente(empresa,agente,tempoMedido,idCampanha,dataI,dataF,hoje){
        let filter=""
        if((dataI!=false)||(dataI!="")){filter+=` AND entrada>='${dataI} 00:00:00'`;}else{filter+=` AND entrada>='${hoje} 00:00:00'`;}
        if((dataF!=false)||(dataF!="")){filter+=` AND saida<='${dataF} 23:59:59'`;}else{filter+=` AND saida<='${hoje} 23:59:59'`;}
        if((idCampanha!=false)||(idCampanha!="")){filter+=` AND idCampanha=${idCampanha}`;}
        if((agente!=false)||(agente!="")){filter+=` AND idAgente=${agente}`;}
        
        
        let tabela
        if(tempoMedido=="TMT"){tabela = 'tempo_tabulacao'}//Tempo médio de Tabulacao
        if(tempoMedido=="TMA"){tabela = 'tempo_ligacao'}//Tempo médio de Atendimento
        if(tempoMedido=="TMO"){tabela = 'tempo_ociosidade'}//Tempo médio de Ociosidade

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   

                const sql = `SELECT AVG(tempo_total) as tempoMedio 
                            FROM ${empresa}_dados.${tabela} 
                            WHERE 1=1 ${filter}`
                            //console.log('tempoMedioAgente',sql)
                const tm = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(Math.floor(tm[0].tempoMedio))
            })
        })      
    }


    async chamadasProdutividade(empresa,statusProdutividade,idAgente,idCampanha,dataI,dataF,hoje){
        let filter="";
        if((dataI!=false)||(dataI!="")){filter+=` AND data>='${dataI}'`;}else{filter+=` AND data>='${hoje}'`;}
        if((dataF!=false)||(dataF!="")){filter+=` AND data<='${dataF}'`;}else{filter+=` AND data<='${hoje}'`;}
        if((idCampanha!=false)||(idCampanha!="")){filter+=` AND campanha=${idCampanha}`;}
        if((idAgente!=false)||(idAgente!="")){filter+=` AND agente=${idAgente}`;}

        if(statusProdutividade==1){
            filter+=` AND produtivo=1`
        }else{
            filter+=` AND (produtivo=0 OR produtivo is null)`
        }

        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS produtivas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE 1=1 ${filter};`
                            //console.log('chamadasProdutividade',sql)
                const p=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(p[0].produtivas)
            })
        })                
    }

    async chamadasAtendidasCampanha(empresa,campanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS atendidas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE agente>0 AND campanha=${campanha}`
                const a=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(a[0].atendidas)
            })
        })
    }

    async chamadasProdutivaCampanha(empresa,campanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS produtivas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE produtivo=1 AND campanha=${campanha}`
                const a=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(a[0].produtivas)
            })
        })
    }

    async chamadasEmAtendimentoCampanha(empresa,campanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS atendidas
                            FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                            WHERE falando=1 AND id_campanha=${campanha}`
                    const a=await this.querySync(conn,sql);
                    pool.end((err)=>{
                        if(err) console.log('Reports ...', err)
                    })
                    resolve(a[0].atendidas)
                })
            })
    }

    async chamadasNaoAtendidasCampanha(empresa,campanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS nao_atendidas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE agente=0 AND campanha=${campanha}`
                const na=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(na[0].nao_atendidas)
            })
        })
    }

    async chamadasContatadasCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS contatados
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE contatado='S' AND campanha=${idCampanha}`
                const c=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(c[0].contatados)
            })
        })
    }

    async agressividadeCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT agressividade 
                            FROM ${empresa}_dados.campanhas_discador
                            WHERE idCampanha=${idCampanha}`
                const c=await this.querySync(conn,sql);
                if(c.length==0){
                    return 0
                }
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(c[0].agressividade)
            })
        })
    }

    async atualizaAgressividade(empresa,idCampanha,agressividade){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `UPDATE ${empresa}_dados.campanhas_discador 
                                SET agressividade=${agressividade}
                            WHERE idCampanha=${idCampanha}`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })
    }


    async TempoMedioDeAtendimentoCampanha(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT AVG(tempo_total) as tempoMedio 
                            FROM ${empresa}_dados.tempo_ligacao
                            WHERE idCampanha=${idCampanha}`
                const tm=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(tm[0].tempoMedio)
            })
        })
    }

    async mailingsProdutivosPorCampanha(empresa,idCampanha,idMailing,status){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                let filter = "";
                if(status==1){
                    filter+=` AND produtivo=1`
                }else{
                    filter+=` AND (produtivo=0 OR produtivo is null)`
                }
                const sql = `SELECT count(id) AS total 
                            FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                            WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ${filter}`
                const total_mailing= await this.querySync(conn,sql)
                return total_mailing[0].total
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(total_mailing[0].total)
            })
        })
    }   

    async totalChamadasDia(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}' AND campanha=${idCampanha}`
                const c=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(c[0].chamadas)
            })
        })
    }

    async totalChamadas_UltimosDias(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT DISTINCT DATE_FORMAT(data,'%d/%m/%Y') AS dataCall, COUNT(id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE campanha=${idCampanha} AND data<'${hoje}' GROUP BY dataCall
                            ORDER BY dataCall ASC LIMIT 7`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })
    }


    async totalChamadasCompletadasDia(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}' AND agente>0 AND campanha=${idCampanha}`
                const c = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(c[0].chamadas)
            })
        })
    }
    async ChamadasCompletadas_UltimosDias(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT DISTINCT DATE_FORMAT(data,'%d/%m/%Y') AS dataCall, COUNT(id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE campanha=${idCampanha} AND agente>0 AND data<'${hoje}' GROUP BY dataCall
                            ORDER BY dataCall ASC LIMIT 7`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })
    }

    
    async totalTabulacoesVendaDia(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(h.id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento AS h
                            JOIN ${empresa}_dados.tabulacoes_status AS t ON h.status_tabulacao=t.id
                            WHERE h.data='${hoje}' AND h.campanha=${idCampanha} AND t.venda=1`
                const c=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(c[0].chamadas)
            })
        })
    }
    async totalChamadasVendas_UltimosDias(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT DISTINCT DATE_FORMAT(h.data,'%d/%m/%Y') AS dataCall, COUNT(h.id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento AS h
                            JOIN ${empresa}_dados.tabulacoes_status AS t ON h.status_tabulacao=t.id
                            WHERE campanha=${idCampanha} AND data<'${hoje}' GROUP BY dataCall
                            ORDER BY dataCall ASC LIMIT 7`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })
    }

    async totalChamadasAbandonadasDia(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT COUNT(id) AS abandonadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE data='${hoje}' AND obs_tabulacao='ABANDONADA' AND campanha=${idCampanha}`
                const a=await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(a[0].abandonadas)
            })
        })
    }
    async totalChamadasAbandonadas_UltimosDias(empresa,idCampanha,hoje){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{   
                const sql = `SELECT DISTINCT DATE_FORMAT(data,'%d/%m/%Y') AS dataCall, COUNT(id) AS chamadas
                            FROM ${empresa}_dados.historico_atendimento
                            WHERE campanha=${idCampanha} AND data<'${hoje}' AND obs_tabulacao='ABANDONADA' GROUP BY dataCall
                            ORDER BY dataCall ASC LIMIT 7`
                const rows = await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Reports ...', err)
                })
                resolve(rows)
            })
        })
    }
    
    converteSeg_tempo(segundos_totais){
        return new Promise((resolve, reject)=>{
            if((segundos_totais==null)||(segundos_totais=="")||(segundos_totais==false)){segundos_totais=0}
            let horas = Math.floor(segundos_totais / 3600);
            let minutos = Math.floor((segundos_totais - (horas * 3600)) / 60);
            let segundos = Math.floor(segundos_totais % 60);
            if(horas<=9){horas="0"+horas}
            if(minutos<=9){minutos="0"+minutos}
            if(segundos<=9){segundos="0"+segundos}

            const tempo =`${horas}:${minutos}:${segundos}`

            resolve(tempo);

        })
    }
   















    /*
    


    async monitoramentoCampanhaIndividual(empresa,idCampanha,callback){
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino 
                   FROM ${empresa}_dados.campanhas as c 
              LEFT JOIN ${empresa}_dados.campanhas_horarios AS h ON h.id_campanha=c.id 
                  WHERE c.estado=1 AND c.status=1 AND c.id=${idCampanha}`
        const rowsCampanhasAtivas = await this.querySync(conn,sql) 
        if(rowsCampanhasAtivas.length==0){
            const monitoramentoCampanhaIndividual=false
            callback(null,monitoramentoCampanhaIndividual)
            return false
        }
        const monitoramentoCampanhaIndividual = {}

       
        monitoramentoCampanhaIndividual['nomeDaCampanha']=rowsCampanhasAtivas[0].nome

        //Status da campanha
        sql=`SELECT estado 
               FROM ${empresa}_dados.campanhas_status 
              WHERE idCampanha=${idCampanha}`
        const rowEstado = await this.querySync(conn,sql)
        let estado = false
        if(rowEstado.length!=0){
            if(rowEstado[0].estado==1){
                estado=true
            }
        }
        monitoramentoCampanhaIndividual['CampanhaRodando']=estado
        monitoramentoCampanhaIndividual['DataCampanha']=`${rowsCampanhasAtivas[0].dataInicio} - ${rowsCampanhasAtivas[0].dataTermino}`
        
        sql=`SELECT COUNT(id) AS atendidas 
               FROM ${empresa}_dados.historico_atendimento
              WHERE campanha=${idCampanha} AND contatado='S'`
        const rowAtendidas = await this.querySync(conn,sql)
        const atendidas=rowAtendidas[0].atendidas
        monitoramentoCampanhaIndividual['ChamadasAtendidasNoTotal']=atendidas

        sql=`SELECT s.id as statusVenda 
               FROM ${empresa}_dados.tabulacoes_status AS s 
               JOIN ${empresa}_dados.campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista 
              WHERE l.idCampanha=${idCampanha} AND s.venda=1 `
        const rowStatusVenda = await this.querySync(conn,sql)
        let statusVenda=0
        let totalVendas=0
        if(rowStatusVenda.length!=0){
            statusVenda=rowStatusVenda[0].statusVenda
            sql=`SELECT COUNT(id) as totalVendas 
                   FROM ${empresa}_dados.historico_atendimento
                  WHERE status_tabulacao=${statusVenda} AND campanha=${idCampanha}`
            const rowVendas = await this.querySync(conn,sql)
            totalVendas = rowVendas[0].totalVendas            
        }
        monitoramentoCampanhaIndividual['TabulacaoDeVendasNoTotal']=totalVendas
        

        sql=`SELECT COUNT(id) as emAtendimento 
               FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
              WHERE falando=1 AND id_campanha=${idCampanha}`
        const rowEmAtendimento = await this.querySync(conn,sql)
        monitoramentoCampanhaIndividual['ChamadasEmAtendimento']=rowEmAtendimento[0].emAtendimento

        sql=`SELECT COUNT(id) AS naoAtendidas 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE campanha=${idCampanha} AND contatado='N'`
        const rowNaoAtendidas = await this.querySync(conn,sql)
        monitoramentoCampanhaIndividual['ChamadasNãoAtendidas']=rowNaoAtendidas[0].naoAtendidas
        
        let conversao=0
        if(totalVendas>0){
            conversao = (totalVendas/atendidas)*100
        }
        
        monitoramentoCampanhaIndividual['Conversao']=`${conversao.toFixed(0)}%`
        monitoramentoCampanhaIndividual['Cronograma']=`${rowsCampanhasAtivas[0].horaInicio} - ${rowsCampanhasAtivas[0].horaTermino}`
        
        sql=`SELECT AVG(tempo_total) as TMA 
               FROM ${empresa}_dados.tempo_ligacao 
              WHERE idCampanha=${idCampanha}`
        const rowsTMA = await this.querySync(conn,sql)  
        monitoramentoCampanhaIndividual['TempoMedioDeAtendimento']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']={}
        
        sql=`SELECT total,conectadas 
               FROM ${empresa}_dados.log_chamadas_simultaneas 
              ORDER BY id DESC LIMIT 12`        
        const rowsChamadasSimultaneas = await this.querySync(conn,sql)          
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['Conectados']=[]
        monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas']=[]
        for(let i=0;i<rowsChamadasSimultaneas.length;i++){
            monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['Conectados'].push(rowsChamadasSimultaneas[0].conectadas)
            monitoramentoCampanhaIndividual['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas'].push(rowsChamadasSimultaneas[0].total)
        
        }
    
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']={}

        sql=`SELECT SUM(m.totalReg) as totalRegistros 
               FROM ${empresa}_dados.mailings as m 
               JOIN ${empresa}_dados.campanhas_mailing AS c ON m.id=c.idMailing 
              WHERE idCampanha=${idCampanha}`        
        const rowsTotalMailing = await this.querySync(conn,sql)     
        const totalRegistros = rowsTotalMailing[0].totalRegistros

        sql=`SELECT count(id) as trabalhados 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
              WHERE contatado='S' AND idCampanha=${idCampanha}`        
        const rowsTrabalhadas = await this.querySync(conn,sql)  
        let trabalhados=0
        let produtivas=0
        let improdutivas=0
        if(rowsTrabalhadas>0){
           trabalhados = (rowsTrabalhadas[0].trabalhados/totalRegistros)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Trabalhado']=parseInt(trabalhados.toFixed(0))

        sql=`SELECT count(id) as produtivo 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
              WHERE contatado='S' AND produtivo=1 AND idCampanha=${idCampanha}`        
        const rowsProdutivas = await this.querySync(conn,sql)  
        if(produtivas>0){   
        const produtivas = (rowsProdutivas[0].produtivo/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Produtivo']=parseInt(produtivas.toFixed(0))

        sql=`SELECT count(id) as improdutivas
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
              WHERE contatado='S' AND produtivo=0 AND idCampanha=${idCampanha}`        
        const rowsImprodutivas = await this.querySync(conn,sql)   
        if(improdutivas>0){   
            improdutivas = (rowsImprodutivas[0].improdutivas/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhaIndividual['DadosCampanhaPorcentagem']['Improdutivo']=parseInt(improdutivas.toFixed(0))

        
        monitoramentoCampanhaIndividual['ConsolidadoDodia']={}
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']={}

        sql=`SELECT COUNT(id) AS chamadas 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE data=date(now()) AND campanha=${idCampanha}`
        const rowsCallsHoje = await this.querySync(conn,sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['total']=rowsCallsHoje[0].chamadas
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE data<>DATE(NOW()) AND campanha=${idCampanha} 
           GROUP BY data 
           ORDER BY data 
               DESC LIMIT 7`
        const rowsCallsLastWeeK = await this.querySync(conn,sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['dataChart']=[]
        for(let i=0;i<rowsCallsLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['labelChart'].push(rowsCallsLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TotalDeChamadas']['dataChart'].push(rowsCallsLastWeeK[i].chamadas)
        }        

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND contatado='S' AND campanha=${idCampanha}`
        const rowsCompletedHoje = await this.querySync(conn,sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['total']=rowsCompletedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE data<>DATE(NOW()) AND contatado='S' AND campanha=${idCampanha} 
           GROUP BY data 
           ORDER BY data DESC LIMIT 7`
        const rowsCompletedLastWeeK = await this.querySync(conn,sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart']=[]
        for(let i=0;i<rowsCompletedLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart'].push(rowsCompletedLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart'].push(rowsCompletedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']={}        
        if(statusVenda==0){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=0
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
        }else{
            sql=`SELECT COUNT(id) AS total 
                   FROM ${empresa}_dados.historico_atendimento 
                  WHERE data=date(now()) AND status_tabulacao=${statusVenda} AND campanha=${idCampanha}`
            const rowsSalesHoje = await this.querySync(conn,sql)   
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=rowsSalesHoje[0].total
            
            sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE data<>DATE(NOW()) AND status_tabulacao=${statusVenda} AND campanha=${idCampanha} 
                   GROUP BY data 
                   ORDER BY data DESC 
                   LIMIT 7`
            const rowsSalesLastWeeK = await this.querySync(conn,sql) 
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
            for(let i=0;i<rowsSalesLastWeeK.length;i++){
                monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart'].push(rowsSalesLastWeeK[i].label)
                monitoramentoCampanhaIndividual['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart'].push(rowsSalesLastWeeK[i].chamadas)
            }   
        }

        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND obs_tabulacao='ABANDONOU FILA' AND campanha=${idCampanha}`
        const rowsAbandonedHoje = await this.querySync(conn,sql)   
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['total']=rowsAbandonedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento
              WHERE data<>DATE(NOW()) AND obs_tabulacao='ABANDONOU FILA' AND campanha=${idCampanha} 
              GROUP BY data 
              ORDER BY data DESC 
              LIMIT 7`
        const rowsAbandonedLastWeeK = await this.querySync(conn,sql) 
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart']=[]
        monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart']=[]
        for(let i=0;i<rowsAbandonedLastWeeK.length;i++){
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart'].push(rowsAbandonedLastWeeK[i].label)
            monitoramentoCampanhaIndividual['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart'].push(rowsAbandonedLastWeeK[i].chamadas)
        }

        monitoramentoCampanhaIndividual['DadosAgente']={}
        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=4`
        const rowAgentesIndisponiveis = await this.querySync(conn,sql)
        monitoramentoCampanhaIndividual['DadosAgente']['indisponiveis']=rowAgentesIndisponiveis[0].total

        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=1`
        const rowAgentesDisponiveis = await this.querySync(conn,sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Disponiveis']=rowAgentesDisponiveis[0].total

        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=3`
        const rowAgentesFalando = await this.querySync(conn,sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Falando']=rowAgentesFalando[0].total

        sql = `SELECT COUNT(af.id) as total 
                 FROM ${empresa}_dados.campanhas_filas AS cf 
                 JOIN ${empresa}_dados.agentes_filas AS af ON af.fila=cf.id 
                WHERE cf.idCampanha=${idCampanha} AND af.estado=2`
        const rowAgentesPausados = await this.querySync(conn,sql)
        monitoramentoCampanhaIndividual['DadosAgente']['Pausados']=rowAgentesPausados[0].total      
       
       
        callback(null,monitoramentoCampanhaIndividual)
        
    }

    async monitoramentoCampanhaGeral(empresa,callback){
        let sql=`SELECT c.id, c.nome, DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio , DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino
                   FROM ${empresa}_dados.campanhas as c 
              LEFT JOIN ${empresa}_dados.campanhas_horarios AS h ON h.id_campanha=c.id
                  WHERE c.estado=1 AND c.status=1`
        const rowsCampanhasAtivas = await this.querySync(conn,sql) 
        if(rowsCampanhasAtivas.length==0){
            const monitoramentoCampanhas=false
            callback(null,monitoramentoCampanhas)
            return false
        }
        const monitoramentoCampanhas = {}

       
        monitoramentoCampanhas['nomeDaCampanha']='Todas as campanhas'

        //Status da campanha       
        monitoramentoCampanhas['CampanhaRodando']=''
        monitoramentoCampanhas['DataCampanha']=''
        
        sql=`SELECT COUNT(id) AS atendidas 
               FROM ${empresa}_dados.historico_atendimento 
              WHERE contatado='S'`
        const rowAtendidas = await this.querySync(conn,sql)
        const atendidas=rowAtendidas[0].atendidas
        monitoramentoCampanhas['ChamadasAtendidasNoTotal']=atendidas

        sql=`SELECT s.id as statusVenda 
               FROM ${empresa}_dados.tabulacoes_status AS s 
               JOIN ${empresa}_dados.campanhas_listastabulacao AS l ON l.idListaTabulacao=s.idLista 
               WHERE s.venda=1 `
        const rowStatusVenda = await this.querySync(conn,sql)
        let statusVenda=0
        let totalVendas=0
        if(rowStatusVenda.length!=0){
            statusVenda=rowStatusVenda[0].statusVenda
            sql=`SELECT COUNT(id) as totalVendas 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE status_tabulacao=${statusVenda}`
            const rowVendas = await this.querySync(conn,sql)
            totalVendas = rowVendas[0].totalVendas            
        }
        monitoramentoCampanhas['TabulacaoDeVendasNoTotal']=totalVendas


        sql=`SELECT COUNT(id) as emAtendimento 
               FROM ${empresa}_dados.campanhas_chamadas_simultaneas 
               WHERE falando=1`
        const rowEmAtendimento = await this.querySync(conn,sql)
        monitoramentoCampanhas['ChamadasEmAtendimento']=rowEmAtendimento[0].emAtendimento

        sql=`SELECT COUNT(id) AS naoAtendidas 
              FROM ${empresa}_dados.historico_atendimento 
              WHERE contatado='N'`
        const rowNaoAtendidas = await this.querySync(conn,sql)
        monitoramentoCampanhas['ChamadasNãoAtendidas']=rowNaoAtendidas[0].naoAtendidas
        let conversao=0
        if(totalVendas>0){
            conversao = (totalVendas/atendidas)*100
        }
        monitoramentoCampanhas['Conversao']=`${conversao.toFixed(0)}%`
        monitoramentoCampanhas['Cronograma']=`${rowsCampanhasAtivas[0].horaInicio} - ${rowsCampanhasAtivas[0].horaTermino}`
        
        sql=`SELECT AVG(tempo_total) as TMA 
               FROM ${empresa}_dados.tempo_ligacao`
        const rowsTMA = await this.querySync(conn,sql)  
        monitoramentoCampanhas['TempoMedioDeAtendimento']=await this.converteSeg_tempo(rowsTMA[0].TMA)
        
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']={}
        
        sql=`SELECT total,conectadas 
               FROM ${empresa}_dados.log_chamadas_simultaneas 
               ORDER BY id DESC 
               LIMIT 12`        
        const rowsChamadasSimultaneas = await this.querySync(conn,sql)          
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['Conectados']=[]
        monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas']=[]
        for(let i=0;i<rowsChamadasSimultaneas.length;i++){
            monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['Conectados'].push(rowsChamadasSimultaneas[0].conectadas)
            monitoramentoCampanhas['GraficoDeChamadasSimultaneas']['ChamadasSimultaneas'].push(rowsChamadasSimultaneas[0].total)
        }
     
        monitoramentoCampanhas['DadosCampanhaPorcentagem']={}

        sql=`SELECT SUM(m.totalReg) as totalRegistros 
               FROM ${empresa}_dados.mailings as m 
               JOIN ${empresa}_dados.campanhas_mailing AS c ON m.id=c.idMailing`        
        const rowsTotalMailing = await this.querySync(conn,sql)     
        const totalRegistros = rowsTotalMailing[0].totalRegistros

        sql=`SELECT count(id) as trabalhados 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
               WHERE contatado='S'`        
        const rowsTrabalhadas = await this.querySync(conn,sql)  
        let trabalhados=0
        let produtivas=0
        let improdutivas=0
        if(trabalhados>0){
            trabalhados = (rowsTrabalhadas[0].trabalhados/totalRegistros)*100
        }    


        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Trabalhado']=parseInt(trabalhados.toFixed(0))

        sql=`SELECT count(id) as produtivo 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
               WHERE contatado='S' AND produtivo=1`        
        const rowsProdutivas = await this.querySync(conn,sql)     
        if(produtivas>0){
            produtivas = (rowsProdutivas[0].produtivo/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Produtivo']=parseInt(produtivas.toFixed(0))

        sql=`SELECT count(id) as improdutivas 
               FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
               WHERE contatado='S' AND produtivo=0`        
        const rowsImprodutivas = await this.querySync(conn,sql)   
        if(improdutivas>0){
             improdutivas = (rowsImprodutivas[0].improdutivas/rowsTrabalhadas[0].trabalhados)*100
        }
        monitoramentoCampanhas['DadosCampanhaPorcentagem']['Improdutivo']=parseInt(improdutivas.toFixed(0))
        
        monitoramentoCampanhas['ConsolidadoDodia']={}
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']={}

        sql=`SELECT COUNT(id) AS chamadas
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now())`
        const rowsCallsHoje = await this.querySync(conn,sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['total']=rowsCallsHoje[0].chamadas
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data<>DATE(NOW()) 
               GROUP BY data 
               ORDER BY data DESC 
               LIMIT 7`
        const rowsCallsLastWeeK = await this.querySync(conn,sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['dataChart']=[]
        for(let i=0;i<rowsCallsLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['labelChart'].push(rowsCallsLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['TotalDeChamadas']['dataChart'].push(rowsCallsLastWeeK[i].chamadas)
        }        

        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND contatado='S'`
        const rowsCompletedHoje = await this.querySync(conn,sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['total']=rowsCompletedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data<>DATE(NOW()) AND contatado='S' 
               GROUP BY data 
               ORDER BY data DESC 
               LIMIT 7`
        const rowsCompletedLastWeeK = await this.querySync(conn,sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart']=[]
        for(let i=0;i<rowsCompletedLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['labelChart'].push(rowsCompletedLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasCompletadasHoje']['dataChart'].push(rowsCompletedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']={}
        if(statusVenda==0){
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=0
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
        }else{
            sql=`SELECT COUNT(id) AS total 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE data=date(now()) AND status_tabulacao=${statusVenda}`
            const rowsSalesHoje = await this.querySync(conn,sql)   
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['total']=rowsSalesHoje[0].total
            
            sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
                   FROM ${empresa}_dados.historico_atendimento 
                   WHERE data<>DATE(NOW()) AND status_tabulacao=${statusVenda} 
                   GROUP BY data 
                   ORDER BY data DESC LIMIT 7`
            const rowsSalesLastWeeK = await this.querySync(conn,sql) 
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart']=[]
            monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart']=[]
            for(let i=0;i<rowsSalesLastWeeK.length;i++){
                monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['labelChart'].push(rowsSalesLastWeeK[i].label)
                monitoramentoCampanhas['ConsolidadoDodia']['TabulacaoDeVendasHoje']['dataChart'].push(rowsSalesLastWeeK[i].chamadas)
            }   
        }         

        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']={}

        sql=`SELECT COUNT(id) AS total 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data=date(now()) AND obs_tabulacao='ABANDONOU FILA'`
        const rowsAbandonedHoje = await this.querySync(conn,sql)   
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['total']=rowsAbandonedHoje[0].total
        
        sql=`SELECT COUNT(id) AS chamadas,DATE_FORMAT(data,'%d/%m/%Y') AS label 
               FROM ${empresa}_dados.historico_atendimento 
               WHERE data<>DATE(NOW()) AND obs_tabulacao='ABANDONOU FILA' 
               GROUP BY data 
               ORDER BY data DESC 
               LIMIT 7`
        const rowsAbandonedLastWeeK = await this.querySync(conn,sql) 
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart']=[]
        monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart']=[]
        for(let i=0;i<rowsAbandonedLastWeeK.length;i++){
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['labelChart'].push(rowsAbandonedLastWeeK[i].label)
            monitoramentoCampanhas['ConsolidadoDodia']['ChamadasAbandonadas']['dataChart'].push(rowsAbandonedLastWeeK[i].chamadas)
        }   

        monitoramentoCampanhas['DadosAgente']={}
        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=4`
        const rowAgentesIndisponiveis = await this.querySync(conn,sql)
        monitoramentoCampanhas['DadosAgente']['indisponiveis']=rowAgentesIndisponiveis[0].total

        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=1`
        const rowAgentesDisponiveis = await this.querySync(conn,sql)
        monitoramentoCampanhas['DadosAgente']['Disponiveis']=rowAgentesDisponiveis[0].total

        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=3`
        const rowAgentesFalando = await this.querySync(conn,sql)
        monitoramentoCampanhas['DadosAgente']['Falando']=rowAgentesFalando[0].total

        sql = `SELECT COUNT(id) as total 
                 FROM ${empresa}_dados.user_ramal 
                 WHERE estado=2`
        const rowAgentesPausados = await this.querySync(conn,sql)
        monitoramentoCampanhas['DadosAgente']['Pausados']=rowAgentesPausados[0].total      
       
       
        callback(null,monitoramentoCampanhas)
    }

    

   

    async restantes(idCampanha){
        return new Promise ((resolve,reject) =>{
            //Calculando tentativas e mailing da campanha
            const sql = `SELECT d.tentativas,m.id as idMailing,m.tabela,m.totalReg 
                           FROM campanhas_discador AS d JOIN campanhas_mailing AS cm ON cm.idCampanha=d.idCampanha 
                           JOIN mailings AS m ON m.id=cm.idMailing WHERE d.idCampanha=${idCampanha}`
            connect.banco.query(sql,(e,rowDadosCampanha)=>{
                if(e) throw e
                const tentativas = rowDadosCampanha[0].tentativas
                const tabela = rowDadosCampanha[0].tabela
                const idMailing = rowDadosCampanha[0].idMailing
                const totalReg = rowDadosCampanha[0].totalReg
                //Contanto total de registros e registros com menos tentativas
                const sql = `SELECT COUNT(id_key_base) AS trabalhados 
                               FROM ${tabela} AS t 
                               LEFT JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS c ON c.idRegistro=t.id_key_base 
                               WHERE (c.idCampanha=${idCampanha} OR c.idCampanha IS NULL) AND (c.idMailing=${idMailing} OR c.idMailing IS NULL) AND c.tentativas>=${tentativas}`
                connect.mailings.query(sql,(e,rowRestantes)=>{
                    
                    const trabalhados=rowRestantes[0].trabalhados
                    const saida = {totalReg:totalReg, trabalhados:trabalhados};
                    if(e)
                        return reject(e);
                
                    resolve(saida);
                })
            })
        })
    }

 */

    //REVISAR
    
   
/*
    

    async criarRelatorio(empresa,data){
        const sql = `INSERT INTO ${empresa}_dados.report_info 
                                (data,nome,descricao,status) 
                         VALUES (NOW(),'${data.nome}','${data.descricao}',1) ` 
        return await this.querySync(conn,sql)
    }

    async listarRelatorios(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_info 
                      WHERE status=1`;
        return await this.querySync(conn,sql)
    }

    async infoRelatorio(empresa,idRelatorio){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_info 
                      WHERE id='${idRelatorio}'`;
        return await this.querySync(conn,sql)
    }

    async editarRelatorio(empresa,idRelatorio,dados){
        const sql = `UPDATE ${empresa}_dados.report_info 
                        SET nome='${dados.nome}',
                            descricao='${dados.descricao}', 
                            status='${dados.status}' 
                      WHERE id='${idRelatorio}'`
        return await this.querySync(conn,sql)
    }

    async addCampoDisponiveis(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.report_campos_disponiveis 
                                (campo,descricao,sintetico,charts,status) 
                         VALUES ('${dados.campo}','${dados.descricao}','${dados.sintetico}','${dados.charts}','${dados.status}')`
        return await this.querySync(conn,sql)
    }

    async listCamposDisponiveis(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_campos_disponiveis`;
        return await this.querySync(conn,sql)
    }

    async editarCampoDisponiveis(empresa,idCampoDisponivel,dados){
        const sql = `UPDATE ${empresa}_dados.report_campos_disponiveis 
                        SET campo='${dados.campo}',
                            descricao='${dados.descricao}',
                            sintetico='${dados.sintetico}',
                            charts='${dados.charts}',
                            status='${dados.status}' 
                      WHERE id='${idCampoDisponivel}'`
        return await this.querySync(conn,sql)
    }

    async delCampoDisponiveis(empresa,idCampoDisponivel){
        const sql = `DELETE FROM ${empresa}_dados.report_campos_disponiveis 
                      WHERE id='${idCampoDisponivel}'`
        return await this.querySync(conn,sql)
    }

    


    async addCampoRelatorio(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.report_campos 
                                (idreport,idcampo,sintetico,chart) 
                         VALUES ('${dados.idreport}','${dados.idcampo}','${dados.sintetico}','${dados.chart}')`
        return await this.querySync(conn,sql)
    }

    async listarCamposRelatorio(empresa,idRelatorio){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_campos 
                      WHERE idreport=${idRelatorio}`;
        return await this.querySync(conn,sql)
    }

    async infoCamposRelatorio(empresa,idCampoRelatorio){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.report_campos 
                      WHERE id=${idCampoRelatorio}`;
        return await this.querySync(conn,sql)
    }
    
    async editCampoRelatorio(empresa,idCampoRelatorio,dados){
        const sql = `UPDATE ${empresa}_dados.report_campos 
                        SET sintetico='${dados.sintetico}', 
                            chart='${dados.chart}'
                      WHERE id='${idCampoRelatorio}'`
        return await this.querySync(conn,sql)
    }
    
    async delCampoRelatorio(empresa,idCampoRelatorio){
        const sql = `DELETE FROM ${empresa}_dados.report_campos 
                      WHERE id='${idCampoRelatorio}'`
        return await this.querySync(conn,sql)
    }



*/
}
exports. default = new Report()