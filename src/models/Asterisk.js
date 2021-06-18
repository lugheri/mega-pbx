'use strict';

import connect from '../Config/dbConnection';
import ari from 'ari-client';
import util from 'util';
import AmiIo from 'ami-io';
import Tabulacoes from '../models/Tabulacoes';

import moment from 'moment';
import Campanhas from './Campanhas';

class Asterisk{
    //######################Configuração das filas######################
   

    //Criar nova filas
    criarFila(name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitorType,monitorFormat,callback){
        const sql = `INSERT INTO queues (name,musiconhold,strategy,timeout,retry,autopause,maxlen,monitor_type,monitor_format) VALUES ('${name}','${musiconhold}','${strategy}','${timeout}','${retry}','${autopause}','${maxlen}','${monitorType}','${monitorFormat}')`
        connect.asterisk.query(sql,callback)
    }
    //Remove a fila
    removerFila(nomeFila,callback){
        const sql = `DELETE FROM queues WHERE name='${nomeFila}'`
        connect.asterisk.query(sql,(err,result)=>{
            if(err) throw err
            
            const sql = `DELETE FROM queue_members WHERE queue_name='${nomeFila}'`
            connect.asterisk.query(sql,callback)
        })

    }
    //Lista as filas cadastradas
    listarFilas(callback){
        const sql = `SELECT * FROM queues`
        connect.asterisk.query(sql,callback)
    }
    //Exibe os dads da fila
    dadosFila(nomeFila,callback){
        const sql = `SELECT * FROM queues WHERE name='${nomeFila}'`
        connect.asterisk.query(sql,callback)
    }
    //Edita os dados da fila
    editarFila(nomeFila,dados,callback){
        const sql = 'UPDATE queues SET ? WHERE name=?'
        connect.asterisk.query(sql,[dados,nomeFila],callback)
    }
    //Adiciona membros na fila
    addMembroFila(queue_name,queue_interface,membername,state_interface,penalty,callback){
        const sql = `INSERT INTO queue_members (queue_name,interface,membername,state_interface,penalty) VALUES ('${queue_name}','${queue_interface}','${membername}','${state_interface}','${penalty}')`
        connect.asterisk.query(sql,callback)
    }
    //Lista os membros da fila
    listarMembrosFila(nomeFila,callback){
        const sql = `SELECT * FROM queue_members WHERE queue_name = ?`
        connect.asterisk.query(sql,nomeFila,callback)
    }
    //Remove os membros da fila
    removeMembroFila(nomeFila,membro,callback){
        const sql = `DELETE FROM queue_members WHERE queue_name='${nomeFila}' AND membername='${membro}'`
        connect.asterisk.query(sql,nomeFila,callback)
    }

   /* delMembroFila(uniqueid,callback){
        const sql = `DELETE FROM queue_members WHERE uniqueid='${uniqueid}'`
        connect.asterisk.query(sql,callback)
    }*/

