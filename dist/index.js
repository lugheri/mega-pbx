"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _customExpress = require('./Config/customExpress'); var _customExpress2 = _interopRequireDefault(_customExpress);
var _http = require('http'); var _http2 = _interopRequireDefault(_http);
var _sockets = require('./Config/sockets'); var _sockets2 = _interopRequireDefault(_sockets);

var _DiscadorController = require('./controllers/DiscadorController'); var _DiscadorController2 = _interopRequireDefault(_DiscadorController);

const app = _customExpress2.default.call(void 0, );
//const httpServer = sockets(app)
const httpServer = _http2.default.createServer(app);

//Iniciando Discador
//DiscadorController.checandoCampanhasProntas()

_DiscadorController2.default.iniciandoDiscadorSistema()

httpServer.listen(3000,()=>console.log('Servidor de testes online'));

