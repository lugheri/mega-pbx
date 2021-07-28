import customExpress from './Config/customExpress';
import http from 'http';
import sockets from './Config/sockets'

import DiscadorController from './controllers/DiscadorController';

const app = customExpress();
//const httpServer = sockets(app)
const httpServer = http.createServer(app);

//Iniciando Discador
DiscadorController.dial()

//DiscadorController.iniciandoDiscadorSistema()

httpServer.listen(3000,()=>console.log('Servidor de testes online'));

