import TestController from '../controllers/TestController';

module.exports = (routes) => {
    //Rotinas de testes

    //Testes de Discador
    //Teste Discagem
    routes.get('/dialPowerTest/:ramal/:numero', TestController.dialPowerTest)

    //Chaves Redis
    routes.post('/getAllRedisKeys',TestController.getAllRedisKeys)
    routes.delete('/delAllRedisKeys',TestController.delAllRedisKeys)
    routes.get('/chamadasSimultaneas/:empresa/:ramal',TestController.chamadasSimultaneas)
    routes.post('/simularChamadasSimultaneas/',TestController.simularChamadasSimultaneas)
}