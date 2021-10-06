"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

class Clients{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async clientesAtivos(){
        const sql = `SELECT prefix 
                       FROM clients.accounts 
                      WHERE status=1`
        return await this.querySync(sql)
    }

    async getTrunk(empresa){
        const sql = `SELECT trunk, tech_prefix, type_dial 
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const trunks = await this.querySync(sql)
        if(trunks.length==0){
            return false
        }
        return trunks
    }

    async maxChannels(empresa){
        const sql = `SELECT total_channels
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const tc = await this.querySync(sql)
        if(tc.length==0){
            return 0
        }
        return tc[0].total_channels
    }

    async servers(empresa){
        const sql = `SELECT asterisk_server, asterisk_domain 
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const servers = await this.querySync(sql)
        if(servers.length==0){
            return false
        }
        return servers
    }
}

exports. default = new Clients();