    //######################Configuração do Asterisk######################
    setRecord(data,hora,ramal,uniqueid,callback){
        const sql = `INSERT INTO records (date,date_record,time_record,ramal,uniqueid) VALUES (now(),'${data}','${hora}','${ramal}','${uniqueid}')`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e
            this.servidorWebRTC(callback)
        })
    }
    getDomain(callback){//Ip/dominio do servidor onde o asterisk esta instalado
        const sql = "SELECT ip FROM servidor_webrtc WHERE status=1"
        connect.banco.query(sql,callback)
    }

    servidorWebRTC(callback){//Ip da maquina onde o asterisk esta instalado
        const sql = "SELECT * FROM servidor_webrtc WHERE status=1"
        connect.banco.query(sql,callback)
    }

    ariConnect(server,user,pass,callback){
        ari.connect(server, user, pass, callback)
    }   


    //######################Funções de suporte ao AGI do Asterisk######################

    //Trata a ligação em caso de Máquina ou Não Atendida    
    machine(dados,callback){
        //Dados recebidos pelo AGI do asterisk
        const numero = dados.numero
        const observacoes = dados.status

        //Verificando se o numero ja consta em alguma chamada simultanea
        this.verificaChamadaSimultanea(numero,(e,chamada)=>{
            if(e) throw e

            if(chamada.length!=0){
                
                const id_reg=chamada[0].id_reg
                const tabela=chamada[0].tabela_mailing

                const idCampanha=chamada[0].id_campanha
                const idMailing=chamada[0].id_mailing
                const ramal=chamada[0].ramal
                const protocolo=chamada[0].protocolo
                console.log(`protocolo ${protocolo}`)

                //Status de tabulacao referente ao nao atendido
                const tabulacao = 0
                const contatado = 'N'
                const produtivo = 0
                const uniqueid=chamada[0].uniqueid
                const tipo_ligacao=chamada[0].tipo_ligacao

                //Registra histórico de chamada
                this.registraHistoricoAtendimento(protocolo,idCampanha,idMailing,id_reg,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado,(e,r)=>{
                    if(e) throw e
                    //Tabula registro
                    this.tabulandoContato(tabela,contatado,tabulacao,observacoes,produtivo,numero,ramal,id_reg,idMailing,idCampanha,callback)
                })
            }else{
                console.log('Nao encontrado')
                callback(false,false)
            }
        })        
    }

    //Atendente atendeu chamada da fila
    answer(dados,callback){
        //Dados recebidos pelo AGI
        const uniqueid = dados.uniqueid;
        const numero = dados.numero;

        let ch = dados.ramal;
        ch = ch.split("-");
        ch = ch[0].split("/")
        const ramal = ch[1]

        console.log(`RAMAL DO AGENTE: ${ramal}`)

        //dados da campanha

        const sql = `UPDATE campanhas_chamadas_simultaneas SET uniqueid='${uniqueid}',ramal='${ramal}', na_fila=0, atendido=1 WHERE numero='${numero}' AND na_fila=1`  
        connect.banco.query(sql,callback)
    }

    //Chamada Manual
    handcall(dados,callback){
        //Dados recebidos pelo AGI
        if(dados.tipo=="externo"){
            const uniqueid = dados.uniqueid;
            const numero = dados.numero;
            const tipo = dados.tipo;
            
            let ch = dados.ramal;
            ch = ch.split("-");
            ch = ch[0].split("/")
            const ramal = ch[1]
            const hoje = moment().format("Y-MM-DD")
            const protocolo = hoje+'0'+ramal
            const modo_atendimento = 'manual'            

            const sql = `INSERT INTO campanhas_chamadas_simultaneas (data,ramal,uniqueid,protocolo,tipo_ligacao,modo_atendimento,numero,falando) VALUES (NOW(),'${ramal}','${uniqueid}','${protocolo}','${tipo}','${modo_atendimento}','${numero}',1)`
            connect.banco.query(sql,callback)
        }else{
            callback(false,true)
        }
    }

    //Reccupera o tipo de idAtendimento
    modoAtendimento(ramal,callback){
        const sql = `SELECT m.id, m.modo_atendimento, m.id_campanha FROM queue_members AS q JOIN mega_conecta.campanhas_chamadas_simultaneas AS m ON q.queue_name=m.fila WHERE membername=${ramal} AND na_fila=1`
        connect.asterisk.query(sql,callback)
    }

    
    //Verifica se um numero esta em chamada
    verificaChamadaSimultanea(numero,callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE numero='${numero}'`;
        connect.banco.query(sql,callback)
    }

    //Registra o histórico de atendimento de uma chamada
    registraHistoricoAtendimento(protocolo,idCampanha,idMailing,id_reg,ramal,uniqueid,tipo_ligacao,numero,tabulacao,observacoes,contatado,callback){
        const sql = `INSERT INTO historico_atendimento (data,hora,protocolo,campanha,mailing,id_registro,agente,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) VALUES (now(),now(),'${protocolo}',${idCampanha},'${idMailing}',${id_reg},${ramal},'${uniqueid}','${tipo_ligacao}','${numero}',${tabulacao},'${observacoes}','${contatado}')`
        connect.banco.query(sql,callback)
    }  

    
    
    //######################Funções do atendente######################
    
    
    //Funcoes do atendimento de ligacao que recupera os dados da ligacao
    atendeChamada(ramal,callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_reg,id_campanha,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE ramal='${ramal}' AND atendido=1`
        connect.banco.query(sql,(e,calldata)=>{
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
                connect.banco.query(sql,(e,r)=>{
                    if(e) throw e
                    //Seleciona os campos de acordo com a configuração da tela do agente
                    //CAMPOS DE DADOS
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
                })
            }
        })
    }

    //Informacoes da chamada ja atendida
    infoChamada(ramal,callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_reg,id_campanha,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE ramal='${ramal}' AND falando=1`
        connect.banco.query(sql,(e,calldata)=>{
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
        })
    }

    infoChamada_byIdAtendimento(idAtendimento,callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_reg,id_campanha,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE id='${idAtendimento}'`
        connect.banco.query(sql,(e,calldata)=>{
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

    preparaRegistroParaTabulacao(idAtendimento,callback){
        //Atualiza Chamada como tabulando 
        const sql = `UPDATE campanhas_chamadas_simultaneas SET falando=1, tabulando=1, hora_tabulacao=now() WHERE id='${idAtendimento}'`;
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            //Retorna id da campanha
            const sql = `SELECT id_campanha FROM campanhas_chamadas_simultaneas WHERE id=${idAtendimento}`
            connect.banco.query(sql,callback)
        })
    }

    //Tabula uma chamada apos sua conclusao                        
    tabulandoContato(idAtendimento,tabela,contatado,status_tabulacao,observacao,produtivo,numero,ramal,idRegistro,idMailing,idCampanha,callback){
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
        Campanhas.atualizaEstadoAgente(ramal,estadoAgente,pausa,(e,r)=>{
            if(e) throw e
        
            this.desligaChamada(idAtendimento,contatado,produtivo,status_tabulacao,observacao,callback)
        })                        
    }    

    dadosAtendimento(idAtendimento, callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,id_reg,id_campanha,id_mailing,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE id='${idAtendimento}'`
        connect.banco.query(sql,callback)
    }

    dadosAtendimento_byNumero(numero, callback){
        //Separando a campanha que o agente pertence
        const sql = `SELECT id,protocolo,uniqueid,id_reg,id_campanha,id_mailing,tabela_mailing,numero FROM campanhas_chamadas_simultaneas WHERE numero='${numero}'`
        connect.banco.query(sql,callback)
    }
               
    desligaChamada(idAtendimento,contatado,produtivo,status_tabulacao,observacao,callback){  
        //Le os dados do registro
        const sql = `SELECT id_reg,uniqueid,tipo_ligacao,protocolo,tabela_mailing,id_mailing,id_campanha,ramal,numero FROM campanhas_chamadas_simultaneas WHERE id=${idAtendimento}`
        connect.banco.query(sql,(e,atendimento)=>{
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

            const estado = 1
            const desc_estado = 'Disponivel'       

            //Atualiza registro com nova tentativa            
            const sql = `UPDATE ${tabela} SET tentativas=tentativas+1, contatado='${contatado}', status_tabulacao=${status_tabulacao}, produtivo='${produtivo}' WHERE id_key_base = ${idRegistro}`
            connect.mailings.query(sql,(e,r)=>{
                if(e) throw e

                //Grava historico
                const sql = `INSERT INTO historico_atendimento (data,hora,campanha,mailing,id_registro,agente,protocolo,uniqueid,tipo,numero_discado,status_tabulacao,obs_tabulacao,contatado) VALUES (now(),now(),${idCampanha},${idMailing},${idRegistro},${ramal},"${protocolo}","${uniqueid}","${tipo_ligacao}","${numero}",${status_tabulacao},"${observacao}","${contatado}") `
                connect.banco.query(sql, (e,r)=>{
                    if(e) throw e

                    //Atualiza a tabela da campanha 
                    const sql = `UPDATE campanhas_tabulacao_mailing SET data=now(), numeroDiscado='${numero}', agente='${ramal}', estado='${estado}', desc_estado='${desc_estado}', contatado='${contatado}', tabulacao=${status_tabulacao}, produtivo='${produtivo}', observacao='${observacao}', tentativas=tentativas+1 WHERE idRegistro=${idRegistro} AND idMailing=${idMailing} AND idCampanha=${idCampanha}`
                    connect.mailings.query(sql,(e,r)=>{
                        if(e) throw e
                        //Removendo chamada das chamadas simultaneas
                        const sql = `DELETE FROM campanhas_chamadas_simultaneas  WHERE id='${idAtendimento}'`
                        connect.banco.query(sql,callback(e,true))
                    }) 
                })
            }) 
        })
    }


    //Pausar Agente
    pausarAgente(ramal,idPausa,pausa,descricao,tempo,callback){
        //atualiza estado do agente na fila das campanhas
        const sql = `UPDATE agentes_filas SET estado=2, idpausa=${idPausa} WHERE ramal='${parseInt(ramal)}'`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            //pausa agente no asterisk
            const sql = `UPDATE queue_members SET paused=1 WHERE membername='${ramal}'`
            connect.asterisk.query(sql,(e,r)=>{
                if(e) throw e
                const agora = moment().format("HH:mm:ss")
                const resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")

                //insere na lista dos agentes pausados
                const sql = `INSERT INTO agentes_pausados (data,ramal,inicio,termino,idPausa,nome,descricao) VALUES (now(),'${ramal}',now(), '${resultado}', ${idPausa}, '${pausa}','${descricao}')`
                connect.banco.query(sql,(e,r)=>{
                    if(e) throw e

                    const agora = moment().format("HH:mm:ss")
                    const resultado = moment(agora, "HH:mm:ss").add(tempo, 'minutes').format("HH:mm:ss")

                    const sql = `INSERT INTO log_pausas (ramal,idPausa,data,inicio,ativa) VALUES ('${ramal}',${idPausa},now(),now(),1)`
                    connect.banco.query(sql,(e,r)=>{
                        if(e) throw e
                        callback(false,true)
                    })
                })           
            })          
        })
    }  

    //Retorna o status de pausa do agente
    infoPausaAgente(ramal,callback){
        const sql = `SELECT idPausa, inicio, termino as limite, nome, descricao FROM agentes_pausados WHERE ramal='${ramal}'`
        connect.banco.query(sql,callback)
    }
    
    //Tira o agente da pausa
    removePausaAgente(ramal,callback){
        //atualiza estado do agente na fila das campanhas
        const sql = `UPDATE agentes_filas SET estado=1, idpausa=0 WHERE ramal='${parseInt(ramal)}'`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            //pausa agente no asterisk
            const sql = `UPDATE queue_members SET paused=0 WHERE membername='${ramal}'`
            connect.asterisk.query(sql,(e,r)=>{
                if(e) throw e
                
               
                //Removeo agente da lista dos agentes pausados
                const sql = `DELETE FROM agentes_pausados WHERE ramal='${ramal}'`
                connect.banco.query(sql,(e,r)=>{
                    if(e) throw e
                    
                    //Atualiza Log
                    const sql = `UPDATE log_pausas SET termino=now(), ativa=0 WHERE ramal='${ramal}' AND ativa=1`
                    connect.banco.query(sql,(e,r)=>{
                        if(e) throw e
                        callback(false,true)
                    })
                })           
            })          
        })
    }
    
    
    
    //OLD
    
    ligar(server,user,pass,modo,ramal,numero,callback){
        console.log(`recebendo ligacao ${numero}`)
        console.log(`ramal ${ramal}`)
        ari.connect(server, user, pass, (err,client)=>{
          if(err) throw err         

          //Extension
          let context
          let endpoint
          if(modo=='discador'){
            context = 'dialer'
            endpoint = `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`
          }else{
            context = 'external'
            endpoint = `PJSIP/megatrunk/` 
          }
          console.log(`context: ${context}`)
          console.log(`endpoint: ${endpoint}`)
          console.log(`numero recebido: ${numero}`)
          console.log(`Servidor: ${server}`)

          const options = {            
            "endpoint"       : `${endpoint}`,
            "extension"      : `0${numero}`,
            "context"        : `${context}`,
            "priority"       : 1,
            "app"            : "",
            "appArgs"        : "",
            "Callerid"       : `0${numero}`,//numero,
            "timeout"        : -1, 
            //"channelId"      : '324234', 
            "otherChannelId" : ""
          }
          client.channels.originate(options,callback)
          //client.channel
        })  
    }




    




    ///////////////////////Funcoes de tabulacao automatica - AGI
    


  



   

    

    

    




    

     ///////////////////////////////////TESTES/////////////////////////////////////////////////////
     agi_test(dados,callback){
        const sql = `INSERT INTO discador (data,obs_tabulacao,status) VALUES (now(),'${dados.obs}','${dados.status}')`
        connect.banco.query(sql,callback);
    }
    
    testLigacao(numero,ramal,callback){
        const sql = `SELECT * FROM asterisk_ari WHERE active=1`; 
        connect.banco.query(sql,(e,res)=>{
            if(e) throw e
            
            console.log(`${res[0].server}, ${res[0].user}, ${res[0].pass}, ${ramal}, ${numero}`)
            const modo='discador'
            this.ligarTeste(res[0].server,res[0].user,res[0].pass,modo,ramal,numero,callback)
        }) 
    }

    ligarTeste(server,user,pass,modo,ramal,numero,res){
        console.log(`recebendo ligacao de teste ${numero}`)
        console.log(`ramal ${ramal}`)
        console.log(`modo ${modo}`)
        ari.connect(server, user, pass, (err,client)=>{
          if(err) throw err         
          console.log(err)

          console.log(client)

          //Extension
          let context
          let endpoint
          if(modo=='discador'){
            context = 'dialer'
            endpoint = `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`
          }else{
            context = 'external'
            endpoint = `PJSIP/megatrunk/` 
          }
          console.log(`context: ${context}`)
          console.log(`endpoint: ${endpoint}`)
          console.log(`numero recebido: ${numero}`)
          console.log(`Servidor: ${server}`)

          const options = {            
            "endpoint"       : `${endpoint}`,
            "extension"      : `0${numero}`,
            "context"        : `${context}`,
            "priority"       : 1,
            "app"            : "",
            "appArgs"        : "",
            "Callerid"       : `0${numero}`,//numero,
            "timeout"        : -1, 
            //"channelId"      : '324234', 
            "otherChannelId" : ""
          }
          client.channels.originate(options,(e,r)=>{
            if(e) throw e
                res.json(r)
            })
          //client.channel
        })  
    }
    
    /*testLigacao(numero,ramal,callback){
        const options = {port:5038, host:'35.239.60.116', login:'mega', password:'1234abc@', encoding: 'ascii'}
        const amiio = AmiIo.createClient(options)
        amiio.on('incorrectServer', function () {
            console.log("Invalid AMI welcome message. Are you sure if this is AMI?");
            process.exit();
        });
        amiio.on('connectionRefused', function(){
            console.log("Connection refused.");
            process.exit();
        });
        amiio.on('incorrectLogin', function () {
            console.log("Incorrect login or password.");
            process.exit();
        });
        amiio.on('event', function(event){
            console.log('event:'+ event);
        });
        amiio.connect();
        amiio.on('connected', function(){
            console.log('connected');
            
            const action = new amiio.Action.Originate();

            
            action.Channel = 'PJSIP/megatrunk/sip:011930224168@35.199.98.221:5060'
            action.Context='external'
            action.Exten='011930224168'
            action.Priority=1
            action.Async=true
            action.WaitEvent=true
    
            amiioClient.send(action,(e,data)=>{
                if(e) throw e 
    
                console.log(data)
            })

            setTimeout(function(){
                amiio.disconnect();
                amiio.on('disconnected', process.exit());
            },30000);
        });
        
        /*
        const options = {port:5038, host:'35.239.60.116', login:'mega', password:'1234abc@', encoding: 'ascii'}
        const cliente = amiio.createClient(options)
        console.log(cliente)
        */
       //amiio.createClient() = amiio.createClient({port:8088, host:'35.239.60.116', login:'mega', password:'1234abc@', encoding: 'ascii'})
        //console.log(amiio.createClient())
        /*
        const action = new amiio.Action.originate();
        action.Channel = 'PJSIP/megatrunk/sip:011930224168@35.199.98.221:5060'
        action.Context='external'
        action.Exten='011930224168'
        action.Priority=1
        action.Async=true
        action.WaitEvent=true

        amiioClient.send(action,(e,data)=>{
            if(e) throw e

            console.log(data)
        })*/


        /*const sql = `SELECT * FROM asterisk_ari WHERE active=1`;
        connect.banco.query(sql,(e,r)=>{
          if(e) throw e

            console.log(`Iniciando teste de ligacao para o nº ${numero} no ramal ${ramal}`)
            
            ari.connect(r[0].server, r[0].user, r[0].pass, (err,client)=>{
              if(err) console.log(err)
              
              console.log(`numero recebido: ${numero}`)
              console.log(`Servidor: ${r[0].server}`)
    
              const options = {
                "endpoint"       : `PJSIP/megatrunk/sip:0${numero}@35.199.98.221:5060`,
                "extension"      : `0${numero}`,
                "context"        : 'external',
                "priority"       : 1,
                "app"            : "",
                "appArgs"        : "",
                "callerid"       : `0${numero}`,//numero,
                "timeout"        : -1,                 
                //"channelId"      : '324234', 
                "otherChannelId" : ""
              }
              client.channels.originate(options,(err,result)=>{
                if(err) throw err;
                console.log({
                    "id":result.id,
                    "name":result.name,
                    "state":result.state,
                    "caller":result.caller,
                    "accountcode":result.accountcode, 
                    "dialplan":result.dialplan,
                    "creationtime":result.creationtime,
                    "language":result.language 
                  })
              })
            })
      
        })*/
        /*
    }*/

    testPlayback(){

        //Pesquisando dados do servidor no banco
        const sql = `SELECT * FROM asterisk_ari WHERE active=1`;
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            //Abrindo conexao ARI
            let timers = {}
            ari.connect(r[0].server, r[0].user, r[0].pass, (err,client)=>{
                if(err) console.log(err)

                client.on('StasisStart',(event,channel)=>{
                    let playback = client.Playback();
                    channel.play({media:'sound:hello-world'},playback,(e,newPlayback)=>{
                        if(e) throw e

                        playback.on('PlaybackFinished',(event,completePlayback)=>{
                            console.log('Audio reproduzido')
                            
                            channel.hangup((e)=>{
                                if(e) throw e

                            })

                        })
                    })
                    channel.play({media:'sound:hello-world'},playback,(e,newPlayback)=>{
                        if(e) throw e

                        playback.on('PlaybackFinished',(event,completePlayback)=>{
                            console.log('Audio reproduzido')
                            
                            channel.hangup((e)=>{
                                if(e) throw e

                            })

                        })
                    })
                })

                client.on('StasisEnd',()=>{
                    console.log('Aplicativo encerrado');
                })

                client.start('channel-state')

                
            })
        })

    }

    uraTest(){
         //Pesquisando dados do servidor no banco
         const sql = `SELECT * FROM asterisk_ari WHERE active=1`;
         connect.banco.query(sql,(e,r)=>{
             if(e) throw e
 
             //Abrindo conexao ARI
             let timers = {}
             ari.connect(r[0].server, r[0].user, r[0].pass, (err,client)=>{
                if(err) console.log(err)

                const menu = {
                    //Opções validas do menu
                    options: [1,2],
                    sounds: ['sound:press-1','sound:or','sound:press-2']
                }

                let timers = {}

                client.on('StasisStart',(event,channel)=>{
                    console.log(`Canal entrou ${channel.name} na ura de teste`)

                    channel.on('ChannelDtmfReceived', dtmfReceived)
                    
                    channel.answer((e)=>{
                        if (e) throw e

                        playIntroMenu(channel)
                    })
                })

                client.on('StasisEnd',(event,channel)=>{
                    console.log(`Canal ${channel.name} deixou a ura`)
                    channel.removeListener('ChannelDtmfReceived',dtmfReceived)
                    cancelTimeout(channel);
                })

                function dtmfReceived(event,channel){
                    cancelTimeout(channel)
                    let digit = parseInt(event.digit)

                    console.log(`Canal ${channel.name} digitou ${digit}`)

                    let valid = ~menu.option.indexOf(digit)
                    if(valid){
                        handleDtmf(channel,digit)
                    }else{
                        console.log(`Canal ${channel.name} escolheu uma opção inválida`)
                    }

                    channel.play({media:'sound:option-is-invalid'},(e,playback)=>{
                        if(e) throw e

                        playIntroMenu(channel)
                    })
                }

                function playIntroMenu(channel){
                    let state = {
                        currentSound: menu.sounds[0],
                        currentPlayback: undefined,
                        done: false
                    }

                    channel.on('ChannelDtmfReceived',cancelMenu)
                    channel.on('StasisEnd',cancelMenu)
                    queueUpSound();

                   
                }

                function cancelMenu(){
                    state.done = true
                    if(state.currentPlayback){
                        state.currentPlayback.stop((e)=>{
                            if(e) throw e
                        })
                    }

                    channel.removeListener('ChannelDtmfReceived',cancelMenu)
                    channel.removeListener('StasisEnd', cancelMenu)
                }
                
                function queueUpSound(){
                    if(!state.done){
                        if(!state.currentSound){
                            let timer = setTimeout(stillThere,10*1000)
                            timers[channel.id]=timer
                        }else{
                            let playback = client.Playback()
                            state.currentPlayback = playback

                            channel.play({media: state.currentSound},playback,(e)=>{
                                if(e) throw e
                            })

                            playback.once('PlaybackFinished',(event,channel)=>{
                                queueUpSound();
                            })

                            let nextSoundIndex = menu.sounds.indexOf(state,currentSound)+1
                            state.currentSound = menu.sounds[nextSoundIndex]
                        }
                    }
                }

                function stillThere(){
                    console.log(`Canal ${channel.name} parado aguardando...`)
                    
                    channel.play({media: 'sound:are-you-still-there'},(e)=>{
                        if(e) throw e

                        playIntroMenu(channel);
                    })
                }

                function cancelTimeout(channel){
                    let timer = timers[channel.id]

                    if(timer){
                        clearTimeout(timer)
                        delete timers[channel.id]
                    }
                }

                function handleDtmf(channel,digit){
                    let parts = ['sound:you-entered',util.format('digits:%s',digit)]
                    let done = 0

                    let playback = client.Playback()
                    channel.play({media: 'sound:you-entered'}, playback,(e)=>{
                        if(e) throw e

                        channel.play({media: util.format('digits:%s',digit)}, (e)=>{
                            if(e) throw e

                            playIntroMenu(channel)
                        })
                    })
                }

                client.start('channel-state')

            })
        })
    }


    /*

    // handler for StasisStart event
    stasisStart_test(event, channel) {
       
        let playback = client.Playback();
        channel.play({media: 'tone:ring;tonezone=fr'},playback,(err,newPlayback)=>{
            if (err) throw err;

            setTimeout(()=>{answer}, 8000);
        })

        function answer() {
            console.log(util.format('Answering channel %s', channel.name));
            playback.stop((err) =>{
              if (err) throw err;
            });
            channel.answer((err) =>{
              if (err) throw err;
            });
            // hang up the channel in 1 seconds
            setTimeout(()=>{hangup}, 1000);
        }
       
        // callback that will hangup the channel
        function hangup() {
            console.log(util.format('Hanging up channel %s', channel.name));
            channel.hangup((err)=>{
              if (err) throw err;
            });
        }

    }
   

    

    stasisEnd_test(event, channel) {
        console.log(util.format(
            'Channel %s just left our application', channel.name));
    }

    channelStateChange(event, channel) {
        console.log(util.format('Channel %s is now: %s', channel.name, channel.state));
      }

    stasisStart(event, channel) {
        console.log(util.format(
            'Channel %s has entered the application', channel.name));
        // use keys on event since channel will also contain channel operations
        Object.keys(event.channel).forEach(function(key) {
          console.log(util.format('%s: %s', key, JSON.stringify(channel[key])));
        });
      }
      
      // handler for StasisEnd event
      stasisEnd(event, channel) {
        console.log(util.format(
            'Channel %s has left the application', channel.name));
      }

    //Ramais
    criarRamal(dados,callback){
        //criar aor
        const sql = `INSERT INTO ps_aors (id,max_contacts,remove_existing) VALUES ('${dados.aor}','1','yes')`
        connect.asterisk.query(sql,(err,r)=>{
            if(err) throw err

             //criar auth
            const sql = `INSERT INTO ps_auths (id,auth_type,password,username) VALUES ('${dados.auth}','userpass','${dados.pass}','${dados.user}')`
            connect.asterisk.query(sql,(err,r)=>{
                if(err) throw err

                //criar endpoint
                const sql = `INSERT INTO ps_endpoints (id,transport,aors,auth,context,disallow,allow) VALUES ('${dados.aor}','${dados.transport}','${dados.aor}','${dados.auth}','${dados.context}','${dados.disallow}','${dados.allow}')`
                connect.asterisk.query(sql,callback)
            })
        })        
    }

    listarRamais(callback){
        const sql = `SELECT * FROM ps_auths`
        connect.asterisk.query(sql,callback)
    }

    */


}

export default new Asterisk();