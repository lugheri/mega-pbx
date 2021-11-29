import socket from 'socket.io';
import http from 'http';

import Agente from '../models/Agente'
import Pausas from '../models/Pausas'
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
        
        socket.on('statusPausaAgente',(dados)=>{            
            const empresa = dados.empresa
            const ramal = dados.ramal      

            const getPausaAgente = async () =>{
                const infoPausa = await Agente.infoPausaAgente(empresa,ramal)
                const statusPausa={}
                if(infoPausa.length==0){
                    statusPausa['status']="agente disponivel"
                    socket.emit('getPausaAgente',statusPausa)
                    return false;
                }
        
                const idPausa = infoPausa[0].idPausa
                const dadosPausa = await Pausas.dadosPausa(empresa,idPausa)
                const inicio = moment(infoPausa[0].inicio, "HH:mm:ss").format("HH:mm:ss") 
                const hoje = moment().format("YYYY-MM-DD")
                const agora = moment().format("HH:mm:ss")
                const termino = infoPausa[0].termino
                const nome = infoPausa[0].nome
                const descricao = infoPausa[0].descricao
                const tempo = dadosPausa[0].tempo
        
                //Tempo passado
                let startTime = moment(`${hoje}T${inicio}`).format();
                let endTime = moment(`${hoje}T${agora}`).format();
                let duration = moment.duration(moment(endTime).diff(startTime));
        
                let horasPass = duration.hours(); //hours instead of asHours
                let minPass = duration.minutes(); //minutes instead of asMinutes
                let segPass = duration.seconds(); //minutes instead of asMinutes
                
                const tempoPassado = horasPass+':'+minPass+':'+segPass
                const minutosTotais = (horasPass*60)+minPass+(segPass/60)
                const percentual = (minutosTotais/tempo)*100
            
                //Tempo restante
                let startTime_res = moment(`${hoje}T${agora}`).format();
                let endTime_res = moment(`${hoje}T${termino}`).format();
                let duration_res = moment.duration(moment(endTime_res).diff(startTime_res));
        
                let horasRes = duration_res.hours(); //hours instead of asHours
                let minRes = duration_res.minutes(); //minutes instead of asMinutes
                let segRes = duration_res.seconds(); //minutes instead of asMinutes
        
                const tempoRestante = horasRes+':'+minRes+':'+segRes
        
                statusPausa['idPausa']=idPausa
                statusPausa['nome']=nome
                statusPausa['descricao']=descricao
                statusPausa['tempoTotal']=tempo
                statusPausa['tempoPassado']=tempoPassado
                statusPausa['tempoRestante']=tempoRestante
                statusPausa['porcentagem']=percentual.toFixed(1)
        
                socket.emit('getPausaAgente',statusPausa)
                if(idSession){
                    setTimeout(getPausaAgente,1000)
                }
            }

            getPausaAgente()
        })  
    })


    return httpServer
}