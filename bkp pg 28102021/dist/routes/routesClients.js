"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _ClientsController = require('../controllers/ClientsController'); var _ClientsController2 = _interopRequireDefault(_ClientsController);

module.exports = (routes) =>{
    routes.post('/createTrunk',_ClientsController2.default.createTrunk)
    routes.get('/listTrunks',_ClientsController2.default.listTrunks)
    routes.get('/infoTrunk/:conta',_ClientsController2.default.infoTrunk)
    routes.patch('/editTrunk/:conta',_ClientsController2.default.editTrunk)
    routes.delete('/deleteTrunk/:conta',_ClientsController2.default.deleteTrunk)

    
    routes.post('/createServer',_ClientsController2.default.createServer)
    routes.get('/listServers',_ClientsController2.default.listServers)
    routes.get('/infoServer/:idServer',_ClientsController2.default.infoServer)
    routes.patch('/updateServer/:idServer',_ClientsController2.default.updateServer)
    routes.delete('/deleteServer/:idServer',_ClientsController2.default.deleteServer)    


    routes.post('/newAccount',_ClientsController2.default.newAccount)
    routes.get('/getTrunk/:prefix',_ClientsController2.default.getTrunk)
    routes.get('/getChannels/:prefix',_ClientsController2.default.maxChannels)
    routes.get('/getServers/:prefix',_ClientsController2.default.servers)
    routes.get('/listarClientes/:pag/:reg',_ClientsController2.default.listarClientes)
    routes.get('/infoCliente/:idCliente',_ClientsController2.default.infoCliente)
    routes.patch('/editarCliente/:idCliente',_ClientsController2.default.editarCliente)
    routes.delete('/desativarCliente/:idCliente',_ClientsController2.default.desativarCliente)
}
