import customExpress from './Config/customExpress';
import sockets from './Config/sockets'

import DiscadorController from './controllers/DiscadorController';

const app = customExpress();
const httpServer = sockets(app)

//Iniciando Discador
DiscadorController.checandoCampanhasProntas()

httpServer.listen(3000,()=>console.log('Servidor de testes online'));