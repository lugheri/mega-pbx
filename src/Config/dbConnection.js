import mysql from 'mysql2';
import Clients from '../models/Clients'

const connect = ()=>{};
      connect.pool = async (empresa,type = 'dados',database_dados='clientes_ativos') =>{
        const environment = 'dev'
        let host = 'localhost'
        let database = 'mysql'
        switch(environment){
            case 'dev':
                switch(type){
                    case 'crm':
                        host = '34.95.152.103'
                        database = 'clients'
                    break;
                    case 'asterisk':
                        host = '35.247.237.187'
                        database = 'asterisk'
                    break;
                    default:
                        host = await Clients.serversDbs(empresa,environment)
                        database = database_dados
                }
            break;
            default:
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
                        host = await Clients.serversDbs(empresa,environment)
                        database = database_dados
                }
        }
            if(environment=='dev'){
                console.log('Ambiente',environment);
                console.log('type',type)
                console.log('host',host)                
                console.log('database',database)
            }
           
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