"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql2 = require('mysql2'); var _mysql22 = _interopRequireDefault(_mysql2);
//Definição de Ambiente
//const environment = "dev"
const environment = "DB_DEV"



let host = 'localhost'
const user = []
const db = []
switch(environment){
    case 'dev':
        host = 'localhost'
        user['name'] = 'root'
        user['pass'] = '1234abc@'
        db['asterisk'] = 'asterisk'
        db['clients'] = 'clients'
    break;
    default:
        host = process.env.DB_HOST
        user['name'] = process.env.DB_USER
        user['pass'] = process.env.DB_PASS

        db['asterisk'] = 'asterisk'
        db['clients'] = 'clients'
}
const connect = ()=>{};
connect.db=db
connect.poolEmpresa=_mysql22.default.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : db['clients'],
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
})
/*

connect.db=db

connect.pool=mysql.createPool({
        host:host,
        user : user['name'],
        password : user['pass'],
        database : db['dados'],
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    })



connect.base=((database)=>{
    return mysql.createConnection({        
        host : host,
        user : user['name'],
        password : user['pass'],
        database : database
    })   
})   

connect.banco=mysql.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : db['dados']
})

connect.mailings=mysql.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : db['mailings']
})
connect.asterisk=mysql.createConnection({    
    host : host,
    user : user['name'],
    password : user['pass'],
    database : db['asterisk']
})

*/


exports. default = connect;