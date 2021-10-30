import 'dotenv/config';
import jwt from 'jsonwebtoken';

export default (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) return res.json('Token not provided');

    try{
        const payload = jwt.verify(authHeader, process.env.APP_SECRET);
        req.userId = payload.userId;
        return next();
    }catch(err){
        return res.json(false);
    }
    
}