import ClientsController from "../controllers/ClientsController";

module.exports = (routes) => {
    routes.post('/newAccount',ClientsController.newAccount)
}