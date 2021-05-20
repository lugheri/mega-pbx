"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
class User{
    findUser(usuario,callback){
        const sql = `SELECT * FROM users WHERE usuario='${usuario}' AND status=1`;
        _dbConnection2.default.banco.query(sql, usuario, callback)
    }

    registraLogin(usuarioId,acao,callback){
        const sql = `INSERT INTO registro_logins (data,hora,user_id,acao) VALUES (NOW(),NOW(),${usuarioId},'${acao}')`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            if(acao=='login'){
                //Atualiza em todas as filas estado como 1
                const sql = `UPDATE agentes_filas SET estado=1 WHERE ramal=${usuarioId}`
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                    if(e) throw e

                    const sql = `UPDATE users SET logado=4, ultimo_acesso=NOW() WHERE id=${usuarioId}`
                    _dbConnection2.default.banco.query(sql,callback)
                })                
            }else{                
                //Atualiza em todas as filas estado como 0
                const sql = `UPDATE agentes_filas SET estado=0 WHERE ramal=${usuarioId}`
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                    if(e) throw e

                    const sql = `UPDATE users SET logado=0 WHERE id=${usuarioId}`
                    _dbConnection2.default.banco.query(sql,callback)
                }) 
            } 
        })        
    }

    totalAgentesLogados(callback){
        const sql = `SELECT COUNT(id) AS total FROM users WHERE STATUS=1 AND logado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    logadosPorDia(limit,callback){
        const sql = `SELECT COUNT(DISTINCT(user_id)) AS agentes, DATE_FORMAT (data,'%d/%m/%Y') AS dia FROM registro_logins GROUP BY data ORDER BY data DESC LIMIT ${limit}`
        _dbConnection2.default.banco.query(sql,callback) 
    }

    newUser(dados,callback){
        const sql = `SELECT id FROM users WHERE usuario='${dados.usuario}'`;
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            if(r.length >= 1){
                const resp = {
                    "erro":1,
                    "descricao":`Usuário ${dados.usuario} já existe`
                }
                callback(e,resp)
            }else{
                const sql = `INSERT INTO users (criacao,nome,usuario,senha,nivelAcesso,cargo,equipe,reset,logado,status) VALUES (NOW(),'${dados.nome}','${dados.usuario}',md5('${dados.senha}'),'${dados.nivelAcesso}','${dados.cargo}','${dados.equipe}','${dados.reset}',0,'${dados.status}')`
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                    if(e) throw e

                    const userId = r.insertId;

                    //Cadastrando ramal
                    const sql = `INSERT INTO user_ramal (userId,ramal) VALUES ('${userId}','${userId}')`
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(e) throw e

                        //criando ramal no asterisk
                        //AOR
                        const sql = `INSERT INTO ps_aors (id,max_contacts,remove_existing) VALUES ('${userId}',1,'yes')`
                        _dbConnection2.default.asterisk.query(sql,(e,r)=>{
                            if(e) throw e
                            
                            //AUTH
                            const sql = `INSERT INTO ps_auths (id,auth_type,password,realm,username) VALUES ('${userId}','userpass','mega_${userId}@agent','asterisk','${userId}')`
                            _dbConnection2.default.asterisk.query(sql,(e,r)=>{
                                if(e) throw e

                                //ENDPOINT
                                const sql = `INSERT INTO ps_endpoints (id,transport,aors,auth,context,disallow,allow,webrtc,dtls_auto_generate_cert,direct_media,force_rport,ice_support,rewrite_contact,rtp_symmetric) VALUES ('${userId}','transport-wss','${userId}','${userId}','external','all','alaw,ulaw,opus','yes','yes','no','yes','yes','yes','yes')`
                                _dbConnection2.default.asterisk.query(sql,callback)
                            })  
                        })
                    })
                })
            }
        })        
    }

    resumoUser(user,callback){
        const sql = `SELECT u.nome,e.equipe FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id WHERE u.id=${user}`
        _dbConnection2.default.banco.query(sql,callback)        
    }

    //retorna se agente esta logado
    agenteLogado(idAgente,callback){
        const sql = `SELECT logado FROM users WHERE id=${idAgente}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    listUsers(status,callback){
        const sql = `SELECT u.id,DATE_FORMAT (u.criacao,'%d/%m/%Y %H:%i:%s') as criacao,u.nome,u.usuario,u.nivelAcesso,e.equipe,c.cargo,n.nivel,u.reset,u.logado,DATE_FORMAT (u.ultimo_acesso,'%d/%m/%Y %H:%i:%s') as ultimo_acesso, u.status FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id  LEFT JOIN users_cargos AS c ON u.cargo=c.id LEFT JOIN users_niveis AS n ON u.nivelAcesso=n.id WHERE u.status=${status} ORDER BY u.id DESC`
        _dbConnection2.default.banco.query(sql,callback)
    }

    listOnlyUsers(status,callback){
        const sql = `SELECT * FROM users WHERE status = ${status} ORDER BY ordem ASC`
        _dbConnection2.default.banco.query(sql,callback)
    }

    userData(userId,callback){
        const sql = `SELECT * FROM users WHERE id='${userId}'`
        _dbConnection2.default.banco.query(sql,callback)
    }

    editUser(userId,userData,callback){
        const sql = `UPDATE users SET modificado=NOW(), ? ,senha=md5('${userData.senha}') WHERE ?`
        _dbConnection2.default.banco.query(sql,[userData,userId],callback)
    }

    //EQUIPES
    novaEquipe(dados,callback){
        const sql = `INSERT INTO users_equipes (supervisor,equipe,descricao,status) VALUES (${dados.supervisor},'${dados.equipe}','${dados.descricao}',1)`
        _dbConnection2.default.banco.query(sql,callback)
    }

    listEquipes(status,callback){
        const sql = `SELECT * FROM users_equipes WHERE status=${status}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    dadosEquipe(idEquipe,callback){
        const sql = `SELECT * FROM users_equipes WHERE id=${idEquipe}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    editEquipe(idEquipe,dados,callback){
        const sql = `UPDATE users_equipes SET ? WHERE ?`
        _dbConnection2.default.banco.query(sql,[dados,idEquipe],callback)
    }
    

    //CARGOS
    novoCargo(dados,callback){
        const sql = `INSERT INTO users_cargos (cargo,descricao,status) VALUES ('${dados.cargo}','${dados.descricao}',1)`
        _dbConnection2.default.banco.query(sql,callback)
    }

    listCargos(status,callback){
        const sql = `SELECT * FROM users_cargos WHERE status=${status}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    dadosCargo(idCargo,callback){
        const sql = `SELECT * FROM users_cargos WHERE id=${idCargo}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    editCargo(idCargo,dados,callback){
        const sql = `UPDATE users_cargos SET ? WHERE ?`
        _dbConnection2.default.banco.query(sql,[dados,idCargo],callback)
    }
       
    //NÍVEIS DE ACESSO
    novoNivel(dados,callback){
        const sql = `INSERT INTO users_niveis (nivel,descricao,status) VALUES ('${dados.nivel}','${dados.descricao}',1)`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    listNiveis(status,callback){
        const sql = `SELECT * FROM users_niveis WHERE status=${status}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    dadosNivel(idNivel,callback){
        const sql = `SELECT * FROM users_niveis WHERE id='${idNivel}'`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    editNivel(idNivel,dados,callback){
        const sql = `UPDATE users_niveis SET ? WHERE ?`
        _dbConnection2.default.banco.query(sql,[dados,idNivel],callback)
    }
}

exports. default = new User;