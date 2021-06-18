"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mysql = require('mysql'); var _mysql2 = _interopRequireDefault(_mysql);

const  connect=()=>{};

const host='mysql'
//const host='localhost'
                                                                                                                                                                                                        
connect.banco=_mysql2.default.createConnection({
    host : host,
    user : 'root',
    password : '1234abc@',
    database : 'mega_conecta'
})
connect.mailings=_mysql2.default.createConnection({
    host : host,
    user : 'root',
    password : '1234abc@',
    database : 'mailings'
})
connect.asterisk=_mysql2.default.createConnection({
    host : host,
    user : 'root',
    password : '1234abc@',
    database : 'asterisk'
})


exports. default = connect;