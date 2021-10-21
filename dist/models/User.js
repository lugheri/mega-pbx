"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Clients = require('./Clients'); var _Clients2 = _interopRequireDefault(_Clients);
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
var _Discador = require('./Discador'); var _Discador2 = _interopRequireDefault(_Discador);

class User{
    async querySync(sql,empresa){
        return new Promise(async(resolve,reject)=>{
            const hostEmp = await _Clients2.default.serversDbs(empresa)
            const conn = _dbConnection2.default.poolConta(hostEmp)
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
            conn.end()                        
        })
    }
    async querySync_crmdb(sql){
        return new Promise(async(resolve,reject)=>{
            const conn = _dbConnection2.default.poolCRM
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })            
        })    
    }
    async querySync_astdb(sql){
        const connection = _dbConnection2.default.poolAsterisk
        const promisePool =  connection.promise();
        const result = await promisePool.query(sql)
        promisePool.end();
        return result[0];
    }




/*
    
    async querySync(sql,empresa){
        return new Promise(async(resolve,reject)=>{
            connect.executeSQLQuery()
             //const hostEmp = await Clients.serversDbs(empresa)
            connect.executeSQLQuery = (sql, 'dados', '34.68.33.39', (e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    async querySync_crmdb(sql){
        return new Promise(async(resolve,reject)=>{
            //const hostEmp = await Clients.serversDbs(empresa)
            connect.executeSQLQuery = (sql, 'crm', 0, (e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    
    async querySync_astdb(sql){
        return new Promise(async(resolve,reject)=>{
            //const hostEmp = await Clients.serversDbs(empresa)
            connect.executeSQLQuery = (sql, 'asterisk', 0, (e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }*/

    async findEmpresa(usuario){
        const u = usuario.split('@');
        const empresa = u[1]
        const sql = `SELECT client_number,prefix
                      FROM accounts
                     WHERE prefix='${empresa}'
                       AND status=1`
        return await this.querySync_crmdb(sql) 
    }

    async codEmpresa(empresa){
        const sql = `SELECT client_number
                      FROM accounts
                     WHERE prefix='${empresa}'`
        const code = await this.querySync_crmdb(sql) 
        return code[0].client_number
    }
    
    async findUser(empresa,usuario){
        const sql = `SELECT *
                       FROM ${empresa}_dados.users 
                      WHERE usuario='${usuario}' AND status=1`;
        return await this.querySync(sql,empresa) 
    }

    async logoffUsersExpire(empresa){
        let sql = `SELECT id FROM ${empresa}_dados.users WHERE logado>0 AND status=1`
        const us = await this.querySync(sql,empresa)
        for(let i=0; i<us.length; i++){
            const agente = us[i].id
            await this.registraLogin(empresa,agente,'logout')
        }       
        return true 
    }

    async registraLogin(empresa,usuarioId,acao){       
        let sql
        if(acao=='login'){
            //checa a ultima acao do agente 
            sql = `SELECT acao FROM ${empresa}_dados.registro_logins WHERE user_id=${usuarioId} ORDER BY id DESC LIMIT 1`
            const a = await this.querySync(sql,empresa)
            if(a.length>0){               
                //Caso a ultima acao tambem tenha sido um login, insere a informacao de logout antes do px login
                if(a[0].acao=='login'){
                    sql = `INSERT INTO ${empresa}_dados.registro_logins 
                                       (data,hora,user_id,acao) 
                                VALUES (NOW(),NOW(),${usuarioId},'logout')`
                    await this.querySync(sql,empresa) 
                }
            } 
            //Atualiza em todas as filas estado como 1
            sql = `UPDATE ${empresa}_dados.agentes_filas SET estado=4 WHERE ramal=${usuarioId}`
            await this.querySync(sql,empresa) 
                               
            sql = `UPDATE ${empresa}_dados.users SET logado=1, ultimo_acesso=NOW() WHERE id=${usuarioId}`
            await this.querySync(sql,empresa) 
            
            sql = `UPDATE ${empresa}_dados.user_ramal SET estado=4, datetime_estado=NOW() WHERE userId=${usuarioId}`
            await this.querySync(sql,empresa)            
        }else{                
            //Atualiza em todas as filas estado como 0
            sql = `UPDATE ${empresa}_dados.agentes_filas SET estado=0 WHERE ramal=${usuarioId}`
            await this.querySync(sql,empresa)

            //Remove qualquer chamada presa do agente
            sql = `DELETE FROM ${empresa}_dados.campanhas_chamadas_simultaneas WHERE ramal='${usuarioId}'`
            await this.querySync(sql,empresa)
            
            sql = `UPDATE ${empresa}_dados.users SET logado=0 WHERE id=${usuarioId}` 
            await this.querySync(sql,empresa)

            sql = `UPDATE ${empresa}_dados.user_ramal SET estado=0, datetime_estado=NOW() WHERE userId=${usuarioId}`
            await this.querySync(sql,empresa)
        } 
        sql = `INSERT INTO ${empresa}_dados.registro_logins 
                                (data,hora,user_id,acao) 
                         VALUES (NOW(),NOW(),${usuarioId},'${acao}')`
        await this.querySync(sql,empresa) 
        return true
    }

    async setToken(empresa,agente,token){
        const sql = `UPDATE ${empresa}_dados.users
                        SET token='${token}'
                      WHERE id=${agente}`
        await this.querySync(sql,empresa) 
        return true
    }

    async checkToken(empresa,agente,token){
        const sql = `SELECT id
                       FROM ${empresa}_dados.users
                      WHERE token='${token}' AND id=${agente}`
        const t = await this.querySync(sql,empresa) 
        if(t.length==0){
            return false
        }
        return true
    }

    async getEmpresa(req){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const empresa = payload.empresa
        return empresa
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
        const sql = `SELECT status FROM ${empresa}_dados.users  WHERE  id=${idAgente}`
        const r = await this.querySync(sql,empresa)
        return r[0].status
    }

    async nomeEmpresa(empresa){
        const sql = `SELECT name FROM clients.accounts WHERE prefix='${empresa}'`
        const e = await this.querySync_crmdb(sql)
        return e[0].name
    }

    async totalAgentesLogados(empresa){
        const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_dados.users 
                      WHERE status=1 AND logado=1`
        return await this.querySync(sql,empresa)
    }

    async logadosPorDia(empresa,limit){
        const sql = `SELECT COUNT(DISTINCT(user_id)) AS agentes, DATE_FORMAT (data,'%d/%m/%Y') AS dia 
                       FROM ${empresa}_dados.registro_logins 
                       GROUP BY data 
                       ORDER BY data DESC 
                       LIMIT ${limit}`
        return await this.querySync(sql,empresa)
    }

    async newUser(empresa,dados){
        let sql = `SELECT id 
                       FROM ${empresa}_dados.users 
                      WHERE usuario='${dados.usuario}'`;
        const c = await this.querySync(sql,empresa)
        const rt={}
        if(c.length >= 1){
            rt['error']=1
            rt['message']=`Usuário ${dados.usuario} já existe`
            return rt
        }
        sql = `INSERT INTO ${empresa}_dados.users
                           (criacao,nome,usuario,empresa,senha,nivelAcesso,cargo,equipe,reset,logado,status)
                    VALUES (NOW(),'${dados.nome}','${dados.usuario}','${empresa}',md5('${dados.senha}'),'${dados.nivelAcesso}','${dados.cargo}','${dados.equipe}','${dados.reset}',0,'1')`
        const u = await this.querySync(sql,empresa)
        const userId = u.insertId;
        //Cadastrando ramal
        sql = `INSERT INTO ${empresa}_dados.user_ramal 
                           (userId,ramal,estado)
                    VALUES ('${userId}','${userId}',0)`
        const r = await this.querySync(sql,empresa)
        //criando ramal no asterisk
        //AOR
        sql = `INSERT INTO asterisk.ps_aors 
                           (id,max_contacts,remove_existing) 
                    VALUES ('${userId}',1,'yes')`
        const a = await this.querySync_astdb(sql)
        //AUTH
        sql = `INSERT INTO asterisk.ps_auths
                           (id,auth_type,password,realm,username) 
                    VALUES ('${userId}','userpass','mega_${userId}@agent','asterisk','${userId}')`
        const h = await this.querySync_astdb(sql)
        //ENDPOINT
        sql = `INSERT INTO asterisk.ps_endpoints 
                           (id,transport,aors,auth,context,disallow,allow,webrtc,dtls_auto_generate_cert,direct_media,force_rport,ice_support,rewrite_contact,rtp_symmetric) 
                    VALUES ('${userId}','transport-wss','${userId}','${userId}','external','all','alaw,ulaw,opus','yes','yes','no','yes','yes','yes','yes')`
        const e = await this.querySync_astdb(sql)
        return true;    
    }

    async resumoUser(empresa,user){
        const sql = `SELECT u.id, u.nome,e.equipe 
                       FROM ${empresa}_dados.users AS u 
                       LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                       WHERE u.id=${user}`
        return await this.querySync(sql,empresa)        
    }

    //retorna se agente esta logado
    async agenteLogado(empresa,idAgente){
        const sql = `SELECT logado 
                       FROM ${empresa}_dados.users 
                       WHERE id=${idAgente}`
        return await this.querySync(sql,empresa)
    }

    async totalAgentesAtivos(empresa){
        const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_dados.users
                      WHERE status=1`
        try{
            const r = await this.querySync(sql,empresa)
            return r[0].total
        }catch (error) {
            console.log(error)
            return 0
        }
    }

    async listUsers(empresa,status){
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
        return await this.querySync(sql,empresa)
    }

    async listOnlyUsers(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users 
                      WHERE status = ${status} 
                      ORDER BY ordem ASC`
        return await this.querySync(sql,empresa)
    }

    async userData(empresa,userId){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users 
                      WHERE id='${userId}'`
        return await this.querySync(sql,empresa)
    }

    async editUser(empresa,userId,userData){
        let fields=""
        if(userData.nome){ fields+=`nome='${userData.nome}', `}
        if(userData.nivelAcesso){ fields+=`nivelAcesso=${userData.nivelAcesso}, `}
        if(userData.cargo){ fields+=`cargo=${userData.cargo}, `}
        if((userData.reset===1)||(userData.reset===0)){fields+=`reset=${userData.reset}, `}
        if((userData.status===1)||(userData.status===0)){fields+=`status=${userData.status}, `}  
        if(userData.senha){ fields+=`senha=md5('${userData.senha}'), `}
        
        const sql = `UPDATE ${empresa}_dados.users
                        SET ${fields} modificado=NOW()
                      WHERE id=${userId}`
        return await this.querySync(sql,empresa)
    }

    //EQUIPES
    async novaEquipe(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.users_equipes 
                                 (supervisor,equipe,descricao,status) 
                          VALUES (${dados.supervisor},'${dados.equipe}','${dados.descricao}',1)`
        return await this.querySync(sql,empresa)
    }

    async listEquipes(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_equipes 
                      WHERE status=${status}`
        return await this.querySync(sql,empresa)
    }
    
    async dadosEquipe(empresa,idEquipe){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_equipes 
                      WHERE id=${idEquipe}`
        return await this.querySync(sql,empresa)
    }
    
    async editEquipe(empresa,idEquipe,dados){
        const sql = `UPDATE ${empresa}_dados.users_equipes 
                        SET supervisor=${dados.supervisor},
                            equipe='${dados.equipe}',
                            descricao='${dados.descricao}',
                            status=${dados.status} 
                      WHERE id=${idEquipe}`
        return await this.querySync(sql,empresa)
    }
    

    //CARGOS
    async novoCargo(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.users_cargos 
                                 (cargo,descricao,status)
                          VALUES ('${dados.cargo}','${dados.descricao}',1)`
        return await this.querySync(sql,empresa)
    }

    async listCargos(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_cargos 
                      WHERE status=${status}`
        return await this.querySync(sql,empresa)
    }
    
    async dadosCargo(empresa,idCargo){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_cargos 
                      WHERE id=${idCargo}`
        return await this.querySync(sql,empresa)
    }
    
    async editCargo(empresa,idCargo,dados){
        const sql = `UPDATE ${empresa}_dados.users_cargos 
                        SET cargo='${dados.cargo}',
                            descricao='${dados.descricao}' 
                      WHERE id=${idCargo}`
        return await this.querySync(sql,empresa)
    }
       
    //NÍVEIS DE ACESSO
    async novoNivel(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.users_niveis
                                 (nivel,descricao,status)
                          VALUES ('${dados.nivel}','${dados.descricao}',1)`
        return await this.querySync(sql,empresa)
    }
    
    async listNiveis(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_niveis 
                      WHERE status=${status}`
        return await this.querySync(sql,empresa)
    }
    
    async dadosNivel(empresa,idNivel){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_niveis 
                      WHERE id='${idNivel}'`
        return await this.querySync(sql,empresa)
    }
    
    async editNivel(empresa,idNivel,dados){
        const sql = `UPDATE ${empresa}_dados.users_niveis 
                        SET nivel='${dados.nivel}',
                            descricao='${dados.descricao}'
                      WHERE id=${idNivel}`
        return await this.querySync(sql,empresa)
    }
        
    //Informacoes dos usuarios
    async todosAgentesEmPausa(empresa){
        //Estado 2 = Em Pausa
        const sql = `SELECT ramal AS agentes 
                       FROM ${empresa}_dados.user_ramal 
                       WHERE estado=estado=2`
        return await this.querySync(sql,empresa)
    }

    async todosAgentesDisponiveis(empresa){
        //Estado 1 = Disponível
        //Estado 0 = Deslogado
        const sql = `SELECT ramal AS agentes 
                       FROM ${empresa}_dados.user_ramal 
                       WHERE estado=1`
        return await this.querySync(sql,empresa)
    }




}

exports. default = new User;