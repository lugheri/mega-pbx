import ReportController from '../controllers/ReportController';

module.exports = (routes) => {
    //RELATORIOS
    //Relatório de Pausas
    routes.post('/relatorioPausas',ReportController.relatorioPausas)
    //Detalhamento de Chamadas
    routes.post('/detalhamentoChamadas',ReportController.detalhamentoChamadas)
    //Monitoramento de Agentes
    routes.post('/monitoramentoAgente',ReportController.monitoramentoAgente)
     //Assertividade Mailing
     routes.post('/detalhamentoTabulacoes',ReportController.detalhamentoTabulacoes)
    //Monitoramento de Campanhas
    routes.get('/monitoramentoCampanha/:idCampanha',ReportController.monitoramentoCampanhas)
   

    //Atualiza Agressividade
    routes.patch('/atualizaAgressividade/:idCampanha',ReportController.atualizaAgressividade)
    //LoginXLogout
    routes.post('/loginXLogout',ReportController.loginXLogout)
    //FILTROS
    //Lista de Agentes
    routes.get('/filtroAgentes/', ReportController.filtroAgentes)
    //Lista de Equipes
    routes.get('/filtroEquipes/', ReportController.filtroEquipes)
    //Lista de Campanhas ativas
    routes.get('/filtroCampanhas', ReportController.filtroCampanhas)
    //Lista de Mailings
    routes.get('/filtroMailings/', ReportController.filtroMailings)




    //Relatórios personalizados
    //Criar Relatorio
    routes.post('/criarRelatorio', ReportController.criarRelatorio)
    //listar Relatorios
    routes.get('/listarRelatorios', ReportController.listarRelatorios)
    //dados Relatorio
    routes.get('/infoRelatorio/:idRelatorio', ReportController.infoRelatorio)
    //Editar Relatorio
    routes.patch('/editarRelatorio/:idRelatorio', ReportController.editarRelatorio)
    routes.post('/addCampoDisponiveis', ReportController.addCampoDisponiveis)
    routes.get('/listCamposDisponiveis', ReportController.listCamposDisponiveis)
    routes.patch('/editarCampoDisponiveis/:idCampoDisponivel', ReportController.editarCampoDisponiveis)
    routes.delete('/delCampoDisponiveis/:idCampoDisponivel', ReportController.delCampoDisponiveis)   

    //Add campo relatorio
    routes.post('/addCampoRelatorio', ReportController.addCampoRelatorio)
     //Listar campos relatorio
     routes.get('/listarCamposRelatorio/:idRelatorio', ReportController.listarCamposRelatorio)
    //Info campo relatorio 
    routes.get('/infoCamposRelatorio/:idCampoRelatorio', ReportController.infoCamposRelatorio) 
    //Editar Campo relatorio
    routes.patch('/editCampoRelatorio/:idCampoRelatorio', ReportController.editCampoRelatorio)
    //Remover campo relatorio
    routes.delete('/delCampoRelatorio/:idCampoRelatorio', ReportController.delCampoRelatorio)
}