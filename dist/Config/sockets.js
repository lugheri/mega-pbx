"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _socketio = require('socket.io'); var _socketio2 = _interopRequireDefault(_socketio);
var _http = require('http'); var _http2 = _interopRequireDefault(_http);

var _Report = require('../models/Report'); var _Report2 = _interopRequireDefault(_Report);

module.exports = (app) => {
    const httpServer = _http2.default.createServer(app);
    const io = _socketio2.default.call(void 0, httpServer)
    const nameSpace = io.of('/reports');
    nameSpace.on('connection',(socket)=>{
        //console.log(`cliente conectado no namespace /reports client ${socket.id}`)
        socket.on("monitoramentoAgente",(dados)=>{ 
            async function inicio(){                
                while(true){
                    await reportPromise(dados)
                }
            }

            function reportPromise(dados){
                return new Promise(resolve=>setTimeout(()=>{
                                   report(dados)
                                   resolve()
                },dados.timeout))
            }

            function report(dados){
                const idCampanha = parseInt(dados.idCampanha)
                const idEquipe = parseInt(dados.idEquipe)
                _Report2.default.monitorarAgentes(idCampanha,idEquipe,(e,monitoramento)=>{
                    if(e) throw e       
                    
                    socket.emit('monitoramentoAgente',monitoramento)
                })
            }
            inicio()
            report(dados)
        })

        socket.on("monitoramentoCampanha",(dados)=>{
            async function inicioCampanhas(){                
                while(true){
                    await campanhasPromise(dados)
                }
            } 

            function campanhasPromise(dados){
                return new Promise(resolve=>setTimeout(()=>{
                                   reportCampanhas(dados.idCampanha)
                                   resolve()
                },dados.timeout))
            }
            function reportCampanhas(dados){
                _Report2.default.monitorarCampanhas(dados.idCampanha,(e,monitoramento)=>{
                    if(e) throw e       
                    socket.emit('monitoramentoCampanha',monitoramento)
                })
            }
            inicioCampanhas()
            reportCampanhas(dados)
        })
    })

    return httpServer
}