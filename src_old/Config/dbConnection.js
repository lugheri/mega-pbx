import mysql from 'mysql';
const connect=mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '1234abc@',
    database : 'mega_conecta'
});

export default connect;

