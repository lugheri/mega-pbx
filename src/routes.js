import { Router } from 'express';
import multer from 'multer';
import multerConfigs from './Config/multer';
import multerDataFiles from './Config/multerDataFiles';
import DashboardController    from './controllers/DashboardController';
import UserController    from './controllers/UserController';
import SessionController from './controllers/SessionController';
import CampanhasController from './controllers/CampanhasController'; 
import MailingController from './controllers/MailingController';
import GravacaoController from './controllers/GravacaoController';
import ReportController from './controllers/ReportController';
import AsteriskController from './controllers/AsteriskController';

import DiscadorController from './controllers/DiscadorController';


import authMiddleware from './middlewares/auth';

const routes = Router();
routes.get('/listaCampos', (req, res) =>{
    res.send('API no ar')
})

routes.get('/teste/:idCampanha/:idEquipe', ReportController.monitoramentoAgente);

//AUTENTICAÇÃO
routes.post('/login', SessionController.store);

//Retornando dominio do servidor
routes.post('/setRecord', AsteriskController.setRecord)

//OPERACOES DO AGI-ASTERISK
routes.post('/agi/:action',AsteriskController.agi);

//MIDDLEWARE DE AUTENTICACAO
routes.use(authMiddleware);

//VERIFICA TOKEN AUTENTICADO
routes.get('/authenticated', SessionController.validate);

//Logout
routes.get('/logout', SessionController.logout)

//TESTE DE UPLOAD DE ARQUIVO
routes.post("/posts", multer(multerConfigs).single('file'), (req, res)=>{   
    return res.json({ test:"Upload"})
});

//DASHBOARD 
    //Usuarios
        //Usuários em tempo real
        routes.get('/usersRealTime',DashboardController.usersRealTime)

        //Qtd de usuarios dos ultimos dias
        routes.get('/usersByDay/:limit',DashboardController.logadosPorDia)

        //Resumo de usuarios por status 
        routes.get('/usersByStatus/',DashboardController.usersByStatus)
        
        //Qtd de usuarios por status
        routes.get('/listUsersByStatus/:status',DashboardController.listUsersByStatus) 


    //Campanhas
        //Campanhas em tempo real
        routes.get('/campainsRealTime',DashboardController.campainsRealTime)

        //Qtd de campanhas
        routes.get('/campanhasByDay/:limit',DashboardController.campanhasByDay)

        //Resumo de campanhas por status 
        routes.get('/campanhasByStatus',DashboardController.campanhasByStatus)
        
        //Qtd de campanhas por status 
        routes.get('/listCampanhasByStatus/:status',DashboardController.listCampanhasByStatus)

    //Mailing das Campanhas 
        //Remumo por status do mailing
        routes.get('/mailingCampanhas',DashboardController.mailingCampanhas)

    //Monitoramento de Chamadas
        //Chamadas simultaneas vs Conectadas
        routes.get('/chamadasSimultaneas/:limit',DashboardController.chamadasSimultaneas)

        
