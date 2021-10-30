import ClientsController from "../controllers/ClientsController";

module.exports = (routes) =>{
    routes.post('/createTrunk',ClientsController.createTrunk)
    routes.get('/listTrunks',ClientsController.listTrunks)
    routes.get('/infoTrunk/:conta',ClientsController.infoTrunk)
    routes.patch('/editTrunk/:conta',ClientsController.editTrunk)
    routes.delete('/deleteTrunk/:conta',ClientsController.deleteTrunk)

    
    routes.post('/createServer',ClientsController.createServer)
    routes.get('/listServers',ClientsController.listServers)
    routes.get('/infoServer/:idServer',ClientsController.infoServer)
    routes.patch('/updateServer/:idServer',ClientsController.updateServer)
    routes.delete('/deleteServer/:idServer',ClientsController.deleteServer)    


    routes.post('/newAccount',ClientsController.newAccount)
    routes.get('/getTrunk/:prefix',ClientsController.getTrunk)
    routes.get('/getChannels/:prefix',ClientsController.maxChannels)
    routes.get('/getServers/:prefix',ClientsController.servers)
    routes.get('/listarClientes/:pag/:reg',ClientsController.listarClientes)
    routes.get('/infoCliente/:idCliente',ClientsController.infoCliente)
    routes.patch('/editarCliente/:idCliente',ClientsController.editarCliente)
    routes.delete('/desativarCliente/:idCliente',ClientsController.desativarCliente)
}
