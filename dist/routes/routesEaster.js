"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _DashboardController = require('../controllers/DashboardController'); var _DashboardController2 = _interopRequireDefault(_DashboardController);

module.exports = (routes) => {

    routes.get('/fraseologia/:all',_DashboardController2.default.fraseologia)
}