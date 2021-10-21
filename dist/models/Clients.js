"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);


class Clients{
  /*
    async querySync(sql,empresa){
        const hostEmp = await Clients.serversDbs(empresa)
        const connection = connect.poolConta(hostEmp)
        const promisePool =  connection.promise();
        const result = await promisePool.query(sql)
        promisePool.end();
        return result[0];       
    }
    async querySync_crmdb(sql){
      const connection = connect.poolCRM
      const promisePool =  connection.promise();
      const result = await promisePool.query(sql)
      //promisePool.end();
      return result[0];
    }

    async querySync_astdb(sql){
      const connection = connect.poolAsterisk
      const promisePool =  connection.promise();
      const result = await promisePool.query(sql)
     // promisePool.end();
      return result[0];
  }*/
    
  async querySync(sql,empresa){
    return new Promise(async(resolve,reject)=>{
        const hostEmp = await this.serversDbs(empresa)
        const conn = _dbConnection2.default.poolConta(hostEmp)
        conn.query(sql,(e,rows)=>{
            if(e) reject(e);
            resolve(rows)
        })
        conn.end()                        
    })
}

    async querySync_crmdb(sql){
      return new Promise(async(resolve,reject)=>{
          const conn = _dbConnection2.default.poolCRM
          conn.query(sql,(e,rows)=>{
              if(e) reject(e);
              resolve(rows)
          })
          
      })    
    }

    async querySync_astdb(sql){
      const connection = _dbConnection2.default.poolAsterisk
      const promisePool =  connection.promise();
      const result = await promisePool.query(sql)
      promisePool.end();
      return result[0];
  }


   

    //TRONCOS 
   async registerTrunk(conta,ip_provider,tech_prefix,type_dial,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport){
      let sql = `SELECT id FROM clients.trunks WHERE conta='${conta}'`
      const r = await this.querySync_crmdb(sql)
      if(r.length==1){
        return {"error":true,"message":`O Tronco ${conta} já existe!`}
      }
      sql = `INSERT INTO clients.trunks 
                         (conta,ip_provider,tech_prefix,type_dial,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport) 
                  VALUES ('${conta}','${ip_provider}','${tech_prefix}','${type_dial}','${contact}',${qualify_frequency},${max_contacts},'${context}','${server_ip}','${dtmf_mode}','${force_rport}','${disallow}','${allow}','${rtp_symmetric}','${rewrite_contact}','${direct_media}','${allow_subscribe}','${transport}')`
      await this.querySync_crmdb(sql)
      return {"error":false,"message":''}
   }
        
    //Criando tronco no asterisk
    async createTrunk(conta,ip_provider,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport){
        //Criando AOR 
        let sql = `INSERT INTO asterisk.ps_aors 
                              (id,contact,max_contacts,qualify_frequency) 
                       VALUES ('${conta}','${contact}',${max_contacts},${qualify_frequency})`
        const a = await this.querySync_astdb(sql)

        //Criando Identify 
        sql = 'INSERT INTO asterisk.ps_endpoint_id_ips (id,endpoint,`match`) VALUES ("'+conta+'","'+conta+'","'+ip_provider+'")'
        const i = await this.querySync_astdb(sql)

        //Criando Endpoint
        sql = `INSERT INTO asterisk.ps_endpoints 
                          (id,transport,aors,context,disallow,allow,direct_media,dtmf_mode,force_rport,rewrite_contact,rtp_symmetric,allow_subscribe,from_domain) 
                   VALUES ('${conta}','${transport}','${conta}','${context}','${disallow}','${allow}','${direct_media}','${dtmf_mode}','${force_rport}','${rewrite_contact}','${rtp_symmetric}','${allow_subscribe}','${server_ip}')`
        const e = await this.querySync_astdb(sql)

    }

    async listTrunks(){
        const sql = `SELECT * FROM clients.trunks`
        return await this.querySync_crmdb(sql)
    }

    async infoTrunk(conta){

      console.log('info trunk')
      const sql = `SELECT * FROM clients.trunks WHERE conta='${conta}'`
      return await this.querySync_crmdb(sql)
  }

