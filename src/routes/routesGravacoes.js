import GravacaoController from '../controllers/GravacaoController';

module.exports = (routes) => {
    //GRAVAÇÕES
    //Listar gravacao
    routes.get('/listarGravacoes/:limit/:pag', GravacaoController.listarGravacoes)

    //Busca as gravacoes
    routes.get('/compartilharGravacao/:idGravacao',GravacaoController.compartilharGravacao)

    //Compartilhar Gravacao
    routes.post('/buscarGravacoes',GravacaoController.buscarGravacoes)

    //Baixar Gravacao
    routes.get('/baixarGravacao/:idGravacao',GravacaoController.baixarGravacao)
}