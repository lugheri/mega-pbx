"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _multer = require('multer'); var _multer2 = _interopRequireDefault(_multer);
var _multer3 = require('./Config/multer'); var _multer4 = _interopRequireDefault(_multer3);
var _multerDataFiles = require('./Config/multerDataFiles'); var _multerDataFiles2 = _interopRequireDefault(_multerDataFiles);
var _DashboardController = require('./controllers/DashboardController'); var _DashboardController2 = _interopRequireDefault(_DashboardController);
var _UserController = require('./controllers/UserController'); var _UserController2 = _interopRequireDefault(_UserController);
var _SessionController = require('./controllers/SessionController'); var _SessionController2 = _interopRequireDefault(_SessionController);
var _CampanhasController = require('./controllers/CampanhasController'); var _CampanhasController2 = _interopRequireDefault(_CampanhasController); 
var _MailingController = require('./controllers/MailingController'); var _MailingController2 = _interopRequireDefault(_MailingController);
var _ReportController = require('./controllers/ReportController'); var _ReportController2 = _interopRequireDefault(_ReportController);
var _AsteriskController = require('./controllers/AsteriskController'); var _AsteriskController2 = _interopRequireDefault(_AsteriskController);


var _auth = require('./middlewares/auth'); var _auth2 = _interopRequireDefault(_auth);

const routes = _express.Router.call(void 0, );
//Teste de API
routes.get('/teste', (req, res) =>{
    res.send('API no ar')
})

//AUTENTICAÇÃO
routes.post('/login', _SessionController2.default.store);

//OPERACOES DO AGI-ASTERISK
routes.post('/agi/:action',_AsteriskController2.default.agi);

//MIDDLEWARE DE AUTENTICACAO
routes.use(_auth2.default);

//VERIFICA TOKEN AUTENTICADO
routes.get('/authenticated', _SessionController2.default.validate);

//Logout
routes.get('/logout', _SessionController2.default.logout)

//TESTE DE UPLOAD DE ARQUIVO
routes.post("/posts", _multer2.default.call(void 0, _multer4.default).single('file'), (req, res)=>{   
    return res.json({ test:"Upload"})
});

//DASHBOARD 
    //Usuarios
        //Qtd de usuarios dos ultimos dias
        routes.get('/usersByDay/:limit',_DashboardController2.default.logadosPorDia)

        //Resumo de usuarios por status 
        routes.get('/usersByStatus/',_DashboardController2.default.usersByStatus)
        
        //Qtd de usuarios por status
        routes.get('/listUsersByStatus/:status',_DashboardController2.default.listUsersByStatus) 


    //Campanhas
        //Qtd de campanhas
        routes.get('/campanhasByDay/:limit',_DashboardController2.default.campanhasByDay)

        //Resumo de campanhas por status 
        routes.get('/campanhasByStatus',_DashboardController2.default.campanhasByStatus)
        
        //Qtd de campanhas por status 
        routes.get('/listCampanhasByStatus/:status',_DashboardController2.default.listCampanhasByStatus)

    //Mailing das Campanhas 
        //Remumo por status do mailing
        routes.get('/mailingCampanhas',_DashboardController2.default.mailingCampanhas)

    //Monitoramento de Chamadas
        //Chamadas simultaneas vs Conectadas
        routes.get('/chamadasSimultaneas/:limit',_DashboardController2.default.chamadasSimultaneas)

        
