import TestController from '../controllers/TestController';

module.exports = (routes) => {
    //Rotinas de testes

    //Testes de Discador
    //Teste Discagem
    routes.get('/dialPowerTest/:ramal/:numero', TestController.dialPowerTest)

    //Chaves Redis
    routes.post('/getRedisKeys',TestController.getRedisKeys)
}