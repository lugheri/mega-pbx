"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql2 = require('mysql2'); var _mysql22 = _interopRequireDefault(_mysql2);
var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);

const connect = ()=>{};
      connect.pool = async (empresa,type = 'dados',database_dados='clientes_ativos') =>{
        const environment = process.env.ENVIRONMENT
        let host = 'localhost'
        let database = 'mysql'
        switch(environment){
            case 'dev':
                switch(type){
                    case 'crm':                        
                        host = '35.225.248.121'//CRM DEV
                        //host = '35.198.60.112'//CRM SP
                        //host = '34.95.152.103'//CRM PG
                        database = 'clients'
                    break;
                    case 'asterisk':
                        host = '34.122.88.236'//AST DEV
                        //host = '34.95.148.41'//AST SP
                        //host = '35.247.237.187'//AST PG
                        database = 'asterisk'
                    break;
                    default:
                        host = await _Clients2.default.serversDbs(empresa,environment)
                        database = database_dados
                }
            break;
            default:
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
                        host = await _Clients2.default.serversDbs(empresa,environment)
                        database = database_dados
                }
        }
            if(process.env.DEBUG=='on'){
                console.log('Ambiente',environment);
                console.log('type',type)
                console.log('host',host)                
                console.log('database',database)
            }
           
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