//CAMPANHAS
    //ATIVAS
        //STATUS ATUAL DA CAMPANHA
        //Status da campanha em tempo real
        routes.get('/statusCampanha/:id',_CampanhasController2.default.statusCampanha)

        //OPERACOES DE CRIACAO E EDICAO DE CAMPANHA (CRUD)
        //Criar Campanha
        routes.post('/criarCampanha',_CampanhasController2.default.criarCampanha)
        
        //Lista campanhas
        routes.get('/listarCampanhas',_CampanhasController2.default.listarCampanhas)

        //Status de evolução do consumo do mailing da campanha
        routes.get('/statusEvolucaoCampanha/:idCampanha',_CampanhasController2.default.statusEvolucaoCampanha)
            
        //Retorna Campanha
        routes.get('/dadosCampanha/:id',_CampanhasController2.default.dadosCampanha)

        //Atualiza campanha
        routes.patch('/atualizaCampanha/:id',_CampanhasController2.default.atualizaCampanha)

        //AGENDAMENTO DA CAMPANHA
        //Agenda Campanha campanha
        routes.post('/agendarCampanha',_CampanhasController2.default.agendarCampanha)

        //Agenda Campanha campanha
        routes.get('/verAgendaCampanha/:idCampanha',_CampanhasController2.default.verAgendaCampanha)

        //LISTAS DE TABULACOES
        //Adiciona Lista de Tabulacao
        routes.post('/addListaTabulacaoCampanha',_CampanhasController2.default.addListaTabulacaoCampanha)

        //Exibir listas de tabulacoes
        routes.get('/listasTabulacaoCampanhas/:idCampanha',_CampanhasController2.default.listasTabulacaoCampanha)
        
        //Remove lista de tabulacoes
        routes.delete('/removerListaTabulacaoCampanha/:idListaNaCampanha',_CampanhasController2.default.removerListaTabulacaoCampanha)

        //INTEGRACOES


        //DISCADOR DA CAMPANHAS
        //configurar discador da campanha
        routes.post('/configDiscadorCampanha',_CampanhasController2.default.configDiscadorCampanha)

        //ver configuracoes do discador
        routes.get('/verConfigDiscadorCampanha/:idCampanha',_CampanhasController2.default.verConfigDiscadorCampanha)



        //CONFIGURACAO DAS FILAS
        //getMembers
        routes.get('/getMembersFila/:idFila',_CampanhasController2.default.getMembersFila)

        //update getMembers
        routes.patch('/updateMemberFila/:idFila',_CampanhasController2.default.updateMemberFila)

        //Listar fila da campanha
        routes.get('/listarFilasCampanha/:idCampanha/',_CampanhasController2.default.listarFilasCampanha)


        

        //MAILING DAS CAMPANHAS
        //Adiciona Mailing Campanha
        routes.post('/addMailingCampanha',_CampanhasController2.default.addMailingCampanha)

        //Lista Mailing Campanha
        routes.get('/listarMailingsCampanha/:idCampanha', _CampanhasController2.default.listarMailingCampanha)
        
        //Remove Mailing Campanha
        routes.delete('/removerMailingCampanha/:id',_CampanhasController2.default.removeMailingCampanha)

        //Mailing por UF

        //Configurar tela do agente
        //get Fields
        routes.get('/getFieldsUserScreen/:idCampanha',_CampanhasController2.default.getFieldsUserScreen)

        //Update Fields
        routes.patch('/updateFieldsUserScreen/:idCampanha',_CampanhasController2.default.updateFieldsUserScreen)

    //TABULACOES
        //LISTA DE TABULACOES     
        //Criar Lista de Tabulacaoes
        routes.post('/criarListaTabulacao',_CampanhasController2.default.criarListaTabulacao)
        //Editar Lista de Tabulacaoes
        routes.patch('/editarListaTabulacao/:id',_CampanhasController2.default.editarListaTabulacao)
        //Dados da Lista de Tabulacaoes
        routes.get('/dadosListaTabulacao/:id',_CampanhasController2.default.dadosListaTabulacao)
        //Listar listas de tabulacoes
        routes.get('/listasTabulacao',_CampanhasController2.default.listasTabulacao)

        //STATUS DE TABULACOES
        //Criar Status
        routes.post('/criarStatusTabulacao',_CampanhasController2.default.criarStatusTabulacao)
        //Editar status
        routes.patch('/editarStatusTabulacao/:id',_CampanhasController2.default.editarStatusTabulacao)
        //Ver status
        routes.get('/statusTabulacao/:id',_CampanhasController2.default.statusTabulacao)
        //Listar Status
        routes.get('/listarStatusTabulacao/:idLista',_CampanhasController2.default.listarStatusTabulacao)


     //PAUSAS
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

    //FILAS
  



    //BASES
    //Pententes de revisao
    //Importar Arquivo
    routes.post('/enviarArquivo',_multer2.default.call(void 0, _multerDataFiles2.default).single('file'),_MailingController2.default.importarBase)

    //Higienizar Base

    //Listar Mailings importados
    routes.get('/listarMailings',_MailingController2.default.listarMailings)

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



   


    


