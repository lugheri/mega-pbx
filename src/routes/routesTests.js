import TestController from '../controllers/TestController';

module.exports = (routes) => {
    //Rotinas de testes
    routes.post('/testMongo',TestController.testMongodb)
    routes.post('/testMongodb_dinamicModel',TestController.testMongodb_dinamicModel)

    //Testes de Discador
    //Teste Discagem
    routes.get('/dialPowerTest/:ramal/:numero', TestController.dialPowerTest)

    //Teste Mongo
    routes.get('/abrirMailings/:empresa/:idMailing',TestController.abrirMailings)

    //Chaves Redis
    routes.post('/getAllRedisKeys',TestController.getAllRedisKeys)
    routes.delete('/delAllRedisKeys',TestController.delAllRedisKeys)
    routes.get('/chamadasSimultaneas/:empresa/:ramal',TestController.chamadasSimultaneas)
    routes.post('/simularChamadasSimultaneas/',TestController.simularChamadasSimultaneas)
    routes.get('/abrirMailings/:empresa/:idMailing',TestController.abrirMailings)
}