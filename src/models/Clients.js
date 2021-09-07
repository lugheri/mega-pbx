import connect from '../Config/dbConnection'

class Clients{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async clientesAtivos(){
        const sql = `SELECT prefix 
                       FROM clients.accounts 
                      WHERE status=1`
        return await this.querySync(sql)
    }
}

export default new Clients();