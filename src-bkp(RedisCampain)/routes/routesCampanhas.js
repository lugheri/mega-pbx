import multer from 'multer';
import multerConfigs from '../Config/multer';
import multerDataFiles from '../Config/multerDataFiles';
import CampanhasController from '../controllers/CampanhasController'; 
import TabulacaoController from '../controllers/TabulacaoController'; 
import FilasController from '../controllers/FilasController';
import MailingController from '../controllers/MailingController';
import BlacklistController from '../controllers/BlacklistController';

module.exports = (routes) => {
    //#########  A T I V A S  ############
    //STATUS ATUAL DA CAMPANHA
    routes.get('/statusCampanha/:id',CampanhasController.statusCampanha)
    routes.get('/statusEvolucaoCampanha/:idCampanha',CampanhasController.statusEvolucaoCampanha)//Status de evolução do consumo do mailing da campanha
    routes.get('/historicoMailingsCampanha/:idCampanha',CampanhasController.historicoMailingsCampanha)
    //OPERACOES DE CRIACAO E EDICAO DE CAMPANHA (CRUD)
    routes.post('/criarCampanha',CampanhasController.criarCampanha)
    routes.get('/listarCampanhas',CampanhasController.listarCampanhas)
    routes.get('/listarCampanhasAtivas',CampanhasController.listarCampanhasAtivas)
    routes.get('/dadosCampanha/:idCampanha',CampanhasController.dadosCampanha)
    routes.patch('/atualizaCampanha/:idCampanha',CampanhasController.atualizaCampanha)

    //LISTAS DE TABULACOES    
    routes.post('/addListaTabulacaoCampanha',CampanhasController.addListaTabulacaoCampanha)//Adiciona Lista de Tabulacao
    routes.get('/listasTabulacaoCampanhas/:idCampanha',CampanhasController.listasTabulacaoCampanha)//Exibir listas de tabulacoes 
    routes.delete('/removerListaTabulacaoCampanha/:idListaNaCampanha',CampanhasController.removerListaTabulacaoCampanha)//Remove lista de tabulacoes
    //routes.get('/statusTabulacaoCampanha/:idCampanha',CampanhasController.statusTabulacaoCampanha)//Status de tabulacao da campanha
    routes.post('/setarTempoMaxTabulacao',CampanhasController.setMaxTimeStatusTab)
    routes.get('/tempoTabulacaoCampanha/:idCampanha',CampanhasController.getMaxTimeStatusTab)
    
    //INTEGRACOES
    routes.post('/criarIntegracao',CampanhasController.criarIntegracao)
    routes.get('/listarIntegracoes',CampanhasController.listarIntegracoes)
    routes.get('/dadosIntegracao/:idIntegracao',CampanhasController.dadosIntegracao)
    routes.patch('/atualizarIntegracao/:idIntegracao',CampanhasController.atualizarIntegracao)
    routes.delete('/removerIntegracao/:idIntegracao',CampanhasController.removerIntegracao)
    routes.post('/inserirIntegracaoCampanha/',CampanhasController.inserirIntegracaoCampanha)
    routes.get('/listaIntegracaoCampanha/:idCampanha',CampanhasController.listaIntegracaoCampanha)
    routes.delete('/removerIntegracaoCampanha/:idCampanha/:idIntegracao',CampanhasController.removerIntegracaoCampanha)

    //DISCADOR DA CAMPANHAS
    routes.post('/configDiscadorCampanha',CampanhasController.configDiscadorCampanha)//configurar discador da campanha  
    routes.get('/verConfigDiscadorCampanha/:idCampanha',CampanhasController.verConfigDiscadorCampanha)//ver configuracoes do discador

    //FILAS  
    routes.get('/listarFilasDisponiveis',CampanhasController.listarFilasDisponiveis)
    routes.get('/listarFilasCampanha/:idCampanha/',CampanhasController.listarFilasCampanha)
    routes.post('/addFilaCampanha',CampanhasController.addFilaCampanha)
    routes.patch('/removerFilaCampanha',CampanhasController.removerFilaCampanha)
  
    //MAILING DAS CAMPANHAS
    //listar mailings disponiveis
    /*rota disponivel na area de bases*/        
    routes.post('/addMailingCampanha',CampanhasController.addMailingCampanha)//Adiciona Mailing Campanha    
    routes.get('/listarMailingsCampanha/:idCampanha', CampanhasController.listarMailingCampanha) //Lista Mailing Campanha       
    routes.delete('/removerMailingCampanha/:idCampanha',CampanhasController.removeMailingCampanha)//Remove Mailing Campanha
    routes.post('/filtrarDiscagem',CampanhasController.filtrarDiscagem)//Remove Mailing Campanha
    routes.get('/filtrosDiscagem/:idCampanha/:uf',CampanhasController.filtrosDiscagem)//Remove Mailing Campanha
    

    //Configuracao da tela do agente
    routes.get('/listarCamposConfigurados/:idCampanha', CampanhasController.listarCamposConfigurados)//Listar campos configurados
    routes.post('/adicionaCampo_telaAgente', CampanhasController.adicionaCampo_telaAgente)//Atualiza nome e inclui campo na tela do agente
    routes.get('/listaCampos_telaAgente/:idCampanha', CampanhasController.listaCampos_telaAgente)//Listar campos adicionados na tela do agente
    routes.delete('/removeCampo_telaAgente/:idCampanha/:idCampo', CampanhasController.removeCampo_telaAgente)//remove campo da tela do agente
    
    //AGENDAMENTO DA CAMPANHA
    routes.post('/agendarCampanha',CampanhasController.agendarCampanha)//Agenda Campanha campanha    
    routes.get('/verAgendaCampanha/:idCampanha',CampanhasController.verAgendaCampanha)//Agenda Campanha campanha

    //#########  P A U S A S  ############    
    //LISTA DE PAUSAS         
    routes.post('/criarListaPausa',CampanhasController.criarListaPausa)//Criar Lista de Pausas
    routes.patch('/editarListaPausa/:id',CampanhasController.editarListaPausa)//Editar Lista de Pausas
    routes.get('/dadosListaPausa/:id',CampanhasController.dadosListaPausa)//Dados da Lista de Pausas
    routes.get('/listasPausa',CampanhasController.listasPausa)//Listar listas de Pausas

    //PAUSAS
    routes.post('/criarPausa',CampanhasController.criarPausa)//Criar Pausa
    routes.patch('/editarPausa/:id',CampanhasController.editarPausa)//Editar Pausa
    routes.delete('/removerPausa/:id',CampanhasController.removerPausa)//Remove Pausa
    routes.get('/dadosPausa/:id',CampanhasController.dadosPausa)//Ver Pausa
    routes.get('/listarPausas/:idLista',CampanhasController.listarPausas)//Listar Pausa

    //#########  T A B U L A Ç Õ E S  ############
    //LISTA DE TABULACOES     
    routes.post('/criarListaTabulacao',TabulacaoController.criarListaTabulacao)//Criar Lista de Tabulacaoes
    routes.get('/listasTabulacao',TabulacaoController.listasTabulacao)//Listar listas de tabulacoes
    routes.get('/dadosListaTabulacao/:idLista',TabulacaoController.dadosListaTabulacao)//Dados da Lista de Tabulacaoes
    routes.patch('/editarListaTabulacao/:idLista',TabulacaoController.editarListaTabulacao)//Editar Lista de Tabulacaoes
    
    //STATUS DE TABULACOES
    routes.post('/criarStatusTabulacao',TabulacaoController.criarStatusTabulacao)//Criar Status
    routes.get('/listarStatusTabulacao/:idLista',TabulacaoController.listarStatusTabulacao)//Listar Status
    routes.get('/infoStatus/:idStatus',TabulacaoController.infoStatus)//Ver status    
    routes.patch('/editarStatusTabulacao/:idStatus',TabulacaoController.editarStatusTabulacao)//Editar status
    routes.delete('/removerStatusTabulacao/:idStatus',TabulacaoController.removerStatus)
    routes.get('/reordenarStatus/:idLista',TabulacaoController.reordenarStatus)//Ver status    

    //Tipo e Ordenacao dos status
    routes.get('/getStatusTabulacao/:idLista',TabulacaoController.getStatusTabulacao)//getListaTabulacao
    routes.patch('/updateStatusTabulacao/:idLista',TabulacaoController.updateTipoStatus)//update tipo status

    //#########  F I L A S  ############
    routes.post('/criarFila',CampanhasController.criarFila)//criarFila
    routes.get('/listarFilas',CampanhasController.listarFilas)//listarFila
    routes.get('/dadosFila/:idFila',CampanhasController.dadosFila)//dadosFila
    routes.get('/configuracoesFila/:idFila',CampanhasController.configuracoesFila)//configuracoesFila
    routes.patch('/editarFila/:idFila',CampanhasController.editarFila)//editarFila
    routes.patch('/configurarFila/:idFila',CampanhasController.configurarFila)//configurarFila
    routes.delete('/removerFila/:idFila',CampanhasController.removerFila)//removerFila
    //MembrosFilas    
    routes.get('/getMembersFila/:idFila',FilasController.agentesFila)//getMembers
    routes.patch('/updateMemberFila/:idFila',FilasController.updateMemberFila)//update getMembers
    routes.get('/moveAllMembers/:idFila/:destino',FilasController.moveAllMembers)//update getMembers

    //#########  B A S E S  ############
    routes.post('/enviarArquivo',multer(multerDataFiles).single('file'), MailingController.importarBase)//Importar Arquivo
    routes.get('/iniciarConfigBase/:idBase',MailingController.iniciarConfigBase)//separa os campos do mailing para configuracao do seu tipo
    routes.post('/concluirConfigBase', MailingController.concluirConfigBase)//Conclui a importação do mailing
    routes.get('/listarMailings',MailingController.listarMailings)//Lista os mailings disponiveis
    routes.get('/abrirMailing/:idMailing/:pag/:reg', MailingController.abrirMailing)//Abrir Mailing    
    routes.get('/exportarMailing/:idMailing',MailingController.exportarMailing)//Exportar Arquivo
    routes.delete('/removerMailing/:idMailing', MailingController.removerMailing)//remover Mailing
    routes.get('/statusMailing/:idMailing',MailingController.statusMailing)//Status do Mailing
    routes.get('/ufsMailing/:idMailing',MailingController.ufsMailing)//UFs do Mailing
    routes.get('/retrabalharMailing/:idMailing',MailingController.retrabalharMailing)//UFs do Mailing
    routes.get('/dddsUfMailing/:idMailing/:uf',MailingController.dddsUfMailing)//DDDs por uf do mailing
    routes.get('/totalRegUF/:idMailing',MailingController.totalRegUF)//Resumo por ddd
    routes.get('/saudeMailing/:idMailing',MailingController.saudeMailing)//Saude do mailing
    routes.post('/formataValor',MailingController.formataValor)//Rota para testes de funcao
    
    //BlackList
    routes.post('/novaLista',BlacklistController.novaLista)
    routes.get('/listarBlacklists',BlacklistController.listarBlacklists)  
    routes.get('/verDadosLista/:idLista',BlacklistController.verDadosLista)  
    routes.patch('/editarDadosLista/:idLista',BlacklistController.editarDadosLista)  
    routes.delete('/removerLista/:idLista',BlacklistController.removerLista)  
    routes.post('/importarNumeros',multer(multerDataFiles).single('file'),BlacklistController.importarNumeros) 
    routes.get('/modeloArquivo',BlacklistController.modeloArquivo) 
    routes.post('/addNumero',BlacklistController.addNumero)  
    routes.get('/buscarNumero/:idLista/:numero',BlacklistController.buscarNumero)  
    routes.get('/numerosBloqueados/:idLista/:pag/:limit',BlacklistController.numerosBloqueados)  
    routes.delete('/removerNumero/:idLista/:numero',BlacklistController.removerNumero)      
    routes.post('/addBlacklistCampanha',BlacklistController.addBlacklistCampanha)
    routes.get('/blacklistsCampanha/:idCampanha',BlacklistController.blacklistsCampanha)
    routes.delete('/removerBlacklistCampanha/:idCampanha/:idBlacklist',BlacklistController.removerBlacklistCampanha)
    
    
    //TESTE DE UPLOAD DE ARQUIVO
    routes.post("/posts", multer(multerConfigs).single('file'), (req, res)=>{   
        return res.json({ test:"Upload"})
    });

    
}


