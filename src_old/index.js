import express from 'express';
import routes from './routes';  
import morgan from 'morgan';
import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

app.use(routes);

app.listen(3333, () => console.log('Servidor online'))