//CAMPANHAS
    //ATIVAS
        //STATUS ATUAL DA CAMPANHA
        //Status da campanha em tempo real
        routes.get('/statusCampanha/:id',CampanhasController.statusCampanha)

        //OPERACOES DE CRIACAO E EDICAO DE CAMPANHA (CRUD)
        //Criar Campanha
        routes.post('/criarCampanha',CampanhasController.criarCampanha)
        
        //Lista campanhas
        routes.get('/listarCampanhas',CampanhasController.listarCampanhas)

        //Status de evolução do consumo do mailing da campanha
        routes.get('/statusEvolucaoCampanha/:idCampanha',CampanhasController.statusEvolucaoCampanha)
            
        //Retorna Campanha
        routes.get('/dadosCampanha/:id',CampanhasController.dadosCampanha)

        //Atualiza campanha
        routes.patch('/atualizaCampanha/:id',CampanhasController.atualizaCampanha)

        //AGENDAMENTO DA CAMPANHA
        //Agenda Campanha campanha
        routes.post('/agendarCampanha',CampanhasController.agendarCampanha)

        //Agenda Campanha campanha
        routes.get('/verAgendaCampanha/:idCampanha',CampanhasController.verAgendaCampanha)

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


        //DISCADOR DA CAMPANHAS
        //configurar discador da campanha
        routes.post('/configDiscadorCampanha',CampanhasController.configDiscadorCampanha)        

        //ver configuracoes do discador
        routes.get('/verConfigDiscadorCampanha/:idCampanha',CampanhasController.verConfigDiscadorCampanha)



        //CONFIGURACAO DAS FILAS
        //getMembers
        routes.get('/getMembersFila/:idFila',CampanhasController.getMembersFila)

        //update getMembers
        routes.patch('/updateMemberFila/:idFila',CampanhasController.updateMemberFila)

        //Listar fila da campanha
        routes.get('/listarFilasCampanha/:idCampanha/',CampanhasController.listarFilasCampanha)


        

        //MAILING DAS CAMPANHAS
        //Adiciona Mailing Campanha
        routes.post('/addMailingCampanha',CampanhasController.addMailingCampanha)

        //Lista Mailing Campanha
        routes.get('/listarMailingsCampanha/:idCampanha', CampanhasController.listarMailingCampanha)
        
        //Remove Mailing Campanha
        routes.delete('/removerMailingCampanha/:id',CampanhasController.removeMailingCampanha)

        //Mailing por UF

        //Configurar tela do agente
        //Listar campos configurados
        routes.get('/listarCamposConfigurados/:idCampanha', CampanhasController.listarCamposConfigurados)

        //Atualiza nome e inclui campo na tela do agente
        routes.post('/adicionaCampo_telaAgente', CampanhasController.adicionaCampo_telaAgente)

        //Listar campos adicionados na tela do agente
        routes.get('/listaCampos_telaAgente/:idCampanha', CampanhasController.listaCampos_telaAgente)

        //remove campo da tela do agente
        routes.delete('/removeCampo_telaAgente/:idCampanha/:idCampo', CampanhasController.removeCampo_telaAgente)



        //Old
        //get Fields
        /*routes.get('/getFieldsUserScreen/:idCampanha',CampanhasController.getFieldsUserScreen)

        //Update Fields
        routes.patch('/updateFieldsUserScreen/:idCampanha',CampanhasController.updateFieldsUserScreen)*/

    //TABULACOES
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


     //PAUSAS
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

    //FILAS
  



    //BASES
    //Pententes de revisao
    //Importar Arquivo
    routes.post('/enviarArquivo',multer(multerDataFiles).single('file'),MailingController.importarBase)

    //Higienizar Base

    //Listar Mailings importados
    routes.get('/listarMailings',MailingController.listarMailings)

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

//DISCADOR
    //novo Metodo do Discador
    routes.get('/teste_iniciandoDiscadorSistema',DiscadorController.iniciandoDiscadorSistema)

    //iniciarDiscador
    routes.get('/iniciarDiscador/:ramal',CampanhasController.iniciarDiscador)

    //Status do ramal
    routes.get('/statusRamal/:ramal',CampanhasController.statusRamal)

    //pararDiscador
    routes.get('/pararDiscador/:ramal',CampanhasController.pararDiscador)

    //Chamada atendida
    routes.get('/modoAtendimento/:ramal',AsteriskController.modoAtendimento)

    //Chamada atendida
    routes.get('/atendeChamada/:ramal',AsteriskController.atenderChamada)

    //Chamada atendida
    routes.get('/dadosChamada/:ramal',AsteriskController.dadosChamada)
    
    //Chamada desligada
    routes.post('/desligarChamada',AsteriskController.desligarChamada)
    
    //Tabular chamada
    routes.post('/tabularChamada',AsteriskController.tabularChamada)

    //Tabular chamada
    routes.post('/marcarRetorno',AsteriskController.marcarRetorno)

    //Historico de Registro
    routes.get('/historicoRegistro/:idRegistro',CampanhasController.historicoRegistro)

    //Historico de Chamadas
    routes.get('/historicoChamadas/:ramal',CampanhasController.historicoChamadas)

    //Remove chamadas paradas
    routes.get('/removeChamadasParadas/',CampanhasController.removeChamadasParadas)

//TELA DE ATENDIMENTO
    //Abrir Listagem de Pausa da Campanha
    routes.get('/pausasDisponiveis',CampanhasController.listarPausasCampanha)

    //Pausar agente
    routes.post('/pausarAgente',CampanhasController.pausarAgente)

    //Status Pausa Agente
    routes.get('/statusPausaAgente/:ramal',CampanhasController.statusPausaAgente)
 
    //Retirar Pausa
    routes.post('/removePausa/',CampanhasController.removePausaAgente)




