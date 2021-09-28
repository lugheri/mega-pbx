"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv/config');
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

exports. default = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) return res.json('Token not provided');

    try{
        const payload = _jsonwebtoken2.default.verify(authHeader, process.env.APP_SECRET);
        req.userId = payload.userId;
        return next();
    }catch(err){
        return res.json(false);
    }
    
}