"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

class Gravacao{
    listarGravacoes(callback){
        const sql = `SELECT * FROM records ORDER BY id DESC LIMIT 30`
        _dbConnection2.default.banco.query(sql,callback)
    }

    buscarGravacao(de,ate,ramal,numero,protocolo,callback){
        if(protocolo){
            const sql = `SELECT uniqueid FROM historico_atendimento as h JOIN records AS r ON h.uniqueid=r.uniqueid WHERE h.protocolo='${protocolo}'`
            console.log(sql)
            _dbConnection2.default.banco.query(sql,callback)
        }else{
            let datas_de=""
            if(de){
                datas_de=`AND c.calldate>='${de}'`
            }  
            
            let datas_ate=""
            if(ate){
                datas_ate=`AND c.calldate<='${ate}'`
            }  

            let datas_ramal=""
            if(ramal){
                datas_ramal=`AND c.src='${ramal}'`
            }  
            let datas_numero=""
            if(numero){
                datas_numero=`AND c.dst='${numero}'`
            }  
            const parametros = `${datas_de} ${datas_ate}  ${datas_ramal}  ${datas_numero} `

            const sql = `SELECT r.* FROM asterisk.cdr AS c JOIN mega_conecta.records AS r ON r.uniqueid=c.uniqueid WHERE duration>=0 ${parametros}`
            console.log(sql)
            _dbConnection2.default.banco.query(sql,callback)
        }

    }

    infoGravacao(idGravacao,callback){
        const sql = `SELECT * FROM records WHERE id=${idGravacao}`
        _dbConnection2.default.banco.query(sql,callback)
    }
}

exports. default = new Gravacao();