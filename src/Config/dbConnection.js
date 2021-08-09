import mysql from 'mysql2';
const dev = 'localhost'

//const host = dev
const host = 'mysql'
    
const user = []
user['name'] = 'root'
user['pass'] = '1234abc@'

/*function testHost(hst){
    return new Promise((resolve, reject)=>{
        const conexao = mysql.createConnection({
                        host : hst,
                        user : 'root',
                        password : '1234abc@'
                    })
        conexao.query('use mega_conecta;',(e,r)=>{
            if(e) resolve('mysql')
            
            resolve(hst)
        })             
    })
}*/

const connect=()=>{};

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