    async updateRegisterTrunk(conta,ip_provider,tech_prefix,type_dial,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport){
      let sql = `UPDATE clients.trunks 
                    SET ip_provider='${ip_provider}',
                        tech_prefix='${tech_prefix}',
                        type_dial='${type_dial}',
                        contact='${contact}',
                        qualify_frequency=${qualify_frequency},
                        max_contacts=${max_contacts},
                        context='${context}',
                        server_ip='${server_ip}',
                        dtmf_mode='${dtmf_mode}',
                        force_rport='${force_rport}',
                        disallow='${disallow}',
                        allow='${allow}',
                        rtp_symmetric='${rtp_symmetric}',
                        rewrite_contact='${rewrite_contact}',
                        direct_media='${direct_media}',
                        allow_subscribe='${allow_subscribe}',
                        transport='${transport}'
                  WHERE conta='${conta}'`
      await this.querySync_crmdb(sql)

      sql = `UPDATE clients.accounts
                SET tech_prefix='${tech_prefix}',
                    type_dial='${type_dial}'
              WHERE trunk='${conta}'`
      await this.querySync_crmdb(sql)
      return true
    }

    async updateCreateTrunk(conta,ip_provider,contact,qualify_frequency,max_contacts,context,server_ip,dtmf_mode,force_rport,disallow,allow,rtp_symmetric,rewrite_contact,direct_media,allow_subscribe,transport){
      //Criando AOR 
      let sql = `UPDATE asterisk.ps_aors 
                    SET contact='${contact}',
                        max_contacts=${max_contacts},
                        qualify_frequency=${qualify_frequency} 
                  WHERE id='${conta}'`
      const a = await this.querySync_astdb(sql)

      //Criando Identify 
      sql = 'UPDATE '+_dbConnection2.default.db.asterisk+'.ps_endpoint_id_ips SET `match`="'+ip_provider+'" WHERE id="'+conta+'"'
      const i = await this.querySync_astdb(sql)

      //Criando Endpoint
      sql = `UPDATE asterisk.ps_endpoints 
                SET transport='${transport}',
                    context='${context}',
                    disallow='${disallow}',
                    allow='${allow}',
                    direct_media='${direct_media}',
                    dtmf_mode='${dtmf_mode}',
                    force_rport='${force_rport}',
                    rewrite_contact='${rewrite_contact}',
                    rtp_symmetric='${rtp_symmetric}',
                    allow_subscribe='${allow_subscribe}',
                    from_domain='${server_ip}'
              WHERE id='${conta}'`
      const e = await this.querySync_astdb(sql)
  }

  async deleteRegisterTrunk(conta){
      let sql = `DELETE FROM clients.trunks 
                  WHERE conta='${conta}'`
      await this.querySync_crmdb(sql)
      return true
  }
  async deleteTrunk(conta){
     //Removendo AOR 
      let sql = `DELETE FROM asterisk.ps_aors 
                       WHERE id='${conta}'`
      const a = await this.querySync_astdb(sql)

      //Removendo Identify 
      sql = `DELETE FROM asterisk.ps_endpoint_id_ips
                   WHERE id='${conta}'`
      const i = await this.querySync_astdb(sql)

      //Removendo Endpoint
      sql = `DELETE FROM asterisk.ps_endpoints 
                   WHERE id='${conta}'`
      const e = await this.querySync_astdb(sql)
  }

  //DBS SERVERS
  async serversDbs(prefix){
    const sql = `SELECT c.server_db,  d.ip , d.ip
                     FROM clients.accounts AS c 
                     JOIN clients.servers_db AS d ON c.server_db = d.id 
                    WHERE c.prefix = '${prefix}'`
      const r = await this.querySync_crmdb(sql)   
     
      return r[0].ip
  }
  

  //SERVERS
  async createServer(nome_dominio,ip_servidor,tipo,status){
    let sql = `SELECT id FROM clients.servers WHERE ip='${ip_servidor}'`
      const r = await this.querySync_crmdb(sql)
      if(r.length==1){
        return {"error":true,"message":`O Servidor ${ip_servidor} já existe!`}
      }
      sql = `INSERT INTO clients.servers 
                         (nome,ip,tipo,status) 
                  VALUES ('${nome_dominio}','${ip_servidor}','${tipo}','${status}')`
      await this.querySync_crmdb(sql)
      return {"error":false,"message":''}
  }

  async listServers(){
        const sql = `SELECT * FROM clients.servers`
        return await this.querySync_crmdb(sql)
  }

  async infoServer(idServer){
    const sql = `SELECT * FROM clients.servers WHERE id=${idServer}`
    return await this.querySync_crmdb(sql)
  }

