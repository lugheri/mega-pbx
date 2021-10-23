import mysql from 'mysql2';
import Clients from '../models/Clients'

const connect = ()=>{};
      connect.pool = async (empresa,type = 'dados',database_dados='clientes_ativos') =>{
          
        let host = 'localhost'
        let database = 'mysql'
        switch(type){
            case 'crm':
                host = process.env.CRMDB_HOST
                database = 'clients'
            break;
            case 'asterisk':
                host = process.env.ASTDB_HOST
                database = 'asterisk'
            break;
            default:
                host = '35.194.25.54'// await Clients.serversDbs(empresa)//
                database = database_dados
        }
            //console.log(type,host)
            return  mysql.createPool({
                host     : host,
                port     : 3306,
                user     : process.env.DB_USER,
                password : process.env.DB_PASS,
                database : database,
                waitForConnections: true,
                connectionLimit: 0,
                queueLimit: 0
        })
    }
export default connect;