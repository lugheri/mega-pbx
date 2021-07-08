"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql = require('mysql'); var _mysql2 = _interopRequireDefault(_mysql);
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

connect.base=((database)=>{
    return _mysql2.default.createConnection({        
        host : host,
        user : user['name'],
        password : user['pass'],
        database : database
    })   
})   

connect.banco=_mysql2.default.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'mega_conecta'
})

connect.mailings=_mysql2.default.createConnection({
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'mailings'
})
connect.asterisk=_mysql2.default.createConnection({    
    host : host,
    user : user['name'],
    password : user['pass'],
    database : 'asterisk'
})



exports. default = connect;