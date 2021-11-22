import connection from './dbConnection'

class Redis{   

    async getter(collection){
        const client = await connection.redisConn()
        const result = await client.get(collection); 
        //console.log('💿Getter < < < < <',`🔑${collection} > `,result)    
        return JSON.parse(result)

    }

    async setter(collection,data,expires){     
       const client = await connection.redisConn()   
        await client.set(collection, JSON.stringify(data));
        if(expires) await client.expire(collection,expires)
       // console.log('💾Setter > > > > >',`🔑${collection}`,`📁${data}`,`⌛${expires}`)
        
        return true
    }

    async delete(collection){
        const client = await connection.redisConn()
        await client.del(collection)
        console.log('🚮Delete x x x x',`🔑${collection}`)
        return true
    }

}

export default new Redis()