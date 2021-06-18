import socket from 'socket.io';
import http from 'http';

import Report from '../models/Report'

module.exports = (app) => {
    const httpServer = http.createServer(app);
    const io = socket(httpServer)
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
                Report.monitorarAgentes(idCampanha,idEquipe,(e,monitoramento)=>{
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
                Report.monitorarCampanhas(dados.idCampanha,(e,monitoramento)=>{
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