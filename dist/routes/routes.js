"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');

var _routesAuth = require('./routesAuth'); var _routesAuth2 = _interopRequireDefault(_routesAuth);
var _routesClients = require('./routesClients'); var _routesClients2 = _interopRequireDefault(_routesClients);
var _routesDashboard = require('./routesDashboard'); var _routesDashboard2 = _interopRequireDefault(_routesDashboard);
var _routesCampanhas = require('./routesCampanhas'); var _routesCampanhas2 = _interopRequireDefault(_routesCampanhas);
var _routesDiscador = require('./routesDiscador'); var _routesDiscador2 = _interopRequireDefault(_routesDiscador);
var _routesGravacoes = require('./routesGravacoes'); var _routesGravacoes2 = _interopRequireDefault(_routesGravacoes);
var _routesReports = require('./routesReports'); var _routesReports2 = _interopRequireDefault(_routesReports);
var _routesAsterisk = require('./routesAsterisk'); var _routesAsterisk2 = _interopRequireDefault(_routesAsterisk);
var _routesConfig = require('./routesConfig'); var _routesConfig2 = _interopRequireDefault(_routesConfig);

const routes = _express.Router.call(void 0, );

_routesAuth2.default.call(void 0, routes)
_routesClients2.default.call(void 0, routes)
_routesDashboard2.default.call(void 0, routes)
_routesCampanhas2.default.call(void 0, routes)
_routesDiscador2.default.call(void 0, routes)
_routesGravacoes2.default.call(void 0, routes)
_routesReports2.default.call(void 0, routes)
_routesAsterisk2.default.call(void 0, routes)
_routesConfig2.default.call(void 0, routes)

exports. default = routes;