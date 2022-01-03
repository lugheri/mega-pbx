import multer from 'multer';
import multerConfigs from '../Config/multer';
import multerDataFiles from '../Config/multerDataFiles';
import ApiController from '../controllers/ApiController';

module.exports = (routes) => {
    //Mailings
    //configuracoes
    
    routes.post('/api/importarMailing',multer(multerDataFiles).single('file'), ApiController.importarMailing)
    routes.get('/api/listarMailings', ApiController.listarMailing)
    routes.get('/api/infoMailing/:idMailing', ApiController.infoMailing)
    routes.delete('/api/removeMailing/:idMailing', ApiController.removeMailing)
}