//GRAVAÇÕES
    //Listar gravacao
    routes.get('/listarGravacoes/:limit/:pag', GravacaoController.listarGravacoes)

    //Busca as gravacoes
    routes.get('/compartilharGravacao/:idGravacao',GravacaoController.compartilharGravacao)

    //Compartilhar Gravacao
    routes.post('/buscarGravacoes',GravacaoController.buscarGravacoes)

    //Baixar Gravacao
    routes.get('/baixarGravacao/:idGravacao',GravacaoController.baixarGravacao)

//RELATORIOS
    //Lista de Campanhas ativas
    routes.get('/filtroCampanhas', ReportController.filtroCampanhas)
    //Lista de Equipes
    routes.get('/filtroEquipes/', ReportController.filtroEquipes)
    //Relatórios personalizados


//ASTERISK
    //FILAS
    //criarFila
    routes.post('/criarFila',AsteriskController.criarFila)

    //removerFila
    routes.delete('/removerFila/:nomeFila',AsteriskController.removerFila)

    //dadosFila
    routes.get('/dadosFila/:nomeFila',AsteriskController.dadosFila)

    //listarFilas
    routes.get('/listarFilas/',AsteriskController.listarFilas)

    //editarFila
    routes.patch('/editarFila/:nomeFila',AsteriskController.editarFila)

    //MEMBROS DA FILA
    //Add Membro Fila
    routes.post('/addMembroFila/', AsteriskController.addMembroFila)

    //Del Membro Fila
    routes.delete('/delMembroFila/:uniqueid', AsteriskController.delMembroFila)
    


    //configuracoes
    routes.post('/criarRamal', AsteriskController.criarRamal)

    routes.get('/listarMembrosFila/:nomeFila', AsteriskController.listarMembrosFila)

    routes.get('/listarRamais', AsteriskController.listarRamais)

    //Dados do Servidor
    routes.get('/servidorWebRTC', AsteriskController.servidorWebRTC)





    //TESTES
    //atribui campanha
    routes.post('/addFila/:idCampanha/:nomeFila',CampanhasController.addFilaCampanha)

    

    //atribui campanha
    routes.delete('/removerFilaCampanha/:idCampanha/:nomeFila',CampanhasController.delFilaCampanha)

    



   



//REPORTS
    //Monitoramento de agentes
    routes.get('/')

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

//CONFIGURACOES

    //Usuários

    //novo usuario
    routes.post('/newUser', UserController.newUser)

    //listar usuarios
    routes.get('/listUsers/:status', UserController.listUsers)

    //dados usuario
    routes.get('/userData/:userId', UserController.userData)

    //editar usuario
    routes.patch('/editUser/:userId', UserController.editUser)

    //Equipes
    //nova equipe
    routes.post('/novaEquipe', UserController.novaEquipe)

    //listar equipes
    routes.get('/listEquipes/:status', UserController.listEquipes)

    //dados equipe
    routes.get('/dadosEquipe/:idEquipe', UserController.dadosEquipe)

    //editar equipe
    routes.patch('/editEquipe/:idEquipe', UserController.editEquipe)

    //Cargos
    //novo usuario
    routes.post('/novoCargo', UserController.novoCargo)

    //listar usuarios
    routes.get('/listCargos/:status', UserController.listCargos)

    //dados usuario
    routes.get('/dadosCargo/:idCargo', UserController.dadosCargo)

    //editar usuario
    routes.patch('/editCargo/:idCargo', UserController.editCargo)

    //Níveis
    //novo usuario
    routes.post('/novoNivel', UserController.novoNivel)

    //listar usuarios
    routes.get('/listNiveis/:status', UserController.listNiveis)

    //dados usuario
    routes.get('/dadosNivel/:idNivel', UserController.dadosNivel)

    //editar usuario
    routes.patch('/editNivel/:idNivel', UserController.editNivel)


//ASTERISK
   
    

    //testes

    //dialer
    //routes.post('/dialer/:numero/:ramal', AsteriskController.dialer)
    routes.get('/originate/:numero', AsteriskController.testLigacao)
    routes.post('/ligar/:numero', AsteriskController.testLigacao)






    

export default routes;