  async updateServer(idServer,nome_dominio,ip_servidor,tipo,status){
    const sql = `UPDATE clients.servers
                    SET nome='${nome_dominio}',
                        ip='${ip_servidor}',
                        tipo='${tipo}',
                        status=${status}
                  WHERE id=${idServer}`
    await this.querySync_crmdb(sql)
  }
  
  async deleteServer(idServer){
    //Removendo AOR 
     let sql = `DELETE FROM clients.servers
                      WHERE id=${idServer}`
     const a = await this.querySync_crmdb(sql)
 }



 //Verifica qual eh o proximo servidor mais disponivel
    async nextServer(tipo,mega){
      let sql = `SELECT id, nome, ip
                   FROM clients.servers
                  WHERE mega='${mega}' AND tipo='${tipo}' 
                    AND status=1 AND clientes<limite
               ORDER BY clientes ASC
                  LIMIT 1`     
      const is = await this.querySync_crmdb(sql)
      const server={}
            server['id']=is[0]['id']
            server['domain']=is[0]['nome']
            server['ip']=is[0]['ip']
      return server
    }

    async nextServerDataBase(tipo,mega){
      let sql = `SELECT id 
                   FROM clients.servers_db
                  WHERE mega='${mega}' AND tipo='${tipo}' AND status=1 AND clientes<limite
                  ORDER BY clientes ASC
                  LIMIT 1;`
      const s = await this.querySync_crmdb(sql)
      if(s.length==0){
        return false
      }
      return s[0].id

    }

    async signatureContract(empresa){
      const sql = `SELECT signed_contract, fidelidade FROM clients.accounts WHERE prefix='${empresa}'`
      const r = await this.querySync_crmdb(sql)
      if(r[0].signed_contract==1){
        return {"approved":true}
      }else{
        return {"approved":false,"fidelidade":r[0].fidelidade}
      }
    }

    async acceptContract(empresa){
      
      const sql = `UPDATE clients.accounts SET signed_contract=1 WHERE prefix='${empresa}'`
      
      try{
        await this.querySync_crmdb(sql)
        return true
      }catch(error){
        console.log(error)
        return false
      }
    }

    async newAccount(mega,nomeEmpresa,prefixo,fidelidade,licenses,channelsUser,totalChannels,trunk,tech_prefix,type_dial,type_server){
        console.log('criando prefixp')
        if(await this.checkPrefix(prefixo)>0){
            return {"error":true,"message":`O prefixo '${prefixo}' já existe!`}
        }

        console.log('Verificando servidor')
        const server = await this.nextServer(type_server,mega);
        if(server==false){
          return {"error":true,"message":`Nenhum servidor disponível`}
        }

        console.log('Separando Banco de dados')
        const server_db = await this.nextServerDataBase(type_server,mega);
        if(server_db==false){
          return {"error":true,"message":`Nenhum servidor de banco de dados disponível`}
        }
        const server_id = server['id']
        const asterisk_server_ip = server['ip']
        const asterisk_domain = server['domain']
        
        console.log('Inserindo clientes')
        let sql = `INSERT INTO clients.clientes 
                               (desde,nome,status)
                        VALUES (now(),'${nomeEmpresa}',0)`
        const e = await this.querySync_crmdb(sql)
        
        const accountId = e['insertId']

        console.log('Criando account')
        sql = `INSERT INTO clients.accounts  
                                (client_number,
                                          mega,
                                          date,
                                          name,
                                        prefix,
                                    fidelidade,
                                      licenses,
                              channels_by_user,
                                total_channels,
                                         trunk,
                                   tech_prefix,
                                     type_dial,
                                     server_id,
                                     server_db,
                               asterisk_server,
                               asterisk_domain,
                                        status)
                          VALUES (${accountId},
                                     '${mega}',
                                         now(),
                              '${nomeEmpresa}',
                                  '${prefixo}',
                                 ${fidelidade},
                                   ${licenses},                                 
                               ${channelsUser},
                              ${totalChannels},
                                    '${trunk}',
                                ${tech_prefix},
                                 '${type_dial}',
                                  ${server_id},
                                  ${server_db},
                          '${asterisk_server_ip}',
                          '${asterisk_domain}',
                                             0)`
                                             console.log('SERVER DB',server_db)                                      
                                             console.log('sql',sql)   
                                              await this.querySync_crmdb(sql)
        console.log('Criando banco de dados')
        await this.createBD_dados(prefixo)
        console.log('Criando banco de mailings')
        await this.createBD_mailing(prefixo)
        console.log('inserindo dados')
        console.log(prefixo,asterisk_server_ip,asterisk_domain,accountId)
        await this.insertDados(prefixo,asterisk_server_ip,asterisk_domain,accountId)
        sql = `UPDATE clients.servers_db SET clientes=clientes+1 WHERE id=${server_db}`
        await this.querySync_crmdb(sql)
        console.log('Ativando a conta')
        sql = `UPDATE clients.clientes SET status=1 WHERE id=${accountId}`
        await this.querySync_crmdb(sql)
        sql = `UPDATE clients.accounts SET status=1 WHERE client_number=${accountId}`
        await this.querySync_crmdb(sql)

        console.log('Concluindo')

        return {"error":false,"asterisk_domain":`${asterisk_domain}`,"server_ip":`${asterisk_server_ip}`}
    }

