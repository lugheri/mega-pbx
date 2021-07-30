"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Asterisk = require('./Asterisk'); var _Asterisk2 = _interopRequireDefault(_Asterisk);
var _Campanhas = require('./Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _Mailing = require('./Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);
var _Cronometro = require('./Cronometro'); var _Cronometro2 = _interopRequireDefault(_Cronometro);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);

class Discador{
    async debug(title="",msg=""){
        const debug=await this.mode()       
        if(debug==1){
            console.log(`${title}`,msg)
        }
    }
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    async mode(){
        const sql = `SELECT debug FROM asterisk_ari WHERE active=1`
        const mode = await this.querySync(sql);
        return mode[0].debug
    }
   /* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    * FUNCOES DO DISCADOOR
    * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    */      
     
   /** 
    *  PASSO 1 - VERIFICAÇÃO
    **/

    //Registrando chamadas simultaneas atuais no log 
    async registrarChamadasSimultaneas(){
        this.debug(' . PASSO 1.1','Registrando chamadas simultaneas')
        const chamadas_simultaneas = await this.todas_chamadasSimultaneas()
        const chamadas_conectadas = await this.todas_chamadasConectadas()
        //removendo do log chamadas do dia anterior
        let sql = `DELETE FROM log_chamadas_simultaneas WHERE DATA < DATE_SUB(NOW(), INTERVAL 1 DAY);`
        await this.querySync(sql)
        //Inserindo informacoes de chamadas para o grafico de chamadas simultaneas
        sql = `INSERT INTO log_chamadas_simultaneas (data,total,conectadas) VALUE (now(),${chamadas_simultaneas},${chamadas_conectadas})`
        await this.querySync(sql)
        return true
    }
    //Conta as chamadas simultaneas
    async todas_chamadasSimultaneas(){
        const sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas`
        const r = await this.querySync(sql)
        return r[0].total
    }
    //Conta as chamadas simultaneas conectadas
    async todas_chamadasConectadas(){
        const sql = `SELECT COUNT(id) as total FROM campanhas_chamadas_simultaneas WHERE falando=1 `
        const r = await this.querySync(sql)
        return r[0].total
    }

    //Remove Chamadas presas nas chamadas simultaneas
    async clearCalls(){
        this.debug(' . PASSO 1.2','Removendo chamadas presas')
        const limitTime = 0 //tempo limite para aguardar atendimento (em segundos)
        let sql = `SELECT id,id_campanha,id_mailing,id_registro,id_numero,numero FROM campanhas_chamadas_simultaneas 
                    WHERE tratado=0 AND TIMESTAMPDIFF(SECOND,data,NOW())>${limitTime} LIMIT 1`
        const r = await this.querySync(sql)
        if(r.length==0){
            return false;
        }
        const idChamada = r[0].id
        const idCampanha = r[0].id_campanha
        const idMailing  = r[0].id_mailing
        const idRegistro = r[0].id_registro
        const id_numero = r[0].id_numero        
        const infoMailing = await _Mailing2.default.infoMailing(idMailing)
        const tabela_numeros = infoMailing[0].tabela_numeros
        const numero = r[0].numero
        //atualizando campanhas_tabulacoes
        const contatado='N'
        const observacoes = 'Não Atendida'
        const tabulacao = 0
        const tipo_ligacao='discador'
        sql = `UPDATE mailings.campanhas_tabulacao_mailing 
                  SET estado=0, 
                      desc_estado='Disponivel',
                      contatado='${contatado}', 
                      observacao='${observacoes}', 
                      tentativas=tentativas+1,
                      max_tent_status=4
                WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} AND idRegistro=${idRegistro} `
        await this.querySync(sql)
        //Grava no histórico de atendimento
        await this.registraHistoricoAtendimento(0,idCampanha,idMailing,idRegistro,id_numero,0,0,tipo_ligacao,numero,tabulacao,observacoes,contatado)
        
        //Marcando numero na tabela de numeros como disponivel
        sql = `UPDATE mailings.${tabela_numeros} SET discando_${idCampanha}=0 WHERE id_registro=${idRegistro}`
        await this.querySync(sql)
        //removendo chamada simultanea
        sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamada}`
        await this.querySync(sql)


