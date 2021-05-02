"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express'); var _express2 = _interopRequireDefault(_express);
var _routes = require('./routes'); var _routes2 = _interopRequireDefault(_routes);
var _morgan = require('morgan'); var _morgan2 = _interopRequireDefault(_morgan);
var _cors = require('cors'); var _cors2 = _interopRequireDefault(_cors);
var _DiscadorController = require('./controllers/DiscadorController'); var _DiscadorController2 = _interopRequireDefault(_DiscadorController);

const app = _express2.default.call(void 0, );



app.use(_cors2.default.call(void 0, ));

app.use(_express2.default.json({limit:'250mb'}))
app.use(_express2.default.urlencoded({extended:true, limit:'250mb'}));
app.use(_morgan2.default.call(void 0, 'dev'));


//TESTES
_DiscadorController2.default.checandoCampanhasProntas()
  



app.use(_routes2.default);

app.listen(3000,()=>console.log('Servidor de testes online'));