    async createBD_dados(empresa){       
        let sql = `CREATE DATABASE IF NOT EXISTS clientes_ativos;`
        await this.querySync(sql,empresa)
        
        
        sql = `CREATE TABLE IF NOT EXISTS clientes_ativos.empresas (
                id int NOT NULL AUTO_INCREMENT,
                prefixo char(50) DEFAULT NULL,
                status int DEFAULT NULL,
                PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)
      
        sql = `CREATE DATABASE IF NOT EXISTS ${empresa}_dados;`
        await this.querySync(sql,empresa)
        
        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.agentes_filas (
          id int NOT NULL AUTO_INCREMENT,
          ramal int DEFAULT NULL,
          fila int DEFAULT NULL,
          estado int DEFAULT NULL,
          idpausa int DEFAULT NULL,
          ordem int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.agentes_pausados (
          id int NOT NULL AUTO_INCREMENT,
          data date DEFAULT NULL,
          ramal char(50) DEFAULT NULL,
          inicio time DEFAULT NULL,
          termino time DEFAULT NULL,
          idPausa int DEFAULT NULL,
          nome varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          descricao text,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.asterisk_ari (
          id int NOT NULL AUTO_INCREMENT,
          server varchar(50) DEFAULT NULL,
          user varchar(50) DEFAULT NULL,
          pass varchar(50) DEFAULT NULL,
          active tinyint DEFAULT NULL,
          debug tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)       
    
        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas (
          id int NOT NULL AUTO_INCREMENT,
          dataCriacao datetime DEFAULT NULL,
          tipo char(1) DEFAULT NULL,
          nome varchar(255) DEFAULT NULL,
          descricao text,
          estado int DEFAULT NULL,
          status int DEFAULT NULL,
          PRIMARY KEY (id),
          KEY nome (nome)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_agendamentos (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          ramal int DEFAULT NULL,
          campanha int DEFAULT NULL,
          mailing int DEFAULT NULL,
          id_numero int DEFAULT NULL,
          id_registro int DEFAULT NULL,
          numero char(50) DEFAULT NULL,
          data_retorno date DEFAULT NULL,
          hora_retorno time DEFAULT NULL,
          tratado int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_blacklists (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idBlacklist int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_campos_tela_agente (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          tabela varchar(50) DEFAULT NULL,
          idCampo int DEFAULT NULL,
          ordem int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_chamadas_simultaneas (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          ramal char(10) DEFAULT NULL,
          uniqueid varchar(150) DEFAULT NULL,
          protocolo varchar(150) DEFAULT NULL,
          tipo_ligacao varchar(10) DEFAULT NULL,
          tipo_discador varchar(12) DEFAULT NULL,
          retorno tinyint DEFAULT NULL,
          modo_atendimento varchar(6) DEFAULT NULL,
          id_campanha int DEFAULT NULL,
          id_mailing int DEFAULT NULL,
          tabela_mailing varchar(50) DEFAULT NULL,
          tabela_dados varchar(100) DEFAULT NULL,
          tabela_numeros varchar(100) DEFAULT NULL,
          id_registro int DEFAULT NULL,
          id_numero int DEFAULT NULL,
          numero char(50) DEFAULT NULL,
          fila char(50) DEFAULT NULL,
          tratado tinyint DEFAULT NULL,
          atendido tinyint DEFAULT NULL,
          na_fila tinyint DEFAULT NULL,
          falando tinyint DEFAULT NULL,
          tabulando tinyint DEFAULT NULL,
          tabulado tinyint DEFAULT NULL,
          hora_tabulacao datetime DEFAULT NULL,
          desligada tinyint DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE,
          KEY atendido (atendido) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_discador (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int NOT NULL DEFAULT '0',
          tipo_discador char(15) NOT NULL DEFAULT '0',
          agressividade int NOT NULL DEFAULT '0',
          ordem_discagem char(4) NOT NULL DEFAULT '0',
          tipo_discagem char(15) NOT NULL DEFAULT '0',
          modo_atendimento char(6) NOT NULL DEFAULT '0',
          tentativas int NOT NULL DEFAULT '0',
          saudacao varchar(50) NOT NULL DEFAULT 'laura',
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_filas (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idFila int DEFAULT NULL,
          nomeFila varchar(255) DEFAULT NULL,
          apelido varchar(255) DEFAULT NULL,
          descricao text,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_horarios (
          id int NOT NULL AUTO_INCREMENT,
          id_campanha int DEFAULT NULL,
          inicio date DEFAULT NULL,
          termino date DEFAULT NULL,
          hora_inicio time DEFAULT NULL,
          hora_termino time DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_integracoes (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idIntegracao int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_integracoes_disponiveis (
          id int NOT NULL AUTO_INCREMENT,
          url text,
          descricao text,
          modoAbertura char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_listastabulacao (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idListaTabulacao int DEFAULT NULL,
          maxTime int DEFAULT '0',
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_mailing (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_mailing_filtros (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          tipo char(50) DEFAULT NULL,
          valor char(50) DEFAULT NULL,
          regiao char(2) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_status (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          data datetime DEFAULT NULL,
          mensagem text,
          estado int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.cargos (
          id int NOT NULL AUTO_INCREMENT,
          cargo varchar(50) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.estadosAgente (
          id int NOT NULL AUTO_INCREMENT,
          cod int DEFAULT NULL,
          estado varchar(25) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)
        
        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.filas (
          id int NOT NULL AUTO_INCREMENT,
          nome varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          apelido varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          descricao text,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.historico_atendimento (
          id int NOT NULL AUTO_INCREMENT,
          data date DEFAULT NULL,
          hora time DEFAULT NULL,
          protocolo varchar(50) DEFAULT NULL,
          campanha int DEFAULT NULL,
          mailing int DEFAULT NULL,
          id_registro int DEFAULT NULL,
          id_numero int DEFAULT NULL,
          nome_registro varchar(80) DEFAULT NULL,
          agente int DEFAULT NULL,
          uniqueid varchar(32) DEFAULT NULL,
          tipo varchar(32) DEFAULT NULL,
          numero_discado varchar(20) DEFAULT NULL,
          contatado char(2) DEFAULT NULL,
          produtivo tinyint DEFAULT NULL,
          status_tabulacao int DEFAULT NULL,
          obs_tabulacao text,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.log_chamadas_simultaneas (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          idCampanha int DEFAULT NULL,
          total int DEFAULT NULL,
          conectadas int DEFAULT NULL,
          manuais int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.log_pausas (
          id int NOT NULL AUTO_INCREMENT,
          ramal char(50) DEFAULT NULL,
          idPausa int DEFAULT NULL,
          data date DEFAULT NULL,
          inicio time DEFAULT NULL,
          termino time DEFAULT NULL,
          duracao time DEFAULT NULL,
          ativa tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.mailings (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          termino_importacao datetime DEFAULT NULL,
          nome varchar(100) DEFAULT NULL,
          arquivo varchar(255) DEFAULT NULL,
          header int DEFAULT NULL,
          delimitador varchar(4) DEFAULT NULL,
          tabela_dados varchar(50) DEFAULT NULL,
          tabela_numeros varchar(50) DEFAULT NULL,
          configurado int DEFAULT NULL,
          totalReg int DEFAULT NULL,
          totalNumeros int DEFAULT NULL,
          repetidos int DEFAULT NULL,
          numerosInvalidos int DEFAULT NULL,
          pronto int DEFAULT NULL,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.mailing_tipo_campo (
          id int NOT NULL AUTO_INCREMENT,
          idMailing int NOT NULL DEFAULT '0',
          campo varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          nome_original_campo varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          apelido varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          tipo varchar(15) DEFAULT NULL,
          conferido tinyint DEFAULT NULL,
          ordem tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.pausas (
          id int NOT NULL AUTO_INCREMENT,
          idLista int DEFAULT NULL,
          nome varchar(50) DEFAULT NULL,
          descricao text,
          tipo char(10) DEFAULT NULL,
          tempo int DEFAULT NULL,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = 'CREATE TABLE IF NOT EXISTS '+empresa+'_dados.pausas_listas (id int NOT NULL AUTO_INCREMENT,nome varchar(50) DEFAULT NULL,descricao text,`default` int DEFAULT NULL,status int DEFAULT NULL,PRIMARY KEY (id)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1'
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.records (
          id int NOT NULL AUTO_INCREMENT,
          date datetime DEFAULT NULL,
          date_record varchar(8) DEFAULT NULL,
          time_record varchar(8) DEFAULT NULL,
          ramal varchar(20) DEFAULT NULL,
          uniqueid varchar(32) DEFAULT NULL,
          numero varchar(20) DEFAULT NULL,
          callfilename varchar(255) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.registro_logins (
          id int NOT NULL AUTO_INCREMENT,
          data date DEFAULT NULL,
          hora time DEFAULT NULL,
          user_id int DEFAULT NULL,
          acao varchar(50) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.report_campos (
          id int NOT NULL AUTO_INCREMENT,
          idreport int DEFAULT NULL,
          idcampo int DEFAULT NULL,
          sintetico tinyint DEFAULT NULL,
          chart char(50) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.report_campos_disponiveis (
          id int NOT NULL AUTO_INCREMENT,
          campo varchar(50) DEFAULT NULL,
          descricao text,
          sintetico tinyint DEFAULT NULL,
          charts varchar(255) DEFAULT NULL,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.report_info (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          nome varchar(50) DEFAULT NULL,
          descricao text,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.servidor_webrtc (
          id int NOT NULL AUTO_INCREMENT,
          protocolo char(5) DEFAULT NULL,
          ip char(40) DEFAULT NULL,
          porta char(6) DEFAULT NULL,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)      
    
        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tabulacoes_listas (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          nome char(50) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tabulacoes_status (
          id int NOT NULL AUTO_INCREMENT,
          idLista int DEFAULT NULL,
          tabulacao char(50) DEFAULT NULL,
          descricao text,
          tipo char(15) DEFAULT NULL,
          contatado char(1) DEFAULT NULL,
          followUp tinyint(1) DEFAULT NULL,
          removeNumero tinyint(1) DEFAULT '0',
          venda tinyint(1) DEFAULT NULL,
          ordem tinyint(1) DEFAULT NULL,
          maxTentativas int DEFAULT NULL,
          tempoRetorno time DEFAULT NULL,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_espera (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idAgente int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_fila (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          idRegistro int DEFAULT NULL,
          numero char(20) DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_ligacao (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          idRegistro int DEFAULT NULL,
          idAgente int DEFAULT NULL,
          tipoDiscador varchar(15) DEFAULT NULL,
          numero char(20) DEFAULT NULL,
          uniqueid char(25) DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_login (
          id int NOT NULL AUTO_INCREMENT,
          idAgente int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_ociosidade (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idAgente int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_pausa (
          id int NOT NULL AUTO_INCREMENT,
          idAgente int DEFAULT NULL,
          idPausa int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_tabulacao (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          idRegistro int DEFAULT NULL,
          idAgente int DEFAULT NULL,
          idTabulacao int DEFAULT NULL,
          numero char(20) DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.users (
          id int NOT NULL AUTO_INCREMENT,
          criacao datetime DEFAULT NULL,
          modificado datetime DEFAULT NULL,
          nome varchar(50) DEFAULT NULL,
          usuario varchar(50) DEFAULT NULL,
          empresa varchar(50) DEFAULT NULL,
          senha varchar(50) DEFAULT NULL,
          nivelAcesso int DEFAULT NULL,
          equipe int DEFAULT NULL,
          cargo int unsigned DEFAULT NULL,
          reset int unsigned DEFAULT NULL,
          token text,
          ultimo_acesso datetime DEFAULT NULL,
          logado int unsigned DEFAULT NULL,
          ordem int unsigned DEFAULT NULL,
          status int unsigned DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)        
    
        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.users_cargos (
          id int NOT NULL AUTO_INCREMENT,
          cargo varchar(15) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.users_equipes (
          id int NOT NULL AUTO_INCREMENT,
          supervisor int DEFAULT NULL,
          equipe varchar(50) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.users_niveis (
          id int NOT NULL AUTO_INCREMENT,
          nivel varchar(15) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)        
    
        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_dados.user_ramal (
          id int NOT NULL AUTO_INCREMENT,
          userId int DEFAULT NULL,
          ramal char(15) DEFAULT NULL,
          estado tinyint DEFAULT NULL,
          deslogado tinyint DEFAULT NULL,
          tabulando tinyint DEFAULT NULL,
          datetime_estado datetime DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;`
        await this.querySync(sql,empresa)
    }
    
