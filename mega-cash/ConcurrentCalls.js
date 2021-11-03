const dbMysql = require("./dbMysql");
async function ConcurrentCalls(db) {
    const conn = await dbMysql.connect('localhost', 'root', 'well', db, '32767');
    let sql = 'SELECT total as total  FROM ' + db + '.log_chamadas_simultaneas ORDER BY id DESC  LIMIT 1'
    const [rows] = await conn.query({ sql: sql })
    return rows[0].total;
}

module.exports = { ConcurrentCalls }