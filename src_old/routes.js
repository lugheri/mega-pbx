import { Router } from 'express';
import multer from 'multer';
import multerConfigs from './Config/multer';
import multerDataFiles from './Config/multerDataFiles';
import UserController    from './controllers/UserController';
import SessionController from './controllers/SessionController';
import CampanhasController from './controllers/CampanhasController'; 
import MailingController from './controllers/MailingController';



import authMiddleware from './middlewares/auth';

const routes = Router();

routes.post('/login', SessionController.store);

//verificação
routes.use(authMiddleware);

routes.get('/authenticated', SessionController.validate);

routes.post("/posts", multer(multerConfigs).single('file'), (req, res)=>{   
    return res.json({ test:"Upload"})
});



//CAMPANHAS
    //Criar Campanha
    routes.post('/criarCampanha',CampanhasController.criarCampanha)

    //Lista campanhas
    routes.get('/listarCampanhas',CampanhasController.listarCampanhas)

    //Retorna Campanha
    routes.get('/dadosCampanha/:id',CampanhasController.dadosCampanha)

    //Atualiza campanha
    routes.patch('/atualizaCampanha/:id',CampanhasController.atualizaCampanha)

//TABULAÇÕES

//LISTA DE TABULACOES     
    //Criar Lista de Tabulacaoes
    routes.post('/criarListaTabulacao',CampanhasController.criarListaTabulacao)
    //Editar Lista de Tabulacaoes
    routes.patch('/editarListaTabulacao/:id',CampanhasController.editarListaTabulacao)
    //Dados da Lista de Tabulacaoes
    routes.get('/dadosListaTabulacao/:id',CampanhasController.dadosListaTabulacao)
    //Listar listas de tabulacoes
    routes.get('/listasTabulacao',CampanhasController.listasTabulacao)

    //STATUS DE TABULACOES
    //Criar Status
    routes.post('/criarStatusTabulacao',CampanhasController.criarStatusTabulacao)
    //Editar status
    routes.patch('/editarStatusTabulacao/:id',CampanhasController.editarStatusTabulacao)
    //Ver status
    routes.get('/statusTabulacao/:id',CampanhasController.statusTabulacao)
    //Listar Status
    routes.get('/listarStatusTabulacao/:idLista',CampanhasController.listarStatusTabulacao)

//MAILINGS
    //Importar Arquivo
    routes.post('/enviarArquivo',multer(multerDataFiles).single('file'),MailingController.importarBase)

    //Higienizar Base
    routes.post('/higienizarBase',MailingController.higienizarBase)

    //Exportar Arquivo

export default routes;
