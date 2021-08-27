import mysql from 'mysql2';
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

connect.pool=mysql.createPool({
    host:host,
    user : user['name'],
    password : user['pass'],
    database : 'mega_conecta',
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
    database : 'mega_conecta'
})

connect.mailings=mysql.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'mailings'
})
connect.asterisk=mysql.createConnection({    
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'asterisk'
})



export default connect;