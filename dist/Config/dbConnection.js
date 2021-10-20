"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql2 = require('mysql2'); var _mysql22 = _interopRequireDefault(_mysql2);
var _Clients = require('../models/Clients'); var _Clients2 = _interopRequireDefault(_Clients);
//Definição de Ambiente
//const environment = "dev"
const environment = "DB_DEV"

let host = 'localhost'
let astdb_host = 'localhost'
let crm_host = 'localhost'
const user = []
const db = []
switch(environment){
    case 'dev':
        host = '34.121.31.128'
        astdb_host = '34.121.31.128'
        crm_host = '34.121.31.128'
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

/*MYSQL*/
/*
connect.poolCRM=mysql.createConnection({    
    host:crm_host,
    user : user['name'],
    password : user['pass'],
    database : "clients"
})
connect.poolConta = (empresa,hostEmp)=>{   
    return mysql.createConnection({
        host:hostEmp,
        port:3306,
        user : user['name'],
        password : user['pass'],
        database : `clientes_ativos`
    })
}
console.log('poolAsterisk',astdb_host)
connect.poolAsterisk=mysql.createConnection({
    host:astdb_host,
    user : user['name'],
    password : user['pass'],
    database : "asterisk"
})*/



/*MYSQL2*/
connect.poolCRM=_mysql22.default.createConnection({    
    host:crm_host,
    user : user['name'],
    password : user['pass'],
    database : "clients",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit:0
})

connect.poolConta = (empresa,hostEmp)=>{  
    //console.log('host',hostEmp)
    return _mysql22.default.createConnection({
        host:hostEmp,
        port:3306,
        user : user['name'],
        password : user['pass'],
        database : `clientes_ativos`,
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit:0
    })
}

console.log('poolAsterisk',astdb_host)
connect.poolAsterisk=_mysql22.default.createConnection({
    host:astdb_host,
    user : user['name'],
    password : user['pass'],
    database : "asterisk",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit:0
}) 



/*
connect.poolEmpresa=mysql.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : db['clients'],
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit:0
})*/

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