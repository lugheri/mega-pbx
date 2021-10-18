"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _Asterisk = require('../models/Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);

class Filas{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }
    querySync_astdb(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolAsterisk.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    //CRUD FILAS
    //Criar nova filas
    async criarFila(empresa,nomeFila,musiconhold,monitorType,monitorFormat,announce_frequency,announce_holdtime,announce_position,autofill,autopause,autopausebusy,autopausedelay,autopauseunavail,joinempty,leavewhenempty,maxlen,memberdelay,penaltymemberslimit,periodic_announce_frequency,queue_callswaiting,queue_thereare,queue_youarenext,reportholdtime,retry,ringinuse,servicelevel,strategy,timeout,timeoutpriority,timeoutrestart,weight,wrapuptime){
        
        const sql = `INSERT INTO ${_dbConnection2.default.db.asterisk}.queues 
                                (name,
                                 musiconhold,
                                 strategy,
                                 timeout,
                                 retry,
                                 autopause,
                                 maxlen,
                                 monitor_type,
                                 monitor_format,
                                 announce_frequency,
                                 announce_holdtime,
                                 announce_position,
                                 autofill,
                                 autopausebusy,
                                 autopausedelay,
                                 autopauseunavail,
                                 joinempty,
                                 leavewhenempty,
                                 memberdelay,
                                 penaltymemberslimit,
                                 periodic_announce_frequency,
                                 queue_callswaiting,
                                 queue_thereare,
                                 queue_youarenext,
                                 reportholdtime,
                                 ringinuse,
                                 servicelevel,
                                 timeoutpriority,
                                 timeoutrestart,
                                 weight,
                                 wrapuptime) 
                         VALUES ('${nomeFila}',
                                 '${musiconhold}',
                                 '${strategy}',
                                 '${timeout}',
                                 '${retry}',
                                 '${autopause}',
                                 '${maxlen}',
                                 '${monitorType}',
                                 '${monitorFormat}',
                                 '${announce_frequency}',
                                 '${announce_holdtime}',
                                 '${announce_position}',
                                 '${autofill}',
                                 '${autopausebusy}',
                                 '${autopausedelay}',
                                 '${autopauseunavail}',
                                 '${joinempty}',
                                 '${leavewhenempty}',
                                 '${memberdelay}',
                                 '${penaltymemberslimit}',
                                 '${periodic_announce_frequency}',
                                 '${queue_callswaiting}',
                                 '${queue_thereare}',
                                 '${queue_youarenext}',
                                 '${reportholdtime}',
                                 '${ringinuse}',
                                 '${servicelevel}',
                                 '${timeoutpriority}',
                                 '${timeoutrestart}',
                                 '${weight}',
                                 '${wrapuptime}')`
        await this.querySync_astdb(sql)
        return true
    }
   
    //Exibe os dads da fila
    async dadosFila(empresa,nomeFila){
        const sql = `SELECT * FROM ${_dbConnection2.default.db.asterisk}.queues 
                     WHERE name='${nomeFila}'`
        return await this.querySync_astdb(sql)
    }
    //Listar Filas
    async listar(empresa){
        const sql = `SELECT * FROM ${_dbConnection2.default.db.asterisk}.queues`
        return await this.querySync_astdb(sql)
    }   
    //Edita os dados da fila
    async editarFila(empresa,nomeFila,dados){
        const sql = `UPDATE ${_dbConnection2.default.db.asterisk}.queues 
                        SET musiconhold='${dados.musiconhold}',
                            strategy='${dados.strategy}',
                            timeout='${dados.timeout}',
                            retry='${dados.retry}',
                            autopause='${dados.autopause}',
                            maxlen='${dados.maxlen}' 
                      WHERE name='${nomeFila}'`
        return await this.querySync_astdb(sql)
    }

    async editarNomeFila(empresa,nomeFilaAtual,name){
        const sql = `UPDATE ${_dbConnection2.default.db.asterisk}.queues SET name='${name}' WHERE name='${nomeFilaAtual}'`
        return await this.querySync_astdb(sql)
    }

     //Remove a fila
     async removerFila(empresa,nomeFila){
        let sql = `DELETE FROM ${_dbConnection2.default.db.asterisk}.queues WHERE name='${nomeFila}'`
        await this.querySync_astdb(sql)
        sql = `DELETE FROM ${_dbConnection2.default.db.asterisk}.queue_members WHERE queue_name='${nomeFila}'`
        await this.querySync_astdb(sql)
    }

    async filaCampanha(empresa,idCampanha){
        const sql = `SELECT idFila, nomeFila 
                       FROM ${empresa}_dados.campanhas_filas 
                      WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)
        
    }


    async agentesAtivos(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.users 
                      WHERE status=1 ORDER BY ordem ASC`
        return await this.querySync(sql)
    }

    async estadoRamal(empresa,idAgente){
        const sql = `SELECT estado 
                       FROM ${empresa}_dados.user_ramal 
                      WHERE userId=${idAgente}`
        return await this.querySync(sql)
    }

    async membrosNaFila(empresa,idFila){
        const sql = `SELECT u.nome, f.ramal 
                       FROM ${empresa}_dados.agentes_filas AS f 
                       JOIN ${empresa}_dados.users AS u ON f.ramal=u.id 
                      WHERE fila=${idFila}  
                      ORDER BY f.id ASC;`
        return await this.querySync(sql)
    }

    async membrosForaFila(empresa,idFila){
        const sql = `SELECT u.id as ramal, u.nome 
                       FROM ${empresa}_dados.users AS u 
                      WHERE status=1  
                   ORDER BY u.nome ASC;`
        return await this.querySync(sql)   
    }

    

    //AddMembro
    async addMembroFila(empresa,ramal,idFila){
        const check = await this.verificaMembroFila(empresa,ramal,idFila)
        if(check){
            return false
        }
        const estado = await this.estadoRamal(empresa,ramal)
        let sql = `INSERT INTO ${empresa}_dados.agentes_filas 
                              (ramal,fila,estado,ordem) 
                       VALUES (${ramal},${idFila},${estado[0].estado},0)`
        await this.querySync(sql)
        sql = `SELECT nome 
                 FROM ${empresa}_dados.filas 
                WHERE id=${idFila}`
        const fila = await this.querySync(sql)
        const queue_name = fila[0].nome
        const queue_interface = `PJSIP/${ramal}`
        const membername = ramal
        const state_interface = ''//`${queue_interface}@megatrunk`
        const penalty = 0
        return await _Asterisk2.default.addMembroFila(empresa,queue_name,queue_interface,membername,state_interface,penalty)
    }
    
    ///remove membros da fila
    async removeMembroFila(empresa,ramal,idFila){
        let sql = `DELETE FROM ${empresa}_dados.agentes_filas
                     WHERE ramal=${ramal} AND fila=${idFila}`
        await this.querySync(sql)
        
        sql = `SELECT nome 
                 FROM ${empresa}_dados.filas 
                WHERE id=${idFila}`
        const fila = await this.querySync(sql)
        const nomeFila = fila[0].nome
        return await _Asterisk2.default.removeMembroFila(empresa,nomeFila,ramal)
    } 

    //verifica se membro pertence a filas
    async verificaMembroFila(empresa,idAgente,idFila){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.agentes_filas 
                      WHERE ramal=${idAgente} AND fila=${idFila}`
        const r = await this.querySync(sql)
        return r.length
    }

   



}

exports. default = new Filas();