//DISCADOR

//GRAVAÇÕES

//RELATORIOS

//ASTERISK
    //FILAS
    //criarFila
    routes.post('/criarFila',_AsteriskController2.default.criarFila)

    //removerFila
    routes.delete('/removerFila/:nomeFila',_AsteriskController2.default.removerFila)

    //dadosFila
    routes.get('/dadosFila/:nomeFila',_AsteriskController2.default.dadosFila)

    //listarFilas
    routes.get('/listarFilas/',_AsteriskController2.default.listarFilas)

    //editarFila
    routes.patch('/editarFila/:nomeFila',_AsteriskController2.default.editarFila)

    //MEMBROS DA FILA
    //Add Membro Fila
    routes.post('/addMembroFila/', _AsteriskController2.default.addMembroFila)

    //Del Membro Fila
    routes.delete('/delMembroFila/:uniqueid', _AsteriskController2.default.delMembroFila)
    


    //configuracoes
    routes.post('/criarRamal', _AsteriskController2.default.criarRamal)

    routes.get('/listarMembrosFila/:nomeFila', _AsteriskController2.default.listarMembrosFila)

    routes.get('/listarRamais', _AsteriskController2.default.listarRamais)

    //Dados do Servidor
    routes.get('/servidorWebRTC', _AsteriskController2.default.servidorWebRTC)





    //TESTES
    //atribui campanha
    routes.post('/addFila/:idCampanha/:nomeFila',_CampanhasController2.default.addFilaCampanha)

    

    //atribui campanha
    routes.delete('/removerFilaCampanha/:idCampanha/:nomeFila',_CampanhasController2.default.delFilaCampanha)

    //DISCADOR
    //Chamada atendida
    routes.get('/atendeChamada/:ramal',_AsteriskController2.default.atenderChamada)
    
    //Chamada desligada
    routes.post('/desligarChamada',_AsteriskController2.default.desligarChamada)
    
    //Tabular chamada
    routes.post('/tabularChamada',_AsteriskController2.default.tabularChamada)



   



//REPORTS
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

//CONFIGURACOES

    //Usuários

    //novo usuario
    routes.post('/newUser', _UserController2.default.newUser)

    //listar usuarios
    routes.get('/listUsers/:status', _UserController2.default.listUsers)

    //dados usuario
    routes.get('/userData/:userId', _UserController2.default.userData)

    //editar usuario
    routes.patch('/editUser/:userId', _UserController2.default.editUser)

    //Equipes
    //nova equipe
    routes.post('/novaEquipe', _UserController2.default.novaEquipe)

    //listar equipes
    routes.get('/listEquipes/:status', _UserController2.default.listEquipes)

    //dados equipe
    routes.get('/dadosEquipe/:idEquipe', _UserController2.default.dadosEquipe)

    //editar equipe
    routes.patch('/editEquipe/:idEquipe', _UserController2.default.editEquipe)

    //Cargos
    //novo usuario
    routes.post('/novoCargo', _UserController2.default.novoCargo)

    //listar usuarios
    routes.get('/listCargos/:status', _UserController2.default.listCargos)

    //dados usuario
    routes.get('/dadosCargo/:idCargo', _UserController2.default.dadosCargo)

    //editar usuario
    routes.patch('/editCargo/:idCargo', _UserController2.default.editCargo)

    //Níveis
    //novo usuario
    routes.post('/novoNivel', _UserController2.default.novoNivel)

    //listar usuarios
    routes.get('/listNiveis/:status', _UserController2.default.listNiveis)

    //dados usuario
    routes.get('/dadosNivel/:idNivel', _UserController2.default.dadosNivel)

    //editar usuario
    routes.patch('/editNivel/:idNivel', _UserController2.default.editNivel)


//ASTERISK
   
    

    //testes

    //dialer
    //routes.post('/dialer/:numero/:ramal', AsteriskController.dialer)
    //routes.get('/originate/:numero', AsteriskController.testLigacao)
    routes.post('/ligar/:numero', _AsteriskController2.default.testLigacao)






    

exports. default = routes;
