import connect from '../Config/dbConnection';

class Gravacao{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    async listarGravacoes(inicio,limit){
        const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                            r.date_record,
                            r.time_record,
                            r.id,
                            r.ramal as origem,
                            r.uniqueid,
                            h.agente as ramal,
                            h.protocolo,
                            h.numero_discado AS numero,
                            tb.tabulacao,
                            tb.tipo,
                            tb.venda,
                            u.nome,
                            e.equipe,
                            t.tempo_total as duracao 
                       FROM records AS r 
                  LEFT JOIN historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                  LEFT JOIN users AS u ON h.agente=u.id 
                  LEFT JOIN users_equipes AS e ON u.equipe=e.id 
                  LEFT JOIN tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                  LEFT JOIN tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                   ORDER BY id DESC 
                      LIMIT ${inicio},${limit}`
        return await this.querySync(sql)
    }


    //protocolo 
    
    async buscarGravacao(minTime,maxTime,de,ate,buscarPor,parametro){
        let filter=""
        //Tempo de Gravação
        if(minTime){
            let time = minTime.split(':');
            let horas = parseInt(time[0]*3600)
            let minutos = parseInt(time[1]*60)
            let segundos = parseInt(time[2])
            let tempo = parseInt(horas+minutos+segundos)
            //console.log(`tempo minimo: ${tempo}`)
            if(tempo>0){
                filter += `AND t.tempo_total >= ${tempo}`
            }            
        }
        if(maxTime){
            let time = maxTime.split(':');
            let horas = parseInt(time[0]*3600)
            let minutos = parseInt(time[1]*60)
            let segundos = parseInt(time[2])
            let tempo = horas+minutos+segundos
            //console.log(`tempo maximo: ${tempo}`)
            if(tempo>0){
                filter += ` AND t.tempo_total <= ${tempo}`
            }
        }
        //Data
        if(de){
            filter += ` AND r.date >= "${de}"`
        }
        if(ate){
            filter += ` AND r.date <=  "${ate}"`
        }

        if(buscarPor){
            if(buscarPor=="protocolo"){
                filter += ` AND h.protocolo="${parametro}"`
            }            
            if(buscarPor=="ramal"){
                filter += ` AND h.agente="${parametro}"`
            }            
            if(buscarPor=="numero"){
                filter += ` AND h.numero_discado LIKE "%${parametro}%"`
            }            
            if(buscarPor=="usuario"){
                filter += ` AND u.nome LIKE "%${parametro}%"`
            }
            if(buscarPor=="equipe"){
                filter += ` AND e.equipe="${parametro}"`
            }
            if(buscarPor=="tipo"){
                filter += ` AND tb.tipo="${parametro}"`
            }
            if(buscarPor=="origem"){
                filter += ` AND r.ramal="${parametro}"`
            }
        }
        
        const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                            r.date_record,
                            r.time_record,
                            r.id,
                            r.ramal as origem,
                            r.uniqueid,
                            h.tipo,
                            h.agente as ramal,
                            h.protocolo,
                            h.numero_discado AS numero,
                            tb.tabulacao,
                            tb.tipo,
                            tb.venda,
                            u.nome,
                            e.equipe,
                            t.tempo_total as duracao 
                       FROM records AS r 
                  LEFT JOIN historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                  LEFT JOIN users AS u ON h.agente=u.id 
                  LEFT JOIN users_equipes AS e ON u.equipe=e.id 
                  LEFT JOIN tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                  LEFT JOIN tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                      WHERE 1=1 ${filter}`
        //console.log(buscarPor)
        //console.log(sql)
        return await this.querySync(sql)
    }

    async infoGravacao(idGravacao){
        const sql = `SELECT * FROM records WHERE id=${idGravacao}`
        return await this.querySync(sql)
    }
}

export default new Gravacao();