"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _DiscadorController = require('../controllers/DiscadorController'); var _DiscadorController2 = _interopRequireDefault(_DiscadorController);

module.exports = (routes) => {

    //DISCADOR
    //novo Metodo do Discador
    routes.get('/teste_iniciandoDiscadorSistema',_DiscadorController2.default.dial)
    //campanhas do agente
    routes.get('/campanhasAtivasAgente/:agente',_DiscadorController2.default.campanhasAtivasAgente)
    //iniciarDiscador
    routes.get('/iniciarDiscador/:ramal',_DiscadorController2.default.iniciarDiscador)
    //Status do ramal
    routes.get('/statusRamal/:ramal',_DiscadorController2.default.statusRamal)
    //Status de chamada manual
    routes.get('/statusDeChamadaManual/:ramal',_DiscadorController2.default.statusDeChamadaManual)
    //pararDiscador
    routes.get('/pararDiscador/:ramal',_DiscadorController2.default.pararDiscador)
    //Chamada atendida
    routes.get('/modoAtendimento/:ramal',_DiscadorController2.default.modoAtendimento)
    //Chamada atendida
    routes.get('/atendeChamada/:ramal',_DiscadorController2.default.atenderChamada)
    //Chamada atendida
    routes.get('/dadosChamada/:ramal',_DiscadorController2.default.dadosChamadaAtendida)    
    //Lista os status de tabulacao da campanha
    routes.get('/statusTabulacaoChamada/:ramal',_DiscadorController2.default.statusTabulacaoChamada)
    //Chamada desligada
    routes.post('/desligarChamada',_DiscadorController2.default.desligarChamada)    
    //Tabular chamada
    routes.post('/tabularChamada',_DiscadorController2.default.tabularChamada)
    //Tabular chamada
    routes.post('/marcarRetorno',_DiscadorController2.default.marcarRetorno)
    //Pula registro
    routes.get('/pularChamada/:ramal',_DiscadorController2.default.pularChamada)
    //Voltar Registro
    routes.get('/voltaRegistro/:idHistorico',_DiscadorController2.default.voltaRegistro)    
    //Historico de Registro
    routes.get('/historicoRegistro/:idMailing/:idRegistro',_DiscadorController2.default.historicoRegistro)
    //Historico de Registro
    routes.get('/historicoChamadaManual/:numero/:idAgente',_DiscadorController2.default.historicoChamadaManual)
    //Historico de Chamadas
    routes.get('/historicoChamadas/:ramal',_DiscadorController2.default.historicoChamadas)
    //Nome Contato Historico
    routes.get('/nomeContato/:numero', _DiscadorController2.default.nomeContatoHistoico_byNumber)
    //Salva Nome e Obs Chamada Manual
    routes.post('/gravaDadosChamadaManual', _DiscadorController2.default.gravaDadosChamadaManual)

    

//TELA DE ATENDIMENTO
    //Abrir Listagem de Pausa da Campanha
    routes.get('/pausasDisponiveis',_DiscadorController2.default.listarPausasCampanha)
    //Pausar agente
    routes.post('/pausarAgente',_DiscadorController2.default.pausarAgente)
    //Status Pausa Agente
    routes.get('/statusPausaAgente/:ramal',_DiscadorController2.default.statusPausaAgente) 
    //Retirar Pausa
    routes.post('/removePausa/',_DiscadorController2.default.removePausaAgente)

    //Teste
    //routes.get('/dial/',DiscadorController.dialTest)
}