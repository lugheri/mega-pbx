import connect from '../Config/dbConnection';
import Asterisk from './Asterisk';
import Campanhas from './Campanhas';
import moment from 'moment';
class Discador{
 
    agentesFila(fila,callback){
        const sql =  `SELECT * FROM queue_members WHERE queue_name='${fila}'`     
        connect.asterisk.query(sql,callback)
    }

    agentesDisponiveis(idFilaCampanha,callback){        
        const sql = `SELECT ramal FROM agentes_filas WHERE fila='${idFilaCampanha}' AND estado=1`
        connect.banco.query(sql,callback)
    }

    camposDiscagem(tabela,tipo,callback){
        //verificando campos para discagem
        const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='${tipo}' ORDER BY id ASC LIMIT 1`
        connect.banco.query(sql,callback)
    }

    parametrosDiscador(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_discador WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    chamadasSimultaneas(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }
    
    todas_chamadasConectadas(callback){
        const sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE falando=1 `
        connect.banco.query(sql,callback)
    }

    todas_chamadasSimultaneas(callback){
        const sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas`
        connect.banco.query(sql,callback)
    }

    //Modo novo de filtragem que adiciona os ids dos registros na tabela de tabulacao a medida que forem sendo trabalhados
    filtrarRegistro(idCampanha,tabela,idMailing,tentativas,ordem,callback){
        const sql = `SELECT m.id_key_base AS idRegistro FROM ${tabela} AS m LEFT OUTER JOIN campanhas_tabulacao_mailing AS t ON m.id_key_base=t.idRegistro WHERE idMailing=${idMailing} AND idCampanha=${idCampanha} AND estado=0 AND t.tentativas < ${tentativas} OR idMailing IS NULL AND idCampanha IS NULL ORDER BY t.tentativas ${ordem} LIMIT 1`
        connect.mailings.query(sql,(er,reg)=>{
            if(er) throw er

            if(reg.length > 0){
           
                const idRegistro = reg[0].idRegistro

                //Verificando se o registro ja foi adicionado a lista de tabulacao desta campanha
                const sql = `SELECT id FROM campanhas_tabulacao_mailing WHERE idMailing=${idMailing} AND idCampanha=${idCampanha} AND idRegistro=${idRegistro} LIMIT 1`
                connect.mailings.query(sql,(er,verificacao)=>{

                    if(verificacao.length == 1){//Caso o registro exista o mesmo eh atualizado
                        const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Discando' WHERE id=${idRegistro}`
                        connect.mailings.query(sql,(e,r)=>{
                            if(e) throw e
                            
                        })
                    }else{//Caso contrário insere o mesmo
                        const sql = `INSERT INTO campanhas_tabulacao_mailing (idCampanha,idMailing,idRegistro,estado,desc_estado,tentativas) VALUES (${idCampanha},${idMailing},${idRegistro},1,'Discando',0)`
                        connect.mailings.query(sql,(e,r)=>{
                            if(e) throw e
                            
                        })
                    }
                })
                callback(er,reg)
            }else{
                callback(er,reg)
            }
        })
        //Estados do registro
        //0 - Disponivel
        //1 - Discando
        //2 - Na Fila
        //3 - Atendido
        //4 - Já Trabalhado  
    }

    //Modo de filtragem de registro com os ids do mailing previamente adicionados a tabulacao
    filtrarRegistro_off(idCampanha,tabela,tentativas,ordem,callback){
        const sql = `SELECT id,idRegistro FROM campanhas_tabulacao_mailing WHERE idCampanha=${idCampanha} AND estado=0 AND tentativas < ${tentativas} ORDER BY tentativas ${ordem} LIMIT 1`
        connect.mailings.query(sql,(er,reg)=>{
           // if(er) throw er

           if(reg.length > 0){

            const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Discando' WHERE id=${reg[0].id}`
            connect.mailings.query(sql,(e,r)=>{
                if(e) throw e

                callback(er,reg)
            })
            }else{
                callback(er,reg)
            }
        })
        //Estados do registro
        //0 - Disponivel
        //1 - Discando
        //2 - Na Fila
        //3 - Atendido
        //4 - Já Trabalhado  
    }

    pegarTelefone(idRegistro,tabela,callback){
        //Verificando se o numero do telene e ddd estao juntos
        const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='ddd_e_telefone' ORDER BY id ASC LIMIT 1`
        connect.banco.query(sql,(e,numeroCompleto)=>{
            if(e) throw e

            if(numeroCompleto != 0){
                //Campo com DDD e NUMERO juntos
                const telefone = numeroCompleto[0].campo
                const sql = `SELECT ${telefone} as numero FROM ${tabela} WHERE id_key_base=${idRegistro}`
                connect.mailings.query(sql,callback)
            }else{
                //Campo com DDD e NUMERO separados
                const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='ddd' ORDER BY id ASC LIMIT 1`
                connect.banco.query(sql,(e,dddQ)=>{
                    if(e) throw e

                    const ddd = dddQ[0].campo

                    //Separando campo campo do Número
                    const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='telefone' ORDER BY id ASC LIMIT 1`
                    connect.banco.query(sql,(e,telefoneQ)=>{
                        if(e) throw e

                        const telefone = telefoneQ[0].campo

                        //Separando registro
                        const sql = `SELECT ${ddd} as ddd, ${telefone} as numero FROM ${tabela} WHERE id_key_base=${idRegistro}`
                        connect.mailings.query(sql,callback)
                    })
                })
            }            
        })
    }

    ligar(ramal,numero,callback){

        //Recuperando dados do asterisk
        const sql = `SELECT * FROM asterisk_ari WHERE active=1`; 
        connect.banco.query(sql,(e,asterisk_server)=>{
            if(e) throw e
            const modo='discador'
            const server = asterisk_server[0].server
            const user =  asterisk_server[0].user
            const pass =  asterisk_server[0].pass
            
            Asterisk.ligar(server,user,pass,modo,ramal,numero,callback)
            callback(e,true)
        })
    }

    registraChamada(ramal,idCampanha,modoAtendimento,idMailing,tabela,id_reg,numero,fila,callback){
        const hoje = moment().format("YMMDDHHmmss")
        const protocolo = hoje+'0'+ramal
        const tipo = 'discador'
        const sql = `INSERT INTO campanhas_chamadas_simultaneas (data,ramal,protocolo,tipo_ligacao,modo_atendimento,id_campanha,id_mailing,tabela_mailing,id_reg,numero,fila) VALUES (now(),'${ramal}','${protocolo}','${tipo}','${modoAtendimento}','${idCampanha}','${idMailing}','${tabela}','${id_reg}','0${numero}','${fila}')`
        connect.banco.query(sql,callback)

        /*STATUS DAS CHAMADAS SIMULTANEAS
        
        */
    }

    registrarChamadasSimultaneas(){
        this.todas_chamadasSimultaneas((e,chamadas)=>{
            if(e) throw e
            //Total de chamadas simultaneas
            const chamadas_simultaneas = chamadas[0].total
            this.todas_chamadasConectadas((e,conectadas)=>{
                if(e) throw e

                const chamadas_conectadas = conectadas[0].total
                const sql = `DELETE FROM log_chamadas_simultaneas WHERE DATA < DATE_SUB(NOW(), INTERVAL 1 DAY);`
                connect.banco.query(sql,(e,r)=>{
                   if(e) throw e

                    const sql = `INSERT INTO log_chamadas_simultaneas (data,total,conectadas) VALUE (now(),${chamadas_simultaneas},${chamadas_conectadas})`
                    connect.banco.query(sql,(e,r)=>{
                        if(e) throw e
                    })
                })
            })
        })
    }

    log_chamadasSimultaneas(limit,tipo,callback){
        const sql = `SELECT ${tipo} AS chamadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT ${limit}`
        connect.banco.query(sql, callback)
    }

}
export default new Discador()