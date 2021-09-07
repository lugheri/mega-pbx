import mysql from 'mysql2';
//Definição de Ambiente
const environment = "dev"
//const environment = "DB_DEV"



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
        db['dados'] = 'megaconecta_dados'
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

connect.poolEmpresa=mysql.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : db['clients'],
    waitForConnections: true,
    connectionLimit: 10,
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


export default connect;