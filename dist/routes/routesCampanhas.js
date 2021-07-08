"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _multer = require('multer'); var _multer2 = _interopRequireDefault(_multer);
var _multer3 = require('../Config/multer'); var _multer4 = _interopRequireDefault(_multer3);
var _multerDataFiles = require('../Config/multerDataFiles'); var _multerDataFiles2 = _interopRequireDefault(_multerDataFiles);
var _CampanhasController = require('../controllers/CampanhasController'); var _CampanhasController2 = _interopRequireDefault(_CampanhasController); 
var _TabulacaoController = require('../controllers/TabulacaoController'); var _TabulacaoController2 = _interopRequireDefault(_TabulacaoController); 
var _FilasController = require('../controllers/FilasController'); var _FilasController2 = _interopRequireDefault(_FilasController);
var _MailingController = require('../controllers/MailingController'); var _MailingController2 = _interopRequireDefault(_MailingController);

module.exports = (routes) => {
    //#########  A T I V A S  ############
    //STATUS ATUAL DA CAMPANHA
    routes.get('/statusCampanha/:id',_CampanhasController2.default.statusCampanha)
    
    //OPERACOES DE CRIACAO E EDICAO DE CAMPANHA (CRUD)
    routes.post('/criarCampanha',_CampanhasController2.default.criarCampanha)
    routes.get('/listarCampanhas',_CampanhasController2.default.listarCampanhas)
    routes.get('/listarCampanhasAtivas',_CampanhasController2.default.listarCampanhasAtivas)
    routes.get('/dadosCampanha/:idCampanha',_CampanhasController2.default.dadosCampanha)
    routes.patch('/atualizaCampanha/:idCampanha',_CampanhasController2.default.atualizaCampanha)

    //LISTAS DE TABULACOES
    //Adiciona Lista de Tabulacao
    routes.post('/addListaTabulacaoCampanha',_CampanhasController2.default.addListaTabulacaoCampanha)
    //Exibir listas de tabulacoes
    routes.get('/listasTabulacaoCampanhas/:idCampanha',_CampanhasController2.default.listasTabulacaoCampanha)    
    //Remove lista de tabulacoes
    routes.delete('/removerListaTabulacaoCampanha/:idListaNaCampanha',_CampanhasController2.default.removerListaTabulacaoCampanha)
    //Status de tabulacao da campanha
    routes.get('/statusTabulacaoCampanha/:idCampanha',_CampanhasController2.default.statusTabulacaoCampanha)

    //INTEGRACOES
    routes.post('/criarIntegracao',_CampanhasController2.default.criarIntegracao)
    routes.get('/listarIntegracoes',_CampanhasController2.default.listarIntegracoes)
    routes.get('/dadosIntegracao/:idIntegracao',_CampanhasController2.default.dadosIntegracao)
    routes.patch('/atualizarIntegracao/:idIntegracao',_CampanhasController2.default.atualizarIntegracao)
    routes.delete('/removerIntegracao/:idIntegracao',_CampanhasController2.default.removerIntegracao)
    routes.post('/inserirIntegracaoCampanha/',_CampanhasController2.default.inserirIntegracaoCampanha)

    //DISCADOR DA CAMPANHAS
    //configurar discador da campanha
    routes.post('/configDiscadorCampanha',_CampanhasController2.default.configDiscadorCampanha)
    //ver configuracoes do discador
    routes.get('/verConfigDiscadorCampanha/:idCampanha',_CampanhasController2.default.verConfigDiscadorCampanha)

    //FILAS  
    routes.get('/listarFilasDisponiveis',_CampanhasController2.default.listarFilasDisponiveis)
    routes.get('/listarFilasCampanha/:idCampanha/',_CampanhasController2.default.listarFilasCampanha)
    routes.post('/addFilaCampanha',_CampanhasController2.default.addFilaCampanha)
    routes.patch('/removerFilaCampanha',_CampanhasController2.default.removerFilaCampanha)
  
    //MAILING DAS CAMPANHAS
    //listar mailings disponiveis
    /*rota disponivel na area de bases*/    
    //Adiciona Mailing Campanha
    routes.post('/addMailingCampanha',_CampanhasController2.default.addMailingCampanha)
    //Lista Mailing Campanha
    routes.get('/listarMailingsCampanha/:idCampanha', _CampanhasController2.default.listarMailingCampanha)        
    //Remove Mailing Campanha
    routes.delete('/removerMailingCampanha/:id',_CampanhasController2.default.removeMailingCampanha)

    //Configuracao da tela do agente
    //Listar campos configurados
    routes.get('/listarCamposConfigurados/:idCampanha', _CampanhasController2.default.listarCamposConfigurados)
    //Atualiza nome e inclui campo na tela do agente
    routes.post('/adicionaCampo_telaAgente', _CampanhasController2.default.adicionaCampo_telaAgente)
    //Listar campos adicionados na tela do agente
    routes.get('/listaCampos_telaAgente/:idCampanha', _CampanhasController2.default.listaCampos_telaAgente)
    //remove campo da tela do agente
    routes.delete('/removeCampo_telaAgente/:idCampanha/:idCampo', _CampanhasController2.default.removeCampo_telaAgente)

    //Status de evolução do consumo do mailing da campanha
    routes.get('/statusEvolucaoCampanha/:idCampanha',_CampanhasController2.default.statusEvolucaoCampanha)

    //AGENDAMENTO DA CAMPANHA
    //Agenda Campanha campanha
    routes.post('/agendarCampanha',_CampanhasController2.default.agendarCampanha)

    //Agenda Campanha campanha
    routes.get('/verAgendaCampanha/:idCampanha',_CampanhasController2.default.verAgendaCampanha)

    //#########  P A U S A S  ############    
    //LISTA DE PAUSAS     
    //Criar Lista de Pausas
    routes.post('/criarListaPausa',_CampanhasController2.default.criarListaPausa)
    //Editar Lista de Pausas
    routes.patch('/editarListaPausa/:id',_CampanhasController2.default.editarListaPausa)
    //Dados da Lista de Pausas
    routes.get('/dadosListaPausa/:id',_CampanhasController2.default.dadosListaPausa)
    //Listar listas de Pausas
    routes.get('/listasPausa',_CampanhasController2.default.listasPausa)

    //PAUSAS
    //Criar Pausa
    routes.post('/criarPausa',_CampanhasController2.default.criarPausa)
    //Editar Pausa
    routes.patch('/editarPausa/:id',_CampanhasController2.default.editarPausa)
    //Ver Pausa
    routes.get('/dadosPausa/:id',_CampanhasController2.default.dadosPausa)
    //Listar Pausa
    routes.get('/listarPausas/:idLista',_CampanhasController2.default.listarPausas)


    //#########  T A B U L A Ç Õ E S  ############
    //LISTA DE TABULACOES     
    //Criar Lista de Tabulacaoes
    routes.post('/criarListaTabulacao',_TabulacaoController2.default.criarListaTabulacao)
    //Editar Lista de Tabulacaoes
    routes.patch('/editarListaTabulacao/:id',_TabulacaoController2.default.editarListaTabulacao)
    //Dados da Lista de Tabulacaoes
    routes.get('/dadosListaTabulacao/:id',_TabulacaoController2.default.dadosListaTabulacao)
    //Listar listas de tabulacoes
    routes.get('/listasTabulacao',_TabulacaoController2.default.listasTabulacao)

    //STATUS DE TABULACOES
    //Criar Status
    routes.post('/criarStatusTabulacao',_TabulacaoController2.default.criarStatusTabulacao)
    //Editar status
    routes.patch('/editarStatusTabulacao/:id',_TabulacaoController2.default.editarStatusTabulacao)
    //Ver status
    routes.get('/statusTabulacao/:id',_TabulacaoController2.default.statusTabulacao)
    //Listar Status
    // routes.get('/listarStatusTabulacao/:idLista',TabulacaoController.listarStatusTabulacao)
    //getListaTabulacao
    routes.get('/getStatusTabulacao/:idLista',_TabulacaoController2.default.getStatus)
    //update tipo status
    routes.patch('/updateStatusTabulacao/:idLista',_TabulacaoController2.default.updateTipoStatus)

    //#########  F I L A S  ############
    //criarFila
    routes.post('/criarFila',_CampanhasController2.default.criarFila)
    //removerFila
    routes.delete('/removerFila/:nomeFila',_CampanhasController2.default.removerFila)
    //dadosFila
    routes.get('/dadosFila/:nomeFila',_CampanhasController2.default.dadosFila)
    //listarFila
    routes.get('/listarFilas',_CampanhasController2.default.listarFilas)
    //editarFila
    routes.patch('/editarFila/:nomeFila',_CampanhasController2.default.editarFila)

    //getMembers
    routes.get('/getMembersFila/:idFila',_FilasController2.default.getMembersFila)
    //update getMembers
    routes.patch('/updateMemberFila/:idFila',_FilasController2.default.updateMemberFila)

    //#########  B A S E S  ############
    //Importar Arquivo
    routes.post('/enviarArquivo',_multer2.default.call(void 0, _multerDataFiles2.default).single('file'), _MailingController2.default.importarBase)
    //Listar Mailings importados
    routes.get('/listarMailings', _MailingController2.default.listarMailings)
    //Abrir Mailing
    //Remover Mailing


    //Old
    //Pententes de revisao

    //Abrir Mailing
    routes.get('/abrirMailing/:idMailing/:pag/:reg', _MailingController2.default.abrirMailing)    

    //remover Mailing
    routes.delete('/removerMailing/:idMailing', _MailingController2.default.removerMailing)

    //Exportar Arquivo
    routes.get('/exportarMailing/:idMailing',_MailingController2.default.exportarMailing)

    
    //CONFIGURAÇÃO DO MAILING
    //Status do Mailing
    routes.get('/statusMailing/:idMailing',_MailingController2.default.statusMailing)

    //Prévia dos dados
    routes.get('/previewMailing/:idMailing',_MailingController2.default.previewMailing)

    //UFs do Mailing
    routes.get('/ufsMailing/:idMailing',_MailingController2.default.ufsMailing)

    //DDDs por uf do mailing
    routes.get('/dddsUfMailing/:idMailing/:uf',_MailingController2.default.dddsUfMailing)

    //Resumo por ddd
    routes.get('/totalRegUF/:idMailing',_MailingController2.default.totalRegUF)

    //Saude do mailing
    routes.get('/saudeMailing/:idMailing',_MailingController2.default.saudeMailing)

    //Campos do Mailing e seu tipo
    routes.get('/camposVsTipo/:idMailing',_MailingController2.default.camposVsTipo)

    //Atualizar tipo do campo
    routes.patch('/atualizaTipoCampo/:idCampo',_MailingController2.default.atualizaTipoCampo)

    //TESTE DE UPLOAD DE ARQUIVO
    routes.post("/posts", _multer2.default.call(void 0, _multer4.default).single('file'), (req, res)=>{   
        return res.json({ test:"Upload"})
    });

     //TESTES
    //atribui campanha
    routes.post('/addFila/:idCampanha/:nomeFila',_CampanhasController2.default.addFilaCampanha)    

    

   
}