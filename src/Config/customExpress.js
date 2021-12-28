import express from 'express';
import routes from '../routes/routes';
import morgan from 'morgan';
import cors from 'cors';

 
module.exports = () => {
    const app = express();
    
    app.use(cors());

    app.use(express.json({limit:'250mb'}))
    app.use(express.urlencoded({extended:true, limit:'250mb'}));

    
   // app.use(morgan('dev'));
    app.use(routes);
 
 return app
}



