"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _socketio = require('socket.io'); var _socketio2 = _interopRequireDefault(_socketio);
var _http = require('http'); var _http2 = _interopRequireDefault(_http);

var _Dashboard = require('../models/Dashboard'); var _Dashboard2 = _interopRequireDefault(_Dashboard);
var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);

module.exports = (app) => {
    const httpServer = _http2.default.createServer(app);
    const io = _socketio2.default.call(void 0, httpServer)
    //Dashbord
    io.of('/dashboard').on('connection',async (socket)=>{
        async function painel(){
            const dados = await _Dashboard2.default.painel()
            //console.log(`cliente conectado no namespace /reports client ${socket.id}`)
            socket.emit('painel',dados)
            setTimeout(()=>{painel()},5000)
        }
        painel()
    })

    
    //Reports
    io.of('/reports').on('connection',(socket)=>{
        console.log(`cliente conectado no namespace /reports client ${socket.id}`)
        socket.on("monitoramentoAgente",(dados)=>{       
            console.log(`Ouvindo /reports client ${socket.id}`)     
            const idCampanha = parseInt(dados.idCampanha)
            const idEquipe = parseInt(dados.idEquipe)
            const idUser = parseInt(dados.idUser)
            _Report2.default.monitorarAgentes(idCampanha,idEquipe,idUser,(e,monitoramento)=>{
                if(e) throw e       
                    
                socket.emit('monitoramentoAgente',monitoramento) 
                console.log(`Emitindo /reports client ${socket.id}`) 
            })
        })

        socket.on("monitoramentoCampanha",(dados)=>{
            _Report2.default.monitorarCampanhas(dados.idCampanha,(e,monitoramento)=>{
                if(e) throw e       
            
                socket.emit('monitoramentoCampanha',monitoramento)
            })
        })
    })

    return httpServer
}