"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Asterisk = require('./Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _Campanhas = require('./Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
class Discador{
 
    agentesFila(fila,callback){
        const sql =  `SELECT * FROM queue_members WHERE queue_name='${fila}'`     
        _dbConnection2.default.asterisk.query(sql,callback)
    }

    agentesDisponiveis(idFilaCampanha,callback){        
        const sql = `SELECT ramal FROM agentes_filas WHERE fila='${idFilaCampanha}' AND estado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    camposDiscagem(tabela,tipo,callback){
        //verificando campos para discagem
        const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='${tipo}' ORDER BY id ASC LIMIT 1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    parametrosDiscador(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_discador WHERE idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    chamadasSimultaneas(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    todas_chamadasConectadas(callback){
        const sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE falando=1 `
        _dbConnection2.default.banco.query(sql,callback)
    }

    todas_chamadasSimultaneas(callback){
        const sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas`
        _dbConnection2.default.banco.query(sql,callback)
    }

    filtrarRegistro(idCampanha,tentativas,ordem,callback){
        const sql = `SELECT id,idRegistro FROM campanhas_tabulacao_mailing WHERE idCampanha=${idCampanha} AND estado=0 AND tentativas < ${tentativas} ORDER BY tentativas ${ordem} LIMIT 1`
        _dbConnection2.default.banco.query(sql,(er,reg)=>{
           // if(er) throw er

           if(reg.length > 0){

            const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Discando' WHERE id=${reg[0].id}`
            _dbConnection2.default.banco.query(sql,(e,r)=>{
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
        _dbConnection2.default.banco.query(sql,(e,numeroCompleto)=>{
            if(e) throw e

            if(numeroCompleto != 0){
                //Campo com DDD e NUMERO juntos
                const telefone = numeroCompleto[0].campo
                const sql = `SELECT ${telefone} as numero FROM ${tabela} WHERE id_key_base=${idRegistro}`
                _dbConnection2.default.mailings.query(sql,callback)
            }else{
                //Campo com DDD e NUMERO separados
                const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='ddd' ORDER BY id ASC LIMIT 1`
                _dbConnection2.default.banco.query(sql,(e,dddQ)=>{
                    if(e) throw e

                    const ddd = dddQ[0].campo

                    //Separando campo campo do Número
                    const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='telefone' ORDER BY id ASC LIMIT 1`
                    _dbConnection2.default.banco.query(sql,(e,telefoneQ)=>{
                        if(e) throw e

                        const telefone = telefoneQ[0].campo

                        //Separando registro
                        const sql = `SELECT ${ddd} as ddd, ${telefone} as numero FROM ${tabela} WHERE id_key_base=${idRegistro}`
                        _dbConnection2.default.mailings.query(sql,callback)
                    })
                })
            }            
        })
    }

    ligar(ramal,numero,callback){

        //Recuperando dados do asterisk
        const sql = `SELECT * FROM asterisk_ari WHERE active=1`; 
        _dbConnection2.default.banco.query(sql,(e,asterisk_server)=>{
            if(e) throw e

            const server = asterisk_server[0].server
            const user =  asterisk_server[0].user
            const pass =  asterisk_server[0].pass
            
            _Asterisk2.default.ligar(server,user,pass,ramal,numero,callback)
            callback(e,true)
        })
    }

    registraChamada(ramal,idCampanha,idMailing,tabela,id_reg,numero,fila,callback){
        const sql = `INSERT INTO campanhas_chamadas_simultaneas (data,ramal,id_campanha,id_mailing,tabela_mailing,id_reg,numero,fila) VALUES (now(),'${ramal}','${idCampanha}','${idMailing}','${tabela}','${id_reg}','0${numero}','${fila}')`
        _dbConnection2.default.banco.query(sql,callback)

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
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                   if(e) throw e

                    const sql = `INSERT INTO log_chamadas_simultaneas (data,total,conectadas) VALUE (now(),${chamadas_simultaneas},${chamadas_conectadas})`
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(e) throw e
                    })
                })
            })
        })
    }

    log_chamadasSimultaneas(limit,tipo,callback){
        const sql = `SELECT ${tipo} AS chamadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT ${limit}`
        _dbConnection2.default.banco.query(sql, callback)
    }

}
exports. default = new Discador()