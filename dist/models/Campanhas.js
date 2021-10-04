"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _Mailing = require('./Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);

class Campanhas{   
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }
    
    //######################CONFIGURAÇÃO DE CAMPANHA ATIVA################################
    
    //######################Operacoes básicas das campanhas (CRUD)######################
    //Criar Campanha
    async criarCampanha(empresa,tipo,nome,descricao){
        const sql = `INSERT INTO ${empresa}_dados.campanhas 
                                (dataCriacao,tipo,nome,descricao,estado,status) 
                         VALUES (now(),'${tipo}','${nome}','${descricao}',0,1)`
        return await this.querySync(sql)  
    }      

    //Lista campanhas
    async listarCampanhas(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas 
                      WHERE status=1 
                      ORDER BY status ASC, id ASC`
        return await this.querySync(sql)  
    }

    async infoCampanha(empresa,idCampanha){
        const sql = `SELECT c.nome, s.estado,
                            DATE_FORMAT(h.inicio,'%d/%m/%Y') AS dataInicio,
                            DATE_FORMAT(h.hora_inicio,'%H:%i') AS horaInicio,
                            DATE_FORMAT(h.termino,'%d/%m/%Y') AS dataTermino,
                            DATE_FORMAT(h.hora_termino,'%H:%i') AS horaTermino
                    FROM ${empresa}_dados.campanhas AS c 
                    JOIN ${empresa}_dados.campanhas_horarios AS h ON c.id=h.id_campanha
                    JOIN ${empresa}_dados.campanhas_status AS s ON s.idCampanha=c.id
                    WHERE c.id=${idCampanha}`
        return await this.querySync(sql)
   }

    async nomeCampanhas(empresa,idCampanha){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas 
                      WHERE id=${idCampanha}`
        const c = await this.querySync(sql)
        if(c.length==0){
            return ""
        }
        return c[0].nome
    }


    async listarCampanhasAtivas(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas 
                      WHERE estado=1 
                        AND status=1 
                   ORDER BY status ASC, id ASC`
        return await this.querySync(sql)         
    }

    //Retorna Campanha
    async dadosCampanha(empresa,idCampanha){
        const sql = `SELECT * FROM ${empresa}_dados.campanhas
                      WHERE id='${idCampanha}' AND status=1`
        return await this.querySync(sql)  
    }

    //Atualiza campanha
    async atualizaCampanha(empresa,idCampanha,valores){
        const sql = `UPDATE ${empresa}_dados.campanhas 
                        SET tipo='${valores.tipo}',
                            nome='${valores.nome}',
                            descricao='${valores.descricao}',
                            estado=${valores.estado},
                            status=${valores.status} 
                      WHERE id=${idCampanha}`

        await atualizaMembrosFilaCampanha(empresa,valores.estado,idCampanha)              


        return await this.querySync(sql)  
    }

    //Atualiza os status dos agentes da campanha de acordo com o status da mesma
    async atualizaMembrosFilaCampanha(empresa,estado,idCampanha){
        //Fila da campanha 
        const sql = `SELECT idFila, nomeFila 
                       FROM ${empresa}_dados.campanhas_filas 
                      WHERE idCampanha=${idCampanha}`
        const fila = await this.querySync(sql)
        if(fila.length==0){
            return false;
        }
        const idFila=fila[0].idFila
        const nomeFila=fila[0].nomeFila

        if(estado==1){
            //Retira pausa do asterisk dos agentes disponiveis no sistema
            sql = `SELECT ramal 
                     FROM ${empresa}_dados.agentes_filas
                    WHERE fila=${idFila}
                      AND estado=1`
            const agentes=await this.querySync(sql)
            for(let i=0; i<agentes.length; i++){
                const agente = agentes[i].ramal
                sql = `UPDATE ${_dbConnection2.default.db.asterisk}.queue_members 
                          SET paused=0 
                        WHERE membername='${agente}'`
                await this.querySync(sql)  
            }
        }else{
            //Pausa os agentes no asterisk
            sql = `UPDATE ${_dbConnection2.default.db.asterisk}.queue_members 
                      SET paused=1 
                        WHERE queue_name='${nomeFila}'`
            await this.querySync(sql) 
        }
    } 

    //Remove Campanha
    //A campanha é removida quando seu status é setado para zero


    //TABULACOES
    //######################Gestão das listas de tabulacao das campanhas######################
    //Adiciona lista de tabulacao na campanha
    async addListaTabulacaoCampanha(empresa,idCampanha,idListaTabulacao){
        //Removendo listas anteriores
        let sql = `DELETE FROM ${empresa}_dados.campanhas_listastabulacao
                         WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
        
        sql = `INSERT INTO ${empresa}_dados.campanhas_listastabulacao 
                           (idCampanha,idListaTabulacao,maxTime) 
                    VALUES (${idCampanha},${idListaTabulacao},15)`
        await this.querySync(sql)         
    }

    //Exibe listas de tabulacao da campanhas
    async listasTabulacaoCampanha(empresa,idCampanha){
        const sql = `SELECT cl.id as idListaNaCampanha, t.nome AS nomeListaTabulacao, idCampanha, idListaTabulacao, maxTime 
                       FROM ${empresa}_dados.campanhas_listastabulacao AS cl 
                  LEFT JOIN ${empresa}_dados.tabulacoes_listas AS t ON t.id=cl.idListaTabulacao
                      WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)  
    }

    async checklistaTabulacaoCampanha(empresa,idCampanha){
        const lista = await this.listasTabulacaoCampanha(empresa,idCampanha)
        if(lista.length==0){
            return false
        }
        return lista[0].idListaTabulacao
    }

    //Remove listas de tabulacao da campanha
    async removerListaTabulacaoCampanha(empresa,idListaNaCampanha){
        const sql = `DELETE FROM ${empresa}_dados.campanhas_listastabulacao 
                           WHERE id=${idListaNaCampanha}`
        await this.querySync(sql)  
    }

    async setMaxTimeStatusTab(empresa,idCampanha,time){
        const sql = `UPDATE ${empresa}_dados.campanhas_listastabulacao 
                        SET maxTime=${time} 
                      WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)  
    }

    async getMaxTimeStatusTab(empresa,idCampanha){
        const sql = `SELECT maxTime 
                       FROM ${empresa}_dados.campanhas_listastabulacao 
                       WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)  
    }

    //INTEGRAÇÕES
    //######################Gestão das integrações######################
    //Cria Integração
    async criarIntegracao(empresa,dados){
        const sql = `INSERT INTO ${empresa}_dados.campanhas_integracoes_disponiveis 
                                 (url,descricao,modoAbertura)
                          VALUES ('${dados.url}','${dados.descricao}','${dados.modoAbertura}')`
        return await this.querySync(sql) 
    }

    //Listar integracao
    async listarIntegracoes(empresa){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas_integracoes_disponiveis`
        return await this.querySync(sql) 
    }

    //Atualiza Integracao
    async atualizarIntegracao(empresa,idIntegracao,dados){
        const sql = `UPDATE ${empresa}_dados.campanhas_integracoes_disponiveis 
                       SET url='${dados.url}',
                           descricao='${dados.descricao}',
                           modoAbertura='${dados.modoAbertura}' 
                     WHERE id=${idIntegracao}`
        return await this.querySync(sql) 
    }

    //Dados integracao
    async dadosIntegracao(empresa,idIntegracao){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas_integracoes_disponiveis 
                      WHERE id=${idIntegracao}`
        return await this.querySync(sql) 
    }

    //Remove Integracao
    async removerIntegracao(empresa,idIntegracao){
        let sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes_disponiveis WHERE id=${idIntegracao}`
        await this.querySync(sql) 
        
        sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes WHERE idIntegracao=${idIntegracao}`
        return await this.querySync(sql) 
        
    }

    //Selecionar integracao
    async inserirIntegracaoCampanha(empresa,dados){
        let sql = `SELECT id FROM ${empresa}_dados.campanhas_integracoes
                    WHERE idCampanha=${dados.idCampanha}`
        const rows = await this.querySync(sql) 
        if(rows.length>=1){
            return false;
        }
        sql = `INSERT INTO ${empresa}_dados.campanhas_integracoes (idCampanha,idIntegracao) 
                    VALUES (${dados.idCampanha},${dados.idIntegracao})`
        return await this.querySync(sql) 
    }

    //Listar Integracoes de uma campanhas
    async listaIntegracaoCampanha(empresa,idCampanha){
        const sql = `SELECT i.* 
                       FROM ${empresa}_dados.campanhas_integracoes AS c 
                       JOIN ${empresa}_dados.campanhas_integracoes_disponiveis AS i ON i.id=c.idIntegracao 
                      WHERE c.idCampanha=${idCampanha}`
                       return await this.querySync(sql) 
    }

    //remove integracao campannha
    async removerIntegracaoCampanha(empresa,idCampanha,idIntegracao){
        const sql = `DELETE FROM ${empresa}_dados.campanhas_integracoes 
                      WHERE idCampanha=${idCampanha}
                        AND idIntegracao=${idIntegracao}`
        return await this.querySync(sql) 
    }

    //DISCADOR
    //######################Configuração do discador da campanha######################
    //Configurar discador da campanha
    async configDiscadorCampanha(empresa,idCampanha,tipoDiscador,agressividade,ordemDiscagem,tipoDiscagem,modo_atendimento,saudacao){
        const conf = await this.verConfigDiscadorCampanha(empresa,idCampanha)
        if(conf.length ===0){
            const sql = `INSERT INTO  ${empresa}_dados.campanhas_discador 
                                     (idCampanha,tipo_discador,agressividade,ordem_discagem,tipo_discagem,modo_atendimento,saudacao) 
                              VALUES (${idCampanha},'${tipoDiscador}',${agressividade},'${ordemDiscagem}','${tipoDiscagem}','${modo_atendimento}','${saudacao}')`
            return await this.querySync(sql) 
        }else{
            const sql = `UPDATE ${empresa}_dados.campanhas_discador 
                            SET tipo_discador='${tipoDiscador}',
                                agressividade=${agressividade},
                                ordem_discagem='${ordemDiscagem}',
                                tipo_discagem='${tipoDiscagem}',
                                modo_atendimento='${modo_atendimento}',
                                saudacao='${saudacao}'
                          WHERE idCampanha = ${idCampanha}`
            return await this.querySync(sql)      
        }
    }
    //Ver configuracoes do discador
    async verConfigDiscadorCampanha(empresa,idCampanha){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas_discador 
                      WHERE idCampanha = ${idCampanha}`
        return await this.querySync(sql)   
    }

    //FILAS
    //Listar filas da campanha
    async listarFilasCampanha(empresa,idCampanha){
        const sql = `SELECT idFila, nomeFila
                       FROM ${empresa}_dados.campanhas_filas 
                      WHERE idCampanha='${idCampanha}'`
        return await this.querySync(sql)   
    }    
    //Incluir fila a campanhas
    async addFila(empresa,idCampanha,idFila,apelido,nomeFila){
        let sql = `DELETE FROM ${empresa}_dados.campanhas_filas 
                    WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)  
        sql = `INSERT INTO ${empresa}_dados.campanhas_filas 
                          (idCampanha,idFila,nomeFila,apelido) 
                   VALUES (${idCampanha},${idFila},'${nomeFila}','${apelido}')`
        return await this.querySync(sql)   
    }

    //Remove uma determinada fila da campanha
    async removerFilaCampanha(empresa,idCampanha,idFila){
        const sql = `DELETE FROM ${empresa}_dados.campanhas_filas 
                      WHERE idCampanha=${idCampanha} AND idFila='${idFila}'`
        return await this.querySync(sql)   
    }    

    //MAILING
    //ADICIONA O MAILING A UMA CAMPANHA
    async addMailingCampanha(empresa,idCampanha,idMailing){
        const infoMailing = await _Mailing2.default.infoMailing(empresa,idMailing)
        const tabelaDados = infoMailing[0].tabela_dados
        const tabelaNumeros = infoMailing[0].tabela_numeros
        //verifica se mailing ja existem na campanha
        let sql = `SELECT id 
                     FROM ${empresa}_dados.campanhas_mailing 
                     WHERE idCampanha=${idCampanha} 
                       AND idMailing=${idMailing}`
        const r = await this.querySync(sql)
        if(r.length==1){
            return false
        }

        
        //Inserindo coluna da campanha na tabela de numeros
        sql = `ALTER TABLE ${empresa}_mailings.${tabelaNumeros} 
               ADD COLUMN campanha_${idCampanha} TINYINT NULL DEFAULT '1' AFTER produtivo`
        await this.querySync(sql)
        //Atualiza os registros como disponíveis (1)
        //sql = `UPDATE mailings.${tabelaNumeros} SET campanha_${idCampanha}=1`
        //await this.querySync(sql)
        
        //Inserindo informacao do id do mailing na campanha 
        sql = `INSERT INTO ${empresa}_dados.campanhas_mailing 
                           (idCampanha,idMailing) 
                    VALUES ('${idCampanha}','${idMailing}')`
        await this.querySync(sql)
        //Inserindo campos do mailing
        sql = `SELECT * 
                 FROM ${empresa}_dados.mailing_tipo_campo 
                WHERE idMailing=${idMailing}`
        const campos =  await this.querySync(sql)
        sql = `INSERT INTO ${empresa}_dados.campanhas_campos_tela_agente 
                           (idCampanha,idMailing,tabela,idCampo,ordem) 
                    VALUES ` 
            for(let i=0; i<campos.length; i++){
                sql += `(${idCampanha},${idMailing},'${tabelaDados}',${campos[i].id},${i})`
                if((i+1)<campos.length){ sql +=', '}            
            }
        //console.log(sql)
        await this.querySync(sql)
        return true
    }

    //Lista os mailings adicionados em uma campanha
    async listarMailingCampanha(empresa,idCampanha){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas_mailing 
                      WHERE idCampanha=${idCampanha}
                      LIMIT 1`
        return await this.querySync(sql)
    }

    //Lista Mailings das campanhas ativas
    async listarMailingCampanhasAtivas(empresa){
        const sql = `SELECT m.id, m.nome, m.totalReg
                       FROM ${empresa}_dados.mailings AS m 
                       JOIN ${empresa}_dados.campanhas_mailing AS cm ON m.id=cm.idMailing
                       JOIN ${empresa}_mailings.campanhas_tabulacao_mailing AS c ON c.id=cm.idCampanha
                   ORDER BY m.id DESC
                      LIMIT 10;`
        return await this.querySync(sql)
    }

    //Remove o mailing de uma campanha
    async removeMailingCampanha(empresa,idCampanha){
        const infoMailing = await this.infoMailingCampanha(empresa,idCampanha)

        //Recuperando o id da campanha
        let sql = `SELECT idCampanha 
                     FROM ${empresa}_dados.campanhas_mailing 
                    WHERE idCampanha=${idCampanha}`
        const r = await this.querySync(sql)
        if(r.length==0){
            return false
        }
        //Removendo coluna da campanha no mailing
        sql = `ALTER TABLE ${empresa}_mailings.${infoMailing[0].tabela_numeros} 
                DROP COLUMN campanha_${idCampanha}`
        await this.querySync(sql)
      
        //Removendo informacao do mailing da campanha
        sql = `DELETE FROM ${empresa}_dados.campanhas_mailing 
                WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
        //Removendo filtros do mailing na campanha
        sql = `DELETE FROM ${empresa}_dados.campanhas_mailing_filtros 
                     WHERE idCampanha=${idCampanha}`
        await this.querySync(sql)
        //removendo campos do mailing na campanha
        sql = `DELETE FROM ${empresa}_dados.campanhas_campos_tela_agente 
                WHERE idCampanha=${idCampanha}` 
        await this.querySync(sql)
        return true
    }

    //FILTROS DE DISCAGEM ##################################################################################
    //Aplica/remove um filtro de discagem
    async filtrarRegistrosCampanha(empresa,parametros){     
        const idCampanha = parametros.idCampanha;
        const infoMailing = await this.infoMailingCampanha(empresa,idCampanha)//informacoes do mailing
        
        const idMailing = infoMailing[0].id;
        const tabelaNumeros = infoMailing[0].tabela_numeros;
        const tipo = parametros.tipo;
        const valor = parametros.valor
        const regiao = parametros.regiao 

        
        if(infoMailing.length==0){
            //console.log('Mailing nao encontrado')
            return false
        }
        const checkFilter = await this.checkFilter(empresa,idCampanha,idMailing,tipo,valor,regiao)//Verificando se ja existe filtro aplicado
        
        //verifica se filtro ja esta aplicado
        if(checkFilter===true){
            //console.log('checkFilter true')
            let sql=""
            if(regiao==""){//remo
                //console.log(`Removendo filtro ${tipo}=${valor}`)
                sql=`DELETE FROM ${empresa}_dados.campanhas_mailing_filtros 
                     WHERE idCampanha=${idCampanha}
                       AND idMailing=${idMailing}
                       AND tipo='${tipo}'
                       AND valor='${valor}'`
            }else{
                //console.log(`Removendo filtros ${tipo}=${valor}`)
                sql=`DELETE FROM ${empresa}_dados.campanhas_mailing_filtros 
                           WHERE idCampanha=${idCampanha}
                             AND idMailing=${idMailing}
                             AND tipo='${tipo}'
                             AND valor='${valor}'
                             AND regiao='${regiao}'`
            }
            //console.log(`Removendo filtros sql`,sql)   
           
            await this.querySync(sql)      
            
            
            this.delFilterDial(empresa,tabelaNumeros,idCampanha,tipo,valor,regiao)
            //Listar filtros restantes
            sql = `SELECT * 
                     FROM ${empresa}_dados.campanhas_mailing_filtros 
                    WHERE idCampanha=${idCampanha} AND idMailing=${idMailing}`
            const fr = await this.querySync(sql)//Filtros Restantes
            
            if(fr.length>=1){
                for (let i = 0; i < fr.length; i++) {
                    this.addFilterDial(empresa,tabelaNumeros,idCampanha,fr[i].tipo,fr[i].valor,fr[i].regiao)
                }
            }
            
            return true
        }
        let sql=`INSERT INTO ${empresa}_dados.campanhas_mailing_filtros 
                         (idCampanha,idMailing,tipo,valor,regiao)
                  VALUES (${idCampanha},${idMailing},'${tipo}','${valor}','${regiao}')`
                  //console.log(`last sql`,sql)          
        await this.querySync(sql)
        this.addFilterDial(empresa,tabelaNumeros,idCampanha,tipo,valor,regiao)
        return true
    }


    //Retorna todas as informações de um mailing que esta atribuido em uma campanha
    async infoMailingCampanha(empresa,idCampanha){
        const sql =`SELECT m.* 
                      FROM ${empresa}_dados.mailings AS m
                      JOIN ${empresa}_dados.campanhas_mailing AS c
                        ON c.idMailing=m.id
                     WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql)
    }
    //Checa se já existe algum filtro aplicado com os parametros informados
    async checkFilter(empresa,idCampanha,idMailing,tipo,valor,regiao){
        const sql =`SELECT id 
                      FROM ${empresa}_dados.campanhas_mailing_filtros 
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
    async delFilterDial(empresa,tabela,idCampanha,tipo,valor,regiao){
        console.log(`delFilterDial ${tipo}=${valor}`)
        let filter=""
        filter+=`${tipo}='${valor}'`
        if(regiao!=0){ filter+=` AND uf='${regiao}'`}
       
        let sql = `UPDATE ${empresa}_mailings.${tabela} 
                      SET campanha_${idCampanha}=1 
                    WHERE ${filter}`       
        console.log(`delFilter sql`,sql)
        await this.querySync(sql)
        return true
    }
    //Aplica um filtro a uma tabela
    async addFilterDial(empresa,tabela,idCampanha,tipo,valor,regiao){
        console.log(`addFilterDial ${tipo}=${valor}`)
        let filter=""
        filter+=`${tipo}='${valor}'`
        if(regiao!=0){ filter+=` AND uf='${regiao}'`}       
        let sql = `UPDATE ${empresa}_mailings.${tabela} 
                      SET campanha_${idCampanha}=0 
                    WHERE ${filter}`          
        await this.querySync(sql)
        return true
    }

    //Conta o total de numeros de uma tabela pelo UF, ou DDD
    async totalNumeros(empresa,tabela,uf,ddd){
        let filter=""
        if(uf!=0){ filter += ` AND uf="${uf}"` }
        if(ddd!=undefined){ filter += ` AND ddd=${ddd}`}
        const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_mailings.${tabela}
                       WHERE valido=1 ${filter}` 
         
        const r = await this.querySync(sql)
        return r[0].total
    }
    async totalNumeros_porTipo(empresa,tabela,uf,tipo){
        let filter=""
        if(uf!=0){ filter += ` AND uf="${uf}"` }
        if(tipo!=undefined){ filter += ` AND tipo='${tipo}'`}
        const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_mailings.${tabela} 
                      WHERE valido=1 ${filter}`       
        const r = await this.querySync(sql)
        return r[0].total
    }
    //Conta o total de registros filtrados de uma tabela pelo us
    async numerosFiltrados(empresa,idMailing,tabelaNumeros,idCampanha,uf){
        let filter=""
        if(uf!=0){ filter += ` AND uf="${uf}"` }
        const sql = `SELECT COUNT(id) AS total
                       FROM ${empresa}_mailings.${tabelaNumeros}
                      WHERE valido=1 AND campanha_${idCampanha}=1 ${filter}`
        const r = await this.querySync(sql)
        return r[0].total
        
        //Verifica os filtros de uma campanha
        /*let regiao="";
        if(uf!=0){
            regiao=` AND regiao='${uf}'`
        }
        let sql = `SELECT * FROM campanhas_mailing_filtros WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ${regiao}`
        const filtros = await this.querySync(sql)      
        let numerosFiltrados = 0
        let filters=""
        for(let i=0;i<filtros.length;i++){
            let tipo=filtros[i].tipo
            let valor = filtros[i].valor
            //console.log(`[${i}] tipo`,tipo)
            let temUf=0
            if(tipo=='uf'){
             //   console.log('tem uf',tipo)
                temUf=valor
            }else{
                filters+=` AND ${tipo}='${valor}'`
            }
            if(temUf!=0){
                filters=` AND uf='${temUf}'`
            }
        }
       
        if(uf!=0){filters+=` AND uf='${uf}'`}
        
       // console.log('filters',filters)
        sql = `SELECT COUNT(id) AS numerosFiltrados
                 FROM ${connect.db.mailings}.${tabelaNumeros}
                WHERE valido=1 ${filters}`
        const numeros = await this.querySync(sql)
        return numeros[0].numerosFiltrados*/
    }
    //Retorna os DDDS de uma tabela de numeros
    async dddsMailings(empresa,tabela,uf){
        let filter=""
        if(uf!=0){ filter = `WHERE uf='${uf}'` }
        let sql = `SELECT DISTINCT ddd 
                     FROM ${empresa}_mailings.${tabela} ${filter}`
        return await this.querySync(sql)
    }
    //Checa se existe algum filtro de DDD aplicado
    async checkTypeFilter(empresa,idCampanha,tipo,valor,uf){     
        let filter  =""
         if(tipo!='uf'){
             filter=` AND regiao = "${uf}"`
         }
        const sql =`SELECT id 
                      FROM ${empresa}_dados.campanhas_mailing_filtros 
                     WHERE idCampanha=${idCampanha}
                       AND tipo='${tipo}' AND valor='${valor}'
                       ${filter}`
                     //  console.log('sql filtro',sql)
        const r = await this.querySync(sql)
        if(r.length==0){
            return false;
        }
        return true;
    }

    //CONFIGURAR TELA DO AGENTE    
     //Lista todos os campos que foram configurados do mailing
     async camposConfiguradosDisponiveis(empresa,idMailing){
        const sql = `SELECT id,campo,apelido,tipo
                       FROM ${empresa}_dados.mailing_tipo_campo 
                       WHERE idMailing='${idMailing}' AND conferido=1`
        return await this.querySync(sql)
    }
    //Verifica se o campo esta selecionado
    async campoSelecionadoTelaAgente(empresa,campo,tabela,idCampanha){
        const sql = `SELECT COUNT(id) AS total 
                       FROM ${empresa}_dados.campanhas_campos_tela_agente 
                      WHERE idCampo=${campo} AND idCampanha=${idCampanha} AND tabela='${tabela}'
                       ORDER BY ordem ASC`
        const total = await this.querySync(sql)     
        if(total[0].total===0){
            return false;
        }
        return true; 
    }
    //Adiciona campo na tela do agente
    async addCampoTelaAgente(empresa,idCampanha,tabela,idCampo){
        const sql = `INSERT INTO ${empresa}_dados.campanhas_campos_tela_agente 
                                (idCampanha,tabela,idCampo,ordem) 
                         VALUES (${idCampanha},'${tabela}',${idCampo},0)`
        return await this.querySync(sql)
    }
    async camposTelaAgente(empresa,idCampanha,tabela){
        const sql = `SELECT t.id AS idJoin, m.id, m.campo, m.apelido, m.tipo 
                      FROM ${empresa}_dados.campanhas_campos_tela_agente AS t 
                      JOIN ${empresa}_dados.mailing_tipo_campo AS m ON m.id=t.idCampo
                       WHERE t.idCampanha=${idCampanha} AND t.tabela='${tabela}'`
        return await this.querySync(sql)
    }
    //Remove campo da campanha
    async delCampoTelaAgente(empresa,idCampanha,idCampo){
        const sql = `DELETE FROM ${empresa}_dados.campanhas_campos_tela_agente 
                       WHERE idCampanha=${idCampanha} AND idCampo=${idCampo}`
        return await this.querySync(sql)
    }


    //Campos adicionados na tela do agente
    /*async camposAdicionadosNaTelaAgente(idCampanha,tabela){
        const sql = `SELECT idCampo FROM campanhas_campos_tela_agente WHERE idCampanha=${idCampanha} AND tabela='${tabela}'`
        return await this.querySync(sql)
    }*/



    

    

   

    

    

   
    
    
    
    



   
   
   
    

   

    

    //BLACKLIST

    //STATUS DE EVOLUCAO DE CAMPANHA
    async totalMailingsCampanha(empresa,idCampanha){
        const sql = `SELECT totalNumeros AS total, m.id AS idMailing
                      FROM ${empresa}_dados.mailings as m 
                      JOIN ${empresa}_dados.campanhas_mailing AS cm 
                        ON cm.idMailing=m.id 
                      WHERE cm.idCampanha=${idCampanha}`
        return await this.querySync(sql)
        
    }

    async mailingsContatadosPorCampanha(empresa,idCampanha,idMailing,status){
        const sql = `SELECT count(id) AS total 
                      FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE contatado='${status}' AND idCampanha=${idCampanha} AND idMailing=${idMailing}`
        const total_mailing= await this.querySync(sql)
        return total_mailing[0].total
    }   

   
    async mailingsContatadosPorMailingNaCampanha(empresa,idCampanha,idMailing,status){
        let queryFilter="";
        if(status==1){
            queryFilter=`AND produtivo=1`
        }else{
            queryFilter=`AND (produtivo=0 OR produtivo is null)`
        }
        const sql = `SELECT count(id) AS total 
                      FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ${queryFilter}`
        const total_mailing= await this.querySync(sql)
        return total_mailing[0].total
    }   

    async dataUltimoRegMailingNaCampanha(empresa,idCampanha,idMailing){
        const sql = `SELECT  DATE_FORMAT(data,'%d/%m/%Y') AS ultimaData
                      FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE idCampanha=${idCampanha} AND idMailing=${idMailing} ORDER BY data DESC`
        const d= await this.querySync(sql)
        if(d.length==0){
            return ""
        }
        return d[0].ultimaData
    }   

    async mailingsAnteriores(empresa,idCampanha){
        const sql = `SELECT DISTINCT idMailing 
                       FROM ${empresa}_mailings.campanhas_tabulacao_mailing 
                      WHERE idCampanha=${idCampanha}`
        return await this.querySync(sql);
        
    }

    //AGENDAMENTO DE CAMPANHAS
    //Agenda campanha
    async agendarCampanha(empresa,idCampanha,dI,dT,hI,hT){ 
        //verifica se a campanha ja possui agendamento
        const r = await this.verAgendaCampanha(empresa,idCampanha)
        if(r.length ===0){
            const sql = `INSERT INTO ${empresa}_dados.campanhas_horarios 
                                    (id_campanha,inicio,termino,hora_inicio,hora_termino) 
                             VALUES (${idCampanha},'${dI}','${dT}','${hI}','${hT}')`
            return await this.querySync(sql)
        }else{
            const sql = `UPDATE ${empresa}_dados.campanhas_horarios 
                            SET inicio='${dI}',termino='${dT}',hora_inicio='${hI}',hora_termino='${hT}' 
                          WHERE id_campanha='${idCampanha}'`
            return await this.querySync(sql)
        }
    }
    //Ver Agendamento da campanha
    async verAgendaCampanha(empresa,idCampanha){
        const sql = `SELECT * 
                       FROM ${empresa}_dados.campanhas_horarios 
                      WHERE id_campanha=${idCampanha}`
        return await this.querySync(sql)
    }
   
    //#########  F I L A S  ############
    async novaFila(empresa,nomeFila,apelido,descricao){
        let sql = `SELECT id 
                     FROM ${empresa}_dados.filas 
                    WHERE nome='${nomeFila}'`
        const r = await this.querySync(sql)
        if(r.length>=1){
            return false
        }
        sql = `INSERT INTO ${empresa}_dados.filas (nome,apelido,descricao) VALUES('${nomeFila}','${apelido}','${descricao}')`
        await this.querySync(sql)
        return true
    }

    async listarFilas(empresa){
        const sql = `SELECT id,apelido as nome, descricao  FROM ${empresa}_dados.filas ORDER BY id DESC`
        return await this.querySync(sql)
    } 

    async dadosFila(empresa,idFila){
        const sql = `SELECT id,apelido as nome, nome as nomeFila, descricao 
                       FROM ${empresa}_dados.filas 
                      WHERE id=${idFila}`
        return await this.querySync(sql)
    } 

    async nomeFila(empresa,idFila){
        const sql = `SELECT nome 
                       FROM ${empresa}_dados.filas 
                      WHERE id=${idFila}`
        const n = await this.querySync(sql)
        return n[0].nome
    } 

    async editarFila(empresa,idFila,dados){
        const sql = `UPDATE ${empresa}_dados.filas 
                        SET apelido='${dados.name}',
                            descricao='${dados.description}' 
                        WHERE id='${idFila}'`
        return await this.querySync(sql)
    }

    async removerFila(empresa,idFila){
        const sql = `DELETE FROM ${empresa}_dados.filas 
                      WHERE id='${idFila}'`
        await this.querySync(sql)
        return true
    }

     


    //#########  B A S E S  ############

    



    ////////////////////OLD

    //total de campanhas que rodaram por dia
    async campanhasByDay(empresa,limit){
        const sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia 
                       FROM ${empresa}_dados.historico_atendimento 
                       GROUP BY data 
                       ORDER BY data DESC 
                       LIMIT ${limit}`
        return await this.querySync(sql)
    }
    
    //Total de campanhas ativas
    async totalCampanhasAtivas(empresa){
        const sql = `SELECT COUNT(id) as total 
                       FROM ${empresa}_dados.campanhas
                      WHERE status=1 AND estado=1`
        return await this.querySync(sql)
    }
    
    async campanhasAtivas(empresa){
       
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo 
                       FROM ${empresa}_dados.campanhas AS c 
                  LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha
                      WHERE c.status=1 AND c.estado=1 AND s.estado=1`
        return await this.querySync(sql)
    }

    //Total de campanhas em pausa
    async campanhasPausadas(empresa){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo
                       FROM ${empresa}_dados.campanhas AS c 
                  LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha 
                      WHERE c.status=1 AND c.estado=2 OR c.estado=1 AND s.estado=2`
        return await this.querySync(sql)
    }

    //Total de campanhas paradas
    async campanhasParadas(empresa){
        const sql = `SELECT c.id as campanha, c.nome, c.descricao, TIMEDIFF (NOW(),DATA) AS tempo 
                       FROM ${empresa}_dados.campanhas AS c 
                  LEFT JOIN ${empresa}_dados.campanhas_status AS s ON c.id = s.idCampanha 
                      WHERE c.status=1 AND c.estado=3 OR c.estado=1 AND s.estado=3`
        return await this.querySync(sql)
    }
        

    

   
    
    //######################Operacoes de agendamento das campanhas######################
    

    

    //######################Gestão das integrações das campanhas######################

    //######################Setup do discador das campanhas######################
    

    //######################Configuração das filas das campanhas######################
    membrosNaFila(idFila,callback){
        const sql = `SELECT ramal FROM agentes_filas WHERE fila=${idFila} ORDER BY ordem ASC;`
        _dbConnection2.default.banco.query(sql,callback)
    }

      
   

    

    totalAgentesDisponiveis(callback){
        const sql = `SELECT distinct ramal FROM agentes_filas AS a 
                       JOIN users AS u ON u.id=a.ramal WHERE u.logado=1 AND u.status=1 AND a.estado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }
    
    

    



    

    

    
    //Status dos agentes das campanhas
    async agentesFalando(empresa){
        //Estado 3 = Falando
        const sql = `SELECT DISTINCT ramal AS agentes 
                       FROM ${empresa}_dados.campanhas_chamadas_simultaneas
                      WHERE falando=1`
        return this.querySync(sql)
    }

    atualizaEstadoAgente(ramal,estado,idPausa,callback){
        const sql = `UPDATE agentes_filas SET estado=${estado}, idpausa=${idPausa} WHERE ramal=${ramal}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            const sql = `UPDATE user_ramal SET estado=${estado} WHERE ramal=${ramal}`
            _dbConnection2.default.banco.query(sql,(e,r)=>{
                if(e) throw e

                if(estado==2){
                    const sql = `UPDATE queue_members SET paused=1 WHERE membername=${ramal}`
                    _dbConnection2.default.asterisk.query(sql,callback)
                }else{
                    const sql = `UPDATE queue_members SET paused=0 WHERE membername=${ramal}`
                    _dbConnection2.default.asterisk.query(sql,callback)
                }
            })
        })
    }

    async agentesEmPausa(empresa){
        //Estado 2 = Em Pausa
        const sql = `SELECT DISTINCT a.ramal AS agentes 
                       FROM ${empresa}_dados.agentes_filas AS a 
                       JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                       JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                       WHERE c.estado=1 AND c.status=1 AND a.estado=2`
        return await this.querySync(sql)
    }

    async agentesDisponiveis(empresa){
        //Estado 1 = Disponível
        //Estado 0 = Deslogado
        const sql = `SELECT DISTINCT a.ramal AS agentes 
                       FROM ${empresa}_dados.agentes_filas AS a 
                       JOIN ${empresa}_dados.campanhas_filas AS f ON a.fila = f.id 
                       JOIN ${empresa}_dados.campanhas AS c ON c.id=f.idCampanha 
                       WHERE c.estado=1 AND c.status=1 AND a.estado=1`
                       
        return await this.querySync(sql)
    }



















    chamadasTravadas(callback){
        const sql = `SELECT * FROM campanhas_chamadas_simultaneas WHERE tratado is null`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Atualiza um registro como disponivel na tabulacao mailing
    liberaRegisto(idCampanha,idMailing,idRegistro,callback){ 
     const sql = `UPDATE campanhas_tabulacao_mailing SET estado=1, desc_estado='Disponível' 
                   WHERE idCampanha=${idCampanha},idMailing=${idMailing},idRegistro=${idRegistro}`
     _dbConnection2.default.mailings.query(sql,callback)
    }

    removeChamadaSimultanea(idChamadaSimultanea,callback){
        const sql = `DELETE FROM campanhas_chamadas_simultaneas WHERE id=${idChamadaSimultanea}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //######################Gestão do Mailing das Campanhas ######################
    

    async campanhaDoMailing(empresa,idMailing){
        const sql = `SELECT m.idCampanha,c.nome 
                       FROM ${empresa}_dados.campanhas_mailing AS m 
                       JOIN ${empresa}_dados.campanhas AS c ON m.idCampanha=c.id
                      WHERE idMailing=${idMailing} AND c.status=1
                      LIMIT 1`
        return await this.querySync(sql)
    }

    mailingConfigurado(empresa,idMailing,callback){
        const sql = `SELECT tabela_dados 
                       FROM ${empresa}_dados.mailings 
                       WHERE id=${idMailing} AND configurado=1`
        _dbConnection2.default.banco.query(sql,callback)
    }

    

     //Status dos Mailings das campanhas ativas
    /*mailingsNaoTrabalhados(callback){
        const sql = `SELECT count(t.id) AS nao_trabalhados FROM campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado is null AND c.estado=1 AND c.status=1`
        connect.banco.query(sql,callback)
    }*/
    async totalMailings(empresa){
        const sql = `SELECT SUM(totalReg) AS total 
                       FROM ${empresa}_dados.mailings as m 
                       JOIN ${empresa}_dados.campanhas_mailing AS cm ON cm.idMailing=m.id 
                       JOIN ${empresa}_dados.campanhas AS c ON c.id=cm.idCampanha 
                      WHERE c.estado=1 AND c.status=1`
        return await this.querySync(sql)
    }

    async totalRegistrosCampanha(empresa,idCampanha){
        const sql = `SELECT SUM(totalReg) AS total 
                       FROM ${empresa}_dados.mailings as m 
                       JOIN ${empresa}_dados.campanhas_mailing AS cm ON cm.idMailing=m.id 
                       JOIN ${empresa}_dados.campanhas AS c ON c.id=cm.idCampanha 
                      WHERE c.id=${idCampanha}`
        return await this.querySync(sql)
    }   

    async mailingsContatados(empresa){
        const sql = `SELECT count(t.id) AS contatados 
                       FROM ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                       JOIN ${empresa}_dados.campanhas AS c ON c.id=t.idCampanha 
                       WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
        return await this.querySync(sql)
    }

    async mailingsNaoContatados(empresa){
        const sql = `SELECT count(t.id) AS nao_contatados 
                       FROM ${empresa}_mailings.campanhas_tabulacao_mailing AS t 
                       JOIN ${empresa}_dados.campanhas AS c 
                         ON c.id=t.idCampanha 
                      WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
        return await this.querySync(sql)
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


    
    
/*********************************
    
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
        const sql = `SELECT m.id FROM campanhas_mailing AS cm 
                      JOIN mailings AS m ON m.id=cm.idMailing 
                      WHERE cm.idCampanha=${idCampanha} AND m.configurado=1`
        connect.banco.query(sql,callback)
    }

    //Verifica se a campanha possui Agendamento
    agendamentoCampanha(idCampanha,callback){
        const sql = `SELECT id FROM campanhas_horarios WHERE id_campanha='${idCampanha}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se hoje esta dentro da data de agendamento de uma campanha
    dataCampanha(idCampanha,hoje,callback){
        const sql = `SELECT id FROM campanhas_horarios 
                      WHERE id_campanha = '${idCampanha}' AND inicio <= '${hoje}' AND termino >='${hoje}'`;
        connect.banco.query(sql,callback)
    }

    //Verifica se agora esta dentro do horário de agendamento de uma campanha
    horarioCampanha(idCampanha,hora,callback){
        const sql = `SELECT id 
                       FROM campanhas_horarios 
                       WHERE id_campanha = '${idCampanha}' AND hora_inicio <= '${hora}' AND hora_termino >='${hora}'`;
        connect.banco.query(sql,callback)
    }*/

   
}
exports. default = new Campanhas();