import socket from 'socket.io';
import http from 'http';

import Dashboard from '../models/Dashboard'
import Discador from '../models/Discador'
import Report from '../models/Report'

module.exports = (app) => {
    const httpServer = http.createServer(app);
    const io = socket(httpServer)
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
            Discador.statusCampanha(idCampanha,(e,info)=>{
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