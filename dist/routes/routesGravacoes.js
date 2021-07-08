"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _GravacaoController = require('../controllers/GravacaoController'); var _GravacaoController2 = _interopRequireDefault(_GravacaoController);

module.exports = (routes) => {
    //GRAVAÇÕES
    //Listar gravacao
    routes.get('/listarGravacoes/:limit/:pag', _GravacaoController2.default.listarGravacoes)

    //Busca as gravacoes
    routes.get('/compartilharGravacao/:idGravacao',_GravacaoController2.default.compartilharGravacao)

    //Compartilhar Gravacao
    routes.post('/buscarGravacoes',_GravacaoController2.default.buscarGravacoes)

    //Baixar Gravacao
    routes.get('/baixarGravacao/:idGravacao',_GravacaoController2.default.baixarGravacao)
}