import DiscadorController from '../controllers/DiscadorController';

module.exports = (routes) => {

    //DISCADOR
    //novo Metodo do Discador
    routes.get('/teste_iniciandoDiscadorSistema',DiscadorController.dial)
    //iniciarDiscador
    routes.get('/iniciarDiscador/:ramal',DiscadorController.iniciarDiscador)
    //Status do ramal
    routes.get('/statusRamal/:ramal',DiscadorController.statusRamal)
    //Status de chamada manual
    routes.get('/statusDeChamadaManual/:ramal',DiscadorController.statusDeChamadaManual)
    //pararDiscador
    routes.get('/pararDiscador/:ramal',DiscadorController.pararDiscador)
    //Chamada atendida
    routes.get('/modoAtendimento/:ramal',DiscadorController.modoAtendimento)
    //Chamada atendida
    routes.get('/atendeChamada/:ramal',DiscadorController.atenderChamada)
    //Chamada atendida
    routes.get('/dadosChamada/:ramal',DiscadorController.dadosChamadaAtendida)    
    //Lista os status de tabulacao da campanha
    routes.get('/statusTabulacaoChamada/:ramal',DiscadorController.statusTabulacaoChamada)
    //Chamada desligada
    routes.post('/desligarChamada',DiscadorController.desligarChamada)    
    //Tabular chamada
    routes.post('/tabularChamada',DiscadorController.tabularChamada)
    //Tabular chamada
    routes.post('/marcarRetorno',DiscadorController.marcarRetorno)
    //Pula registro
    routes.get('/pularChamada/:ramal',DiscadorController.pularChamada)
    //Voltar Registro
    routes.get('/voltaRegistro/:idHistorico',DiscadorController.voltaRegistro)    
    //Historico de Registro
    routes.get('/historicoRegistro/:idMailing/:idRegistro',DiscadorController.historicoRegistro)
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

    //Teste
    //routes.get('/dial/',DiscadorController.dialTest)
}