        return true; 
    }

    //Verifica se existem campanhas ativas
    async campanhasAtivas(){   
        this.debug(' . PASSO 1.3','Verificando Campanhas Ativas')     
        const sql = `SELECT id FROM campanhas WHERE tipo='a' AND status=1 AND estado=1`
        return await this.querySync(sql)
    }

    //Checando se a campanha possui fila de agentes configurada
    async filasCampanha(idCampanha){
        this.debug(' . . . PASSO 1.4',`Verifica a fila da Campanha`)
        const sql = `SELECT idFila, nomeFila FROM campanhas_filas WHERE idCampanha='${idCampanha}'`
        return await this.querySync(sql)        
    }

    //Verifica mailings atribuidos na campanha
    async verificaMailing(idCampanha){
        this.debug(' . . . PASSO 1.5',`Verifica se existe mailing adicionado`)
        const sql = `SELECT idMailing FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)  
    }

    //Verifica se o mailing da campanha esta pronto para discar
    async mailingConfigurado(idMailing){
        this.debug(' . . . . PASSO 1.6',`Verifica se existe mailing configurado`)
        const sql = `SELECT id,tabela_dados,tabela_numeros FROM mailings WHERE id=${idMailing} AND configurado=1`
        return await this.querySync(sql)  
    }

    //Verifica se a campanha possui Agendamento
    async agendamentoCampanha(idCampanha){
        this.debug(' . . . . . PASSO 1.7',`Verifica se existe mailing possui Agendamento`)
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha=${idCampanha}`
        return await this.querySync(sql)  
    } 

    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    async agendamentoCampanha_data(idCampanha,hoje){
        this.debug(' . . . . . . PASSO 1.8',`Verifica se a campanha esta dentro da data de agendamento`)
        const sql = `SELECT id FROM campanhas_horarios 
                      WHERE id_campanha=${idCampanha} AND inicio<='${hoje}' AND termino>='${hoje}'`;
         return await this.querySync(sql)       
    }
    //Verifica se agora esta dentro do horário de agendamento de uma campanha
    async agendamentoCampanha_horario(idCampanha,hora){
        this.debug(' . . . . . . . PASSO 1.8.1',`Verifica se a campanha esta dentro do horario de agendamento`)                                
        const sql = `SELECT id FROM campanhas_horarios 
                      WHERE id_campanha=${idCampanha} AND hora_inicio<='${hora}' AND hora_termino>='${hora}'`;
        return await this.querySync(sql)
    }

    /** 
    *  PASSO 2 - PREPARAÇÃO DO DISCADOR
    **/

    //Verificando se existem agentes na fila
    async agentesNaFila(idFila){
        this.debug(' . . . . . . . PASSO 2.1 - Verificando se existem agentes na fila') 
        const sql =  `SELECT * FROM agentes_filas WHERE fila=${idFila}`     
        return await this.querySync(sql)    
    }

    //Verificando se existem agentes disponiveis na fila
    async agentesDisponiveis(idFila){  
        this.debug(' . . . . . . . . PASSO 2.2 - Verificando se os agentes estao logados e disponiveis') 
        const sql = `SELECT ramal FROM agentes_filas WHERE fila='${idFila}' AND estado=1`
        return await this.querySync(sql)       
    }

    //Contanto total de chamadas simultaneas 
    async qtdChamadasSimultaneas(idCampanha){
        const sql = `SELECT COUNT(id) AS total FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha}`
        return await this.querySync(sql)               
    }

    //Modo novo de filtragem que adiciona os ids dos registros na tabela de tabulacao a medida que forem sendo trabalhados
    async filtrarRegistro(idCampanha,tabela_dados,tabela_numeros,idMailing,tipoDiscagem,ordemDiscagem){
        this.debug(' . . . . . . . . . . . PASSO 2.5 - Verificando se existem registros disponíveis')
        //Estados do registro
        //0 - Disponivel
        //1 - Discando
        //2 - Na Fila
        //3 - Atendido
        //4 - Já Trabalhado 
        let sql 
        if(tipoDiscagem=="horizontal"){
            //modo horizontal considera a tabela de numeros
            sql = `SELECT n.id AS idNumero, id_registro, numero FROM mailings.${tabela_numeros} as n
                     LEFT OUTER JOIN mailings.campanhas_tabulacao_mailing AS t ON n.id=t.idNumero
                    WHERE (t.idMailing=${idMailing} AND t.idCampanha=${idCampanha} AND estado=0
                      AND t.tentativas <= t.max_tent_status
                       OR t.idMailing IS NULL AND idCampanha IS NULL)
                      AND n.valido=1 AND n.discando_${idCampanha}=0 AND n.campanha_${idCampanha}=1
                 ORDER BY t.tentativas ${ordemDiscagem} LIMIT 1`
            return await this.querySync(sql)
        }else{
            //modo vertical considera a tabela de dados
            sql = `SELECT m.id_key_base AS idRegistro FROM mailings.${tabela_dados} as m
                     LEFT OUTER JOIN mailings.campanhas_tabulacao_mailing AS t ON m.id_key_base=t.idRegistro
                     WHERE t.idMailing=${idMailing} AND t.idCampanha=${idCampanha} AND estado=0
                  AND t.tentativas <= t.max_tent_status
                    OR t.idMailing IS NULL AND idCampanha IS NULL
                 ORDER BY t.tentativas ${ordemDiscagem} LIMIT 1`                   
            const idr = await this.querySync(sql)
            if(idr.length==0){
                return []
            }
            //selecionando um numero para discar
            sql = `SELECT n.id AS idNumero, n.id_registro, n.numero FROM mailings.${tabela_numeros} as n
                     LEFT OUTER JOIN mailings.campanhas_tabulacao_mailing AS t ON n.id=t.idNumero
                    WHERE (t.idMailing=${idMailing} AND t.idCampanha=${idCampanha} AND estado=0
                       OR t.idMailing IS NULL AND idCampanha IS NULL)
                      AND n.id_registro=${idr[0].idRegistro} AND n.valido=1 AND n.discando_${idCampanha}=0 AND n.campanha_${idCampanha}=1
                 ORDER BY t.tentativas ${ordemDiscagem} LIMIT 1`
            return await this.querySync(sql)
        }
    }

    /** 
    *  PASSO 2 - PREPARAÇÃO DO DISCADOR
    **/

    async registraNumero(idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros){
        let sql = `SELECT id FROM mailings.campanhas_tabulacao_mailing
                    WHERE idMailing=${idMailing} AND idCampanha=${idCampanha} AND idRegistro=${idRegistro} AND idNumero=${idNumero} LIMIT 1`
        const r = await this.querySync(sql)
        if(r.length > 0){  
            const id = r[0].id
            sql = `UPDATE mailings.campanhas_tabulacao_mailing 
                      SET data=now(), estado=1, desc_estado='Discando' 
                    WHERE id=${id}`
            await this.querySync(sql)
            return true                              
        }     
        sql = `INSERT INTO mailings.campanhas_tabulacao_mailing 
                          (data,idCampanha,idMailing,idRegistro,idNumero,numeroDiscado,estado,desc_estado,tentativas) 
                   VALUES (now(),${idCampanha},${idMailing},${idRegistro},${idNumero},'${numero}',1,'Discando',0)`
        await this.querySync(sql)  

        //atualiza como discando 
        sql = `UPDATE mailings.${tabela_numeros} SET discando_${idCampanha}=1 WHERE id_registro=${idRegistro}`
        await this.querySync(sql)  
        return true 
    }

    //Seleciona um agente disponivel
    async agenteDisponivel(idFila){
        const sql = `SELECT ramal FROM agentes_filas AS a LEFT JOIN tempo_espera AS t ON a.ramal=t.idAgente 
                      WHERE a.fila=${idFila} AND a.estado=1 ORDER BY t.tempo_total DESC LIMIT 1` 
        const r =  await this.querySync(sql)    
        return r[0].ramal  
    }

    //Registra chamada simultanea
    async registraChamada(ramal,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,id_reg,id_numero,numero,fila,tratado){
        const hoje = _moment2.default.call(void 0, ).format("YMMDDHHmmss")
        const protocolo = hoje+'0'+ramal
        const tipo = 'discador'
        const sql = `INSERT INTO campanhas_chamadas_simultaneas 
                                (data,ramal,protocolo,tipo_ligacao,tipo_discador,modo_atendimento,id_campanha,id_mailing,tabela_dados,tabela_numeros,id_registro,id_numero,numero,fila,tratado,atendido,na_fila,falando) 
                         VALUES (now(),'${ramal}','${protocolo}','${tipo}','${tipoDiscador}','${modoAtendimento}','${idCampanha}','${idMailing}','${tabela_dados}','${tabela_numeros}',${id_reg},${id_numero},'0${numero}','${fila}',${tratado},0,0,0)`
        await this.querySync(sql)  
        return true
    }

    
   /** 
    *  ATUALIZACAO DE STATUS E INFORMAÇÕES DO DISCADOR
    **/
    async atualizaStatus(idCampanha,msg,estado){
        //verificando se a campanha ja possui status
        const statusCampanha = await this.statusCampanha(idCampanha)
        this.debug('[!]','')
        this.debug('[!]',`Campanha: ${idCampanha} msg: ${msg} `)
        this.debug('[!]','')

        

        if(statusCampanha.length==0){
            //Caso nao, insere o status
            const sql = `INSERT INTO campanhas_status (idCampanha,data,mensagem,estado) 
                              VALUES (${idCampanha},now(),'${msg}',${estado})`               
            await this.querySync(sql)         
        }else{
            //Caso sim atualiza o mesmo
            const sql = `UPDATE campanhas_status SET data=now(),mensagem='${msg}',estado=${estado}
                          WHERE idCampanha=${idCampanha}` 
            await this.querySync(sql)               
        }
        return true
    }
    //Status atual de uma campanha 
    async statusCampanha(idCampanha){
        const sql =`SELECT * FROM campanhas_status WHERE idCampanha = ${idCampanha}`
        return await this.querySync(sql)        
    }

    //Recuperando os parametros do discador
    async parametrosDiscador(idCampanha){
        this.debug(' . . . . . . . . . PASSO 2.3 - Verificando configuração do discador')
        const sql = `SELECT * FROM campanhas_discador WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)          
    }

   /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FIM DAS FUNCOES DO DISCADOOR
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */

    //Registra o histórico de atendimento de uma chamada
    async registraHistoricoAtendimento(protocolo,idCampanha,idMailing,id_registro,id_numero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado){
        const sql = `INSERT INTO historico_atendimento 
                                (data,hora,protocolo,campanha,mailing,id_registro,id_numero,agente,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) 
                         VALUES (now(),now(),'${protocolo}',${idCampanha},'${idMailing}',${id_registro},${id_numero},${ramal},'${uniqueid}','${tipo_ligacao}','${numero}',${tabulacao},'${observacoes}','${contatado}')`
        return await this.querySync(sql)          
    }  








    
    

    

    

    historicoRegistro(idReg,callback){
        const sql = `SELECT agente, u.nome, protocolo,DATE_FORMAT (data,'%d/%m/%Y') AS dia,t.tabulacao,obs_tabulacao FROM historico_atendimento AS h left JOIN users AS u ON u.id=h.agente LEFT JOIN campanhas_status_tabulacao AS t ON t.id=h.status_tabulacao WHERE id_registro=${idReg} ORDER BY h.id DESC LIMIT 50`
        _dbConnection2.default.banco.query(sql,callback) 
    }
    
    historicoChamadas(ramal,callback){
        const sql = `SELECT agente, u.nome, protocolo,DATE_FORMAT (data,'%d/%m/%Y') AS dia,t.tabulacao,obs_tabulacao FROM historico_atendimento AS h JOIN users AS u ON u.id=h.agente LEFT JOIN campanhas_status_tabulacao AS t ON t.id=h.status_tabulacao WHERE agente='${ramal}' ORDER BY h.id DESC LIMIT 50`
        _dbConnection2.default.banco.query(sql,callback) 
    }
    
    discar(ramal,numero){
        return new Promise((resolve,reject)=>{
            //Recuperando dados do asterisk
            const sql=`SELECT * FROM asterisk_ari WHERE active=1`; 
            _dbConnection2.default.banco.query(sql,(e,asterisk_server)=>{
                if(e)
                    reject(e)

                const modo='discador'
                const server = asterisk_server[0].server
                const user =  asterisk_server[0].user
                const pass =  asterisk_server[0].pass
                
                console.log('modo',modo)
                console.log('server',server)
                console.log('user',user)
                console.log('pass',pass)
                _Asterisk2.default.discar(server,user,pass,modo,ramal,numero,(e,call)=>{
                    if(e)
                        reject(e)
    
                    resolve(call)
                })          
            })
        })
    }

    discarCB(ramal,numero,callback){
        //Recuperando dados do asterisk
        const sql=`SELECT * FROM asterisk_ari WHERE active=1`;
        _dbConnection2.default.banco.query(sql,(e,asterisk_server)=>{
            if(e) throw e;
            
            const modo='discador'
            const server = asterisk_server[0].server
            const user =  asterisk_server[0].user
            const pass =  asterisk_server[0].pass
            
            //Asterisk.discar(server,user,pass,modo,ramal,numero,callback)          
        })
    }


    //FUNCOES DE APOIO AO ASTERISK
    //Busca a fila da campanha atendida
    getQueueByNumber(numero,callback){
        const sql = `SELECT id,fila AS Fila FROM campanhas_chamadas_simultaneas WHERE numero='${numero}' ORDER BY id DESC LIMIT 1`
        _dbConnection2.default.banco.query(sql,callback);
    }

    setaRegistroNaFila(idChamada,callback){       
        const sql = `UPDATE campanhas_chamadas_simultaneas SET na_fila=1, tratado=1 WHERE id='${idChamada}'`
        _dbConnection2.default.banco.query(sql,callback) 
    }

    //Recupera o tipo de idAtendimento
    modoAtendimento(ramal,callback){
        const sql = `SELECT m.id, m.modo_atendimento, m.id_campanha FROM queue_members AS q JOIN mega_conecta.campanhas_chamadas_simultaneas AS m ON q.queue_name=m.fila WHERE membername=${ramal} AND na_fila=1`
        _dbConnection2.default.asterisk.query(sql,callback)
    }

   

    //######################Funções do atendente######################
    //Funcoes do atendimento de ligacao que recupera os dados da ligacao
    atendeChamada(ramal,callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_registro,id_campanha,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE ramal='${ramal}' AND atendido=1`
        _dbConnection2.default.banco.query(sql,(e,calldata)=>{
            if(e) throw e

            if(calldata.length==0){
                console.log('ERRO: Dados da chamada não localizados')
                callback(e,false)
            }else{
                const idAtendimento = calldata[0].id
                const idReg = calldata[0].id_reg
                const tabela = calldata[0].tabela_mailing
                const numero = calldata[0].numero
                const idCampanha = calldata[0].id_campanha
                const protocolo = calldata[0].protocolo

                //Atualiza chamada simultanea com o status de falando
                const sql = `UPDATE campanhas_chamadas_simultaneas SET atendido=0, falando=1 WHERE id='${idAtendimento}'`;
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                    if(e) throw e                   

                    //Seleciona os campos de acordo com a configuração da tela do agente
                    //CAMPOS DE DADOS
                    this.camposChamada(idAtendimento,idReg,tabela,numero,idCampanha,protocolo,callback)                
                })
            }
        })
    }

    //Informacoes da chamada ja atendida
    dadosChamada(ramal,callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_registro,id_campanha,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE ramal='${ramal}' AND falando=1`
        _dbConnection2.default.banco.query(sql,(e,calldata)=>{
            if(e) throw e

            if(calldata.length==0){
                console.log('ERRO: Dados da chamada não localizados')
                callback(e,false)
            }else{
                const idAtendimento = calldata[0].id
                const idReg = calldata[0].id_reg
                const tabela = calldata[0].tabela_mailing
                const numero = calldata[0].numero
                const idCampanha = calldata[0].id_campanha
                const protocolo = calldata[0].protocolo

               
                //Seleciona os campos de acordo com a configuração da tela do agente
                //CAMPOS DE DADOS
                this.camposChamada(idAtendimento,idReg,tabela,numero,idCampanha,protocolo,callback)
                                   
            }
        })
    }

    //CAMPOS DE DADOS
    camposChamada(idAtendimento,idReg,tabela,numero,idCampanha,protocolo,callback){
        const sql = `SELECT c.id,c.campo,c.apelido FROM mailing_tipo_campo AS c JOIN campanhas_campos_tela_agente AS s ON c.id=s.idCampo WHERE c.tipo='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
        _dbConnection2.default.banco.query(sql,(e,campos_dados)=>{
            if(e) throw e

            //montando a query de busca dos dados
            let campos = '';
            for(let i=0; i<campos_dados.length; i++){
                let apelido=''
                if(campos_dados[i].apelido === null){
                    apelido=campos_dados[i].campo
                }else{
                    apelido=campos_dados[i].apelido
                }
                campos += `${campos_dados[i].campo} as ${apelido}, `
            }
            campos += 'id_key_base'

            const sql = `SELECT ${campos} FROM ${tabela} WHERE id_key_base=${idReg}`
            _dbConnection2.default.mailings.query(sql,(e,dados)=>{
                if(e) throw e
                
                //CAMPOS DE TELEFONE
                const sql = `SELECT c.id,c.campo,c.apelido FROM mailing_tipo_campo AS c JOIN campanhas_campos_tela_agente AS s ON c.id=s.idCampo WHERE c.tipo!='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
                _dbConnection2.default.banco.query(sql,(e,campos_numeros)=>{
                    if(e) throw e

                    //montando a query de busca dos numeros
                    let campos = '';
                    for(let i=0; i<campos_numeros.length; i++){
                        let apelido=''
                        if(campos_numeros[i].apelido === null){
                            apelido=campos_numeros[i].campo
                        }else{
                            apelido=campos_numeros[i].apelido
                        }
                        campos += `${campos_numeros[i].campo} as ${apelido}, `
                    }
                    campos += 'id_key_base'
     
                    const sql = `SELECT ${campos} FROM ${tabela} WHERE id_key_base=${idReg}`
                    _dbConnection2.default.mailings.query(sql,(e,numeros)=>{
                        if(e) throw e
                               
                        let camposRegistro = '{"campos":{"dados":'+JSON.stringify(dados)+',' 
                        camposRegistro += '"numeros":'+JSON.stringify(numeros)+'},'
                        //Numero Discado
                        camposRegistro += `"numero_discado":{"protocolo":"${protocolo}","telefone":"${numero}","id_atendimento":${idAtendimento}},`;
                                    
                        //Informações da campanha
                        _Campanhas2.default.dadosCampanha(idCampanha,(e,dadosCampanha)=>{
                            if(e) throw e

                            camposRegistro += `"info_campanha":{"idCampanha":"${idCampanha}","nome":"${dadosCampanha[0].nome}","descricao":"${dadosCampanha[0].descricao}"}}`;
                            console.log(camposRegistro)
                            callback(false,JSON.parse(camposRegistro))
                        })
                    })
                })
            })
        }) 
    }

    //Desligando Chamada
    preparaRegistroParaTabulacao(idAtendimento,callback){
        //Atualiza Chamada como tabulando 
        const sql = `UPDATE campanhas_chamadas_simultaneas SET falando=1, tabulando=1, hora_tabulacao=now() WHERE id='${idAtendimento}'`;
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            //Retorna id da campanha
            const sql = `SELECT id_campanha FROM campanhas_chamadas_simultaneas WHERE id=${idAtendimento}`
            _dbConnection2.default.banco.query(sql,callback)
        })
    }

    dadosAtendimento(idAtendimento, callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE id='${idAtendimento}'`
        _dbConnection2.default.banco.query(sql,callback)
    }

    dadosAtendimento_byNumero(numero, callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE numero='${numero}'`
        _dbConnection2.default.banco.query(sql,callback)
    }

     //Tabula uma chamada apos sua conclusao                        
     async tabulandoContato(idAtendimento,tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,callback){
        let estado
        let desc_estado
        
        if(produtivo==1){
            estado=4
            desc_estado='Já Trabalhado'
        }else{
            estado=0
            desc_estado='Disponivel'
        }    
        const estadoAgente = 1//Libera o agente
        const pausa=0
        await this.alterarEstadoAgente(ramal,estadoAgente,pausa)
        this.desligaChamada(idAtendimento,estado,contatado,produtivo,status_tabulacao,observacao,callback)                                
    }  

    desligaChamada(idAtendimento,estado,contatado,produtivo,status_tabulacao,observacao,callback){  
        //Le os dados do registro
        const sql = `SELECT id_reg,uniqueid,tipo_ligacao,protocolo,tabela_mailing,id_mailing,id_campanha,ramal,numero FROM campanhas_chamadas_simultaneas WHERE id=${idAtendimento}`
        _dbConnection2.default.banco.query(sql,(e,atendimento)=>{
            if(e) throw e

            const idRegistro = atendimento[0].id_reg
            const uniqueid = atendimento[0].uniqueid
            const tipo_ligacao = atendimento[0].tipo_ligacao
            const protocolo = atendimento[0].protocolo
            const tabela = atendimento[0].tabela_mailing
            const numero = atendimento[0].numero
            const ramal = atendimento[0].ramal
            const idMailing = atendimento[0].id_mailing
            const idCampanha = atendimento[0].id_campanha

            //const estado = 0
            const desc_estado = 'Disponivel'       

            //Atualiza registro com nova tentativa            
            const sql = `UPDATE ${tabela} SET tentativas=tentativas+1, contatado='${contatado}', status_tabulacao=${status_tabulacao}, produtivo='${produtivo}' WHERE id_key_base = ${idRegistro}`
            _dbConnection2.default.mailings.query(sql,(e,r)=>{
                if(e) throw e

                //Grava historico
                const sql = `INSERT INTO historico_atendimento (data,hora,campanha,mailing,id_registro,agente,protocolo,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) VALUES (now(),now(),${idCampanha},${idMailing},${idRegistro},${ramal},"${protocolo}","${uniqueid}","${tipo_ligacao}","${numero}",${status_tabulacao},"${observacao}","${contatado}") `
                _dbConnection2.default.banco.query(sql, (e,r)=>{
                    if(e) throw e

                    //Atualiza a tabela da campanha 
                    const sql = `UPDATE campanhas_tabulacao_mailing SET data=now(), numeroDiscado='${numero}', agente='${ramal}', estado='${estado}', desc_estado='${desc_estado}', contatado='${contatado}', tabulacao=${status_tabulacao}, produtivo='${produtivo}', observacao='${observacao}', tentativas=tentativas+1 WHERE idRegistro=${idRegistro} AND idMailing=${idMailing} AND idCampanha=${idCampanha}`
                    _dbConnection2.default.mailings.query(sql,(e,r)=>{
                        if(e) throw e
                        //Removendo chamada das chamadas simultaneas
                        const sql = `DELETE FROM campanhas_chamadas_simultaneas  WHERE id='${idAtendimento}'`
                        _dbConnection2.default.banco.query(sql,callback(e,true))
                    }) 
                })
            }) 
        })
    }

       

    infoChamada_byIdAtendimento(idAtendimento,callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_reg,id_campanha,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE id='${idAtendimento}'`
        _dbConnection2.default.banco.query(sql,(e,calldata)=>{
            if(e) throw e

            if(calldata.length==0){
                console.log('ERRO: Dados da chamada não localizados')
                callback(e,false)
            }else{
                const idAtendimento = calldata[0].id
                const idReg = calldata[0].id_reg
                const tabela = calldata[0].tabela_mailing
                const numero = calldata[0].numero
                const idCampanha = calldata[0].id_campanha
                const protocolo = calldata[0].protocolo

               
                //Seleciona os campos de acordo com a configuração da tela do agente
                //CAMPOS DE DADOS
                const sql = `SELECT c.id,c.campo,c.apelido FROM mailing_tipo_campo AS c JOIN campanhas_campos_tela_agente AS s ON c.id=s.idCampo WHERE c.tipo='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
                _dbConnection2.default.banco.query(sql,(e,campos_dados)=>{
                    if(e) throw e

                    //montando a query de busca dos dados
                    let campos = '';
                    for(let i=0; i<campos_dados.length; i++){
                        let apelido=''
                        if(campos_dados[i].apelido === null){
                            apelido=campos_dados[i].campo
                        }else{
                            apelido=campos_dados[i].apelido
                        }
                        campos += `${campos_dados[i].campo} as ${apelido}, `
                    }
                    campos += 'id_key_base'

                    const sql = `SELECT ${campos} FROM ${tabela} WHERE id_key_base=${idReg}`
                    _dbConnection2.default.mailings.query(sql,(e,dados)=>{
                        if(e) throw e

                        //CAMPOS DE TELEFONE
                        const sql = `SELECT c.id,c.campo,c.apelido FROM mailing_tipo_campo AS c JOIN campanhas_campos_tela_agente AS s ON c.id=s.idCampo WHERE c.tipo!='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
                        _dbConnection2.default.banco.query(sql,(e,campos_numeros)=>{
                            if(e) throw e

                            //montando a query de busca dos numeros
                            let campos = '';
                            for(let i=0; i<campos_numeros.length; i++){
                                let apelido=''
                                if(campos_numeros[i].apelido === null){
                                    apelido=campos_numeros[i].campo
                                }else{
                                    apelido=campos_numeros[i].apelido
                                }
                                campos += `${campos_numeros[i].campo} as ${apelido}, `
                            }
                            campos += 'id_key_base'
        
                            const sql = `SELECT ${campos} FROM ${tabela} WHERE id_key_base=${idReg}`
                            _dbConnection2.default.mailings.query(sql,(e,numeros)=>{
                                if(e) throw e
                                   
                                let camposRegistro = '{"campos":{"dados":'+JSON.stringify(dados)+',' 
                                    camposRegistro += '"numeros":'+JSON.stringify(numeros)+'},'
                                    //Numero Discado
                                    camposRegistro += `"numero_discado":{"protocolo":"${protocolo}","telefone":"${numero}","id_atendimento":${idAtendimento}},`;
                                    
                                    //Informações da campanha
                                    _Campanhas2.default.dadosCampanha(idCampanha,(e,dadosCampanha)=>{
                                        if(e) throw e
                                        camposRegistro += `"info_campanha":{"idCampanha":"${idCampanha}","nome":"${dadosCampanha[0].nome}","descricao":"${dadosCampanha[0].descricao}"}`;
                                        console.log(camposRegistro)

                                        callback(false,camposRegistro)
                                    })
                            })
                        })
                    })
                })                    
            }
        })
    }

    


       

    
   


    //FUNCOES DO AGENTE
    statusRamal(ramal,callback){
        const sql = `SELECT estado FROM agentes_filas WHERE ramal=${ramal}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Retorna o status de pausa do agente
    infoEstadoAgente(ramal){
        return new Promise((resolve,reject)=>{
            const sql = `SELECT * FROM user_ramal WHERE ramal='${ramal}'`
            _dbConnection2.default.banco.query(sql,(e,rows)=>{
                if(e) 
                     reject(e)
                
                if(rows.length==0){
                    resolve(0)
                    return true
                }  

                     console.log('ramal',ramal)
                resolve(rows[0].estado)
            })
        })
    }
    
    infoPausaAgente(ramal,callback){
        const sql = `SELECT * FROM agentes_pausados WHERE ramal='${ramal}'`
        _dbConnection2.default.banco.query(sql,callback)
    }  

    //Muda o status do agente
    alterarEstadoAgente(agente,estado,pausa){
        return new Promise (async(resolve,reject) =>{
            //Recuperando estado anterior do agente
            const estadoAnterior = await this.infoEstadoAgente(agente)

            //zerando cronometro do estado anterior
            if(estadoAnterior==2){
                //Removeo agente da lista dos agentes pausados
                const sql = `DELETE FROM agentes_pausados WHERE ramal='${agente}'`
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                    if(e) 
                        reject(e)
                    //Atualiza Log
                    const sql = `UPDATE log_pausas SET termino=now(), ativa=0 WHERE ramal='${agente}' AND ativa=1`
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(e) 
                            reject(e)
                        _Cronometro2.default.saiuDaPausa(agente,(e,r)=>{
                            if(e) 
                                reject(e)
                        })
                    })
                })                
            }

            const sql = `UPDATE agentes_filas SET estado=${estado}, idPausa=${pausa} WHERE ramal=${agente}` 
            _dbConnection2.default.banco.query(sql,(e,r)=>{
                if(e) 
                    reject(e)

                const sql = `UPDATE user_ramal SET estado=${estado} WHERE userId=${agente}`
                _dbConnection2.default.banco.query(sql,(e,r)=>{
                    if(e) 
                        reject(e)

                        if(estado==1){
                            const sql = `UPDATE queue_members SET paused=0 WHERE membername=${agente}`
                            _dbConnection2.default.asterisk.query(sql,(e,r)=>{
                                if(e) 
                                    reject(e)
                            })
                        }else if(estado==2){
                           //dados da pausa
                           const sql = `SELECT * FROM pausas WHERE id=${pausa}`
                           _dbConnection2.default.banco.query(sql,(e,infoPausa)=>{
                                if(e) 
                                    reject(e)

                                    const idPausa = infoPausa[0].id
                                    const nomePausa = infoPausa[0].nome
                                    const descricaoPausa = infoPausa[0].descricao
                                    const tempo = infoPausa[0].tempo

                                //pausa agente no asterisk
                                const sql = `UPDATE queue_members SET paused=1 WHERE membername='${agente}'`    
                                _dbConnection2.default.asterisk.query(sql,(e,r)=>{
                                    if(e) 
                                        reject(e)

                                    const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
                                    const resultado = _moment2.default.call(void 0, agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                        
                                    //insere na lista dos agentes pausados
                                    const sql = `INSERT INTO agentes_pausados (data,ramal,inicio,termino,idPausa,nome,descricao) VALUES (now(),'${agente}',now(), '${resultado}', ${idPausa}, '${nomePausa}','${descricaoPausa}')`
                                        _dbConnection2.default.banco.query(sql,(e,r)=>{
                                            if(e) 
                                                reject(e)
                        
                                        const agora = _moment2.default.call(void 0, ).format("HH:mm:ss")
                                        const resultado = _moment2.default.call(void 0, agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                        
                                        const sql = `INSERT INTO log_pausas (ramal,idPausa,data,inicio,ativa) VALUES ('${agente}',${idPausa},now(),now(),1)`
                                        _dbConnection2.default.banco.query(sql,(e,r)=>{
                                            if(e) 
                                                reject(e)
                                        })
                                    })
                                })
                           })
                        }else if(estado==3){
                           
                        }else if(estado==4){
                           
                        }
                    resolve(true)
                })
            })
        })
    }

       

    log_chamadasSimultaneas(limit,tipo,callback){
        const sql = `SELECT ${tipo} AS chamadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT ${limit}`
        _dbConnection2.default.banco.query(sql, callback)
    }
    //old
    /*
    camposDiscagem(tabela,tipo,callback){
        //verificando campos para discagem
        const sql = `SELECT campo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND tipo='${tipo}' ORDER BY id ASC LIMIT 1`
        connect.banco.query(sql,callback)
    }

    
    chamadasSimultaneas(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }
    
    

    

    //Modo novo de filtragem que adiciona os ids dos registros na tabela de tabulacao a medida que forem sendo trabalhados
    filtrarRegistro_off2(idCampanha,tabela,idMailing,tentativas,ordem,callback){
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
                        const sql = `INSERT INTO campanhas_tabulacao_mailing (data,idCampanha,idMailing,idRegistro,estado,desc_estado,tentativas) VALUES (now(),${idCampanha},${idMailing},${idRegistro},1,'Discando',0)`
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

    

    

    

    
    

    */

}
exports. default = new Discador()