    async createBD_mailing(empresa){
        let sql = `CREATE DATABASE IF NOT EXISTS ${empresa}_mailings;`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.blacklists (
                      id int NOT NULL AUTO_INCREMENT,
                      nome char(50) DEFAULT NULL,
                      descricao text,
                      padrao int DEFAULT NULL,
                      PRIMARY KEY (id) USING BTREE
               ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.blacklist_numeros (
                    id int NOT NULL AUTO_INCREMENT,
                    idLista int DEFAULT NULL,
                    dataBloqueio datetime DEFAULT NULL,
                    ddd int DEFAULT NULL,
                    numero char(15) DEFAULT NULL,
                    tipo char(15) DEFAULT NULL,
                    PRIMARY KEY (id) USING BTREE
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
                await this.querySync(sql,empresa)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.campanhas_tabulacao_mailing (
                    id int NOT NULL AUTO_INCREMENT,
                    data datetime DEFAULT NULL,
                    idCampanha int DEFAULT NULL,
                    idMailing int DEFAULT NULL,
                    idRegistro int DEFAULT NULL,
                    selecoes_registro int DEFAULT NULL,
                    idNumero int DEFAULT NULL,
                    selecoes_numero int DEFAULT NULL,
                    numeroDiscado char(15) DEFAULT NULL,
                    agente int DEFAULT NULL,
                    estado int DEFAULT NULL,
                    desc_estado char(15) DEFAULT NULL,
                    contatado char(50) DEFAULT NULL,
                    tabulacao int DEFAULT NULL,
                    max_tent_status int DEFAULT NULL,
                    max_time_retry int DEFAULT '0',
                    produtivo int DEFAULT NULL,
                    observacao text,
                    tentativas int DEFAULT NULL,
                    PRIMARY KEY (id) USING BTREE
                ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1`
        await this.querySync(sql,empresa)
    }

    async insertDados(empresa,asterisk_server,asterisk_domain,accountId){
      const firstRamal = (accountId-1000)*1000
      let sql = `INSERT INTO ${empresa}_dados.asterisk_ari 
                         (id, server, user, pass, active, debug)
                  VALUES (1, 'http://${asterisk_server}:8088 ', 'mega-user-ari', '1234abc@', 1, 0)`
      await this.querySync(sql,empresa)

      sql = `INSERT INTO ${empresa}_dados.estadosAgente 
                         (id, cod, estado) 
                  VALUES (1, 0, 'Deslogado'),
                         (2, 1, 'Disponível'),
                         (3, 2, 'Pausado'),
                         (4, 3, 'Falando'),
                         (5, 4, 'Indisponível'),
                         (6, 5, 'Tela Reg.'),
                         (7, 6, 'C. Manual'),
                         (8, 7, 'Em lig. Manual')`
      await this.querySync(sql,empresa)

      sql = `INSERT INTO ${empresa}_dados.servidor_webrtc (id, protocolo, ip, porta, status) VALUES
        (1, 'wss', '${asterisk_domain}', '8089', 1)`
        await this.querySync(sql,empresa)

        sql = `INSERT INTO ${empresa}_dados.users (id, criacao, nome, usuario, empresa, senha, nivelAcesso, equipe, cargo, reset, logado, ordem, status) VALUES
            (${firstRamal}, NOW(), 'Gestor', 'gestor@${empresa}', '${empresa}', '64ad3fb166ddb41a2ca24f1803b8b722', 4, 4, 2, 0, 0, 0, 1)`
        const u = await this.querySync(sql,empresa)
        const userId = u.insertId;
        //Cadastrando ramal
        sql = `INSERT INTO ${empresa}_dados.user_ramal 
                           (userId,ramal,estado)
                    VALUES ('${userId}','${userId}',0)`
        const r = await this.querySync(sql,empresa)
         //criando ramal no asterisk
        //AOR
        sql = `INSERT INTO asterisk.ps_aors 
                           (id,max_contacts,remove_existing) 
                    VALUES ('${userId}',1,'yes')`
        const a = await this.querySync_astdb(sql)
        //AUTH
        sql = `INSERT INTO asterisk.ps_auths
                           (id,auth_type,password,realm,username) 
                    VALUES ('${userId}','userpass','mega_${userId}@agent','asterisk','${userId}')`
        const h = await this.querySync_astdb(sql)
        //ENDPOINT
        sql = `INSERT INTO asterisk.ps_endpoints 
                           (id,transport,aors,auth,context,disallow,allow,webrtc,dtls_auto_generate_cert,direct_media,force_rport,ice_support,rewrite_contact,rtp_symmetric) 
                    VALUES ('${userId}','transport-wss','${userId}','${userId}','external','all','alaw,ulaw,opus','yes','yes','no','yes','yes','yes','yes')`
        const e = await this.querySync_astdb(sql)
        
        sql = `INSERT INTO ${empresa}_dados.users_niveis (id, nivel, descricao, status) VALUES
            (1, 'Vendedor', 'Sem Descricao', 1),
            (2, 'Supervisor', NULL, 1),
            (3, 'Gestor', NULL, 1),
            (4, 'Master', NULL, 1)`
        await this.querySync(sql,empresa)

        sql = `INSERT INTO clientes_ativos.empresas (prefixo, status) VALUES
            ('${empresa}', 1)`
        await this.querySync(sql,empresa)
    }

    async totalClientsServidor(asterisk_server){
        const sql = `SELECT id 
                       FROM clients.accounts 
                      WHERE asterisk_server='${asterisk_server}'`
        const s=await this.querySync_crmdb(sql)
        return s.length
    }

    async checkPrefix(prefix){
        let sql = `SELECT id 
                     FROM clients.accounts
                    WHERE prefix = '${prefix}'`
        const p = await this.querySync_crmdb(sql) 
        return p.length           
    }


    async clientesAtivos(){
        const sql = `SELECT prefix 
                       FROM clients.accounts
                      WHERE status=1`
        return await this.querySync_crmdb(sql)
    }

    async getTrunk(empresa){
        const sql = `SELECT trunk, tech_prefix, type_dial 
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const trunks = await this.querySync_crmdb(sql)
        if(trunks.length==0){
            return false
        }
        return trunks
    }

    async maxLicences(empresa){
      const sql = `SELECT licenses
                     FROM clients.accounts 
                    WHERE prefix='${empresa}'`
      try{
          const tc = await this.querySync_crmdb(sql)
          if(tc.length==0){
            return 0
        }
        return tc[0].licenses
      }catch(error){
        console.log(error)
        return 0
      }      
    }

    async maxChannels(empresa){
      const sql = `SELECT total_channels
                     FROM clients.accounts 
                    WHERE prefix='${empresa}'`
      try{
          const tc = await this.querySync_crmdb(sql)
          if(tc.length==0){
            return 0
        }
        return tc[0].total_channels
      }catch(error){
        console.log(error)
        return 0
      }      
    }

    async servers(empresa){
        const sql = `SELECT server_id, asterisk_server, asterisk_domain 
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const servers = await this.querySync_crmdb(sql)
        if(servers.length==0){
            return false
        }
        return servers
    }

    async listarClientes(pag,reg){
      let pagina=(pag-1)*reg
      const sql = `SELECT * FROM clients.accounts LIMIT ${pagina},${reg}`
      return await this.querySync_crmdb(sql)
    }

    async infoCliente(idCliente){
      const sql = `SELECT * FROM clients.accounts WHERE client_number=${idCliente}`
      return await this.querySync_crmdb(sql)
    }

    async editarCliente(idCliente,nome,fidelidade,licenses,channels_by_user,total_channels,trunk,tech_prefix,type_dial,idServer,asterisk_server,asterisk_domain){
        let sql = `UPDATE clients.accounts
                      SET name='${nome}',
                          fidelidade=${fidelidade},
                          licenses=${licenses},
                          channels_by_user=${channels_by_user},
                          total_channels=${total_channels},
                          trunk='${trunk}',
                          tech_prefix=${tech_prefix},
                          type_dial='${type_dial}',
                          server_id=${idServer},
                          asterisk_server='${asterisk_server}',
                          asterisk_domain='${asterisk_domain}'
                    WHERE client_number=${idCliente}`
        await this.querySync_crmdb(sql)

        sql = `UPDATE clients.clientes
                  SET nome='${nome}'
                WHERE id=${idCliente}`
        await this.querySync_crmdb(sql)
    }

    async desativarCliente(idCliente){
      let sql = `UPDATE clients.accounts
                    SET status='0'
                  WHERE client_number=${idCliente}`
      await this.querySync_crmdb(sql)

      sql = `UPDATE clients.clientes
                SET status='0'
              WHERE id=${idCliente}`
      await this.querySync_crmdb(sql)
    }
}

exports. default = new Clients();