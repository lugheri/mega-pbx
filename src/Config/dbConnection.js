import mysql from 'mysql';

const connect=()=>{};

//const host='mysql'
const host='localhost'
                                                                                                                                                                                                        
connect.banco=mysql.createConnection({
    host : host,
    user : 'root',
    password : '1234abc@',
    database : 'mega_conecta'
})
connect.mailings=mysql.createConnection({
    host : host,
    user : 'root',
    password : '1234abc@',
    database : 'mailings'
})
connect.asterisk=mysql.createConnection({
    host : host,
    user : 'root',
    password : '1234abc@',
    database : 'asterisk'
})

export default connect;