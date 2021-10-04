"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _DashboardController = require('../controllers/DashboardController'); var _DashboardController2 = _interopRequireDefault(_DashboardController);

module.exports = (routes) => {
    //Usuarios
    //Usuários em tempo real
    routes.get('/nomeEmpresa',_DashboardController2.default.nomeEmpresa)

    routes.get('/painel',_DashboardController2.default.painel)

    routes.get('/realTimeCalls',_DashboardController2.default.realTimeCalls)

    routes.get('/realTimeCallsCampain/:idCampanha',_DashboardController2.default.realTimeCallsCampain)

    routes.get('/usersRealTime',_DashboardController2.default.usersRealTime)

    //Qtd de usuarios dos ultimos dias
    routes.get('/usersByDay/:limit',_DashboardController2.default.logadosPorDia)

    //Resumo de usuarios por status 
    routes.get('/usersByStatus/',_DashboardController2.default.usersByStatus)
        
    //Qtd de usuarios por status
    routes.get('/listUsersByStatus/:status',_DashboardController2.default.listUsersByStatus) 


    //Campanhas
    //Campanhas em tempo real
    routes.get('/campainsRealTime',_DashboardController2.default.campainsRealTime)

    //Qtd de campanhas
    routes.get('/campanhasByDay/:limit',_DashboardController2.default.campanhasByDay)

    //Resumo de campanhas por status 
    routes.get('/campanhasByStatus',_DashboardController2.default.campanhasByStatus)
        
    //Qtd de campanhas por status 
    routes.get('/listCampanhasByStatus/:status',_DashboardController2.default.listCampanhasByStatus)

    //Mailing das Campanhas 
    //Remumo por status do mailing
    routes.get('/mailingCampanhas',_DashboardController2.default.mailingCampanhas)

    //Monitoramento de Chamadas
    //Chamadas simultaneas vs Conectadas
    routes.get('/chamadasSimultaneas/:limit',_DashboardController2.default.chamadasSimultaneas)

    routes.get('/fraseologia/:all',_DashboardController2.default.fraseologia)
}