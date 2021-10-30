"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _socketio = require('socket.io'); var _socketio2 = _interopRequireDefault(_socketio);
var _http = require('http'); var _http2 = _interopRequireDefault(_http);

var _Dashboard = require('../models/Dashboard'); var _Dashboard2 = _interopRequireDefault(_Dashboard);
var _Discador = require('../models/Discador'); var _Discador2 = _interopRequireDefault(_Discador);
var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);

module.exports = (app) => {
    const httpServer = _http2.default.createServer(app);
    const io = _socketio2.default.call(void 0, httpServer)
    //Dashbord
    /*io.of('/dashboard').on('connection',async (socket)=>{
        async function painel(){
            const dados = await Dashboard.painel()
            //console.log(`cliente conectado no namespace /reports client ${socket.id}`)
            socket.emit('painel',dados)
            //setTimeout(()=>{painel()},5000)
        }
        painel()
    })*/

    //Campanhas
    io.of('/campanhas').on('connection',(socket)=>{
        socket.on('statusCampanha',(dados)=>{
            const idCampanha = parseInt(dados.idCampanha)
            _Discador2.default.statusCampanha(idCampanha,(e,info)=>{
                if(e) throw e       
            
                socket.emit('statusCampanha',info)
            })
        })
    })

    /*
    //Reports
    io.of('/reports').on('connection',(socket)=>{
        //console.log(`cliente conectado no namespace /reports client ${socket.id}`)
        socket.on("monitoramentoAgente",(dados)=>{       
            console.log(`Ouvindo /reports client ${socket.id}`)     
            const idCampanha = parseInt(dados.idCampanha)
            const idEquipe = parseInt(dados.idEquipe)
            const idUser = parseInt(dados.idUser)
            Report.monitorarAgentes(idCampanha,idEquipe,idUser,(e,monitoramento)=>{
                if(e) throw e       
                    
                socket.emit('monitoramentoAgente',monitoramento) 
                console.log(`Emitindo /reports client ${socket.id}`) 
            })
        })

        socket.on("monitoramentoCampanha",(dados)=>{
            Report.monitorarCampanhas(dados.idCampanha,(e,monitoramento)=>{
                if(e) throw e       
            
                socket.emit('monitoramentoCampanha',monitoramento)
            })
        })
    })
*/
    return httpServer
}