"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Clients = require('./Clients'); var _Clients2 = _interopRequireDefault(_Clients);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
var _Discador = require('./Discador'); var _Discador2 = _interopRequireDefault(_Discador);

class User{
    /*async querySync(sql,empresa){
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
    async querySync_crmdb(sql){
        return new Promise(async(resolve,reject)=>{
            const conn = connect.poolCRM
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                
                resolve(rows)
            })            
        })    
    }
    async querySync_astdb(sql){
        const conn = connect.poolAsterisk
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                
                resolve(rows)
            }) 
    }*/


    

    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
    }        
   

    async findEmpresa(usuario){
        return new Promise (async (resolve,reject)=>{ 
            const u = usuario.split('@');
            const empresa = u[1]
            const sql = `SELECT client_number,prefix
                        FROM accounts
                        WHERE prefix='${empresa}'
                        AND status=1`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'crm')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            }) 
        }) 
    }

    async codEmpresa(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT client_number
                        FROM accounts
                        WHERE prefix='${empresa}'`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'crm')
            pool.getConnection(async (err,conn)=>{                           
                const code =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(code[0].client_number)   
            }) 
        })
    }
    
    async findUser(empresa,usuario){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT *
                        FROM ${empresa}_dados.users 
                        WHERE usuario='${usuario}' AND status=1`;
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            })  
        })
    }

    async logoffUsersExpire(empresa){
        return new Promise (async (resolve,reject)=>{ 
            let sql = `SELECT id FROM ${empresa}_dados.users WHERE logado>0 AND status=1`
             //Executando query
             const pool =  _dbConnection2.default.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{                           
                const us =  await this.querySync(conn,sql) 
                for(let i=0; i<us.length; i++){
                    const agente = us[i].id
                    await this.registraLogin(empresa,agente,'logout')
                }    
                
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(true) 
            })
        })  
    }

    async registraLogin(empresa,usuarioId,acao){
        return new Promise (async (resolve,reject)=>{        
            let sql
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                if(acao=='login'){
                    //checa a ultima acao do agente 
                    sql = `SELECT acao FROM ${empresa}_dados.registro_logins WHERE user_id=${usuarioId} ORDER BY id DESC LIMIT 1`
                    
                    //Executando query
                    const a =  await this.querySync(conn,sql)
                    if(a.length>0){               
                        //Caso a ultima acao tambem tenha sido um login, insere a informacao de logout antes do px login
                        if(a[0].acao=='login'){
                            sql = `INSERT INTO ${empresa}_dados.registro_logins 
                                               (data,hora,user_id,acao) 
                                        VALUES (NOW(),NOW(),${usuarioId},'logout')`
                            await this.querySync(conn,sql)
                        }
                    } 
                    //Atualiza em todas as filas estado como 1
                    sql = `UPDATE ${empresa}_dados.agentes_filas SET estado=4 WHERE ramal=${usuarioId}`
                    await this.querySync(conn,sql) 
                                        
                    sql = `UPDATE ${empresa}_dados.users SET logado=1, ultimo_acesso=NOW() WHERE id=${usuarioId}`
                    await this.querySync(conn,sql) 
                       
                    sql = `UPDATE ${empresa}_dados.user_ramal SET estado=4, datetime_estado=NOW() WHERE userId=${usuarioId}`
                    await this.querySync(conn,sql) 
                }else{                
                    //Atualiza em todas as filas estado como 0
                    sql = `UPDATE ${empresa}_dados.agentes_filas SET estado=0 WHERE ramal=${usuarioId}`
                    await this.querySync(conn,sql) 

                    //Remove qualquer chamada presa do agente
                    sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas WHERE ramal='${usuarioId}'`
                    await this.querySync(conn,sql)  
                    
                    sql = `UPDATE ${empresa}_dados.users SET logado=0 WHERE id=${usuarioId}` 
                    await this.querySync(conn,sql) 

                    sql = `UPDATE ${empresa}_dados.user_ramal SET estado=0, datetime_estado=NOW() WHERE userId=${usuarioId}`
                    await this.querySync(conn,sql) 
                } 
                sql = `INSERT INTO ${empresa}_dados.registro_logins 
                                        (data,hora,user_id,acao) 
                                VALUES (NOW(),NOW(),${usuarioId},'${acao}')`
                await this.querySync(conn,sql) 
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(true) 
            })
        })  
    }

    async setToken(empresa,agente,token){  
        return new Promise (async (resolve,reject)=>{ 
            const sql = `UPDATE ${empresa}_dados.users
                            SET token='${token}'
                          WHERE id=${agente}`

            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(true)   
            })  
        })
    }

    async checkToken(empresa,agente,token){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT id
                       FROM ${empresa}_dados.users
                      WHERE token='${token}' AND id=${agente}`
                          
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(true)   
            })  
        })
    }

    async getEmpresa(req){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const empresa = payload.empresa
        return empresa
    }

    async getHostEmpresa(req){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const hostDB = payload.hostDB
        return hostDB
    }

    

    async estadoAgente(req){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const ramal = payload.userId
        const empresa = payload.empresa
        const estadoRamal = await _Discador2.default.statusRamal(empresa,ramal)        
        if(estadoRamal.lenght==0){
            if(estadoRamal[0].estado==undefined){
                return 0
            }
        }
        return estadoRamal[0].estado
    }

    async statusAgente(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT status FROM ${empresa}_dados.users  WHERE  id=${idAgente}`
                          
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows[0].status)   
            })  
        })
    }

    async nomeEmpresa(empresa){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT name FROM clients.accounts WHERE prefix='${empresa}'`
                          
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'crm')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows[0].name)   
            })  
        })
        
    }

    async totalAgentesLogados(empresa){        
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_dados.users 
                      WHERE status=1 AND logado=1`
                          
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            })  
        })
    }

    async logadosPorDia(empresa,limit){        
       return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT COUNT(DISTINCT(user_id)) AS agentes, DATE_FORMAT (data,'%d/%m/%Y') AS dia 
                       FROM ${empresa}_dados.registro_logins 
                       GROUP BY data 
                       ORDER BY data DESC 
                       LIMIT ${limit}`
                          
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            })  
        })
    }

    async newUser(empresa,dados){
        return new Promise (async (resolve,reject)=>{ 
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{        
                let sql = `SELECT id 
                            FROM ${empresa}_dados.users 
                            WHERE usuario='${dados.usuario}'`;
                const c = await this.querySync(conn,sql) 
                const rt={}
                if(c.length >= 1){
                    rt['error']=1
                    rt['message']=`Usuário ${dados.usuario} já existe`
                    pool.end((err)=>{
                        if(err) console.log(err)
                     }) 
                    resolve(rt)
                    return
                    
                }
                sql = `INSERT INTO ${empresa}_dados.users
                                (criacao,nome,usuario,empresa,senha,nivelAcesso,cargo,equipe,reset,logado,status)
                            VALUES (NOW(),'${dados.nome}','${dados.usuario}','${empresa}',md5('${dados.senha}'),'${dados.nivelAcesso}','${dados.cargo}','${dados.equipe}','${dados.reset}',0,'1')`
                const u = await this.querySync(conn,sql)
                const userId = u.insertId;
                //Cadastrando ramal
                sql = `INSERT INTO ${empresa}_dados.user_ramal 
                                (userId,ramal,estado)
                            VALUES ('${userId}','${userId}',0)`
                const r = await this.querySync(conn,sql)

                const poolAsterisk =  _dbConnection2.default.pool(empresa,'asterisk')
                poolAsterisk.getConnection(async (err,conn)=>{

                    
                    //criando ramal no asterisk
                    //AOR
                    sql = `INSERT INTO asterisk.ps_aors 
                            (id,max_contacts,remove_existing) 
                        VALUES ('${userId}',1,'yes')`
                    const a = await this.querySync(conn,sql)
                    //AUTH
                    sql = `INSERT INTO asterisk.ps_auths
                                    (id,auth_type,password,realm,username) 
                                VALUES ('${userId}','userpass','mega_${userId}@agent','asterisk','${userId}')`
                    const h = await this.querySync(conn,sql)
                    //ENDPOINT
                    sql = `INSERT INTO asterisk.ps_endpoints 
                                    (id,transport,aors,auth,context,disallow,allow,webrtc,dtls_auto_generate_cert,direct_media,force_rport,ice_support,rewrite_contact,rtp_symmetric) 
                                VALUES ('${userId}','transport-wss','${userId}','${userId}','external','all','alaw,ulaw,opus','yes','yes','no','yes','yes','yes','yes')`
                    const e = await this.querySync(conn,sql)
                    poolAsterisk.end((err)=>{
                        if(err) console.log(err)

                        console.log("encerrou asterisk")
                    }) 
                })
                pool.end((err)=>{
                    if(err) console.log(err)

                    console.log("encerrou dados")
                }) 
                resolve(true) 
            })
        })   
    }

    async resumoUser(empresa,user){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT u.id, u.nome,e.equipe 
                        FROM ${empresa}_dados.users AS u 
                        LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                        WHERE u.id=${user}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            })    
        })        
    }

    //retorna se agente esta logado
    async agenteLogado(empresa,idAgente){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT logado 
                        FROM ${empresa}_dados.users 
                        WHERE id=${idAgente}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                    if(err) console.log(err)
                }) 
                resolve(rows)   
            })    
        }) 
    }

    async totalAgentesAtivos(empresa){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT COUNT(id) AS total 
                        FROM ${empresa}_dados.users
                        WHERE status=1`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                    if(err) console.log(err)
                }) 
                resolve(rows[0].total)   
            })            
        })
    }

    async listUsers(empresa,status){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT u.id,
                                DATE_FORMAT (u.criacao,'%d/%m/%Y %H:%i:%s') as criacao,
                                u.nome,
                                u.usuario,
                                u.nivelAcesso,
                                e.equipe,
                                c.cargo,
                                n.nivel,
                                u.reset,
                                u.logado,
                                DATE_FORMAT (u.ultimo_acesso,'%d/%m/%Y %H:%i:%s') as ultimo_acesso, 
                                u.status 
                        FROM ${empresa}_dados.users AS u 
                    LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                    LEFT JOIN ${empresa}_dados.users_cargos AS c ON u.cargo=c.id 
                    LEFT JOIN ${empresa}_dados.users_niveis AS n ON u.nivelAcesso=n.id 
                        WHERE u.status=${status} 
                        ORDER BY u.id DESC`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            }) 
        }) 
    }

    async listOnlyUsers(empresa,status){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users 
                        WHERE status = ${status} 
                        ORDER BY ordem ASC`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            }) 
        })
    }

    async userData(empresa,userId){
        return new Promise (async (resolve,reject)=>{      
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users 
                        WHERE id='${userId}'`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log(err)
                }) 
                resolve(rows)   
            }) 
        })
    }

    async editUser(empresa,userId,userData){
        let fields=""
        if(userData.nome){ fields+=`nome='${userData.nome}', `}
        if(userData.nivelAcesso){ fields+=`nivelAcesso=${userData.nivelAcesso}, `}
        if(userData.cargo){ fields+=`cargo=${userData.cargo}, `}
        if((userData.reset===1)||(userData.reset===0)){fields+=`reset=${userData.reset}, `}
        if((userData.status===1)||(userData.status===0)){fields+=`status=${userData.status}, `}  
        if(userData.senha){ fields+=`senha=md5('${userData.senha}'), `}
        
        return new Promise (async (resolve,reject)=>{  
            const sql = `UPDATE ${empresa}_dados.users
                            SET ${fields} modificado=NOW()
                        WHERE id=${userId}`
             //Executando query
             const pool =  _dbConnection2.default.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{                           
                 const rows =  await this.querySync(conn,sql) 
 
                 pool.end((err)=>{
                    if(err) console.log(err)
                 }) 
                 resolve(rows) 
             })
        })
    }

    //EQUIPES
    async novaEquipe(empresa,dados){
        return new Promise (async (resolve,reject)=>{  
            const sql = `INSERT INTO ${empresa}_dados.users_equipes 
                                    (supervisor,equipe,descricao,status) 
                            VALUES (${dados.supervisor},'${dados.equipe}','${dados.descricao}',1)`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }

    async listEquipes(empresa,status){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users_equipes 
                        WHERE status=${status}`
             //Executando query
             const pool =  _dbConnection2.default.pool(empresa,'dados')
             pool.getConnection(async (err,conn)=>{                           
                 const rows =  await this.querySync(conn,sql) 
 
                 pool.end((err)=>{
                 if(err) console.log(err)
                 }) 
                 resolve(rows) 
             })
        })
    }
    
    async dadosEquipe(empresa,idEquipe){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users_equipes 
                        WHERE id=${idEquipe}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    
    async editEquipe(empresa,idEquipe,dados){
        return new Promise (async (resolve,reject)=>{  
            const sql = `UPDATE ${empresa}_dados.users_equipes 
                            SET supervisor=${dados.supervisor},
                                equipe='${dados.equipe}',
                                descricao='${dados.descricao}',
                                status=${dados.status} 
                        WHERE id=${idEquipe}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    

    //CARGOS
    async novoCargo(empresa,dados){
        return new Promise (async (resolve,reject)=>{  
            const sql = `INSERT INTO ${empresa}_dados.users_cargos 
                                    (cargo,descricao,status)
                            VALUES ('${dados.cargo}','${dados.descricao}',1)`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }

    async listCargos(empresa,status){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users_cargos 
                        WHERE status=${status}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    
    async dadosCargo(empresa,idCargo){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users_cargos 
                        WHERE id=${idCargo}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    
    async editCargo(empresa,idCargo,dados){
        return new Promise (async (resolve,reject)=>{  
            const sql = `UPDATE ${empresa}_dados.users_cargos 
                            SET cargo='${dados.cargo}',
                                descricao='${dados.descricao}' 
                        WHERE id=${idCargo}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
       
    //NÍVEIS DE ACESSO
    async novoNivel(empresa,dados){
        return new Promise (async (resolve,reject)=>{  
            const sql = `INSERT INTO ${empresa}_dados.users_niveis
                                    (nivel,descricao,status)
                            VALUES ('${dados.nivel}','${dados.descricao}',1)`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    
    async listNiveis(empresa,status){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users_niveis 
                        WHERE status=${status}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    
    async dadosNivel(empresa,idNivel){
        return new Promise (async (resolve,reject)=>{  
            const sql = `SELECT * 
                        FROM ${empresa}_dados.users_niveis 
                        WHERE id='${idNivel}'`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
    
    async editNivel(empresa,idNivel,dados){
        return new Promise (async (resolve,reject)=>{  
            const sql = `UPDATE ${empresa}_dados.users_niveis 
                            SET nivel='${dados.nivel}',
                                descricao='${dados.descricao}'
                        WHERE id=${idNivel}`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }
        
    //Informacoes dos usuarios
    async todosAgentesEmPausa(empresa){
        return new Promise (async (resolve,reject)=>{  
            //Estado 2 = Em Pausa
            const sql = `SELECT ramal AS agentes 
                        FROM ${empresa}_dados.user_ramal 
                        WHERE estado=estado=2`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }

    async todosAgentesDisponiveis(empresa){
        return new Promise (async (resolve,reject)=>{  
            //Estado 1 = Disponível
            //Estado 0 = Deslogado
            const sql = `SELECT ramal AS agentes 
                        FROM ${empresa}_dados.user_ramal 
                        WHERE estado=1`
            //Executando query
            const pool =  _dbConnection2.default.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql) 

                pool.end((err)=>{
                if(err) console.log(err)
                }) 
                resolve(rows) 
            })
        })
    }




}

exports. default = new User;