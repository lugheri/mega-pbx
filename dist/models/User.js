"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);

class User{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async findEmpresa(usuario){
        const u = usuario.split('@');
        const empresa = u[1]
        const sql = `SELECT client_number,prefix
                      FROM accounts
                     WHERE prefix='${empresa}'
                       AND status=1`
        return await this.querySync(sql) 
    }
    
    async findUser(empresa,usuario){
      

        const sql = `SELECT *
                       FROM ${empresa}_dados.users 
                      WHERE usuario='${usuario}' AND status=1`;
        return await this.querySync(sql) 
    }

    async registraLogin(empresa,usuarioId,acao){
        let sql = `INSERT INTO ${empresa}_dados.registro_logins 
                                (data,hora,user_id,acao) 
                         VALUES (NOW(),NOW(),${usuarioId},'${acao}')`
        await this.querySync(sql) 

        if(acao=='login'){
            //Atualiza em todas as filas estado como 1
            sql = `UPDATE ${empresa}_dados.agentes_filas SET estado=4 WHERE ramal=${usuarioId}`
            await this.querySync(sql) 
                               
            sql = `UPDATE ${empresa}_dados.users SET logado=1, ultimo_acesso=NOW() WHERE id=${usuarioId}`
            await this.querySync(sql) 
            
            sql = `UPDATE ${empresa}_dados.user_ramal SET estado=4 WHERE userId=${usuarioId}`
            await this.querySync(sql) 
            return true
        }else{                
            //Atualiza em todas as filas estado como 0
            sql = `UPDATE ${empresa}_dados.agentes_filas SET estado=0 WHERE ramal=${usuarioId}`
            await this.querySync(sql)
            
            sql = `UPDATE ${empresa}_dados.users SET logado=0 WHERE id=${usuarioId}`
            await this.querySync(sql)

            sql = `UPDATE ${empresa}_dados.user_ramal SET estado=0 WHERE userId=${usuarioId}`
            await this.querySync(sql)
        } 
    }

    async getEmpresa(req){
        const authHeader = req.headers.authorization;
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        const empresa = payload.empresa
        return empresa
    }

    async totalAgentesLogados(empresa){
        const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_dados.users 
                      WHERE status=1 AND logado=1`
        return await this.querySync(sql)
    }

    async logadosPorDia(empresa,limit){
        const sql = `SELECT COUNT(DISTINCT(user_id)) AS agentes, DATE_FORMAT (data,'%d/%m/%Y') AS dia 
                       FROM ${empresa}_dados.registro_logins 
                       GROUP BY data 
                       ORDER BY data DESC 
                       LIMIT ${limit}`
        return await this.querySync(sql)
    }

    async newUser(empresa,dados){
        let sql = `SELECT id 
                       FROM ${empresa}_dados.users 
                      WHERE usuario='${dados.usuario}'`;
        const c = await this.querySync(sql)
        const rt={}
        if(c.length >= 1){
            rt['error']=1
            rt['message']=`Usuário ${dados.usuario} já existe`
            return rt
        }
        sql = `INSERT INTO ${empresa}_dados.users
                           (criacao,nome,usuario,senha,nivelAcesso,cargo,equipe,reset,logado,status)
                    VALUES (NOW(),'${dados.nome}','${dados.usuario}',md5('${dados.senha}'),'${dados.nivelAcesso}','${dados.cargo}','${dados.equipe}','${dados.reset}',0,'${dados.status}')`
        const u = await this.querySync(sql)
        const userId = u.insertId;
        //Cadastrando ramal
        sql = `INSERT INTO ${empresa}_dados.user_ramal 
                           (userId,ramal,estado)
                    VALUES ('${userId}','${userId}',0)`
        const r = await this.querySync(sql)
        //criando ramal no asterisk
        //AOR
        sql = `INSERT INTO ${_dbConnection2.default.db.asterisk}.ps_aors 
                           (id,max_contacts,remove_existing) 
                    VALUES ('${userId}',1,'yes')`
        const a = await this.querySync(sql)
        //AUTH
        sql = `INSERT INTO ${_dbConnection2.default.db.asterisk}.ps_auths
                           (id,auth_type,password,realm,username) 
                    VALUES ('${userId}','userpass','mega_${userId}@agent','asterisk','${userId}')`
        const h = await this.querySync(sql)
        //ENDPOINT
        sql = `INSERT INTO ${_dbConnection2.default.db.asterisk}.ps_endpoints 
                           (id,transport,aors,auth,context,disallow,allow,webrtc,dtls_auto_generate_cert,direct_media,force_rport,ice_support,rewrite_contact,rtp_symmetric) 
                    VALUES ('${userId}','transport-wss','${userId}','${userId}','external','all','alaw,ulaw,opus','yes','yes','no','yes','yes','yes','yes')`
        const e = await this.querySync(sql)
        return true;    
    }

    async resumoUser(empresa,user){
        const sql = `SELECT u.id, u.nome,e.equipe 
                       FROM ${empresa}_dados.users AS u 
                       LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                       WHERE u.id=${user}`
        return await this.querySync(sql)        
    }

    //retorna se agente esta logado
    async agenteLogado(empresa,idAgente){
        const sql = `SELECT logado 
                       FROM ${empresa}_dados.users 
                       WHERE id=${idAgente}`
        return await this.querySync(sql)
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
        return await this.querySync(sql)
    }

    async listOnlyUsers(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users 
                      WHERE status = ${status} 
                      ORDER BY ordem ASC`
        return await this.querySync(sql)
    }

