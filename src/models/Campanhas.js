import connect from '../Config/dbConnection';
import Mailing from './Mailing';

class Campanhas{   
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }
    
    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    
    //######################Operacoes básicas das campanhas (CRUD)######################
    //Criar Campanha
    criarCampanha(tipo,nome,descricao,callback){
        const sql = `INSERT INTO campanhas (dataCriacao,tipo,nome,descricao,estado,status) VALUES (now(),'${tipo}','${nome}','${descricao}',0,1)`
        connect.banco.query(sql,callback)
    }      

    //Lista campanhas
    listarCampanhas(callback){
        const sql = "SELECT * FROM campanhas WHERE status=1 ORDER BY status ASC, id ASC"
        connect.banco.query(sql,callback)
    }
    listarCampanhasAtivas(callback){
        const sql = "SELECT * FROM campanhas WHERE estado=1 AND status=1 ORDER BY status ASC, id ASC"
        connect.banco.query(sql,callback)        
    }

    //Retorna Campanha
    dadosCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas WHERE id='${idCampanha}' AND status=1`
        connect.banco.query(sql,callback)
    }

    //Atualiza campanha
    atualizaCampanha(idCampanha,valores,callback){
        const sql = 'UPDATE campanhas SET ? WHERE id=?'
        connect.banco.query(sql,[valores,idCampanha],callback)
    }
    
    //Remove Campanha
    //A campanha é removida quando seu status é setado para zero


    //TABULACOES
    //######################Gestão das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    async addListaTabulacaoCampanha(idCampanha,idListaTabulacao,callback){
        //Removendo listas anteriores
        let sql = `DELETE FROM campanhas_listastabulacao WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
        
        sql = `INSERT INTO campanhas_listastabulacao (idCampanha,idListaTabulacao) VALUES (${idCampanha},${idListaTabulacao})`
        await this.querySync(sql)         
    }

    //Exibe listas de tabulacao da campanhas
    async listasTabulacaoCampanha(idCampanha){
        const sql = `SELECT id as idListaNaCampanha, idCampanha, idListaTabulacao FROM campanhas_listastabulacao WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)  
    }

    //Remove listas de tabulacao da campanha
    async removerListaTabulacaoCampanha(idListaNaCampanha){
        const sql = `DELETE FROM campanhas_listastabulacao WHERE id=${idListaNaCampanha}`
        await this.querySync(sql)  
    }

    //INTEGRAÇÕES
    //######################Gestão das integrações######################
    //Cria Integração
    criarIntegracao(dados,callback){
        const sql = `INSERT INTO campanhas_integracoes_disponiveis (url,descricao,modoAbertura) VALUES ('${dados.url}','${dados.descricao}','${dados.modoAbertura}')`
        connect.banco.query(sql,callback)
    }

    //Listar integracao
    listarIntegracoes(callback){
        const sql = `SELECT * FROM campanhas_integracoes_disponiveis`
        connect.banco.query(sql,callback)
    }

    //Atualiza Integracao
    atualizarIntegracao(idIntegracao,dados,callback){
        const sql = `UPDATE campanhas_integracoes_disponiveis SET url='${dados.url}',descricao='${dados.descricao}',modoAbertura='${dados.modoAbertura}' WHERE id=${idIntegracao}`
        connect.banco.query(sql,callback)
    }

    //Dados integracao
    dadosIntegracao(idIntegracao,callback){
        const sql = `SELECT * FROM  campanhas_integracoes_disponiveis WHERE id=${idIntegracao}`
        connect.banco.query(sql,callback)
    }

    //Remove Integracao
    removerIntegracao(idIntegracao,callback){
        const sql = `DELETE FROM campanhas_integracoes_disponiveis WHERE id=${idIntegracao}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `DELETE FROM campanhas_integracoes WHERE idIntegracao=${idIntegracao}`
            connect.banco.query(sql,callback)
        })
    }

    //Selecionar integracao
    inserirIntegracaoCampanha(dados,callback){
        const sql = `SELECT id FROM campanhas_integracoes WHERE idCampanha=${dados.idCampanha}`
        connect.banco.query(sql,(e,rows)=>{
            if(e) throw e

            if(rows.length>=1){
                callback(false,false)
                return false;
            }
            const sql = `INSERT INTO campanhas_integracoes (idCampanha,idIntegracao) VALUES (${dados.idCampanha},${dados.idIntegracao})`
            connect.banco.query(sql,callback)
        })        
    }

    //Listar Integracoes de uma campanhas
    listaIntegracaoCampanha(idCampanha,callback){
        const sql = `SELECT i.* FROM  campanhas_integracoes AS c JOIN campanhas_integracoes_disponiveis AS i ON i.id=c.idIntegracao WHERE c.idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    //remove integracao campannha
    removerIntegracaoCampanha(idCampanha,idIntegracao,callback){
        const sql = `DELETE FROM campanhas_integracoes WHERE idCampanha=${idCampanha} AND idIntegracao=${idIntegracao}`
        connect.banco.query(sql,callback)
    }

    //DISCADOR
    //######################Configuração do discador da campanha######################
    //Configurar discador da campanha
    configDiscadorCampanha(idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,tentativas,modo_atendimento,callback){
        this.verConfigDiscadorCampanha(idCampanha,(e,r)=>{
            if(e) throw e

            if(r.length ===0){
                const sql = `INSERT INTO campanhas_discador (idCampanha,tipo_discador,agressividade,ordem_discagem,tipo_discagem,tentativas,modo_atendimento) VALUES (${idCampanha},'${tipoDiscador}',${agressividade},'${ordemDiscagem}','${tipoDiscagem}',${tentativas},'${modo_atendimento}')`
                connect.banco.query(sql,callback)
            }else{
                const sql = `UPDATE campanhas_discador SET tipo_discador='${tipoDiscador}',agressividade=${agressividade},ordem_discagem='${ordemDiscagem}',tipo_discagem='${tipoDiscagem}',tentativas=${tentativas},modo_atendimento='${modo_atendimento}' WHERE idCampanha = ${idCampanha}`
                connect.banco.query(sql,callback)     
            }
        })       
    }
    //Ver configuracoes do discador
    verConfigDiscadorCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_discador WHERE idCampanha = ${idCampanha}`
        connect.banco.query(sql,callback)
    }

    //FILAS
    //Listar filas da campanha
    listarFilasCampanha(idCampanha,callback){
        const sql = `SELECT idFila, nomeFila FROM campanhas_filas WHERE idCampanha='${idCampanha}'`
        connect.banco.query(sql,callback)
    }    
    //Incluir fila a campanhas
    addFila(idCampanha,idFila,nomeFila,callback){
        const sql = `DELETE FROM campanhas_filas WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `INSERT INTO campanhas_filas (idCampanha,idFila,nomeFila) VALUES (${idCampanha},${idFila},'${nomeFila}')`
            connect.banco.query(sql,callback)
        })
    }

    //Remove uma determinada fila da campanha
    removerFilaCampanha(idCampanha,idFila,callback){
        const sql = `DELETE FROM campanhas_filas WHERE idCampanha=${idCampanha} AND idFila='${idFila}'`
        connect.banco.query(sql,callback)
    }    

    //MAILING
    //ADICIONA O MAILING A UMA CAMPANHA
    async addMailingCampanha(idCampanha,idMailing){
        const infoMailing = await Mailing.infoMailing(idMailing)
        const tabelaDados = infoMailing[0].tabela_dados
        const tabelaNumeros = infoMailing[0].tabela_numeros
        //verifica se mailing ja existem na campanha
        let sql = `SELECT id FROM campanhas_mailing WHERE idCampanha=${idCampanha} AND idMailing=${idMailing}`
        const r = await this.querySync(sql)
        if(r.length==1){
            return false
        }
        //Inserindo coluna da campanha na tabela de numeros
        sql = `ALTER TABLE mailings.${tabelaNumeros} 
               ADD COLUMN campanha_${idCampanha} TINYINT NULL DEFAULT NULL AFTER produtivo,
               ADD INDEX campanha_${idCampanha} (campanha_${idCampanha})`
        await this.querySync(sql)
        //Atualiza os registros como disponíveis (1)
        sql = `UPDATE mailings.${tabelaNumeros} SET campanha_${idCampanha}=1`
        await this.querySync(sql)
        //Inserindo informacao do id do mailing na campanha 
        sql = `INSERT INTO campanhas_mailing (idCampanha,idMailing) VALUES ('${idCampanha}','${idMailing}')`
        await this.querySync(sql)
        //Inserindo campos do mailing
        sql = `SELECT * FROM mailing_tipo_campo WHERE idMailing=${idMailing}`
        const campos =  await this.querySync(sql)
        sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,idMailing,tabela,idCampo,ordem) VALUES ` 
        for(let i=0; i<campos.length; i++){
            sql += `(${idCampanha},${idMailing},'${tabelaDados}',${campos[i].id},${i})`
            if((i+1)<campos.length){ sql +=', '}
            
        }
        console.log(sql)
        await this.querySync(sql)
        return true
    }

    //Lista os mailings adicionados em uma campanha
    listarMailingCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    //Remove o mailing de uma campanha
    async removeMailingCampanha(idCampanha){
        const infoMailing = await this.infoMailingCampanha(idCampanha)

        //Recuperando o id da campanha
        let sql = `SELECT idCampanha FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        const r = await this.querySync(sql)
        if(r.length==0){
            return false
        }
        //Removendo coluna da campanha no mailing
        sql = `ALTER TABLE mailings.${infoMailing[0].tabela_numeros} DROP COLUMN campanha_${idCampanha}`
        await this.querySync(sql)
        //Removendo informacao do mailing da campanha
        sql = `DELETE FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
        //Removendo filtros do mailing na campanha
        sql = `DELETE FROM campanhas_mailing_filtros WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
        //removendo campos do mailing na campanha
        sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha}` 
        await this.querySync(sql)
        return true
    }

    //FILTROS DE DISCAGEM ##################################################################################
    //Aplica/remove um filtro de discagem
    async filtrarRegistrosCampanha(parametros){     
        const idCampanha = parametros.idCampanha;
        const infoMailing = await this.infoMailingCampanha(idCampanha)//informacoes do mailing
        const idMailing = infoMailing[0].id;
        const tabelaNumeros = infoMailing[0].tabela_numeros;
        const tipo = parametros.tipo;
        const valor = parametros.valor
        const regiao = parametros.regiao 

        
        if(infoMailing.length==0){
            //console.log('Mailing nao encontrado')
            return false
        }
        const checkFilter = await this.checkFilter(idCampanha,idMailing,tipo,valor,regiao)//Verificando se ja existe filtro aplicado
        
        //verifica se filtro ja esta aplicado
        if(checkFilter===true){
            //console.log('checkFilter true')
            let sql=""
            if(regiao==""){//remo
                //console.log(`Removendo filtro ${tipo}=${valor}`)
                sql=`DELETE FROM campanhas_mailing_filtros 
                     WHERE idCampanha=${idCampanha}
                       AND idMailing=${idMailing}
                       AND tipo='${tipo}'
                       AND valor='${valor}'`
            }else{
                //console.log(`Removendo filtros ${tipo}=${valor}`)
                sql=`DELETE FROM campanhas_mailing_filtros 
                           WHERE idCampanha=${idCampanha}
                             AND idMailing=${idMailing}
                             AND tipo='${tipo}'
                             AND valor='${valor}'
                             AND regiao='${regiao}'`
            }
            //console.log(`Removendo filtros sql`,sql)   
           
            await this.querySync(sql)      
            this.delFilterDial(tabelaNumeros,idCampanha,tipo,valor,regiao)
            //Listar filtros restantes
            sql = `SELECT * FROM campanhas_mailing_filtros WHERE idCampanha=${idCampanha} AND idMailing=${idMailing}`
            const fr = await this.querySync(sql)//Filtros Restantes
            
            if(fr.length>=1){
                for (let i = 0; i < fr.length; i++) {
                    this.addFilterDial(tabelaNumeros,idCampanha,fr[i].tipo,fr[i].valor,fr[i].regiao)
                }
            }
            return true
        }
        let sql=`INSERT INTO campanhas_mailing_filtros 
                         (idCampanha,idMailing,tipo,valor,regiao)
                  VALUES (${idCampanha},${idMailing},'${tipo}','${valor}','${regiao}')`
                  //console.log(`last sql`,sql)          
        await this.querySync(sql)
        this.addFilterDial(tabelaNumeros,idCampanha,tipo,valor,regiao)
        return true
    }


    //Retorna todas as informações de um mailing que esta atribuido em uma campanha
    async infoMailingCampanha(idCampanha){
        const sql =`SELECT m.* FROM mailings AS m
                    JOIN campanhas_mailing AS c
                    ON c.idMailing=m.id
                    WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)
    }
    //Checa se já existe algum filtro aplicado com os parametros informados
    async checkFilter(idCampanha,idMailing,tipo,valor,regiao){
        const sql =`SELECT id FROM campanhas_mailing_filtros 
                     WHERE idCampanha=${idCampanha}
                       AND idMailing=${idMailing}
                       AND tipo='${tipo}'
                       AND valor='${valor}'
                       AND regiao='${regiao}'`
        const r = await this.querySync(sql)
        if(r.length==0){
            return false;
        }
        return true;
    }
    //Remove um filtro de uma tabela
    async delFilterDial(tabela,idCampanha,tipo,valor,regiao){
        console.log(`delFilterDial ${tipo}=${valor}`)
        let filter=""
        filter+=`${tipo}='${valor}'`
        if(regiao!=0){ filter+=` AND uf='${regiao}'`}
       
        let sql = `UPDATE mailings.${tabela} SET campanha_${idCampanha}=1 WHERE ${filter}`       
        console.log(`delFilter sql`,sql)
        await this.querySync(sql)
        return true
    }
    //Aplica um filtro a uma tabela
    async addFilterDial(tabela,idCampanha,tipo,valor,regiao){
        console.log(`addFilterDial ${tipo}=${valor}`)
        let filter=""
        filter+=`${tipo}='${valor}'`
        if(regiao!=0){ filter+=` AND uf='${regiao}'`}       
        let sql = `UPDATE mailings.${tabela} SET campanha_${idCampanha}=0 WHERE ${filter}`          
        await this.querySync(sql)
        return true
    }

    //Conta o total de numeros de uma tabela pelo UF, ou DDD
    async totalNumeros(tabela,uf,ddd){
        let filter=""
        if(uf!=0){ filter += ` AND uf="${uf}"` }
        if(ddd!=undefined){ filter += ` AND ddd=${ddd}`}
        const sql = `SELECT COUNT(id) AS total FROM mailings.${tabela} WHERE valido=1 ${filter}` 
        console.log('sql',sql)      
        const r = await this.querySync(sql)
        return r[0].total
    }
    async totalNumeros_porTipo(tabela,uf,tipo){
        let filter=""
        if(uf!=0){ filter += ` AND uf="${uf}"` }
        if(tipo!=undefined){ filter += ` AND tipo='${tipo}'`}
        const sql = `SELECT COUNT(id) AS total FROM mailings.${tabela} WHERE valido=1 ${filter}`       
        const r = await this.querySync(sql)
        return r[0].total
    }
    //Conta o total de registros filtrados de uma tabela pelo us
    async numerosFiltrados(tabela,idCampanha,uf){
        let filter=""
        if(uf!=0){ filter += ` AND uf="${uf}"` }
        const sql = `SELECT COUNT(id) AS total FROM mailings.${tabela} WHERE valido=1 AND campanha_${idCampanha}=1 ${filter}`
        const r = await this.querySync(sql)
        return r[0].total
    }
    //Retorna os DDDS de uma tabela de numeros
    async dddsMailings(tabela,uf){
        let filter=""
        if(uf!=0){ filter = `WHERE uf='${uf}'` }
        let sql = `SELECT DISTINCT ddd FROM mailings.${tabela} ${filter}`
        return await this.querySync(sql)
    }
    //Checa se existe algum filtro de DDD aplicado
    async checkTypeFilter(idCampanha,tipo,valor,uf){     
        let filter  =""
         if(tipo!='uf'){
             filter=` AND regiao = "${uf}"`
         }
        const sql =`SELECT id FROM campanhas_mailing_filtros 
                     WHERE idCampanha=${idCampanha}
                       AND tipo='${tipo}' AND valor='${valor}'
                       ${filter}`
                       console.log('sql filtro',sql)
        const r = await this.querySync(sql)
        if(r.length==0){
            return false;
        }
        return true;
    }

    //CONFIGURAR TELA DO AGENTE    
     //Lista todos os campos que foram configurados do mailing
     async camposConfiguradosDisponiveis(idMailing){
        const sql = `SELECT id,campo,apelido,tipo FROM mailing_tipo_campo WHERE idMailing='${idMailing}' AND conferido=1`
        return await this.querySync(sql)
    }
    //Verifica se o campo esta selecionado
    async campoSelecionadoTelaAgente(campo,tabela,idCampanha){
        const sql = `SELECT COUNT(id) AS total FROM campanhas_campos_tela_agente WHERE idCampo=${campo} AND idCampanha=${idCampanha} AND tabela='${tabela}' ORDER BY ordem ASC`
        const total = await this.querySync(sql)     
        if(total[0].total===0){
            return false;
        }
        return true; 
    }
    //Adiciona campo na tela do agente
    async addCampoTelaAgente(idCampanha,tabela,idCampo){
        const sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,tabela,idCampo,ordem) VALUES (${idCampanha},'${tabela}',${idCampo},0)`
        return await this.querySync(sql)
    }
    async camposTelaAgente(idCampanha,tabela){
        const sql = `SELECT t.id AS idJoin, m.id, m.campo, m.apelido, m.tipo FROM campanhas_campos_tela_agente AS t JOIN mailing_tipo_campo AS m ON m.id=t.idCampo WHERE t.idCampanha=${idCampanha} AND t.tabela='${tabela}'`
        return await this.querySync(sql)
    }
    //Remove campo da campanha
    async delCampoTelaAgente(idCampanha,idCampo){
        const sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND idCampo=${idCampo}`
        return await this.querySync(sql)
    }


    //Campos adicionados na tela do agente
    /*async camposAdicionadosNaTelaAgente(idCampanha,tabela){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}'`
        return await this.querySync(sql)
    }*/



    

    

   

    

    

   
    
    
    
    



   
   
   
    

   

    

    //BLACKLIST

    //STATUS DE EVOLUCAO DE CAMPANHA
    async totalMailingsCampanha(idCampanha){
        const sql = `SELECT SUM(totalReg) AS total FROM mailings as m JOIN campanhas_mailing AS cm ON cm.idMailing=m.id WHERE cm.idCampanha=${idCampanha}`
        const total_mailing= await this.querySync(sql)
        if(total_mailing[0].total == null){
            return 0
        }
        return parseInt(total_mailing[0].total)
    }

    async mailingsContatadosPorCampanha(idCampanha,status){
        const sql = `SELECT count(id) AS total FROM mailings.campanhas_tabulacao_mailing WHERE contatado='${status}' AND idCampanha=${idCampanha}`
        const total_mailing= await this.querySync(sql)
        return total_mailing[0].total
    }   

    //AGENDAMENTO DE CAMPANHAS
    //Agenda campanha
    agendarCampanha(idCampanha,dI,dT,hI,hT,callback){ 
        //verifica se a campanha ja possui agendamento
        this.verAgendaCampanha(idCampanha,(e,r)=>{
            if(e) throw e            

            if(r.length ===0){
                const sql = `INSERT INTO campanhas_horarios (id_campanha,inicio,termino,hora_inicio,hora_termino) VALUES (${idCampanha},'${dI}','${dT}','${hI}','${hT}')`
                connect.banco.query(sql,callback)
            }else{
                const sql = `UPDATE campanhas_horarios SET inicio='${dI}',termino='${dT}',hora_inicio='${hI}',hora_termino='${hT}' WHERE id_campanha='${idCampanha}'`
                connect.banco.query(sql,callback)
            }
        })
    }

    //Ver Agendamento da campanha
    verAgendaCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_horarios WHERE id_campanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }
   
    //#########  F I L A S  ############
    async novaFila(nomeFila,descricao){
        const sql = `INSERT INTO filas (nome,descricao) VALUES('${nomeFila}','${descricao}')`
        await this.querySync(sql)
        return true
    }

    async listarFilas(){
        const sql = `SELECT * FROM filas`
        return await this.querySync(sql)
    } 

    async dadosFila(idFila){
        const sql = `SELECT * FROM filas WHERE id=${idFila}`
        return await this.querySync(sql)
    } 

    async editarFila(idFila,dados){
        const sql = `UPDATE filas SET nome='${dados.name}',descricao='${dados.description}' WHERE id='${idFila}'`
        return await this.querySync(sql)
    }

    async removerFila(idFila){
        const sql = `DELETE FROM filas WHERE id='${idFila}'`
        await this.querySync(sql)
        return true
    }

     


    //#########  B A S E S  ############

    



    ////////////////////OLD

    //total de campanhas que rodaram por dia
    campanhasByDay(limit,callback){
        const sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia FROM historico_atendimento GROUP BY data ORDER BY data DESC LIMIT ${limit}`
        connect.banco.query(sql,callback)
    }
    
    //Total de campanhas ativas
    totalCampanhasAtivas(callback){
        const sql = `SELECT COUNT(id) as total FROM campanhas WHERE status=1 AND estado=1`
        connect.banco.query(sql,callback)
    }
    
    campanhasAtivas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado=1`
        connect.banco.query(sql,callback)
    }

    //Total de campanhas em pausa
    campanhasPausadas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=2 OR c.estado=1 AND s.estado=2`
        connect.banco.query(sql,callback)
    }

    //Total de campanhas paradas
    campanhasParadas(callback){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id = s.idCampanha WHERE c.status=1 AND c.estado=3 OR c.estado=1 AND s.estado=3`
        connect.banco.query(sql,callback)
    }
        

    

   
    
    //######################Operacoes de agendamento das campanhas######################
    

    

    //######################Gestão das integrações das campanhas######################

    //######################Setup do discador das campanhas######################
    

    //######################Configuração das filas das campanhas######################
    membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }

      
   

    

    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
        connect.banco.query(sql,callback)
    }
    
    

    



    

    

    
    //Status dos agentes das campanhas
    agentesFalando(callback){
        //Estado 3 = Falando
        const sql = `SELECT DISTINCT ramal AS agentes FROM campanhas_chamadas_simultaneas WHERE falando=3`
        connect.banco.query(sql,callback)
    }

    atualizaEstadoAgente(ramal,estado,idPausa,callback){
        const sql = `UPDATE agentes_filas SET estado=${estado}, idpausa=${idPausa} WHERE ramal=${ramal}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `UPDATE user_ramal SET estado=${estado} WHERE ramal=${ramal}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                if(estado==2){
                    const sql = `UPDATE queue_members SET paused=1 WHERE membername=${ramal}`
                    connect.asterisk.query(sql,callback)
                }else{
                    const sql = `UPDATE queue_members SET paused=0 WHERE membername=${ramal}`
                    connect.asterisk.query(sql,callback)
                }
            })
        })
    }

    agentesEmPausa(callback){
        //Estado 2 = Em Pausa
        const sql = `SELECT DISTINCT a.ramal AS agentes FROM agentes_filas AS a JOIN campanhas_filas AS f ON a.fila = f.id JOIN campanhas AS c ON c.id=f.idCampanha WHERE c.estado=1 AND c.status=1 AND a.estado=2`
        connect.banco.query(sql,callback)
    }

    agentesDisponiveis(callback){
        //Estado 1 = Disponível
        //Estado 0 = Deslogado
        const sql = `SELECT DISTINCT a.ramal AS agentes FROM agentes_filas AS a JOIN campanhas_filas AS f ON a.fila = f.id JOIN campanhas AS c ON c.id=f.idCampanha WHERE c.estado=1 AND c.status=1 AND a.estado=1`
        connect.banco.query(sql,callback)
    }

    chamadasTravadas(callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE tratado is null`
        connect.banco.query(sql,callback)
    }

    //Atualiza um registro como disponivel na tabulacao mailing
    liberaRegisto(idCampanha,idMailing,idRegistro,callback){ 
     const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Disponível' WHERE idCampanha=${idCampanha},idMailing=${idMailing},idRegistro=${idRegistro}`
     connect.mailings.query(sql,callback)
    }

    removeChamadaSimultanea(idChamadaSimultanea,callback){
        const sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamadaSimultanea}`
        connect.banco.query(sql,callback)
    }

    //######################Gestão do Mailing das Campanhas ######################
    mailingCampanha(idCampanha,callback){
        const sql = `SELECT idMailing FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        connect.banco.query(sql,callback)
    }

    mailingConfigurado(idMailing,callback){
        const sql = `SELECT tabela_dados FROM mailings WHERE id=${idMailing} AND configurado=1`
        connect.banco.query(sql,callback)
    }

    

     //Status dos Mailings das campanhas ativas
    /*mailingsNaoTrabalhados(callback){
        const sql = `SELECT count(t.id) AS nao_trabalhados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado is null AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }*/
    totalMailings(callback){
        const sql = `SELECT SUM(totalReg) AS total FROM mailings as m JOIN campanhas_mailing AS cm ON cm.idMailing=m.id JOIN campanhas AS c ON c.id=cm.idCampanha WHERE c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }

    mailingsContatados(callback){
        const sql = `SELECT count(t.id) AS contatados FROM mailings.campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }

    mailingsNaoContatados(callback){
        const sql = `SELECT count(t.id) AS nao_contatados FROM mailings.campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }

    //Status dos Mailings por campanha
    /*camposConfiguradosDisponiveis(tabela,idCampanha,callback){
        const sql = `SELECT m.id, m.campo, m.apelido, m.tipo ,t.idCampanha FROM mailing_tipo_campo AS m LEFT JOIN campanhas_campos_tela_agente AS t ON m.id = t.idCampo WHERE m.tabela='${tabela}' AND (t.idCampanha=${idCampanha} OR t.idCampanha != ${idCampanha} OR t.idCampanha is null) AND m.conferido=1`
        connect.banco.query(sql,callback)
    }
    
     //INFORMACOES DO STATUS DA CAMPANHA EM TEMPO REAL
     //Atualizacao de status das campanhas pelo discador
     atualizaStatus(idCampanha,msg,estado,callback){
        //verificando se a campanha ja possui status
        this.statusCampanha(idCampanha,(e,r)=>{
            if(e) throw e
            //console.log(`Campanha: ${idCampanha} msg: ${msg}`)
            if(r.length!=0){
                //Caso sim atualiza o mesmo
                const sql = `UPDATE campanhas_status SET data=now(), mensagem='${msg}', estado=${estado} WHERE idCampanha=${idCampanha}`
                connect.banco.query(sql,callback)
            }else{
                //Caso nao, insere o status
                const sql = `INSERT INTO campanhas_status (idCampanha,data,mensagem,estado) VALUES (${idCampanha},now(),'${msg}',${estado})`               
                connect.banco.query(sql,callback)
            }
        })        
    }


    //Campos Nao Selecionados
    camposNaoSelecionados(idCampanha,tabela,callback){
        const sql = `SELECT DISTINCT m.id AS campo FROM mailing_tipo_campo AS m LEFT OUTER JOIN campanhas_campos_tela_agente AS s ON m.id=s.idCampo WHERE m.tabela='${tabela}' AND conferido=1 AND m.id NOT IN (SELECT idCampo FROM campanhas_campos_tela_agente WHERE tabela='${tabela}' AND idCampanha=${idCampanha})`
        connect.banco.query(sql,callback) 
    }

    campoSelecionado(campo,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE tabela='${tabela}' AND idCampo='${campo}';`
        connect.banco.query(sql,callback)
    }    

    //Campos Selecionados na tela do agente
    camposSelecionados(idCampanha,tabela,callback){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}' ORDER BY ordem ASC;`
        connect.banco.query(sql,callback)
    }

    //Reordena campos disponiveis do mailing                         
    reordenaCamposMailing(idCampo,tabela,posOrigen,posDestino,callback){
        //Caso ele tenha descido
        if(posOrigen<posDestino){
            //diminui a ordem de todos que sao menores ou iguais ao destino
            const sql = `UPDATE mailings_tipo_campo campo SET ordem=ordem-1 WHERE tabela='${tabela}' AND ordem<=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE mailings_tipo_campo SET ordem=${posDestino} WHERE id=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }else{//Caso ele tenha subido
            //aumenta a ordem de todos que sao maiores ou iguais ao destino
            const sql = `UPDATE mailings_tipo_campo SET ordem=ordem+1 WHERE tabela='${tabela}' AND ordem>=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE mailings_tipo_campo SET ordem=${posDestino} WHERE id=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }
    }

    //Reordena campos selecionados da tela do agente
    reordenaCampoTelaAgente(idCampanha,tabela,idCampo,posOrigen,posDestino,callback){
        //Caso ele tenha descido
        if(posOrigen<posDestino){
            //diminui a ordem de todos que sao menores ou iguais ao destino
            const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem-1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem<=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE campanhas_campos_tela_agente SET ordem=${posDestino} WHERE idCampo=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }else{//Caso ele tenha subido
            //aumenta a ordem de todos que sao maiores ou iguais ao destino
            const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem+1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem>=${posDestino}`
            connect.banco.query(sql,(e,r)=>{
                if(e) throw e

                const sql = `UPDATE campanhas_campos_tela_agente SET ordem=${posDestino} WHERE idCampo=${idCampo}`
                connect.banco.query(sql,callback)
            })
        }
    }


    //Adicionando campo na tela do agente
    addCampoTelaAgente(idCampanha,tabela,idCampo,ordem,callback){
        const sql = `UPDATE campanhas_campos_tela_agente SET ordem=ordem+1 WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND ordem>=${ordem}`
        connect.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `INSERT INTO campanhas_campos_tela_agente (idCampanha,tabela,idCampo,ordem) VALUES (${idCampanha},'${tabela}',${idCampo},${ordem})`
            connect.banco.query(sql,callback)
        })
    }

    //Removendo campo selecionado da tela do agente
    removeCampoTelaAgente(idCampanha,tabela,idCampo,callback){
        const sql = `DELETE FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}' AND idCampo=${idCampo}`
        connect.banco.query(sql,callback)
    }
    */


    
    

    
    //######################Funções para funcionamento do discador######################
    campanhasAtivasHabilitadas(callback){
        //Estados de Campanhas
        //0 - Inativa
        //1 - Ativa
        //2 - Pausadas
        //3 - Parada

        const sql = `SELECT * FROM campanhas WHERE tipo = 'a' AND status = 1 AND estado = 1`
        connect.banco.query(sql,callback)
    }

    //Verifica se uma determinada campanha tem mailing adicionado e configurado
    mailingProntoParaDiscagem(idCampanha,callback){
        const sql = `SELECT m.id FROM campanhas_mailing AS cm JOIN mailings AS m ON m.id=cm.idMailing WHERE cm.idCampanha=${idCampanha} AND m.configurado=1`
        connect.banco.query(sql,callback)
    }

    //Verifica se a campanha possui Agendamento
    agendamentoCampanha(idCampanha,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha='${idCampanha}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    dataCampanha(idCampanha,hoje,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha = '${idCampanha}' AND inicio <= '${hoje}' AND termino >='${hoje}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se agora esta dentro do horário de agendamento de uma campanha
    horarioCampanha(idCampanha,hora,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha = '${idCampanha}' AND hora_inicio <= '${hora}' AND hora_termino >='${hora}'`;
        connect.banco.query(sql,callback)
    }

   
}
export default new Campanhas();