"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _ClientsController = require('../controllers/ClientsController'); var _ClientsController2 = _interopRequireDefault(_ClientsController);

module.exports = (routes) =>{
    routes.post('/newAccount',_ClientsController2.default.newAccount)
    routes.get('/getTrunk/:prefix',_ClientsController2.default.getTrunk)
    routes.get('/getChannels/:prefix',_ClientsController2.default.maxChannels)
    routes.get('/getServers/:prefix',_ClientsController2.default.servers)
}