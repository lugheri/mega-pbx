import connect from '../Config/dbConnection';
import Asterisk from './Asterisk';
import Campanhas from './Campanhas';
import Mailing from './Mailing';
import Cronometro from './Cronometro';
import moment from 'moment';

class Discador{
    async debug(title="",msg=""){
        const debug=await this.mode()       
        if(debug==1){
            console.log(`${title}`,msg)
        }
    }
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
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
        const limitTime = 30 //tempo limite para aguardar atendimento (em segundos)
        let sql = `SELECT id,id_campanha,id_mailing,id_registro,id_numero,numero FROM campanhas_chamadas_simultaneas 
                    WHERE tipo_discador='power' 
                     AND tratado=0 AND TIMESTAMPDIFF(SECOND,data,NOW())>${limitTime} 
                    LIMIT 1`
        const r = await this.querySync(sql)
        if(r.length==0){
            return false;
        }
        const idChamada = r[0].id
        const idCampanha = r[0].id_campanha
        const idMailing  = r[0].id_mailing
        const idRegistro = r[0].id_registro
        const id_numero = r[0].id_numero        
        const infoMailing = await Mailing.infoMailing(idMailing)
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
                WHERE idCampanha=${idCampanha} 
                  AND idMailing=${idMailing} 
                  AND idRegistro=${idRegistro} `
        await this.querySync(sql)
        //Grava no histórico de atendimento
        await this.registraHistoricoAtendimento(0,idCampanha,idMailing,idRegistro,id_numero,0,0,tipo_ligacao,numero,tabulacao,observacoes,contatado)
        
        //Marcando numero na tabela de numeros como disponivel
        sql = `UPDATE mailings.${tabela_numeros} SET discando=0 WHERE id_registro=${idRegistro}`
        await this.querySync(sql)
        //removendo chamada simultanea
        sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamada}`
        await this.querySync(sql)


