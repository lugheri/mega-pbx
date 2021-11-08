import connection from './dbConnection'

class Redis{   

    async getter(collection){
        const client = await connection.redisConn()
        const result = await client.get(collection);     
        return JSON.parse(result)
    }

    async setter(collection,data,expires){     
       //console.log('Setou ',collection,data)
        const client = await connection.redisConn()   
        await client.set(collection, JSON.stringify(data));
        if(expires) await client.expire(collection,expires)

        return true
    }

    async delete(collection){
        const client = await connection.redisConn()
        await client.del(collection)

        return true
    }

}

export default new Redis()