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
        db['mailings'] = 'mailings'
        db['dados'] = 'mega_conecta'
    break;
    default:
        host = process.env.DB_HOST
        user['name'] = process.env.DB_USER
        user['pass'] = process.env.DB_PASS

        db['asterisk'] = 'asterisk'
        db['mailings'] = 'mailings'
        db['dados'] = 'mega_conecta'
}


const connect = ()=>{};

connect.db=db

connect.pool=_mysql22.default.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : db['dados'],
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

connect.base=((database)=>{
    return _mysql22.default.createConnection({        
        host : host,
        user : user['name'],
        password : user['pass'],
        database : database
    })   
})   

connect.banco=_mysql22.default.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : db['dados']
})

connect.mailings=_mysql22.default.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : db['mailings']
})
connect.asterisk=_mysql22.default.createConnection({    
    host : host,
    user : user['name'],
    password : user['pass'],
    database : db['asterisk']
})



exports. default = connect;