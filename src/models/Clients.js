import connect from '../Config/dbConnection'

class Clients{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.poolEmpresa.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
        })
    }

    async newAccount(nomeEmpresa,prefixo,licenses,channelsUser,totalChannels, trunk, tech_prefix, type_dial, asterisk_server, asterisk_domain){
        if(await this.checkPrefix(prefixo)>0){
            return {"error":true,"message":`O prexixo '${prefixo}' já existe!`}
        }
        let sql = `INSERT INTO clients.clientes 
                               (desde,nome,status)
                        VALUES (now(),'${nomeEmpresa}',1)`
        const e = await this.querySync(sql)
        const accountId = e['insertId']

        sql = `INSERT INTO clients.accounts  
                                (client_number,
                                          date,
                                          name,
                                        prefix,
                                      licenses,
                              channels_by_user,
                                total_channels,
                                         trunk,
                                   tech_prefix,
                                     type_dial,
                               asterisk_server,
                               asterisk_domain,
                                        status)
                          VALUES (${accountId},
                                         now(),
                              '${nomeEmpresa}',
                                  '${prefixo}',
                                   ${licenses},
                               ${channelsUser},
                              ${totalChannels},
                                    '${trunk}',
                                ${tech_prefix},
                                  ${type_dial},
                          '${asterisk_server}',
                          '${asterisk_domain}',
                                             1)`
        await this.querySync(sql)
        await this.createBD_dados(prefixo,asterisk_server,asterisk_domain)
        await this.createBD_mailing(prefixo)
              
        return true
    }

    async createBD_dados(empresa,asterisk_server,asterisk_domain){
        let sql = `CREATE DATABASE IF NOT EXISTS ${empresa}_dados;`
        await this.querySync(sql)

        const cs = await totalClientsServidor(asterisk_server)

        sql = `CREATE DATABASE IF NOT EXISTS ${empresa}_dados;
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.agentes_filas (
          id int NOT NULL AUTO_INCREMENT,
          ramal int DEFAULT NULL,
          fila int DEFAULT NULL,
          estado int DEFAULT NULL,
          idpausa int DEFAULT NULL,
          ordem int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

        CREATE TABLE IF NOT EXISTS ${empresa}_dados.agentes_pausados (
          id int NOT NULL AUTO_INCREMENT,
          data date DEFAULT NULL,
          ramal char(50) DEFAULT NULL,
          inicio time DEFAULT NULL,
          termino time DEFAULT NULL,
          idPausa int DEFAULT NULL,
          nome varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          descricao text,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.asterisk_ari (
          id int NOT NULL AUTO_INCREMENT,
          server varchar(50) DEFAULT NULL,
          user varchar(50) DEFAULT NULL,
          pass varchar(50) DEFAULT NULL,
          active tinyint DEFAULT NULL,
          debug tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        INSERT INTO ${empresa}_dados.asterisk_ari (id, server, user, pass, active, debug) VALUES
            (1, 'http://${asterisk_server}:8088 ', 'mega-user-ari', '1234abc@', 1, 0);
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas (
          id int NOT NULL AUTO_INCREMENT,
          dataCriacao datetime DEFAULT NULL,
          tipo char(1) DEFAULT NULL,
          nome varchar(255) DEFAULT NULL,
          descricao text,
          estado int DEFAULT NULL,
          status int DEFAULT NULL,
          PRIMARY KEY (id),
          KEY nome (nome)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_agendamentos (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_blacklists (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idBlacklist int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_campos_tela_agente (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          tabela varchar(50) DEFAULT NULL,
          idCampo int DEFAULT NULL,
          ordem int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_chamadas_simultaneas (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_discador (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_filas (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idFila int DEFAULT NULL,
          nomeFila varchar(255) DEFAULT NULL,
          apelido varchar(255) DEFAULT NULL,
          descricao text,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_horarios (
          id int NOT NULL AUTO_INCREMENT,
          id_campanha int DEFAULT NULL,
          inicio date DEFAULT NULL,
          termino date DEFAULT NULL,
          hora_inicio time DEFAULT NULL,
          hora_termino time DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_integracoes (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idIntegracao int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_integracoes_disponiveis (
          id int NOT NULL AUTO_INCREMENT,
          url text,
          descricao text,
          modoAbertura char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_listastabulacao (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idListaTabulacao int DEFAULT NULL,
          maxTime int DEFAULT '0',
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
         CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_mailing (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_mailing_filtros (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          tipo char(50) DEFAULT NULL,
          valor char(50) DEFAULT NULL,
          regiao char(2) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.campanhas_status (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          data datetime DEFAULT NULL,
          mensagem text,
          estado int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.cargos (
          id int NOT NULL AUTO_INCREMENT,
          cargo varchar(50) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.estadosAgente (
          id int NOT NULL AUTO_INCREMENT,
          cod int DEFAULT NULL,
          estado varchar(15) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        INSERT INTO ${empresa}_dados.estadosAgente (id, cod, estado) VALUES
            (1, 0, 'Deslogado'),
            (2, 1, 'Disponível'),
            (3, 2, 'Pausado'),
            (4, 3, 'Falando'),
            (5, 4, 'Indisponível'),
            (6, 5, 'Tela Reg.'),
            (7, 6, 'C. Manual'),
            (8, 7, 'Falando C. Manual');
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.filas (
          id int NOT NULL AUTO_INCREMENT,
          nome varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          apelido varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          descricao text,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.historico_atendimento (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.log_chamadas_simultaneas (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          idCampanha int DEFAULT NULL,
          total int DEFAULT NULL,
          conectadas int DEFAULT NULL,
          manuais int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.log_pausas (
          id int NOT NULL AUTO_INCREMENT,
          ramal char(50) DEFAULT NULL,
          idPausa int DEFAULT NULL,
          data date DEFAULT NULL,
          inicio time DEFAULT NULL,
          termino time DEFAULT NULL,
          duracao time DEFAULT NULL,
          ativa tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.mailings (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.mailing_tipo_campo (
          id int NOT NULL AUTO_INCREMENT,
          idMailing int NOT NULL DEFAULT '0',
          campo varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          nome_original_campo varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          apelido varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          tipo varchar(15) DEFAULT NULL,
          conferido tinyint DEFAULT NULL,
          ordem tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.pausas (
          id int NOT NULL AUTO_INCREMENT,
          idLista int DEFAULT NULL,
          nome varchar(50) DEFAULT NULL,
          descricao text,
          tipo char(10) DEFAULT NULL,
          tempo int DEFAULT NULL,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.pausas_listas (
          id int NOT NULL AUTO_INCREMENT,
          nome varchar(50) DEFAULT NULL,
          descricao text,
          default int DEFAULT NULL,
          status int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.records (
          id int NOT NULL AUTO_INCREMENT,
          date datetime DEFAULT NULL,
          date_record varchar(8) DEFAULT NULL,
          time_record varchar(8) DEFAULT NULL,
          ramal varchar(20) DEFAULT NULL,
          uniqueid varchar(32) DEFAULT NULL,
          numero varchar(20) DEFAULT NULL,
          callfilename varchar(255) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.registro_logins (
          id int NOT NULL AUTO_INCREMENT,
          data date DEFAULT NULL,
          hora time DEFAULT NULL,
          user_id int DEFAULT NULL,
          acao varchar(50) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.report_campos (
          id int NOT NULL AUTO_INCREMENT,
          idreport int DEFAULT NULL,
          idcampo int DEFAULT NULL,
          sintetico tinyint DEFAULT NULL,
          chart char(50) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.report_campos_disponiveis (
          id int NOT NULL AUTO_INCREMENT,
          campo varchar(50) DEFAULT NULL,
          descricao text,
          sintetico tinyint DEFAULT NULL,
          charts varchar(255) DEFAULT NULL,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.report_info (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          nome varchar(50) DEFAULT NULL,
          descricao text,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.servidor_webrtc (
          id int NOT NULL AUTO_INCREMENT,
          protocolo char(5) DEFAULT NULL,
          ip char(40) DEFAULT NULL,
          porta char(6) DEFAULT NULL,
          status tinyint DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        INSERT INTO ${empresa}_dados.servidor_webrtc (id, protocolo, ip, porta, status) VALUES
            (1, 'wss', '${asterisk_domain}', '8089', 1);
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tabulacoes_listas (
          id int NOT NULL AUTO_INCREMENT,
          data datetime DEFAULT NULL,
          nome char(50) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tabulacoes_status (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_espera (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idAgente int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_fila (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idMailing int DEFAULT NULL,
          idRegistro int DEFAULT NULL,
          numero char(20) DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_ligacao (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_login (
          id int NOT NULL AUTO_INCREMENT,
          idAgente int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_ociosidade (
          id int NOT NULL AUTO_INCREMENT,
          idCampanha int DEFAULT NULL,
          idAgente int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_pausa (
          id int NOT NULL AUTO_INCREMENT,
          idAgente int DEFAULT NULL,
          idPausa int DEFAULT NULL,
          entrada datetime DEFAULT NULL,
          saida datetime DEFAULT NULL,
          tempo_total char(10) DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.tempo_tabulacao (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.users (
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        INSERT INTO ${empresa}_dados.users (id, criacao, nome, usuario, empresa, senha, nivelAcesso, equipe, cargo, reset, logado, ordem, status) VALUES
            (1001, '2021-10-01 16:39:28', 'Gestor', 'gestor@nomeempresa', 'nomeempresa', '64ad3fb166ddb41a2ca24f1803b8b722', 4, 4, 2, 0, 0, 0, 1);
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.users_cargos (
          id int NOT NULL AUTO_INCREMENT,
          cargo varchar(15) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.users_equipes (
          id int NOT NULL AUTO_INCREMENT,
          supervisor int DEFAULT NULL,
          equipe varchar(50) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.users_niveis (
          id int NOT NULL AUTO_INCREMENT,
          nivel varchar(15) DEFAULT NULL,
          descricao text,
          status int DEFAULT NULL,
          PRIMARY KEY (id) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
        
        INSERT INTO ${empresa}_dados.users_niveis (id, nivel, descricao, status) VALUES
            (1, 'Vendedor', 'Sem Descricao', 1),
            (2, 'Supervisor', NULL, 1),
            (3, 'Gestor', NULL, 1),
            (4, 'Master', NULL, 1);
         
        CREATE TABLE IF NOT EXISTS ${empresa}_dados.user_ramal (
          id int NOT NULL AUTO_INCREMENT,
          userId int DEFAULT NULL,
          ramal char(15) DEFAULT NULL,
          estado tinyint DEFAULT NULL,
          deslogado tinyint DEFAULT NULL,
          tabulando tinyint DEFAULT NULL,
          datetime_estado datetime DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;`
        await this.querySync(sql)
    }

    async createBD_dados(empresa){
        let sql = `CREATE DATABASE IF NOT EXISTS ${empresa}_mailings;`
        await this.querySync(sql)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.blacklists (
                      id int NOT NULL AUTO_INCREMENT,
                      nome char(50) DEFAULT NULL,
                      descricao text,
                      padrao int DEFAULT NULL,
                      PRIMARY KEY (id) USING BTREE
               ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
        await this.querySync(sql)

        sql = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.blacklist_numeros (
                    id int NOT NULL AUTO_INCREMENT,
                    idLista int DEFAULT NULL,
                    dataBloqueio datetime DEFAULT NULL,
                    ddd int DEFAULT NULL,
                    numero char(15) DEFAULT NULL,
                    tipo char(15) DEFAULT NULL,
                    PRIMARY KEY (id) USING BTREE
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
                await this.querySync(sql)

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
        await this.querySync(sql)
    }

    async totalClientsServidor(asterisk_server){
        const sql = `SELECT id 
                       FROM clients.accounts 
                      WHERE asterisk_server='${asterisk_server}'`
        const s=await this.querySync(sql)
        return s.length
    }

    async checkPrefix(prefix){
        let sql = `SELECT id 
                     FROM clients.accounts
                    WHERE prefix = '${prefix}'`
        const p = await this.querySync(sql) 
        return p.length           
    }


    async clientesAtivos(){
        const sql = `SELECT prefix 
                       FROM clients.accounts 
                      WHERE status=1`
        return await this.querySync(sql)
    }

    async getTrunk(empresa){
        const sql = `SELECT trunk, tech_prefix, type_dial 
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const trunks = await this.querySync(sql)
        if(trunks.length==0){
            return false
        }
        return trunks
    }

    async maxChannels(empresa){
        const sql = `SELECT total_channels
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const tc = await this.querySync(sql)
        if(tc.length==0){
            return 0
        }
        return tc[0].total_channels
    }

    async servers(empresa){
        const sql = `SELECT asterisk_server, asterisk_domain 
                       FROM clients.accounts 
                      WHERE prefix='${empresa}'`
        const servers = await this.querySync(sql)
        if(servers.length==0){
            return false
        }
        return servers
    }
}

export default new Clients();