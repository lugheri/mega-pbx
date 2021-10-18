import mysql from 'mysql2';
import Clients from '../models/Clients';
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
        host = process.env.DB_HOST
        astdb_host = process.env.ASTDB_HOST
        crm_host = process.env.CRMDB_HOST
        user['name'] = process.env.DB_USER
        user['pass'] = process.env.DB_PASS

        db['asterisk'] = 'asterisk'
        db['clients'] = 'clients'
}
const connect = ()=>{};
connect.db=db

connect.poolCRM=mysql.createPool({
    host:crm_host,
    user : user['name'],
    password : user['pass'],
    database : "clients",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit:0
})

connect.poolConta = function(empresa,hostEmp){   


    return mysql.createPool({
        host:hostEmp,
        port:3306,
        user : user['name'],
        password : user['pass'],
        database : `${empresa}_dados`,
        waitForConnections: true,
        connectionLimit: 5000,
        queueLimit:0
    })
}


connect.poolEmpresa=mysql.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : db['clients'],
    waitForConnections: true,
    connectionLimit: 5000,
    queueLimit:0
})



connect.poolAsterisk=mysql.createPool({
    host:astdb_host,
    user : user['name'],
    password : user['pass'],
    database : "asterisk",
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit:0
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


export default connect;