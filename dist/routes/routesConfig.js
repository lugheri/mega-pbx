"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _UserController = require('../controllers/UserController'); var _UserController2 = _interopRequireDefault(_UserController);

module.exports = (routes) => {
//CONFIGURACOES

    //Usuários

    //novo usuario
    routes.post('/newUser', _UserController2.default.newUser)

    //listar usuarios
    routes.get('/listUsers/:status', _UserController2.default.listUsers)

    //dados usuario
    routes.get('/userData/:userId', _UserController2.default.userData)

    //editar usuario
    routes.patch('/editUser/:userId', _UserController2.default.editUser)

    //Equipes
    //nova equipe
    routes.post('/novaEquipe', _UserController2.default.novaEquipe)

    //listar equipes
    routes.get('/listEquipes/:status', _UserController2.default.listEquipes)

    //dados equipe
    routes.get('/dadosEquipe/:idEquipe', _UserController2.default.dadosEquipe)

    //editar equipe
    routes.patch('/editEquipe/:idEquipe', _UserController2.default.editEquipe)

    //Cargos
    //novo usuario
    routes.post('/novoCargo', _UserController2.default.novoCargo)

    //listar usuarios
    routes.get('/listCargos/:status', _UserController2.default.listCargos)

    //dados usuario
    routes.get('/dadosCargo/:idCargo', _UserController2.default.dadosCargo)

    //editar usuario
    routes.patch('/editCargo/:idCargo', _UserController2.default.editCargo)

    //Níveis
    //novo usuario
    routes.post('/novoNivel', _UserController2.default.novoNivel)

    //listar usuarios
    routes.get('/listNiveis/:status', _UserController2.default.listNiveis)

    //dados usuario
    routes.get('/dadosNivel/:idNivel', _UserController2.default.dadosNivel)

    //editar usuario
    routes.patch('/editNivel/:idNivel', _UserController2.default.editNivel)
}