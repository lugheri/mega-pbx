import authMiddleware from '../middlewares/auth';
import SessionController from '../controllers/SessionController';
import AsteriskController from '../controllers/AsteriskController';
import GravacaoController from '../controllers/GravacaoController';

module.exports = (routes) => {
    
    routes.get('/listaCampos', (req, res) =>{
        res.send('API no ar')
    })
    //Link de  Gravacao
    routes.get('/gravacaoCompartilhada/:hash', GravacaoController.gravacaoCompartilhada)
    
    //AUTENTICAÇÃO
    routes.post('/login', SessionController.store);

    //Retornando dominio do servidor
    routes.post('/setRecord', AsteriskController.setRecord)

    //OPERACOES DO AGI-ASTERISK
    routes.post('/agi/:action',AsteriskController.agi);

    //MIDDLEWARE DE AUTENTICACAO
    routes.use(authMiddleware);

    //VERIFICA TOKEN AUTENTICADO
    routes.get('/authenticated', SessionController.validate);

    //Logout
    routes.get('/logout', SessionController.logout)
}