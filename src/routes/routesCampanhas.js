import multer from 'multer';
import multerConfigs from '../Config/multer';
import multerDataFiles from '../Config/multerDataFiles';
import CampanhasController from '../controllers/CampanhasController'; 
import TabulacaoController from '../controllers/TabulacaoController'; 
import FilasController from '../controllers/FilasController';
import MailingController from '../controllers/MailingController';

module.exports = (routes) => {
    //#########  A T I V A S  ############
    //STATUS ATUAL DA CAMPANHA
    routes.get('/statusCampanha/:id',CampanhasController.statusCampanha)
    
    //OPERACOES DE CRIACAO E EDICAO DE CAMPANHA (CRUD)
    routes.post('/criarCampanha',CampanhasController.criarCampanha)
    routes.get('/listarCampanhas',CampanhasController.listarCampanhas)
    routes.get('/listarCampanhasAtivas',CampanhasController.listarCampanhasAtivas)
    routes.get('/dadosCampanha/:idCampanha',CampanhasController.dadosCampanha)
    routes.patch('/atualizaCampanha/:idCampanha',CampanhasController.atualizaCampanha)

    //LISTAS DE TABULACOES
    //Adiciona Lista de Tabulacao
    routes.post('/addListaTabulacaoCampanha',CampanhasController.addListaTabulacaoCampanha)
    //Exibir listas de tabulacoes
    routes.get('/listasTabulacaoCampanhas/:idCampanha',CampanhasController.listasTabulacaoCampanha)    
    //Remove lista de tabulacoes
    routes.delete('/removerListaTabulacaoCampanha/:idListaNaCampanha',CampanhasController.removerListaTabulacaoCampanha)
    //Status de tabulacao da campanha
    routes.get('/statusTabulacaoCampanha/:idCampanha',CampanhasController.statusTabulacaoCampanha)

    //INTEGRACOES
    routes.post('/criarIntegracao',CampanhasController.criarIntegracao)
    routes.get('/listarIntegracoes',CampanhasController.listarIntegracoes)
    routes.get('/dadosIntegracao/:idIntegracao',CampanhasController.dadosIntegracao)
    routes.patch('/atualizarIntegracao/:idIntegracao',CampanhasController.atualizarIntegracao)
    routes.delete('/removerIntegracao/:idIntegracao',CampanhasController.removerIntegracao)
    routes.post('/inserirIntegracaoCampanha/',CampanhasController.inserirIntegracaoCampanha)

    //DISCADOR DA CAMPANHAS
    //configurar discador da campanha
    routes.post('/configDiscadorCampanha',CampanhasController.configDiscadorCampanha)
    //ver configuracoes do discador
    routes.get('/verConfigDiscadorCampanha/:idCampanha',CampanhasController.verConfigDiscadorCampanha)

    //FILAS  
    routes.get('/listarFilasDisponiveis',CampanhasController.listarFilasDisponiveis)
    routes.get('/listarFilasCampanha/:idCampanha/',CampanhasController.listarFilasCampanha)
    routes.post('/addFilaCampanha',CampanhasController.addFilaCampanha)
    routes.patch('/removerFilaCampanha',CampanhasController.removerFilaCampanha)
  
    //MAILING DAS CAMPANHAS
    //listar mailings disponiveis
    /*rota disponivel na area de bases*/    
    //Adiciona Mailing Campanha
    routes.post('/addMailingCampanha',CampanhasController.addMailingCampanha)
    //Lista Mailing Campanha
    routes.get('/listarMailingsCampanha/:idCampanha', CampanhasController.listarMailingCampanha)        
    //Remove Mailing Campanha
    routes.delete('/removerMailingCampanha/:id',CampanhasController.removeMailingCampanha)

    //Configuracao da tela do agente
    //Listar campos configurados
    routes.get('/listarCamposConfigurados/:idCampanha', CampanhasController.listarCamposConfigurados)
    //Atualiza nome e inclui campo na tela do agente
    routes.post('/adicionaCampo_telaAgente', CampanhasController.adicionaCampo_telaAgente)
    //Listar campos adicionados na tela do agente
    routes.get('/listaCampos_telaAgente/:idCampanha', CampanhasController.listaCampos_telaAgente)
    //remove campo da tela do agente
    routes.delete('/removeCampo_telaAgente/:idCampanha/:idCampo', CampanhasController.removeCampo_telaAgente)

    //Status de evolução do consumo do mailing da campanha
    routes.get('/statusEvolucaoCampanha/:idCampanha',CampanhasController.statusEvolucaoCampanha)

    //AGENDAMENTO DA CAMPANHA
    //Agenda Campanha campanha
    routes.post('/agendarCampanha',CampanhasController.agendarCampanha)

    //Agenda Campanha campanha
    routes.get('/verAgendaCampanha/:idCampanha',CampanhasController.verAgendaCampanha)

    //#########  P A U S A S  ############    
    //LISTA DE PAUSAS     
    //Criar Lista de Pausas
    routes.post('/criarListaPausa',CampanhasController.criarListaPausa)
    //Editar Lista de Pausas
    routes.patch('/editarListaPausa/:id',CampanhasController.editarListaPausa)
    //Dados da Lista de Pausas
    routes.get('/dadosListaPausa/:id',CampanhasController.dadosListaPausa)
    //Listar listas de Pausas
    routes.get('/listasPausa',CampanhasController.listasPausa)

    //PAUSAS
    //Criar Pausa
    routes.post('/criarPausa',CampanhasController.criarPausa)
    //Editar Pausa
    routes.patch('/editarPausa/:id',CampanhasController.editarPausa)
    //Ver Pausa
    routes.get('/dadosPausa/:id',CampanhasController.dadosPausa)
    //Listar Pausa
    routes.get('/listarPausas/:idLista',CampanhasController.listarPausas)


    //#########  T A B U L A Ç Õ E S  ############
    //LISTA DE TABULACOES     
    //Criar Lista de Tabulacaoes
    routes.post('/criarListaTabulacao',TabulacaoController.criarListaTabulacao)
    //Editar Lista de Tabulacaoes
    routes.patch('/editarListaTabulacao/:id',TabulacaoController.editarListaTabulacao)
    //Dados da Lista de Tabulacaoes
    routes.get('/dadosListaTabulacao/:id',TabulacaoController.dadosListaTabulacao)
    //Listar listas de tabulacoes
    routes.get('/listasTabulacao',TabulacaoController.listasTabulacao)

    //STATUS DE TABULACOES
    //Criar Status
    routes.post('/criarStatusTabulacao',TabulacaoController.criarStatusTabulacao)
    //Editar status
    routes.patch('/editarStatusTabulacao/:id',TabulacaoController.editarStatusTabulacao)
    //Ver status
    routes.get('/statusTabulacao/:id',TabulacaoController.statusTabulacao)
    //Listar Status
    // routes.get('/listarStatusTabulacao/:idLista',TabulacaoController.listarStatusTabulacao)
    //getListaTabulacao
    routes.get('/getStatusTabulacao/:idLista',TabulacaoController.getStatus)
    //update tipo status
    routes.patch('/updateStatusTabulacao/:idLista',TabulacaoController.updateTipoStatus)

    //#########  F I L A S  ############
    //criarFila
    routes.post('/criarFila',CampanhasController.criarFila)
    //removerFila
    routes.delete('/removerFila/:nomeFila',CampanhasController.removerFila)
    //dadosFila
    routes.get('/dadosFila/:nomeFila',CampanhasController.dadosFila)
    //listarFila
    routes.get('/listarFilas',CampanhasController.listarFilas)
    //editarFila
    routes.patch('/editarFila/:nomeFila',CampanhasController.editarFila)

    //getMembers
    routes.get('/getMembersFila/:idFila',FilasController.getMembersFila)
    //update getMembers
    routes.patch('/updateMemberFila/:idFila',FilasController.updateMemberFila)

    //#########  B A S E S  ############
    //Importar Arquivo
    routes.post('/enviarArquivo',multer(multerDataFiles).single('file'), MailingController.importarBase)
    //Listar Mailings importados
    routes.get('/listarMailings', MailingController.listarMailings)
    //Abrir Mailing
    //Remover Mailing


    //Old
    //Pententes de revisao

    //Abrir Mailing
    routes.get('/abrirMailing/:idMailing/:pag/:reg', MailingController.abrirMailing)    

    //remover Mailing
    routes.delete('/removerMailing/:idMailing', MailingController.removerMailing)

    //Exportar Arquivo
    routes.get('/exportarMailing/:idMailing',MailingController.exportarMailing)

    
    //CONFIGURAÇÃO DO MAILING
    //Status do Mailing
    routes.get('/statusMailing/:idMailing',MailingController.statusMailing)

    //Prévia dos dados
    routes.get('/previewMailing/:idMailing',MailingController.previewMailing)

    //UFs do Mailing
    routes.get('/ufsMailing/:idMailing',MailingController.ufsMailing)

    //DDDs por uf do mailing
    routes.get('/dddsUfMailing/:idMailing/:uf',MailingController.dddsUfMailing)

    //Resumo por ddd
    routes.get('/totalRegUF/:idMailing',MailingController.totalRegUF)

    //Saude do mailing
    routes.get('/saudeMailing/:idMailing',MailingController.saudeMailing)

    //Campos do Mailing e seu tipo
    routes.get('/camposVsTipo/:idMailing',MailingController.camposVsTipo)

    //Atualizar tipo do campo
    routes.patch('/atualizaTipoCampo/:idCampo',MailingController.atualizaTipoCampo)

    //TESTE DE UPLOAD DE ARQUIVO
    routes.post("/posts", multer(multerConfigs).single('file'), (req, res)=>{   
        return res.json({ test:"Upload"})
    });

     //TESTES
    //atribui campanha
    routes.post('/addFila/:idCampanha/:nomeFila',CampanhasController.addFilaCampanha)    

    

   
}