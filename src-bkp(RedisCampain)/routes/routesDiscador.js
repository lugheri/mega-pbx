import DiscadorController from '../controllers/DiscadorController';

module.exports = (routes) => {
    //DISCADOR
    //novo Metodo do Discador
    //routes.get('/teste_iniciandoDiscadorSistema',DiscadorController.dial)   
    //campanhas do agente
    routes.get('/campanhasAtivasAgente/:agente',DiscadorController.campanhasAtivasAgente)
}