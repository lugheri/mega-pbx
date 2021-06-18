"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _customExpress = require('./Config/customExpress'); var _customExpress2 = _interopRequireDefault(_customExpress);
var _sockets = require('./Config/sockets'); var _sockets2 = _interopRequireDefault(_sockets);

var _DiscadorController = require('./controllers/DiscadorController'); var _DiscadorController2 = _interopRequireDefault(_DiscadorController);

const app = _customExpress2.default.call(void 0, );
const httpServer = _sockets2.default.call(void 0, app)

//Iniciando Discador
_DiscadorController2.default.checandoCampanhasProntas()

httpServer.listen(3000,()=>console.log('Servidor de testes online'));