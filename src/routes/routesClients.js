import ClientsController from "../controllers/ClientsController";

<<<<<<< HEAD
module.exports = (routes) => {
    routes.post('/newAccount',ClientsController.newAccount)
=======
module.exports = (routes) =>{
    routes.post('/newAccount',ClientsController.newAccount)
    routes.get('/getTrunk/:prefix',ClientsController.getTrunk)
    routes.get('/getChannels/:prefix',ClientsController.maxChannels)
    routes.get('/getServers/:prefix',ClientsController.servers)
>>>>>>> d5d2a5f18680acf1aaabee40db059ea303086c76
}