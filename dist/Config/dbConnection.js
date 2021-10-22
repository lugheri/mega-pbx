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
                host = await _Clients2.default.serversDbs(empresa)//'35.194.25.54'// 
                database = database_dados
        }
            console.log(type,host)
            return  _mysql22.default.createPool({
                host     : host,
                port     : 3306,
                user     : process.env.DB_USER,
                password : process.env.DB_PASS,
                database : database
        })
    }
exports. default = connect;









/*import mysql from 'mysql2';
import Clients from '../models/Clients'
//Definição de Ambiente
//const environment = "dev"
const environment = "DB_DEV"

let host = 'localhost'
let astdb_host = 'localhost'
let crm_host = 'localhost'
let database= 'localhost'
const user = []
const db = []
switch(environment){
    case 'dev':
        host = '34.121.31.128'
        astdb_host = '34.121.31.128'
        crm_host = '34.121.31.128'
        datadb_host= '34.121.31.128'
        user['name'] = 'megaconecta'
        user['pass'] = 'M3g4_devDB@2021'
        db['asterisk'] = 'asterisk'
        db['clients'] = 'clients'
    break;
    default:
        astdb_host = process.env.ASTDB_HOST
        crm_host = process.env.CRMDB_HOST
       
        user['name'] = process.env.DB_USER
        user['pass'] = process.env.DB_PASS

        db['asterisk'] = 'asterisk'
        db['clients'] = 'clients'
}

const connect = ()=>{};

/*MYSQL2*
connect.pool = async (empresa,type = 'dados') =>{
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
            host = await Clients.serversDbs(empresa),//'35.194.25.54',//
            database = `clientes_ativos`
    }
        console.log(type,host)
        return  mysql.createPool({
            host               : host,
            port               : 3306,
            user               : user['name'],
            password           : user['pass'],
            database           : database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit:0
    })
}


export default connect;*/
