"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _DiscadorController = require('../controllers/DiscadorController'); var _DiscadorController2 = _interopRequireDefault(_DiscadorController);

module.exports = (routes) => {

    //DISCADOR
    //novo Metodo do Discador
    routes.get('/teste_iniciandoDiscadorSistema',_DiscadorController2.default.dial)

    //iniciarDiscador
    routes.get('/iniciarDiscador/:ramal',_DiscadorController2.default.iniciarDiscador)

    //Status do ramal
    routes.get('/statusRamal/:ramal',_DiscadorController2.default.statusRamal)

    //pararDiscador
    routes.get('/pararDiscador/:ramal',_DiscadorController2.default.pararDiscador)

    //Chamada atendida
    routes.get('/modoAtendimento/:ramal',_DiscadorController2.default.modoAtendimento)

    //Chamada atendida
    routes.get('/atendeChamada/:ramal',_DiscadorController2.default.atenderChamada)

    //Chamada atendida
    routes.get('/dadosChamada/:ramal',_DiscadorController2.default.dadosChamada)
    
    //Chamada desligada
    routes.post('/desligarChamada',_DiscadorController2.default.desligarChamada)
    
    //Tabular chamada
    routes.post('/tabularChamada',_DiscadorController2.default.tabularChamada)

    //Tabular chamada
    routes.post('/marcarRetorno',_DiscadorController2.default.marcarRetorno)

    //Historico de Registro
    routes.get('/historicoRegistro/:idRegistro',_DiscadorController2.default.historicoRegistro)

    //Historico de Chamadas
    routes.get('/historicoChamadas/:ramal',_DiscadorController2.default.historicoChamadas)

    

//TELA DE ATENDIMENTO
    //Abrir Listagem de Pausa da Campanha
    routes.get('/pausasDisponiveis',_DiscadorController2.default.listarPausasCampanha)

    //Pausar agente
    routes.post('/pausarAgente',_DiscadorController2.default.pausarAgente)

    //Status Pausa Agente
    routes.get('/statusPausaAgente/:ramal',_DiscadorController2.default.statusPausaAgente)
 
    //Retirar Pausa
    routes.post('/removePausa/',_DiscadorController2.default.removePausaAgente)

}