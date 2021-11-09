"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('./dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);

class Redis{   

    async getter(collection){
        const client = await _dbConnection2.default.redisConn()
        const result = await client.get(collection);     
        return JSON.parse(result)
    }

    async setter(collection,data,expires){     
       //console.log('Setou ',collection,data)
        const client = await _dbConnection2.default.redisConn()   
        await client.set(collection, JSON.stringify(data));
        if(expires) await client.expire(collection,expires)

        return true
    }

    async delete(collection){
        const client = await _dbConnection2.default.redisConn()
        await client.del(collection)

        return true
    }

}

exports. default = new Redis()