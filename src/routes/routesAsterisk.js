import AsteriskController from '../controllers/AsteriskController';

module.exports = (routes) => {
    //ASTERISK
    //configuracoes
    routes.post('/criarRamal', AsteriskController.criarRamal)

    routes.get('/listarMembrosFila/:nomeFila', AsteriskController.listarMembrosFila)

    routes.get('/listarRamais', AsteriskController.listarRamais)

    //Dados do Servidor
    routes.get('/servidorWebRTC', AsteriskController.servidorWebRTC)

    //testes

    //dialer
    //routes.post('/dialer/:numero/:ramal', AsteriskController.dialer)
    routes.get('/originate/:numero', AsteriskController.testLigacao)
    routes.post('/ligar/:numero', AsteriskController.testLigacao)
}