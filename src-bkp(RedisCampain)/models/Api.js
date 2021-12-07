class Api{
    async checkToken(token){
        const dec1 = new Buffer.from(token, 'base64');
        const hash1 = dec1.toString('ascii');
        const h1 = hash1.split(":")
        const dec2 = new Buffer.from(h1[1], 'base64');
        const hash2 = dec2.toString('ascii');
        const r = hash2.split(":")
        const empresa = r[1]
        return empresa
    }

}

export default new Api()