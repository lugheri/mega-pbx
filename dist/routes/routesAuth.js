"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _auth = require('../middlewares/auth'); var _auth2 = _interopRequireDefault(_auth);
var _SessionController = require('../controllers/SessionController'); var _SessionController2 = _interopRequireDefault(_SessionController);
var _AsteriskController = require('../controllers/AsteriskController'); var _AsteriskController2 = _interopRequireDefault(_AsteriskController);
var _GravacaoController = require('../controllers/GravacaoController'); var _GravacaoController2 = _interopRequireDefault(_GravacaoController);

module.exports = (routes) => {
    
    routes.get('/listaCampos', (req, res) =>{
        res.send('API no ar')
    })
    //Link de  Gravacao
    routes.get('/gravacaoCompartilhada/:hash', _GravacaoController2.default.gravacaoCompartilhada)
    
    //AUTENTICAÇÃO
    routes.post('/login', _SessionController2.default.store);

    //Retornando dominio do servidor
    routes.post('/setRecord', _AsteriskController2.default.setRecord)

    //OPERACOES DO AGI-ASTERISK
    routes.post('/agi/:action',_AsteriskController2.default.agi);

    //MIDDLEWARE DE AUTENTICACAO
    routes.use(_auth2.default);

    //VERIFICA TOKEN AUTENTICADO
    routes.get('/authenticated', _SessionController2.default.validate);

    //Logout
    routes.get('/logout', _SessionController2.default.logout)
}