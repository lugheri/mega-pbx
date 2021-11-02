import redis from 'promise-redis'

class Redis{

    async connect(){
        const redisConn = redis()
        const client = redisConn.createClient(6379,'35.247.227.4')
        client.on("error", (error) => {
            console.error(error);
        });

        return client
    }

    async getter(collection){
        const client = await this.connect()
        const result = await client.get(collection);     
        return result
    }

    async setter(collection,data){     
        const client = await this.connect()   
        await client.set(collection, JSON.stringify(data));
        return true
    }


}

export default new Redis()