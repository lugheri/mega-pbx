import connection from './dbConnection'

class Redis{   

    async getter(collection){
        const client = await connection.redisConn()
        const result = await client.get(collection); 
        //console.log('💿Getter < < < < <',`🔑${collection} > `,result)    
        return JSON.parse(result)

    }

    async setter(collection,data,expires){   
        let expire_time = expires
        if((expires=="")||(expires===undefined)){
            expire_time = 7200
        }
       const client = await connection.redisConn()   
       await client.del(collection)
       await client.set(collection, JSON.stringify(data));
       if(expires) await client.expire(collection,expire_time)
        //console.log('💾 Setter > > > > >',`🔑${collection}`,`📁${data}`,`⌛${expire_time}`)
        
        return true
    }

    async delete(collection){
        const client = await connection.redisConn()
        await client.del(collection)
        //console.log('🚮Delete x x x x',`🔑${collection}`)
        return true
    }

    async deleteAll(){
        const client = await connection.redisConn()
        await client.flushdb()
        //console.log('🚮 All Keys removed x x x x')
        return true
    }

    async getAllKeys(params){
        const client = await connection.redisConn()
        const result = await client.keys(`${params}*`)
        return result
    }



}

export default new Redis()