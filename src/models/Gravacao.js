import connect from '../Config/dbConnection';
import moment from 'moment';

class Gravacao{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async listarGravacoes(empresa,inicio,limit){
        const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                            r.date_record,
                            r.time_record,
                            r.id,
                            r.ramal as origem,
                            r.uniqueid,
                            r.callfilename,
                            h.agente as ramal,
                            h.protocolo,
                            h.nome_registro,
                            h.numero_discado AS numero,                            
                            tb.tabulacao,
                            tb.tipo,
                            tb.venda,
                            u.nome,
                            e.equipe,
                            t.tempo_total as duracao 
                       FROM ${empresa}_dados.records AS r 
                       JOIN ${empresa}_dados.historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                  LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id 
                  LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                  LEFT JOIN ${empresa}_dados.tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                  LEFT JOIN ${empresa}_dados.tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                   ORDER BY id DESC 
                      LIMIT ${inicio},${limit}`
        return await this.querySync(sql)
    }


    //protocolo 
    
    async buscarGravacao(empresa,minTime,maxTime,de,ate,buscarPor,parametro){
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
        let sepDate_de = de.split('/')
        let data_de=`${sepDate_de[2]}-${sepDate_de[1]}-${sepDate_de[0]}`

        let sepDate_ate = ate.split('/')
        let data_ate=`${sepDate_ate[2]}-${sepDate_ate[1]}-${sepDate_ate[0]}`


        if(de){
            filter += ` AND r.date >= "${data_de} 00:00:00"`
        }
        if(ate){
            filter += ` AND r.date <=  "${data_ate} 23:59:59"`
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
                            r.callfilename,
                            h.tipo,
                            h.agente as ramal,
                            h.protocolo,
                            h.numero_discado AS numero,
                            h.nome_registro,
                            tb.tabulacao,
                            tb.tipo,
                            tb.venda,
                            u.nome,
                            e.equipe,
                            t.tempo_total as duracao 
                       FROM ${empresa}_dados.records AS r 
                       JOIN ${empresa}_dados.historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                  LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id 
                  LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                  LEFT JOIN ${empresa}_dados.tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                  LEFT JOIN ${empresa}_dados.tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                      WHERE 1=1 ${filter}`
        //console.log(buscarPor)
        console.log(sql)
        return await this.querySync(sql)
    }

    async infoGravacao(empresa,idGravacao){
        const sql = `SELECT *
                       FROM ${empresa}_dados.records
                      WHERE id=${idGravacao}`
        return await this.querySync(sql)
    }

    async numeroDiscadoByUniqueid(empresa,uniqueid){
        const sql = `SELECT numero_discado AS numero
                       FROM ${empresa}_dados.historico_atendimento
                      WHERE uniqueid=${uniqueid}`
        const n =  await this.querySync(sql)
        if(n.length==0){
            return 0
        }
        return n[0].numero
    }

    async prefixEmpresa(idEmpresa){
        const sql = `SELECT prefix
                       FROM clients.accounts
                      WHERE client_number=${idEmpresa}`
        const e = await this.querySync(sql)

        if(e.length == 0){
            return false
        }

        return e[0].prefix
    }

    async linkGravacao(empresa,idRec){
        const sql = `SELECT DATE_FORMAT(r.date,'%d/%m/%Y %H:%i:%S ') AS data,
                            r.date_record,
                            r.time_record,
                            r.id,
                            r.ramal as origem,
                            r.uniqueid,
                            r.callfilename,
                            h.agente as ramal,
                            h.protocolo,
                            h.nome_registro,
                            h.numero_discado AS numero,                            
                            tb.tabulacao,
                            tb.tipo,
                            tb.venda,
                            u.nome,
                            e.equipe,
                            t.tempo_total as duracao 
                       FROM ${empresa}_dados.records AS r 
                       JOIN ${empresa}_dados.historico_atendimento AS h ON h.uniqueid=r.uniqueid 
                  LEFT JOIN ${empresa}_dados.users AS u ON h.agente=u.id 
                  LEFT JOIN ${empresa}_dados.users_equipes AS e ON u.equipe=e.id 
                  LEFT JOIN ${empresa}_dados.tempo_ligacao AS t ON r.uniqueid=t.uniqueid 
                  LEFT JOIN ${empresa}_dados.tabulacoes_status AS tb ON tb.id=h.status_tabulacao 
                      WHERE r.id=${idRec}`
        return await this.querySync(sql)
    }
}

export default new Gravacao();