"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _AsteriskController = require('../controllers/AsteriskController'); var _AsteriskController2 = _interopRequireDefault(_AsteriskController);

module.exports = (routes) => {
    //ASTERISK
    //configuracoes
    routes.post('/criarRamal', _AsteriskController2.default.criarRamal)

    routes.get('/listarMembrosFila/:nomeFila', _AsteriskController2.default.listarMembrosFila)

    routes.get('/listarRamais', _AsteriskController2.default.listarRamais)

    //Dados do Servidor
    routes.get('/servidorWebRTC', _AsteriskController2.default.servidorWebRTC)

    //testes

    //dialer
    //routes.post('/dialer/:numero/:ramal', AsteriskController.dialer)
    routes.get('/originate/:numero', _AsteriskController2.default.testLigacao)
    routes.post('/ligar/:numero', _AsteriskController2.default.testLigacao)
}