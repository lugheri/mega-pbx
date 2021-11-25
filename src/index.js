import customExpress from './Config/customExpress';
import http from 'http';
import sockets from './Config/sockets'

import DiscadorController from './controllers/DiscadorController';
import UserController from './controllers/UserController';

const app = customExpress();
const httpServer = sockets(app)
//const httpServer = http.createServer(app);

//Iniciando Discador
DiscadorController.checkAccounts()
UserController.checkUsers()


httpServer.listen(3000,()=>console.log('Servidor de testes online!'));

