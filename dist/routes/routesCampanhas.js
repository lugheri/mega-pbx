"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _multer = require('multer'); var _multer2 = _interopRequireDefault(_multer);
var _multer3 = require('../Config/multer'); var _multer4 = _interopRequireDefault(_multer3);
var _multerDataFiles = require('../Config/multerDataFiles'); var _multerDataFiles2 = _interopRequireDefault(_multerDataFiles);
var _CampanhasController = require('../controllers/CampanhasController'); var _CampanhasController2 = _interopRequireDefault(_CampanhasController); 
var _TabulacaoController = require('../controllers/TabulacaoController'); var _TabulacaoController2 = _interopRequireDefault(_TabulacaoController); 
var _FilasController = require('../controllers/FilasController'); var _FilasController2 = _interopRequireDefault(_FilasController);
var _MailingController = require('../controllers/MailingController'); var _MailingController2 = _interopRequireDefault(_MailingController);
var _BlacklistController = require('../controllers/BlacklistController'); var _BlacklistController2 = _interopRequireDefault(_BlacklistController);

module.exports = (routes) => {
    //#########  A T I V A S  ############
    //STATUS ATUAL DA CAMPANHA
    routes.get('/statusCampanha/:id',_CampanhasController2.default.statusCampanha)
    routes.get('/statusEvolucaoCampanha/:idCampanha',_CampanhasController2.default.statusEvolucaoCampanha)//Status de evolução do consumo do mailing da campanha
    routes.get('/historicoMailingsCampanha/:idCampanha',_CampanhasController2.default.historicoMailingsCampanha)
    //OPERACOES DE CRIACAO E EDICAO DE CAMPANHA (CRUD)
    routes.post('/criarCampanha',_CampanhasController2.default.criarCampanha)
    routes.get('/listarCampanhas',_CampanhasController2.default.listarCampanhas)
    routes.get('/listarCampanhasAtivas',_CampanhasController2.default.listarCampanhasAtivas)
    routes.get('/dadosCampanha/:idCampanha',_CampanhasController2.default.dadosCampanha)
    routes.patch('/atualizaCampanha/:idCampanha',_CampanhasController2.default.atualizaCampanha)

    //LISTAS DE TABULACOES    
    routes.post('/addListaTabulacaoCampanha',_CampanhasController2.default.addListaTabulacaoCampanha)//Adiciona Lista de Tabulacao
    routes.get('/listasTabulacaoCampanhas/:idCampanha',_CampanhasController2.default.listasTabulacaoCampanha)//Exibir listas de tabulacoes 
    routes.delete('/removerListaTabulacaoCampanha/:idListaNaCampanha',_CampanhasController2.default.removerListaTabulacaoCampanha)//Remove lista de tabulacoes
    //routes.get('/statusTabulacaoCampanha/:idCampanha',CampanhasController.statusTabulacaoCampanha)//Status de tabulacao da campanha
    routes.post('/setarTempoMaxTabulacao',_CampanhasController2.default.setMaxTimeStatusTab)
    routes.get('/tempoTabulacaoCampanha/:idCampanha',_CampanhasController2.default.getMaxTimeStatusTab)
    
    //INTEGRACOES
    routes.post('/criarIntegracao',_CampanhasController2.default.criarIntegracao)
    routes.get('/listarIntegracoes',_CampanhasController2.default.listarIntegracoes)
    routes.get('/dadosIntegracao/:idIntegracao',_CampanhasController2.default.dadosIntegracao)
    routes.patch('/atualizarIntegracao/:idIntegracao',_CampanhasController2.default.atualizarIntegracao)
    routes.delete('/removerIntegracao/:idIntegracao',_CampanhasController2.default.removerIntegracao)
    routes.post('/inserirIntegracaoCampanha/',_CampanhasController2.default.inserirIntegracaoCampanha)
    routes.get('/listaIntegracaoCampanha/:idCampanha',_CampanhasController2.default.listaIntegracaoCampanha)
    routes.delete('/removerIntegracaoCampanha/:idCampanha/:idIntegracao',_CampanhasController2.default.removerIntegracaoCampanha)

    //DISCADOR DA CAMPANHAS
    routes.post('/configDiscadorCampanha',_CampanhasController2.default.configDiscadorCampanha)//configurar discador da campanha  
    routes.get('/verConfigDiscadorCampanha/:idCampanha',_CampanhasController2.default.verConfigDiscadorCampanha)//ver configuracoes do discador

    //FILAS  
    routes.get('/listarFilasDisponiveis',_CampanhasController2.default.listarFilasDisponiveis)
    routes.get('/listarFilasCampanha/:idCampanha/',_CampanhasController2.default.listarFilasCampanha)
    routes.post('/addFilaCampanha',_CampanhasController2.default.addFilaCampanha)
    routes.patch('/removerFilaCampanha',_CampanhasController2.default.removerFilaCampanha)
  
    //MAILING DAS CAMPANHAS
    //listar mailings disponiveis
    /*rota disponivel na area de bases*/        
    routes.post('/addMailingCampanha',_CampanhasController2.default.addMailingCampanha)//Adiciona Mailing Campanha    
    routes.get('/listarMailingsCampanha/:idCampanha', _CampanhasController2.default.listarMailingCampanha) //Lista Mailing Campanha       
    routes.delete('/removerMailingCampanha/:idCampanha',_CampanhasController2.default.removeMailingCampanha)//Remove Mailing Campanha
    routes.post('/filtrarDiscagem',_CampanhasController2.default.filtrarDiscagem)//Remove Mailing Campanha
    routes.get('/filtrosDiscagem/:idCampanha/:uf',_CampanhasController2.default.filtrosDiscagem)//Remove Mailing Campanha

    //Configuracao da tela do agente
    routes.get('/listarCamposConfigurados/:idCampanha', _CampanhasController2.default.listarCamposConfigurados)//Listar campos configurados
    routes.post('/adicionaCampo_telaAgente', _CampanhasController2.default.adicionaCampo_telaAgente)//Atualiza nome e inclui campo na tela do agente
    routes.get('/listaCampos_telaAgente/:idCampanha', _CampanhasController2.default.listaCampos_telaAgente)//Listar campos adicionados na tela do agente
    routes.delete('/removeCampo_telaAgente/:idCampanha/:idCampo', _CampanhasController2.default.removeCampo_telaAgente)//remove campo da tela do agente
    
    //AGENDAMENTO DA CAMPANHA
    routes.post('/agendarCampanha',_CampanhasController2.default.agendarCampanha)//Agenda Campanha campanha    
    routes.get('/verAgendaCampanha/:idCampanha',_CampanhasController2.default.verAgendaCampanha)//Agenda Campanha campanha

    //#########  P A U S A S  ############    
    //LISTA DE PAUSAS         
    routes.post('/criarListaPausa',_CampanhasController2.default.criarListaPausa)//Criar Lista de Pausas
    routes.patch('/editarListaPausa/:id',_CampanhasController2.default.editarListaPausa)//Editar Lista de Pausas
    routes.get('/dadosListaPausa/:id',_CampanhasController2.default.dadosListaPausa)//Dados da Lista de Pausas
    routes.get('/listasPausa',_CampanhasController2.default.listasPausa)//Listar listas de Pausas

    //PAUSAS
    routes.post('/criarPausa',_CampanhasController2.default.criarPausa)//Criar Pausa
    routes.patch('/editarPausa/:id',_CampanhasController2.default.editarPausa)//Editar Pausa
    routes.delete('/removerPausa/:id',_CampanhasController2.default.removerPausa)//Remove Pausa
    routes.get('/dadosPausa/:id',_CampanhasController2.default.dadosPausa)//Ver Pausa
    routes.get('/listarPausas/:idLista',_CampanhasController2.default.listarPausas)//Listar Pausa

    //#########  T A B U L A Ç Õ E S  ############
    //LISTA DE TABULACOES     
    routes.post('/criarListaTabulacao',_TabulacaoController2.default.criarListaTabulacao)//Criar Lista de Tabulacaoes
    routes.get('/listasTabulacao',_TabulacaoController2.default.listasTabulacao)//Listar listas de tabulacoes
    routes.get('/dadosListaTabulacao/:idLista',_TabulacaoController2.default.dadosListaTabulacao)//Dados da Lista de Tabulacaoes
    routes.patch('/editarListaTabulacao/:idLista',_TabulacaoController2.default.editarListaTabulacao)//Editar Lista de Tabulacaoes
    
    //STATUS DE TABULACOES
    routes.post('/criarStatusTabulacao',_TabulacaoController2.default.criarStatusTabulacao)//Criar Status
    routes.get('/listarStatusTabulacao/:idLista',_TabulacaoController2.default.listarStatusTabulacao)//Listar Status
    routes.get('/infoStatus/:idStatus',_TabulacaoController2.default.infoStatus)//Ver status    
    routes.patch('/editarStatusTabulacao/:idStatus',_TabulacaoController2.default.editarStatusTabulacao)//Editar status
    routes.delete('/removerStatusTabulacao/:idStatus',_TabulacaoController2.default.removerStatus)
    routes.get('/reordenarStatus/:idLista',_TabulacaoController2.default.reordenarStatus)//Ver status    

    //Tipo e Ordenacao dos status
    routes.get('/getStatusTabulacao/:idLista',_TabulacaoController2.default.getStatusTabulacao)//getListaTabulacao
    routes.patch('/updateStatusTabulacao/:idLista',_TabulacaoController2.default.updateTipoStatus)//update tipo status

    //#########  F I L A S  ############
    routes.post('/criarFila',_CampanhasController2.default.criarFila)//criarFila
    routes.get('/listarFilas',_CampanhasController2.default.listarFilas)//listarFila
    routes.get('/dadosFila/:idFila',_CampanhasController2.default.dadosFila)//dadosFila
    routes.get('/configuracoesFila/:idFila',_CampanhasController2.default.configuracoesFila)//configuracoesFila
    routes.patch('/editarFila/:idFila',_CampanhasController2.default.editarFila)//editarFila
    routes.patch('/configurarFila/:idFila',_CampanhasController2.default.configurarFila)//configurarFila
    routes.delete('/removerFila/:idFila',_CampanhasController2.default.removerFila)//removerFila
    //MembrosFilas    
    routes.get('/getMembersFila/:idFila',_FilasController2.default.agentesFila)//getMembers
    routes.patch('/updateMemberFila/:idFila',_FilasController2.default.updateMemberFila)//update getMembers
    routes.get('/moveAllMembers/:idFila/:destino',_FilasController2.default.moveAllMembers)//update getMembers

    //#########  B A S E S  ############
    routes.post('/enviarArquivo',_multer2.default.call(void 0, _multerDataFiles2.default).single('file'), _MailingController2.default.importarBase)//Importar Arquivo
    routes.get('/iniciarConfigBase/:idBase',_MailingController2.default.iniciarConfigBase)//separa os campos do mailing para configuracao do seu tipo
    routes.post('/concluirConfigBase', _MailingController2.default.concluirConfigBase)//Conclui a importação do mailing
    routes.get('/listarMailings',_MailingController2.default.listarMailings)//Lista os mailings disponiveis
    routes.get('/abrirMailing/:idMailing/:pag/:reg', _MailingController2.default.abrirMailing)//Abrir Mailing    
    routes.get('/exportarMailing/:idMailing',_MailingController2.default.exportarMailing)//Exportar Arquivo
    routes.delete('/removerMailing/:idMailing', _MailingController2.default.removerMailing)//remover Mailing
    routes.get('/statusMailing/:idMailing',_MailingController2.default.statusMailing)//Status do Mailing
    routes.get('/ufsMailing/:idMailing',_MailingController2.default.ufsMailing)//UFs do Mailing
    routes.get('/retrabalharMailing/:idMailing',_MailingController2.default.retrabalharMailing)//UFs do Mailing
    routes.get('/dddsUfMailing/:idMailing/:uf',_MailingController2.default.dddsUfMailing)//DDDs por uf do mailing
    routes.get('/totalRegUF/:idMailing',_MailingController2.default.totalRegUF)//Resumo por ddd
    routes.get('/saudeMailing/:idMailing',_MailingController2.default.saudeMailing)//Saude do mailing

    //BlackList
    routes.post('/novaLista',_BlacklistController2.default.novaLista)
    routes.get('/listarBlacklists',_BlacklistController2.default.listarBlacklists)  
    routes.get('/verDadosLista/:idLista',_BlacklistController2.default.verDadosLista)  
    routes.patch('/editarDadosLista/:idLista',_BlacklistController2.default.editarDadosLista)  
    routes.delete('/removerLista/:idLista',_BlacklistController2.default.removerLista)  
    routes.post('/importarNumeros',_multer2.default.call(void 0, _multerDataFiles2.default).single('file'),_BlacklistController2.default.importarNumeros) 
    routes.get('/modeloArquivo',_BlacklistController2.default.modeloArquivo) 
    routes.post('/addNumero',_BlacklistController2.default.addNumero)  
    routes.get('/buscarNumero/:idLista/:numero',_BlacklistController2.default.buscarNumero)  
    routes.get('/numerosBloqueados/:idLista/:pag/:limit',_BlacklistController2.default.numerosBloqueados)  
    routes.delete('/removerNumero/:idLista/:numero',_BlacklistController2.default.removerNumero)      
    routes.post('/addBlacklistCampanha',_BlacklistController2.default.addBlacklistCampanha)
    routes.get('/blacklistsCampanha/:idCampanha',_BlacklistController2.default.blacklistsCampanha)
    routes.delete('/removerBlacklistCampanha/:idCampanha/:idBlacklist',_BlacklistController2.default.removerBlacklistCampanha)
    
    
    //TESTE DE UPLOAD DE ARQUIVO
    routes.post("/posts", _multer2.default.call(void 0, _multer4.default).single('file'), (req, res)=>{   
        return res.json({ test:"Upload"})
    });

     //TESTES    
    routes.post('/addFila/:idCampanha/:nomeFila',_CampanhasController2.default.addFilaCampanha)//atribui campanha
}


