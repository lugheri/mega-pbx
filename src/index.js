import express from 'express';
import routes from './routes';
import morgan from 'morgan';
import cors from 'cors';
import DiscadorController from './controllers/DiscadorController';

const app = express();



app.use(cors());

app.use(express.json({limit:'250mb'}))
app.use(express.urlencoded({extended:true, limit:'250mb'}));
app.use(morgan('dev'));


//TESTES
DiscadorController.checandoCampanhasProntas()
  



app.use(routes);

app.listen(3000,()=>console.log('Servidor de testes online'));