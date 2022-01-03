import express from 'express';
import routes from '../routes/routes';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';

 
module.exports = () => {
    const app = express();
    
    app.use(cors());

    app.use(express.json({limit:'250mb'}))
    app.use(express.urlencoded({extended:true, limit:'250mb'}));

    
   // app.use(morgan('dev'));
  
    console.log(path.resolve(__dirname,'..', '..','public'))
    app.use('/static', express.static(path.resolve(__dirname,'..', '..','public')));
    app.use(routes);
 
 return app
}



