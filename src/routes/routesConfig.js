import UserController    from '../controllers/UserController';

module.exports = (routes) => {
//CONFIGURACOES

    //Usuários
    //novo usuario
    routes.post('/newUser', UserController.newUser)

    //listar usuarios
    routes.get('/listUsers/:status', UserController.listUsers)

    //dados usuario
    routes.get('/userData/:userId', UserController.userData)

    //editar usuario
    routes.patch('/editUser/:userId', UserController.editUser)

    //Equipes
    //nova equipe
    routes.post('/novaEquipe', UserController.novaEquipe)

    //listar equipes
    routes.get('/listEquipes/:status', UserController.listEquipes)

    //dados equipe
    routes.get('/dadosEquipe/:idEquipe', UserController.dadosEquipe)

    //editar equipe
    routes.patch('/editEquipe/:idEquipe', UserController.editEquipe)

    //Cargos
    //novo usuario
    routes.post('/novoCargo', UserController.novoCargo)

    //listar usuarios
    routes.get('/listCargos/:status', UserController.listCargos)

    //dados usuario
    routes.get('/dadosCargo/:idCargo', UserController.dadosCargo)

    //editar usuario
    routes.patch('/editCargo/:idCargo', UserController.editCargo)

    //Níveis
    //novo usuario
    routes.post('/novoNivel', UserController.novoNivel)

    //listar usuarios
    routes.get('/listNiveis/:status', UserController.listNiveis)

    //dados usuario
    routes.get('/dadosNivel/:idNivel', UserController.dadosNivel)

    //editar usuario
    routes.patch('/editNivel/:idNivel', UserController.editNivel)
}