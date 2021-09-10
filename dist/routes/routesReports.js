"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _ReportController = require('../controllers/ReportController'); var _ReportController2 = _interopRequireDefault(_ReportController);

module.exports = (routes) => {
    //RELATORIOS
    //Monitoramento de Agentes
    routes.get('/monitoramentoAgente/:idUser/:idCampanha/:idEquipe',_ReportController2.default.monitoramentoAgente)
    //Monitoramento de Campanhas
    routes.get('/monitoramentoCampanha/:idCampanha',_ReportController2.default.monitoramentoCampanhas)


    //Lista de Campanhas ativas
    routes.get('/filtroCampanhas', _ReportController2.default.filtroCampanhas)
    //Lista de Equipes
    routes.get('/filtroEquipes/', _ReportController2.default.filtroEquipes)
    //Relatórios personalizados
   

    //REPORTS
    //Monitoramento de agentes
  

    //Criar Relatorio
    routes.post('/criarRelatorio', _ReportController2.default.criarRelatorio)

    //listar Relatorios
    routes.get('/listarRelatorios', _ReportController2.default.listarRelatorios)

    //dados Relatorio
    routes.get('/infoRelatorio/:idRelatorio', _ReportController2.default.infoRelatorio)

    //Editar Relatorio
    routes.patch('/editarRelatorio/:idRelatorio', _ReportController2.default.editarRelatorio)

    routes.post('/addCampoDisponiveis', _ReportController2.default.addCampoDisponiveis)
    routes.get('/listCamposDisponiveis', _ReportController2.default.listCamposDisponiveis)
    routes.patch('/editarCampoDisponiveis/:idCampoDisponivel', _ReportController2.default.editarCampoDisponiveis)
    routes.delete('/delCampoDisponiveis/:idCampoDisponivel', _ReportController2.default.delCampoDisponiveis)


   

    //Add campo relatorio
    routes.post('/addCampoRelatorio', _ReportController2.default.addCampoRelatorio)

     //Listar campos relatorio
     routes.get('/listarCamposRelatorio/:idRelatorio', _ReportController2.default.listarCamposRelatorio)

    //Info campo relatorio 
    routes.get('/infoCamposRelatorio/:idCampoRelatorio', _ReportController2.default.infoCamposRelatorio) 

    //Editar Campo relatorio
    routes.patch('/editCampoRelatorio/:idCampoRelatorio', _ReportController2.default.editCampoRelatorio)

    //Remover campo relatorio
    routes.delete('/delCampoRelatorio/:idCampoRelatorio', _ReportController2.default.delCampoRelatorio)
}