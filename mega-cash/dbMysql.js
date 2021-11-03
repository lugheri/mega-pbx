 const mysql = require("mysql2/promise");
 async function connect(host, user, pass, db, port) {
     if (global.connection && global.connection.state !== 'disconnected')
         return global.connection;


     const connection = await mysql.createConnection("mysql://" + user + ":" + pass + "@" + host + ":" + port + "/" + db);
     console.log("Conectou no MySQL!");
     global.connection = connection;
     return connection;
 }

 module.exports = { connect }