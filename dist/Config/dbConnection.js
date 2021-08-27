"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql2 = require('mysql2'); var _mysql22 = _interopRequireDefault(_mysql2);
//Definição de Ambiente
//const environment = "dev"
//const environment = "ks8"
const environment = "CLOUD_DB"


let host = 'localhost'
const user = []

switch(environment){
    case 'dev':
        host = 'localhost'
        user['name'] = 'root'
        user['pass'] = '1234abc@'
    break;
    case 'ks8':
        host = 'mysql'
        user['name'] = 'root'
        user['pass'] = '1234abc@'
    break;
    default:
        host = '104.154.176.149'
        user['name'] = 'megauser'
        user['pass'] = 'M3g4_devDB@'
}

const connect = ()=>{};

connect.pool=_mysql22.default.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : 'mega_conecta',
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
    database : 'mega_conecta'
})

connect.mailings=_mysql22.default.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'mailings'
})
connect.asterisk=_mysql22.default.createConnection({    
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'asterisk'
})



exports. default = connect;