    async userData(empresa,userId){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users 
                      WHERE id='${userId}'`
        return await this.querySync(sql)
    }

    async editUser(empresa,userId,userData){
        const sql = `UPDATE ${empresa}_dados.users
                        SET modificado=NOW(),
                            nome='${userData.nome}',                            
                            nivelAcesso=${userData.nivelAcesso},
                            cargo=${userData.cargo},
                            reset=${userData.reset},
                            status=${userData.status},
                            senha=md5('${userData.senha}') 
                      WHERE id=${userId}`
        return await this.querySync(sql)
    }

    //EQUIPES
    async novaEquipe(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.users_equipes 
                                 (supervisor,equipe,descricao,status) 
                          VALUES (${dados.supervisor},'${dados.equipe}','${dados.descricao}',1)`
        return await this.querySync(sql)
    }

    async listEquipes(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_equipes 
                      WHERE status=${status}`
        return await this.querySync(sql)
    }
    
    async dadosEquipe(empresa,idEquipe){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_equipes 
                      WHERE id=${idEquipe}`
        return await this.querySync(sql)
    }
    
    async editEquipe(empresa,idEquipe,dados){
        const sql = `UPDATE ${empresa}_dados.users_equipes 
                        SET supervisor=${dados.supervisor},
                            equipe='${dados.equipe}',
                            descricao='${dados.descricao}',
                            status=${dados.status} 
                      WHERE id=${idEquipe}`
        return await this.querySync(sql)
    }
    

    //CARGOS
    async novoCargo(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.users_cargos 
                                 (cargo,descricao,status)
                          VALUES ('${dados.cargo}','${dados.descricao}',1)`
        return await this.querySync(sql)
    }

    async listCargos(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_cargos 
                      WHERE status=${status}`
        return await this.querySync(sql)
    }
    
    async dadosCargo(empresa,idCargo){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_cargos 
                      WHERE id=${idCargo}`
        return await this.querySync(sql)
    }
    
    async editCargo(empresa,idCargo,dados){
        const sql = `UPDATE ${empresa}_dados.users_cargos 
                        SET cargo='${dados.cargo}',
                            descricao='${dados.descricao}' 
                      WHERE id=${idCargo}`
        return await this.querySync(sql)
    }
       
    //NÍVEIS DE ACESSO
    async novoNivel(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.users_niveis
                                 (nivel,descricao,status)
                          VALUES ('${dados.nivel}','${dados.descricao}',1)`
        return await this.querySync(sql)
    }
    
    async listNiveis(empresa,status){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_niveis 
                      WHERE status=${status}`
        return await this.querySync(sql)
    }
    
    async dadosNivel(empresa,idNivel){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users_niveis 
                      WHERE id='${idNivel}'`
        return await this.querySync(sql)
    }
    
    async editNivel(empresa,idNivel,dados){
        const sql = `UPDATE ${empresa}_dados.users_niveis 
                        SET nivel='${dados.nivel}',
                            descricao='${dados.descricao}'
                      WHERE id=${idNivel}`
        return await this.querySync(sql)
    }
        
    //Informacoes dos usuarios
    async todosAgentesEmPausa(empresa){
        //Estado 2 = Em Pausa
        const sql = `SELECT ramal AS agentes 
                       FROM ${empresa}_dados.user_ramal 
                       WHERE estado=estado=2`
        return await this.querySync(sql)
    }

    async todosAgentesDisponiveis(empresa){
        //Estado 1 = Disponível
        //Estado 0 = Deslogado
        const sql = `SELECT ramal AS agentes 
                       FROM ${empresa}_dados.user_ramal 
                       WHERE estado=1`
        return await this.querySync(sql)
    }




}

exports. default = new User;