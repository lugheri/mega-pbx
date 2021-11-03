const moment = require("moment");
const { ConcurrentCalls } = require("./ConcurrentCalls");
const dbMysql = require("./dbMysql");
(async() => {
    while (true) {
        let startedOn = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
        console.log('Começou!');
        let data = await GetFromMysql()
        await SetToRedis(data)
        let endedOn = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
        console.log('Atualizado => ', startedOn, endedOn)
        await sleep(10000)
    }


})();

async function GetFromMysql() {
    const conn = await dbMysql.connect('localhost', 'root', 'well', 'clientes_ativos', '32767');
    let sql = 'SELECT table_schema from information_schema.tables where table_schema like "%_dados" GROUP BY table_schema;'
    const [dataBases] = await conn.execute({ sql: sql, rowsAsArray: true });


    let data = []

    for (dataBase of dataBases) {
        let total = await ConcurrentCalls(dataBase)
        let companyCollection = {
                databaseName: dataBase[0],
                concurrentCalls: total,
                lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss.SSS')
            }
            //console.log('companyCollection => ', companyCollection)
        data.push({
            databaseName: dataBase[0],
            concurrentCalls: total,
            lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
        })
    }
    return data
}

async function SetToRedis(data) {
    const redis = require('promise-redis')();
    const client = redis.createClient(6379, 'localhost');

    client.on("error", (error) => {
        console.error(error);
    });

    const result = await client.set("ConcurrentCalls", JSON.stringify(data));
    //console.log(`result: ${result}`);

    const result2 = await client.get("ConcurrentCalls");
    console.log(`result2: ${result2}`);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}