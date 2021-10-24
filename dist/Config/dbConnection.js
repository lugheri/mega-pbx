"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql2 = require('mysql2'); var _mysql22 = _interopRequireDefault(_mysql2);
var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);

const connect = ()=>{};
      connect.pool = async (empresa,type = 'dados',database_dados='clientes_ativos') =>{
          
        let host = 'localhost'
        let database = 'mysql'
        switch(type){
            case 'crm':
                host = process.env.CRMDB_HOST
                database = 'clients'
            break;
            case 'asterisk':
                host = process.env.ASTDB_HOST
                database = 'asterisk'
            break;
            default:
                host =  await _Clients2.default.serversDbs(empresa)//'35.194.25.54'//
                database = database_dados
        }
            //console.log(type,host)
            return  _mysql22.default.createPool({
                host     : host,
                port     : 3306,
                user     : process.env.DB_USER,
                password : process.env.DB_PASS,
                database : database,
                waitForConnections: true,
                connectionLimit: 0,
                queueLimit: 0
        })
    }
exports. default = connect;