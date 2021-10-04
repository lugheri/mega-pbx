"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _ReportController = require('../controllers/ReportController'); var _ReportController2 = _interopRequireDefault(_ReportController);

module.exports = (routes) => {
    //RELATORIOS
    //Relatório de Pausas
    routes.post('/relatorioPausas',_ReportController2.default.relatorioPausas)
    //Detalhamento de Chamadas
    routes.post('/detalhamentoChamadas',_ReportController2.default.detalhamentoChamadas)
    //Monitoramento de Agentes
    routes.post('/monitoramentoAgente',_ReportController2.default.monitoramentoAgente)
    //Monitoramento de Campanhas
    routes.get('/monitoramentoCampanha/:idCampanha',_ReportController2.default.monitoramentoCampanhas)
    //Atualiza Agressividade
    routes.patch('/atualizaAgressividade/:idCampanha',_ReportController2.default.atualizaAgressividade)
    
    
    
    
    
    //LoginXLogout
    routes.post('/loginXLogout',_ReportController2.default.loginXLogout)

    //FILTROS
    //Lista de Agentes
    routes.get('/filtroAgentes/', _ReportController2.default.filtroAgentes)
    //Lista de Equipes
    routes.get('/filtroEquipes/', _ReportController2.default.filtroEquipes)
    //Lista de Campanhas ativas
    routes.get('/filtroCampanhas', _ReportController2.default.filtroCampanhas)
    //Lista de Mailings
    routes.get('/filtroMailings/', _ReportController2.default.filtroMailings)




    //Relatórios personalizados
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