        return true; 
    }

    async clearCallsCampanhas(idCampanha){
        let sql = `SELECT id_campanha,tabela_numeros,id_numero FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha}`
        const infoChamada = await this.querySync(sql)

        for(let i=0; i<infoChamada.length; i++){
            const idCampanha = infoChamada[i].id_campanha
            const idNumero = infoChamada[i].id_numero
            const tabelaNumeros = infoChamada[i].tabela_numeros
            //verifica tabulacao da campanha
            sql = `UPDATE mailings.campanhas_tabulacao_mailing 
                      SET estado=0, desc_estado='Disponivel'
                    WHERE idCampanha=${idCampanha} 
                    AND idNumero=${idNumero}`
            await this.querySync(sql)

            //Libera numero na base de numeros
            sql = `UPDATE mailings.${tabelaNumeros} 
                      SET discando=0   
                    WHERE id=${idNumero}`
            await this.querySync(sql)
        }


        sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha} AND falando=0`
        await this.querySync(sql)
        sql = `UPDATE campanhas_status SET mensagem="..." WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
    }
    
    async clearCallsAgent(ramal){
        let sql = `SELECT id_campanha,tabela_numeros,id_numero FROM campanhas_chamadas_simultaneas WHERE ramal=${ramal}`
        const infoChamada = await this.querySync(sql)
        if(infoChamada.length==0){
            return false
        }
        
        const idCampanha = infoChamada[0].id_campanha
        const idNumero = infoChamada[0].id_numero
        const tabelaNumeros = infoChamada[0].tabela_numeros

        //verifica tabulacao da campanha
        sql = `UPDATE mailings.campanhas_tabulacao_mailing 
                  SET estado=0, desc_estado='Disponivel'
                WHERE idCampanha=${idCampanha} AND idNumero=${idNumero}`
        await this.querySync(sql)

         //Libera numero na base de numeros
         sql = `UPDATE mailings.${tabelaNumeros} 
                   SET discando=0   
                 WHERE id=${idNumero}`
        await this.querySync(sql)

        sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE ramal=${ramal}`
        await this.querySync(sql)
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
        const sql = `SELECT ramal FROM agentes_filas WHERE fila='${idFila}' AND estado!=4 AND estado!=0`
        return await this.querySync(sql)       
    }

    //Contanto total de chamadas simultaneas 
    async qtdChamadasSimultaneas(idCampanha){
        const sql = `SELECT COUNT(id) AS total 
                         FROM campanhas_chamadas_simultaneas WHERE id_campanha=${idCampanha}`
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
        //filtrando
        let filtro = await this.filtrosDiscagem(idCampanha,idMailing)   
        
        let sql 
        if(tipoDiscagem=="horizontal"){
            //modo horizontal considera a tabela de numeros
            sql = `SELECT n.id AS idNumero, id_registro, numero 
                     FROM mailings.${tabela_numeros} as n
          LEFT OUTER JOIN mailings.campanhas_tabulacao_mailing AS t 
                       ON n.id=t.idNumero
                    WHERE (t.idCampanha=${idCampanha} 
                      AND estado=0 AND TIMESTAMPDIFF (MINUTE, data, NOW()) >= 10
                      AND t.tentativas <= t.max_tent_status
                       OR t.idCampanha IS NULL 
                       OR t.idCampanha!=${idCampanha})
                      AND n.valido=1 
                      AND n.discando=0 
                      AND n.campanha_${idCampanha}=1
                 ORDER BY t.tentativas ${ordemDiscagem},t.id ${ordemDiscagem}
                    LIMIT 1`                  
           
            return await this.querySync(sql)
        }else{
            //modo vertical considera a tabela de dados
            sql = `SELECT m.id_key_base AS idRegistro 
                     FROM mailings.${tabela_dados} as m
          LEFT OUTER JOIN mailings.campanhas_tabulacao_mailing AS t 
                       ON m.id_key_base=t.idRegistro
                    WHERE t.idCampanha=${idCampanha} 
                      AND estado=0 AND TIMESTAMPDIFF (MINUTE, data, NOW()) >= 10
                      AND t.tentativas <= t.max_tent_status
                       OR idCampanha IS NULL
                       OR t.idCampanha!=${idCampanha}
                 ORDER BY t.tentativas ${ordemDiscagem},t.id ${ordemDiscagem}
                    LIMIT 1`                   
            
            const idr = await this.querySync(sql)
            if(idr.length==0){
                return []
            }
            //selecionando um numero para discar
            sql = `SELECT n.id AS idNumero, n.id_registro, n.numero 
                     FROM mailings.${tabela_numeros} as n
          LEFT OUTER JOIN mailings.campanhas_tabulacao_mailing AS t 
                       ON n.id=t.idNumero
                    WHERE (t.idCampanha=${idCampanha} 
                      AND estado=0
                       OR idCampanha IS NULL
                       OR t.idCampanha!=${idCampanha})
                      AND n.id_registro=${idr[0].idRegistro} 
                      AND n.valido=1 
                      AND n.discando=0 
                      AND n.campanha_${idCampanha}=1
                 ORDER BY t.tentativas ${ordemDiscagem},t.id ${ordemDiscagem}
                    LIMIT 1`
                   
            return await this.querySync(sql)
        }
    }

    async filtrosDiscagem(idCampanha,idMailing){
        let sql = `SELECT tipo,valor,regiao
                     FROM campanhas_mailing_filtros 
                    WHERE idCampanha=${idCampanha} 
                      AND idMailing=${idMailing}`;
        return await this.querySync(sql)        
    }

    /** 
    *  PASSO 2 - PREPARAÇÃO DO DISCADOR
    **/

    async registraNumero(idCampanha,idMailing,idRegistro,idNumero,numero,tabela_numeros){
        let sql = `SELECT id FROM mailings.campanhas_tabulacao_mailing
                    WHERE idMailing=${idMailing} AND idCampanha=${idCampanha} 
                      AND idRegistro=${idRegistro} AND idNumero=${idNumero} LIMIT 1`
        const r = await this.querySync(sql)
        if(r.length > 0){  
            const id = r[0].id
            sql = `UPDATE mailings.campanhas_tabulacao_mailing 
                      SET data=now(), 
                          estado=1, 
                          desc_estado='Discando',
                          selecoes_registro=selecoes_registro+1,
                          selecoes_numero=selecoes_numero+1
                    WHERE id=${id}`
            await this.querySync(sql)
            return true                              
        }     
        sql = `INSERT INTO mailings.campanhas_tabulacao_mailing 
                          (data,idCampanha,idMailing,idRegistro,selecoes_registro,idNumero,selecoes_numero,numeroDiscado,estado,desc_estado,max_tent_status,tentativas) 
                   VALUES (now(),${idCampanha},${idMailing},${idRegistro},1,${idNumero},1,'${numero}',1,'Discando',1,0)`
        await this.querySync(sql)  

        //atualiza como discando 
        sql = `UPDATE mailings.${tabela_numeros} SET discando=1 WHERE id_registro=${idRegistro}`
        await this.querySync(sql)  
        return true 
    }

    //Seleciona um agente disponivel
    async agenteDisponivel(idFila){
        const sql = `SELECT ramal FROM agentes_filas AS a LEFT JOIN tempo_espera AS t ON a.ramal=t.idAgente 
                      WHERE a.fila=${idFila} AND a.estado=1 ORDER BY t.tempo_total DESC LIMIT 1` 
        const r =  await this.querySync(sql)    
        if(r.length==0){
            return 0
        }
        return r[0].ramal  
    }

    //Registra chamada simultanea
    async registraChamada(ramal,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,id_reg,id_numero,numero,fila,tratado,atendido){
        const hoje = moment().format("YMMDDHHmmss")
        const protocolo = hoje+'0'+ramal
        const tipo = 'discador'
        const sql = `INSERT INTO campanhas_chamadas_simultaneas 
                                (data,ramal,protocolo,tipo_ligacao,tipo_discador,modo_atendimento,id_campanha,id_mailing,tabela_dados,tabela_numeros,id_registro,id_numero,numero,fila,tratado,atendido,na_fila,falando) 
                         VALUES (now(),'${ramal}','${protocolo}','${tipo}','${tipoDiscador}','${modoAtendimento}','${idCampanha}','${idMailing}','${tabela_dados}','${tabela_numeros}',${id_reg},${id_numero},'0${numero}','${fila}',${tratado},${atendido},0,0)`
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
        //console.log('[!]',msg)        

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

    /*DISCAR*/
    async discar(ramal,numero){
        this.debug(' . . . . . . . . . . . . . . PASSO 3.4 - Discando')
        //Recuperando dados do asterisk
        const sql=`SELECT * FROM asterisk_ari WHERE active=1`; 
        const asterisk_server = await this.querySync(sql)  
        const modo='discador'
        const server = asterisk_server[0].server
        const user =  asterisk_server[0].user
        const pass =  asterisk_server[0].pass
                
        Asterisk.discar(server,user,pass,modo,ramal,numero,(e,call)=>{
            if(e) throw e 

            this.debug('Data Call',call)  
            return true
        })          
    }

   /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FIM DAS FUNCOES DO DISCADOR
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */

   /*Funcoes auxiliares do dicador******************************************************************************/
    //Registra o histórico de atendimento de uma chamada
    async registraHistoricoAtendimento(protocolo,idCampanha,idMailing,id_registro,id_numero,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado){
        console.log('registra atendimento')
        const sql = `INSERT INTO historico_atendimento 
                                (data,hora,protocolo,campanha,mailing,id_registro,id_numero,agente,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) 
                         VALUES (now(),now(),'${protocolo}',${idCampanha},'${idMailing}',${id_registro},${id_numero},${ramal},'${uniqueid}','${tipo_ligacao}','${numero}',${tabulacao},'${observacoes}','${contatado}')`
        return await this.querySync(sql)          
    }  
                        
    async tabulaChamada(idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal){
        const dadosAtendimento = await this.dadosAtendimento(idAtendimento)
        if(dadosAtendimento.length === 0){
            return false
        }

        //Dados do atendimento
        const tabelaNumero = dadosAtendimento[0].tabela_numeros
        const tabelaDados = dadosAtendimento[0].tabela_dados
        const idNumero  = dadosAtendimento[0].id_numero
        const idRegistro = dadosAtendimento[0].id_registro
        const numero  = dadosAtendimento[0].numero
        const idMailing = dadosAtendimento[0].id_mailing
        const idCampanha = dadosAtendimento[0].id_campanha
        const protocolo = dadosAtendimento[0].id_campanha
        const uniqueid = dadosAtendimento[0].uniqueid
        const tipo_ligacao = dadosAtendimento[0].tipo_ligacao

        const nome_registro=await this.campoNomeRegistro(idMailing,idRegistro,tabelaDados);

        let sql =""
        let estado =0
        let desc_estado  =""
        if(produtivo==1){
            estado=4
            desc_estado='Já Trabalhado'
            //Verifica se todos os numeros do registro ja estao marcados na tabulacao
            sql = `SELECT id,numero FROM mailings.${tabelaNumero} WHERE id_registro=${idRegistro}`
            const numbers = await this.querySync(sql)
          
            for(let i = 0; i < numbers.length; i++){
                sql = `SELECT id FROM mailings.campanhas_tabulacao_mailing 
                        WHERE idRegistro=${idRegistro} AND idMailing=${idMailing} AND idCampanha=${idCampanha} AND idNumero=${numbers[i].id}`
                const n = await this.querySync(sql)
                
                if(n.length==0){
                    sql = `INSERT INTO mailings.campanhas_tabulacao_mailing 
                                      (data,numeroDiscado,agente,estado,desc_estado,contatado,tabulacao,produtivo,observacao,tentativas,idRegistro,idMailing,idCampanha,idNumero)
                               VALUES (now(),'${numero}','${ramal}','${estado}','${desc_estado}','${contatado}',${status_tabulacao},'${produtivo}','${observacao}',1,${idRegistro},${idMailing},${idCampanha},${numbers[i].id})` 
                    
                    await this.querySync(sql)
                }
            }

            //Grava tabulacao na tabela do numero atualizando todos numeros do registro
            sql = `UPDATE mailings.${tabelaNumero} 
                          SET tentativas=tentativas+1, 
                              contatado='${contatado}', 
                              status_tabulacao=${status_tabulacao}, 
                              produtivo='${produtivo}', 
                              discando=0
                        WHERE id_registro = ${idRegistro}`
            await this.querySync(sql)
        }else{
            estado=0
            desc_estado='Disponivel'
            //Grava tabulacao na tabela do numero
            sql = `UPDATE mailings.${tabelaNumero} 
                      SET tentativas=tentativas+1, 
                          contatado='${contatado}', 
                          status_tabulacao=${status_tabulacao}, 
                          produtivo='${produtivo}', 
                          discando=0
                    WHERE id = ${idNumero}`
        }   

        //Marca chamada simultanea como tabulada
        sql = `UPDATE mailings.campanhas_tabulacao_mailing 
                  SET data=now(), 
                      numeroDiscado='${numero}', 
                      agente='${ramal}', 
                      estado='${estado}', 
                      desc_estado='${desc_estado}', 
                      contatado='${contatado}', 
                      tabulacao=${status_tabulacao}, 
                      produtivo='${produtivo}', 
                      observacao='${observacao}', 
                      tentativas=tentativas+1 
                WHERE idRegistro=${idRegistro} 
                  AND idMailing=${idMailing} 
                  AND idCampanha=${idCampanha} 
                  AND idNumero=${idNumero}`
        await this.querySync(sql)   
        
        
        //Grava informações no histórico de chamadas
        sql = `INSERT INTO historico_atendimento 
                            (data,hora,campanha,mailing,id_registro,id_numero,nome_registro,agente,protocolo,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) 
                     VALUES (now(),now(),${idCampanha},${idMailing},${idRegistro},${idNumero},'${nome_registro}',${ramal},'${protocolo}','${uniqueid}','${tipo_ligacao}','${numero}',${status_tabulacao},'${observacao}','${contatado}') `
        await this.querySync(sql)
        
        //Verifica se a chamada ja foi desligada 
        if(dadosAtendimento[0].desligada==1){
            //Remove chamada simultanea 
            await this.clearCallsAgent(ramal);
            //Atualiza estado do agente para disponivel
            await this.alterarEstadoAgente(ramal,1,0)//Altera o status do agente para ativo
        }else{
            //Atualiza a tabela da chamada simultanea como tabulando
            sql = `UPDATE campanhas_chamadas_simultaneas SET tabulado=1 WHERE id=${idAtendimento}`
            await this.querySync(sql)
        }
        
        return true;
    }



    //Tabula uma chamada apos sua conclusao                        
    async tabulandoContato_old(idAtendimento,contatado,status_tabulacao,observacao,produtivo,ramal){
        let estado
        let desc_estado        
        if(produtivo==1){
            estado=4
            desc_estado='Já Trabalhado'
        }else{
            estado=0
            desc_estado='Disponivel'
        }    
            
        await this.desligaChamada(idAtendimento,estado,contatado,produtivo,status_tabulacao,observacao)    
        return true;                            
    }  
    //Muda o status do agente
    async alterarEstadoAgente(agente,estado,pausa){
        //Recuperando estado anterior do agente
        const estadoAnterior = await this.infoEstadoAgente(agente)
        
        //zerando cronometro do estado anterior
        let sql
        if(estadoAnterior==2){//Caso o agente venha de uma pausa            
            //Removeo agente da lista dos agentes pausados
            sql = `DELETE FROM agentes_pausados WHERE ramal='${agente}'`
            await this.querySync(sql)
            //Atualiza Log
            sql = `UPDATE log_pausas SET termino=now(), ativa=0 WHERE ramal='${agente}' AND ativa=1`
            await this.querySync(sql)
            await Cronometro.saiuDaPausa(agente)
        }
       
        
        if(estado==1){//disponibiliza o ramal do agente no asterisk
            
            this.clearCallsAgent(agente)
            sql = `SELECT idPausa FROM agentes_filas WHERE ramal=${agente} LIMIT 1` 
            const r = await this.querySync(sql)
            const statusPausa=r[0].idPausa
            
            //verifica se o agente tinha solicidado saida do discador em ligacao
            sql = `SELECT deslogado FROM user_ramal WHERE ramal=${agente}`
            const user = await this.querySync(sql)
            const deslogar = user[0].deslogado
            if(deslogar==1){
               //Atualizando o novo estado do agente        
                sql = `UPDATE agentes_filas SET estado=4, idPausa=0 WHERE ramal=${agente}` 
                await this.querySync(sql)
                sql = `UPDATE user_ramal SET estado=4, deslogado=0 WHERE userId=${agente}`
                await this.querySync(sql)
                return false;
            }
            
            if(estadoAnterior==2){
                sql = `UPDATE asterisk.queue_members SET paused=0 WHERE membername=${agente}`
                await this.querySync(sql)  
            }else{
                if((statusPausa==0)||(statusPausa==null)){
                    sql = `UPDATE asterisk.queue_members SET paused=0 WHERE membername=${agente}`
                    await this.querySync(sql)  
                }else{                         
                    //dados da pausa
                    sql = `SELECT * FROM pausas WHERE id=${statusPausa}`
                    const infoPausa = await this.querySync(sql)
                    const idPausa = infoPausa[0].id
                    const nomePausa = infoPausa[0].nome
                    const descricaoPausa = infoPausa[0].descricao
                    const tempo = infoPausa[0].tempo
                    //pausa agente no asterisk
                    sql = `UPDATE asterisk.queue_members SET paused=1 WHERE membername='${agente}'`    
                    await this.querySync(sql)
                    let agora = moment().format("HH:mm:ss")
                    let resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                    //insere na lista dos agentes pausados
                    sql = `INSERT INTO agentes_pausados (data,ramal,inicio,termino,idPausa,nome,descricao) VALUES (now(),'${agente}',now(), '${resultado}', ${idPausa}, '${nomePausa}','${descricaoPausa}')`
                    await this.querySync(sql)
                    agora = moment().format("HH:mm:ss")
                    resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
                    sql = `INSERT INTO log_pausas (ramal,idPausa,data,inicio,ativa) VALUES ('${agente}',${idPausa},now(),now(),1)`
                    await this.querySync(sql)
                    //Atualizando o novo estado do agente        
                    sql = `UPDATE agentes_filas SET estado=2, idPausa=${pausa} WHERE ramal=${agente}` 
                    await this.querySync(sql)
                    sql = `UPDATE user_ramal SET estado=2 WHERE userId=${agente}`
                    await this.querySync(sql)
                    return false
                }
            }            
        }

        if(estado==2){//Caso o agente va para uma pausa
            
            if(estadoAnterior==3){
                //Atualizando o novo estado do agente        
                sql = `UPDATE agentes_filas SET estado=${estadoAnterior}, idPausa=${pausa} WHERE ramal=${agente}` 
                await this.querySync(sql)
                sql = `UPDATE user_ramal SET estado=${estadoAnterior} WHERE userId=${agente}`
                await this.querySync(sql)
                return false
            }
            this.clearCallsAgent(agente)
            //dados da pausa
            sql = `SELECT * FROM pausas WHERE id=${pausa}`
            const infoPausa = await this.querySync(sql)
            const idPausa = infoPausa[0].id
            const nomePausa = infoPausa[0].nome
            const descricaoPausa = infoPausa[0].descricao
            const tempo = infoPausa[0].tempo
            //pausa agente no asterisk
            sql = `UPDATE asterisk.queue_members SET paused=1 WHERE membername='${agente}'`    
            await this.querySync(sql)
            let agora = moment().format("HH:mm:ss")
            let resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
            //insere na lista dos agentes pausados
            sql = `INSERT INTO agentes_pausados (data,ramal,inicio,termino,idPausa,nome,descricao) VALUES (now(),'${agente}',now(), '${resultado}', ${idPausa}, '${nomePausa}','${descricaoPausa}')`
            await this.querySync(sql)
            agora = moment().format("HH:mm:ss")
            resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")
            sql = `INSERT INTO log_pausas (ramal,idPausa,data,inicio,ativa) VALUES ('${agente}',${idPausa},now(),now(),1)`
            await this.querySync(sql)
        }

        if(estado==4){
            if(estadoAnterior==3){
                //Atualizando o novo estado do agente        
                sql = `UPDATE user_ramal SET deslogado=1 WHERE ramal=${agente}`
                await this.querySync(sql)
                return false
            }
            this.clearCallsAgent(agente)
        }
        
        //Atualizando o novo estado do agente        
        sql = `UPDATE agentes_filas SET estado=${estado}, idPausa=${pausa} WHERE ramal=${agente}` 
        await this.querySync(sql)
        sql = `UPDATE user_ramal SET estado=${estado} WHERE userId=${agente}`
        await this.querySync(sql)

        return true
    }

    //Retorna o status de pausa do agente
    async infoEstadoAgente(ramal){
        const sql = `SELECT * FROM user_ramal WHERE ramal='${ramal}'`
        const rows = await this.querySync(sql)
        if(rows.length==0){
            return 0
        }
        return rows[0].estado
    }

    //Desliga Chamada
    async desligaChamada(ramal){
        let sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE ramal=${ramal}`
        const infoChamada = await this.querySync(sql)
        if(infoChamada.length==0){
            return false
        }
        const idAtendimento = infoChamada[0].id
        sql = `UPDATE campanhas_chamadas_simultaneas SET desligada=1 WHERE id=${idAtendimento}`
        await this.querySync(sql)
        return infoChamada

    }



    async desligaChamada_old(idAtendimento){  
        //Le os dados do registro
        
        let sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE id=${idAtendimento}`
        const atendimento = await this.querySync(sql)
        const ramal = atendimento[0].ramal
        //Removendo chamada das chamadas simultaneas
        sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idAtendimento}`
        await this.querySync(sql)

        const estadoAgente = 1//Libera o agente
        const pausa=0
        await this.alterarEstadoAgente(ramal,estadoAgente,pausa)   

        return true
    }
    //Busca a fila da campanha atendida
    async getQueueByNumber(numero){
        const sql = `SELECT id,fila AS Fila FROM campanhas_chamadas_simultaneas WHERE numero='${numero}' ORDER BY id DESC LIMIT 1`
        return await this.querySync(sql)
    }
    //Atualiza registros em uma fila de espera
    async setaRegistroNaFila(idChamada){       
        const sql = `UPDATE campanhas_chamadas_simultaneas SET na_fila=1, tratado=1 WHERE id='${idChamada}'`
        return await this.querySync(sql)
    }




    /*Funcoes de resposta aos scripts do Asterisk******************************************************************/
    //Retorna as informações da chamada pelo número discador
    async dadosAtendimento_byNumero(numero){
        //Separando a campanha que o agente pertence
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE numero='${numero}'`
        return await this.querySync(sql)   
    }

    //Retorna as informações da chamada pelo id de atendimento
    async dadosAtendimento(idAtendimento){
        //Separando a campanha que o agente pertence
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE id='${idAtendimento}'`
        return await this.querySync(sql) 
    }
    
    /* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    * FUNCOES DA TELA DO AGENTE
    * <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    */

    //Retorna o estado atual do agente
    async statusRamal(ramal){
        const sql = `SELECT estado FROM user_ramal WHERE ramal=${ramal}`
        const r = await this.querySync(sql)
        return r[0].estado 
    }

    //Status de pausa do agente
    async infoPausaAgente(ramal){
        const sql = `SELECT * FROM agentes_pausados WHERE ramal='${ramal}'`
        return await this.querySync(sql)
    }  


    //Recupera o tipo de idAtendimento
    async modoAtendimento(ramal){
        const sql = `SELECT m.id, m.modo_atendimento, m.id_campanha 
                       FROM asterisk.queue_members AS q 
                       JOIN mega_conecta.campanhas_chamadas_simultaneas AS m 
                         ON q.queue_name=m.fila 
                      WHERE membername=${ramal} AND na_fila=1`
        return await this.querySync(sql)
    }
       
    //Informações da chamada a ser atendida
    async infoChamada_byIdAtendimento(idAtendimento){
        //Separando a campanha que o agente pertence
        let sql = `SELECT id,protocolo,id_registro,tipo_discador,id_campanha,id_mailing,numero,tabela_dados,tabela_numeros
                       FROM campanhas_chamadas_simultaneas WHERE id='${idAtendimento}'`
        const calldata = await this.querySync(sql)
        if(calldata.length==0){
            return false
        }
        
        
        const idMailing = calldata[0].id_mailing
        const tipo_discador = calldata[0].tipo_discador
        const idReg = calldata[0].id_registro
        const tabela_dados = calldata[0].tabela_dados
        const tabela_numeros = calldata[0].tabela_numeros
        const idCampanha = calldata[0].id_campanha
        const protocolo = calldata[0].protocolo
        const numero = calldata[0].numero

        //Seleciona os campos de acordo com a configuração da tela do agente
        //CAMPOS DE DADOS
         sql = `SELECT id,campo,apelido
                  FROM mailing_tipo_campo 
                 WHERE idMailing=${idMailing}
                   AND (tipo='dados' OR tipo='nome')
              ORDER BY ordem ASC`;
       
        const campos_dados = await this.querySync(sql)
        //montando a query de busca dos dados
        const info = {};
              info['idAtendimento']=idAtendimento
              info['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(idCampanha)
              info['tipo_discador']=tipo_discador
              info['idMailing']=idMailing              
              info['idMailing']=idMailing
              info['protocolo']=protocolo
              info['nome_registro']=await this.campoNomeRegistro(idMailing,idReg,tabela_dados)
              info['campos']={}
              info['campos']['idRegistro']=idReg
       
        for(let i=0; i<campos_dados.length; i++){
            let apelido=''
            if(campos_dados[i].apelido === null){
                apelido=campos_dados[i].campo
            }else{
                apelido=campos_dados[i].apelido
            }  
            console.log('Info Chamada - Valor do Campo',campos_dados[i].campo)
            sql = `SELECT ${campos_dados[i].campo} AS 'valor' FROM mailings.${tabela_dados} WHERE id_key_base=${idReg}` 
            let value = await this.querySync(sql)
            info['campos'][apelido]=value[0].valor
        }        
       
        info['numeros']=[]
        //CAMPOS DE TELEFONE
         sql = `SELECT numero
                       FROM mailings.${tabela_numeros}
                      WHERE id_registro=${idReg} 
                   ORDER BY id ASC`;
        const campos_numeros = await this.querySync(sql)
        for(let i=0; i<campos_numeros.length; i++){
            info['numeros'].push(`0${campos_numeros[i].numero}`);
        }
        info['numeros_discado']=numero
         sql = `SELECT id,nome,descricao FROM campanhas WHERE id=${idCampanha}`
        const dadosCampanha = await this.querySync(sql)
        
        info['dadosCampanha']=dadosCampanha
        
        return info
    }

    //Retorna o valor do campo nome do registro caso exista
    async campoNomeRegistro(idMailing,idRegistro,tabelaDados){
        let sql = `SELECT campo FROM mailing_tipo_campo 
                    WHERE idMailing=${idMailing}
                      AND tipo='nome'`
        const campoNome = await this.querySync(sql)
        if(campoNome.length==0){
            return false
        }
        const campo = campoNome[0].campo
        sql = `SELECT ${campo} as nome
                 FROM mailings.${tabelaDados}
                WHERE id_key_base=${idRegistro}`
        const nome = await this.querySync(sql)
        return nome[0].nome
    }

    //Informações da chamada a ser atendida
    async infoChamada_byRamal(ramal){
        //Separando a campanha que o agente pertence
        let sql = `SELECT id,protocolo,tipo_discador,id_registro,id_campanha,id_mailing,numero,tabela_dados,tabela_numeros
                     FROM campanhas_chamadas_simultaneas 
                    WHERE ramal='${ramal}' AND falando=1`
        const calldata = await this.querySync(sql)
        if(calldata.length==0){
            return false
        }
        const tipo_discador = calldata[0].tipo_discador
        const idMailing = calldata[0].id_mailing
        const idReg = calldata[0].id_registro
        const tabela_dados = calldata[0].tabela_dados
        const tabela_numeros = calldata[0].tabela_numeros
        const idCampanha = calldata[0].id_campanha
        const protocolo = calldata[0].protocolo
        const numero = calldata[0].numero

        //Seleciona os campos de acordo com a configuração da tela do agente
        //CAMPOS DE DADOS
         sql = `SELECT id,campo,apelido
                  FROM mailing_tipo_campo 
                 WHERE idMailing=${idMailing}
                   AND (tipo='dados' OR tipo='nome')
              ORDER BY ordem ASC`;
       
        const campos_dados = await this.querySync(sql)
        //montando a query de busca dos dados
        const info = {};
              info['tipo_discador']=tipo_discador
              info['idAtendimento']=calldata[0].id
              info['listaTabulacao']=await Campanhas.checklistaTabulacaoCampanha(idCampanha)
              info['idMailing']=idMailing
              info['protocolo']=protocolo
              info['nome_registro']=await this.campoNomeRegistro(idMailing,idReg,tabela_dados)
              info['campos']={}
              info['campos']['idRegistro']=idReg
       
        for(let i=0; i<campos_dados.length; i++){
            let apelido=''
            if(campos_dados[i].apelido === null){
                apelido=campos_dados[i].campo
            }else{
                apelido=campos_dados[i].apelido
            }  
            console.log('Valor do Campo',campos_dados[i].campo)
            sql = `SELECT ${campos_dados[i].campo} AS 'valor' FROM mailings.${tabela_dados} WHERE id_key_base=${idReg}` 
            let value = await this.querySync(sql)
            info['campos'][apelido]=value[0].valor
        }        
       
        info['numeros']=[]
        //CAMPOS DE TELEFONE
         sql = `SELECT numero
                       FROM mailings.${tabela_numeros}
                      WHERE id_registro=${idReg} 
                   ORDER BY id ASC`;
        const campos_numeros = await this.querySync(sql)
        for(let i=0; i<campos_numeros.length; i++){
            info['numeros'].push(`0${campos_numeros[i].numero}`);
        }
        info['numeros_discado']=numero
         sql = `SELECT id,nome,descricao FROM campanhas WHERE id=${idCampanha}`
        const dadosCampanha = await this.querySync(sql)
        
        info['dadosCampanha']=dadosCampanha
        
        return info
    } 

    //Atende a chamada, atualiza a chamada simultanea e retorna os dados da mesma com os históricos do registro
    async atendeChamada(ramal){
        //Separando a campanha que o agente pertence
        let sql = `SELECT id FROM campanhas_chamadas_simultaneas WHERE ramal='${ramal}' AND tratado=1`
        const calldata = await this.querySync(sql)
        if(calldata.length==0){
            return "Chamada interna"
        }
        const idAtendimento = calldata[0].id
        //Atualiza chamada simultanea com o status de falando
        sql = `UPDATE campanhas_chamadas_simultaneas SET atendido=0, falando=1 WHERE id='${idAtendimento}'`;
        await this.querySync(sql)        
        return await this.infoChamada_byIdAtendimento(idAtendimento)
    }

    async dadosChamadaAtendida(ramal){
        //Separando a campanha que o agente pertence
        let sql = `SELECT id FROM campanhas_chamadas_simultaneas WHERE ramal='${ramal}' AND (falando=1 OR tipo_discador='preview' OR tipo_discador='clicktocall')`
        const calldata = await this.querySync(sql)
        if(calldata.length==0){
            return "Chamada interna"
        }
        const idAtendimento = calldata[0].id           
        return await this.infoChamada_byIdAtendimento(idAtendimento)
    }

    async infoChamada(ramal){
        let sql = `SELECT * FROM campanhas_chamadas_simultaneas 
                    WHERE ramal='${ramal}'`
        return await this.querySync(sql)
    }

    //Dados do Agente
    async infoAgente(ramal){
        const sql = `SELECT id as ramal, nome FROM users WHERE id=${ramal}`
        return await this.querySync(sql)        
    }

     //Dados do Agente
     async infoRegistro(idMailing,idRegistro){
        const infoMailing = await Mailing.infoMailing(idMailing)
        console.log(infoMailing)
        const tabela = infoMailing[0].tabela_dados
        const sql = `SELECT * FROM mailings.${tabela} WHERE id_key_base=${idRegistro}`
        return await this.querySync(sql)        
    }

    //Retorna o histórico de atendimento do registro
    async historicoRegistro(idMailing,idReg){


        const sql = `SELECT nome_registro,numero_discado,agente,protocolo,DATE_FORMAT (data,'%d/%m/%Y') AS dia,DATE_FORMAT (hora,'%H:%i') AS horario,t.tabulacao,obs_tabulacao,h.contatado
                       FROM historico_atendimento AS h 
                       LEFT JOIN tabulacoes_status AS t ON t.id=h.status_tabulacao 
                      WHERE id_registro=${idReg} AND mailing=${idMailing} 
                      ORDER BY h.id DESC LIMIT 50`
        return await this.querySync(sql)  
    }

    //Retorna o histórico de atendimento do agente
    async historicoChamadas(ramal){
        const sql = `SELECT nome_registro,numero_discado,agente,protocolo,DATE_FORMAT (data,'%d/%m/%Y') AS dia,t.tabulacao,obs_tabulacao 
                       FROM historico_atendimento AS h 
                       LEFT JOIN tabulacoes_status AS t ON t.id=h.status_tabulacao
                       WHERE agente='${ramal}' 
                       ORDER BY h.id DESC LIMIT 50`
        return await this.querySync(sql)  
    }

    

    //Verifica Lista de tabulacao da campanha
    async tabulacoesCampanha(idCampanha){
        let sql = `SELECT idListaTabulacao FROM campanhas_listastabulacao WHERE idCampanha='${idCampanha}' AND idListaTabulacao!=0`
        const idLista = await this.querySync(sql)
        if(idLista.length!=0){
           
            const tabulacoes={}
            //produtivas
            sql = `SELECT id,tabulacao,descricao,followUp,venda,contatado FROM tabulacoes_status 
                    WHERE idLista=${idLista[0].idListaTabulacao} AND tipo='produtivo' AND status=1
                    ORDER BY ordem ASC`
            const pro = await this.querySync(sql) 
            tabulacoes['produtivas']=[]
            for(let i = 0; i<pro.length; i++) {                
                tabulacoes['produtivas'].push(pro[i])
                tabulacoes['produtivas'][i]['tipo']='produtivo'
            }
            //improdutivas       
            sql = `SELECT id,tabulacao,descricao,followUp,venda,contatado FROM tabulacoes_status 
                    WHERE idLista=${idLista[0].idListaTabulacao} AND tipo='improdutivo' AND status=1
                    ORDER BY ordem ASC`
            const imp = await this.querySync(sql)
            tabulacoes['improdutivas']=[]
            for(let i = 0; i<imp.length; i++) {
                tabulacoes['improdutivas'].push(imp[i])
                tabulacoes['improdutivas'][i]['tipo']='improdutivo'
            }
            return tabulacoes
        }
        return false
    }
    //Atualiza a chamada como tabulando
    async preparaRegistroParaTabulacao(idAtendimento){
        //Atualiza Chamada como tabulando 
        const sql = `UPDATE campanhas_chamadas_simultaneas
                        SET falando=1, tabulando=1 
                      WHERE id='${idAtendimento}'`;
        await this.querySync(sql) 
    }









    
    

    
    //EM REFATORACAO
    

   
    
    
    
    

    /*discarCB(ramal,numero,callback){
        //Recuperando dados do asterisk
        const sql=`SELECT * FROM asterisk_ari WHERE active=1`;
        connect.banco.query(sql,(e,asterisk_server)=>{
            if(e) throw e;
            
            const modo='discador'
            const server = asterisk_server[0].server
            const user =  asterisk_server[0].user
            const pass =  asterisk_server[0].pass
            
            //Asterisk.discar(server,user,pass,modo,ramal,numero,callback)          
        })
    }*/


    //FUNCOES DE APOIO AO ASTERISK
    

   

    

   

    //######################Funções do atendente######################
   
   

    //CAMPOS DE DADOS
    camposChamada(idAtendimento,idReg,tabela,numero,idCampanha,protocolo,callback){
        const sql = `SELECT c.id,c.campo,c.apelido FROM mailing_tipo_campo AS c JOIN campanhas_campos_tela_agente AS s ON c.id=s.idCampo WHERE c.tipo='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
        connect.banco.query(sql,(e,campos_dados)=>{
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
            connect.mailings.query(sql,(e,dados)=>{
                if(e) throw e
                
                //CAMPOS DE TELEFONE
                const sql = `SELECT c.id,c.campo,c.apelido FROM mailing_tipo_campo AS c JOIN campanhas_campos_tela_agente AS s ON c.id=s.idCampo WHERE c.tipo!='dados' AND s.tabela='${tabela}' AND s.idCampanha=${idCampanha} ORDER BY s.ordem ASC`;
                connect.banco.query(sql,(e,campos_numeros)=>{
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
                    connect.mailings.query(sql,(e,numeros)=>{
                        if(e) throw e
                               
                        let camposRegistro = '{"campos":{"dados":'+JSON.stringify(dados)+',' 
                        camposRegistro += '"numeros":'+JSON.stringify(numeros)+'},'
                        //Numero Discado
                        camposRegistro += `"numero_discado":{"protocolo":"${protocolo}","telefone":"${numero}","id_atendimento":${idAtendimento}},`;
                                    
                        //Informações da campanha
                        Campanhas.dadosCampanha(idCampanha,(e,dadosCampanha)=>{
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

    

   

    

     

    

       

    

    


       

    
   


    //FUNCOES DO AGENTE
   

    
    
   
    

       

    log_chamadasSimultaneas(limit,tipo,callback){
        const sql = `SELECT ${tipo} AS chamadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT ${limit}`
        connect.banco.query(sql, callback)
    }
    

}
export default new Discador()