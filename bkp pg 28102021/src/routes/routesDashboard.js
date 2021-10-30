import DashboardController    from '../controllers/DashboardController';

module.exports = (routes) => {
    //Usuarios
    //Usuários em tempo real
    routes.get('/nomeEmpresa',DashboardController.nomeEmpresa)

    routes.get('/painel',DashboardController.painel)

    routes.get('/realTimeCalls',DashboardController.realTimeCalls)

    routes.get('/realTimeCallsCampain/:idCampanha',DashboardController.realTimeCallsCampain)

    routes.get('/usersRealTime',DashboardController.usersRealTime)

    //Qtd de usuarios dos ultimos dias
    routes.get('/usersByDay/:limit',DashboardController.logadosPorDia)

    //Resumo de usuarios por status 
    routes.get('/usersByStatus/',DashboardController.usersByStatus)
        
    //Qtd de usuarios por status
    routes.get('/listUsersByStatus/:status',DashboardController.listUsersByStatus) 


    //Campanhas
    //Campanhas em tempo real
    routes.get('/campainsRealTime',DashboardController.campainsRealTime)

    //Qtd de campanhas
    routes.get('/campanhasByDay/:limit',DashboardController.campanhasByDay)

    //Resumo de campanhas por status 
    routes.get('/campanhasByStatus',DashboardController.campanhasByStatus)
        
    //Qtd de campanhas por status 
    routes.get('/listCampanhasByStatus/:status',DashboardController.listCampanhasByStatus)

    //Mailing das Campanhas 
    //Remumo por status do mailing
    routes.get('/mailingCampanhas',DashboardController.mailingCampanhas)

    //Monitoramento de Chamadas
    //Chamadas simultaneas vs Conectadas
    routes.get('/chamadasSimultaneas/:limit',DashboardController.chamadasSimultaneas)

    routes.get('/fraseologia/:all',DashboardController.fraseologia)
}