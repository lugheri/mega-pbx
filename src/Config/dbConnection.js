import mysql from 'mysql2';
import Clients from '../models/Clients'

const connect = ()=>{};
      connect.pool = async (empresa,server_db = 'dados',database_dados='clientes_ativos') =>{
        let host = 'localhost'
        let database = database_dados        
       
        const hosts = {}
              hosts['DEV']={}
              hosts['DEV']['LOCAL']={}
              hosts['DEV']['LOCAL']['ast']=process.env.AST_DB_LOCAL_HOST_DEV
              hosts['DEV']['LOCAL']['crm']=process.env.CRM_DB_LOCAL_HOST_DEV              
              hosts['DEV']['PUBLIC']={}
              hosts['DEV']['PUBLIC']['ast']=process.env.AST_DB_PUBLIC_HOST_DEV
              hosts['DEV']['PUBLIC']['crm']=process.env.CRM_DB_PUBLIC_HOST_DEV

              hosts['SP']={}
              hosts['SP']['LOCAL']={}
              hosts['SP']['LOCAL']['ast']=process.env.AST_DB_LOCAL_HOST_SP
              hosts['SP']['LOCAL']['crm']=process.env.CRM_DB_LOCAL_HOST_SP
              hosts['SP']['PUBLIC']={}
              hosts['SP']['PUBLIC']['ast']=process.env.AST_DB_PUBLIC_HOST_SP
              hosts['SP']['PUBLIC']['crm']=process.env.CRM_DB_PUBLIC_HOST_SP

              hosts['PG']={}
              hosts['PG']['LOCAL']={}
              hosts['PG']['LOCAL']['ast']=process.env.AST_DB_LOCAL_HOST_PG
              hosts['PG']['LOCAL']['crm']=process.env.CRM_DB_LOCAL_HOST_PG
              hosts['PG']['PUBLIC']={}
              hosts['PG']['PUBLIC']['ast']=process.env.AST_DB_PUBLIC_HOST_PG
              hosts['PG']['PUBLIC']['crm']=process.env.CRM_DB_PUBLIC_HOST_PG

        switch(server_db){
            case 'crm':
                database = 'clients'
                host = hosts[process.env.ENVIRONMENT][process.env.TYPE_IP]['crm']
            break;
            case 'asterisk':
                database = 'asterisk'
                host = hosts[process.env.ENVIRONMENT][process.env.TYPE_IP]['ast']
            break;
            default:
                host = await Clients.serversDbs(empresa,process.env.TYPE_IP)
                database = database_dados
        }        
        
        if(process.env.DEBUG=='ON'){
            console.log('Ambiente',process.env.ENVIRONMENT);
            console.log('Server DB',server_db)
            console.log('Type IP',process.env.TYPE_IP)
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