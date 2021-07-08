import DiscadorController from '../controllers/DiscadorController';

module.exports = (routes) => {

    //DISCADOR
    //novo Metodo do Discador
    routes.get('/teste_iniciandoDiscadorSistema',DiscadorController.iniciandoDiscadorSistema)

    //iniciarDiscador
    routes.get('/iniciarDiscador/:ramal',DiscadorController.iniciarDiscador)

    //Status do ramal
    routes.get('/statusRamal/:ramal',DiscadorController.statusRamal)

    //pararDiscador
    routes.get('/pararDiscador/:ramal',DiscadorController.pararDiscador)

    //Chamada atendida
    routes.get('/modoAtendimento/:ramal',DiscadorController.modoAtendimento)

    //Chamada atendida
    routes.get('/atendeChamada/:ramal',DiscadorController.atenderChamada)

    //Chamada atendida
    routes.get('/dadosChamada/:ramal',DiscadorController.dadosChamada)
    
    //Chamada desligada
    routes.post('/desligarChamada',DiscadorController.desligarChamada)
    
    //Tabular chamada
    routes.post('/tabularChamada',DiscadorController.tabularChamada)

    //Tabular chamada
    routes.post('/marcarRetorno',DiscadorController.marcarRetorno)

    //Historico de Registro
    routes.get('/historicoRegistro/:idRegistro',DiscadorController.historicoRegistro)

    //Historico de Chamadas
    routes.get('/historicoChamadas/:ramal',DiscadorController.historicoChamadas)

    

//TELA DE ATENDIMENTO
    //Abrir Listagem de Pausa da Campanha
    routes.get('/pausasDisponiveis',DiscadorController.listarPausasCampanha)

    //Pausar agente
    routes.post('/pausarAgente',DiscadorController.pausarAgente)

    //Status Pausa Agente
    routes.get('/statusPausaAgente/:ramal',DiscadorController.statusPausaAgente)
 
    //Retirar Pausa
    routes.post('/removePausa/',DiscadorController.removePausaAgente)

}