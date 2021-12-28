import customExpress from './Config/customExpress';
import http from 'http';
import sockets from './Config/sockets'
import logs from './Config/logs';
import connect from './Config/dbConnection';

import DiscadorController from './controllers/DiscadorController';
import UserController from './controllers/UserController';

const app = customExpress();
app.use(function(err, req, res, next) {
    logs.getErrors(err.stack)
    next(err);
});


const httpServer = sockets(app)


    
//Iniciando Discador
DiscadorController.checkAccounts()
UserController.checkUsers()
httpServer.listen(3000,()=>console.log('Servidor de testes online!'));


