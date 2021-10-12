import ClientsController from "../controllers/ClientsController";

module.exports = (routes) =>{
    routes.post('/newAccount',ClientsController.newAccount)
    routes.get('/getTrunk/:prefix',ClientsController.getTrunk)
    routes.get('/getChannels/:prefix',ClientsController.maxChannels)
    routes.get('/getServers/:prefix',ClientsController.servers)
}
