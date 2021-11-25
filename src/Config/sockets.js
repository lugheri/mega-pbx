import socket from 'socket.io';
import http from 'http';

import Agente from '../models/Agente'
import moment from 'moment'
import Report from '../models/Report'

module.exports = (app) => {
    const httpServer = http.createServer(app);
    const io = socket(httpServer)

    //Agentes 
    io.of('/agentes').on('connection',(socket)=>{
        let idSession = socket.id

        socket.on('disconnect',()=>{
            idSession = false
        })
        socket.on('statusAgente',(dados)=>{            
            const empresa = dados.empresa
            const ramal = dados.ramal         
            const getAgentes = async () =>{
                let estado = 0
                let tempo = 0    
                const estadoRamal = await Agente.statusRamal(empresa,ramal)
                estado = estadoRamal['estado'];
                const now = moment(new Date());         
                const duration = moment.duration(now.diff(estadoRamal['hora']))
                tempo=await Report.converteSeg_tempo(duration.asSeconds())      
             
                const estados=['deslogado','disponivel','em pausa','falando','indisponivel','tela reg.','ch manual','lig. manual'];
                const status = {}
                      status['idEstado']=estado
                      status['estado']=estados[estado]
                      status['tempo']=tempo 

                socket.emit('getStatus',status)
                if(idSession){
                    setTimeout(getAgentes,1000)
                }
            }
            getAgentes()
        })       
    })


    return httpServer
}