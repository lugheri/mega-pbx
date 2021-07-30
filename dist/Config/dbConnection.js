"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql2 = require('mysql2'); var _mysql22 = _interopRequireDefault(_mysql2);
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