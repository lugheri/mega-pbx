import AgenteController from '../controllers/AgenteController';

module.exports = (routes) =>{
    //iniciarDiscador
    routes.get('/iniciarDiscador/:ramal',AgenteController.iniciarDiscador)
    //Status do ramal
    routes.get('/statusRamal/:ramal',AgenteController.statusRamal)
    //Status de chamada manual
    routes.get('/statusDeChamadaManual/:ramal',AgenteController.statusDeChamadaManual)
    //pararDiscador
    routes.get('/pararDiscador/:ramal',AgenteController.pararDiscador)
    //Chamada atendida
    routes.get('/modoAtendimento/:ramal',AgenteController.modoAtendimento)
    //Chamada atendida
    routes.get('/atendeChamada/:ramal',AgenteController.atenderChamada)
    //Chamada atendida
    routes.get('/dadosChamada/:ramal',AgenteController.dadosChamadaAtendida)    
    //Lista os status de tabulacao da campanha
    routes.get('/statusTabulacaoChamada/:ramal',AgenteController.statusTabulacaoChamada)
    //Chamada desligada
    routes.post('/desligarChamada',AgenteController.desligarChamada)    
    //Tabular chamada
    routes.post('/tabularChamada',AgenteController.tabularChamada)
    //Tabular chamada
    routes.post('/marcarRetorno',AgenteController.marcarRetorno)
    //Pula registro
    routes.get('/pularChamada/:ramal',AgenteController.pularChamada)
    //Voltar Registro
    routes.get('/voltaRegistro/:idHistorico',AgenteController.voltaRegistro)    
    //Historico de Registro
    routes.get('/historicoRegistro/:idMailing/:idRegistro',AgenteController.historicoRegistro)
    //Historico de Registro
    routes.get('/historicoChamadaManual/:numero/:idAgente',AgenteController.historicoChamadaManual)
    //Historico de Chamadas
    routes.get('/historicoChamadas/:ramal',AgenteController.historicoChamadas)
    //Nome Contato Historico
    routes.get('/nomeContato/:numero', AgenteController.nomeContatoHistoico_byNumber)
    //Salva Nome e Obs Chamada Manual
    routes.post('/gravaDadosChamadaManual', AgenteController.gravaDadosChamadaManual)
    //Abrir Listagem de Pausa da Campanha
    routes.get('/pausasDisponiveis',AgenteController.listarPausasCampanha)
    //Pausar agente
    routes.post('/pausarAgente',AgenteController.pausarAgente)
    //Status Pausa Agente
    routes.get('/statusPausaAgente/:ramal',AgenteController.statusPausaAgente) 
    //Retirar Pausa
    routes.post('/removePausa/',AgenteController.removePausaAgente)

}