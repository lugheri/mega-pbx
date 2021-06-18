"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _csvtojson = require('csvtojson'); var _csvtojson2 = _interopRequireDefault(_csvtojson);
const Json2csvParser = require("json2csv").Parser;
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);


class Mailing{
    //Abre o csv do mailing a ser importado
    async abreCsv(path,delimitador,callback){
        await _csvtojson2.default.call(void 0, {delimiter:delimitador}).fromFile(path).then(callback)
    }

    //Cria uma nova tabela para o mailing
    criarBase(base,nomeTabela,header,callback){
        const keys = Object.keys(base)
        //criando tabela
       
        let campos='';
        if(header==1){
           // console.log('Headers '+keys)
            for(let i=0; i<keys.length; i++){
                let k = keys[i]
                campos+="`"+k.replace(/�/gi, "ç")+"` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',"
            }                 
        }else{
           // console.log('Sem Header');
            for(let i=0; i<keys.length; i++){
                campos+="`campo_"+(i+1)+"` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',"
            }
        }
        //console.log(`Campos: ${campos}`)
        const sql = "CREATE TABLE IF NOT EXISTS `mailings_"+nomeTabela+"` (`id_key_base` INT(11) NOT NULL AUTO_INCREMENT, "+campos+" `ddd_db` INT(2) NULL DEFAULT NULL,`uf_db` CHAR(2) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`tentativas` INT(11) NULL DEFAULT NULL,`status_tabulacao` INT(11) NULL DEFAULT NULL,`contatado` CHAR(2) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`produtivo` INT(11) NULL DEFAULT NULL, PRIMARY KEY (id_key_base) USING BTREE,INDEX `ddd_db` (`ddd_db`),INDEX `uf_db` (`uf_db`),INDEX `produtivo` (`produtivo`),INDEX `contatado` (`contatado`),INDEX `status_tabulacao` (`status_tabulacao`)) COLLATE='utf8_general_ci' ENGINE=InnoDB;" 
        
        _dbConnection2.default.mailings.query(sql,callback)
    }

    //Tenta reconhecer e setar os tipos de campo de cada coluna
    setaTipoCampo(base,nomeTabela,callback){
        const keys = Object.keys(base)       
        let sql='INSERT INTO mailing_tipo_campo (tabela,campo,tipo) VALUES ';
        for(let i=0; i<keys.length; i++){
            //Pegando campo ta tabela
            let k=keys[i];
            let campo = k.replace(/�/gi, "ç")
            let campoTest=campo.toLowerCase()
            
            //Pegando valor do campo 
            let valor=base[keys[i]]
            //Identificando tipo de campo
            //verifica o nome do campo de
            let tipo = 'dados';
            if((campoTest=='nome')||
               (campoTest=='name')||
               (campoTest=='titular')){
                tipo = 'nome'; 
            }else if(campoTest=='ddd'){
                tipo = 'ddd';                
            }else if((campoTest=='numero')||
                     (campoTest=='telefone')||
                     (campoTest=='celular')||
                     (campoTest=='tel')||
                     (campoTest=='cel')||
                     (campoTest=='contato')){
                        if(valor.length==11){       
                            let t = parseInt(valor.slice(2, 3))
                            if(t>=7){
                                tipo = 'ddd_e_telefone'; 
                            }    
                        }else if(valor.length==10){
                            let t = parseInt(valor.slice(2, 3))
                            if(t<7){
                                tipo = 'ddd_e_telefone'; 
                            } 
                        }else if(valor.length==9){                        
                            let t = parseInt(valor.slice(0,1))                        
                            if(t>=7){                            
                                tipo = 'telefone'; 
                            } 
                        }else if(valor.length==8){
                            let t = parseInt(valor.slice(0,1))
                            if(t<7){
                                tipo = 'telefone';
                            }
                        }

            }else if((campoTest=='cep')||
                     (campoTest=='cpf')||
                     (campoTest=='cnpj')||
                     (campoTest=='cpf/cnpj')||
                     (campoTest=='rg')||
                     (campoTest=='cnh')||
                     (campoTest=='documento')||
                     (campoTest=='habilitacao')){
                tipo = 'dados';  
            }else{
                //verifica se eh numero     
                let nvalor=parseInt(valor)      
                if(Number.isInteger(parseInt(nvalor))){
                    //verifica a quantidade de caracteres                   
                    if(valor.length==2){
                       tipo = 'ddd';
                    }else if(valor.length==11){                       
                        let t = parseInt(valor.slice(2, 3))
                        if(t>=9){
                            tipo = 'ddd_e_telefone'; 
                        }                        
                    }else if(valor.length==10){
                        let t = parseInt(valor.slice(2, 3))
                        if(t<9){
                            tipo = 'ddd_e_telefone'; 
                        } 
                    }else if(valor.length==9){                        
                        let t = parseInt(valor.slice(0,1))                       
                        if(t>=9){                            
                            tipo = 'telefone'; 
                        } 
                    }else if(valor.length==8){
                        let t = parseInt(valor.slice(0,1))
                        if(t<=9){
                            tipo = 'telefone'; 
                        } 
                    }
                }
            } 
            
            //Montando query
            sql +=`('mailings_${nomeTabela}','${campo}','${tipo}')`
            if(i==keys.length-1){
                sql +=';'
            }else{
                sql +=','
            }

        } 
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Adiciona as informacoes do mailing na tabela de controle de mailings
    addMailing(nome,nomeTabela,filename,callback){       
        const sql = `INSERT INTO mailings (data,termino_importacao,nome,arquivo,tabela,pronto,higienizado,status) VALUES (NOW(),now(),'${nome}','${filename[1]}','mailings_${nomeTabela}',0,0,1)`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Separa as colunas do novo mailing
    separarColunas(base,nomeTabela,header,callback){
        let keys = Object.keys(base)
       
        let campos='';
        let insertHeader='';
        if(header==1){
            //console.log('Headers '+keys)
            for(let i=0; i<keys.length; i++){
                campos+="`"+keys[i].replace(/�/gi, "ç")+"`,"
            }                 
        }else{
            //console.log('Sem Header');
            for(let i=0; i<keys.length; i++){
                campos+="`campo_"+(i+1)+"`,"
            }
            insertHeader+="INSERT INTO `mailings_"+nomeTabela+"` ("+campos+"`ddd_db`,`uf_db`,`tentativas`,`status_tabulacao`,`contatado`,`produtivo`) VALUES`(";
            for(let i=0; i<keys.length; i++){
                insertHeader+=`'${keys[i]}',`
            }
            insertHeader+="'00','uf',0,0,'',0)";
        }
        if(insertHeader){
            //Inserindo 1 linha
            _dbConnection2.default.mailings.query(insertHeader,(erro)=>{
                if(erro) throw erro;
                
            })
        }
        //console.log('Campos => '+campos)

        //setando o campo de ddd
        const sql=`SELECT campo,tipo FROM mailing_tipo_campo WHERE tabela='mailings_${nomeTabela}' AND (tipo = 'ddd' OR tipo = 'ddd_e_telefone') LIMIT 1`;
        _dbConnection2.default.banco.query(sql,(erro,result)=>{
            if(erro) throw erro;

            let r = new Object() 

            console.log(result[0].tipo)
            
            if(result[0].tipo){
                r.tipo=result[0].tipo
                r.campo=result[0].campo
            }
            

            callback(nomeTabela,campos,r)
        })

        //callback(nomeTabela,campos)
    }

    //Importa os dados do arquivo csv para a tabela criada
    importaDados(base,nomeTabela,campos,base_id,campoDDD,callback){
        let erros=0
       
        const totalBase = base.length
        let taxaTransferencia
        if(totalBase<=100000){
            taxaTransferencia=2000
        }else if(totalBase<=300000){
            taxaTransferencia=1000
        }else if(totalBase<=500000){
            taxaTransferencia=500
        }else if(totalBase<=700000){
            taxaTransferencia=300
        }else if(totalBase<=900000){
            taxaTransferencia=200    
        }else{
            taxaTransferencia=100
        }
        

        //console.log('Total: '+totalBase+' x Taxa '+taxaTransferencia)

        const key= Object.keys(base[0][1])
        
        
        let sqlValue="INSERT INTO `mailings_"+nomeTabela+"` ("+campos+"`ddd_db`,`uf_db`,`tentativas`,`status_tabulacao`,`contatado`,`produtivo`) VALUES";
        const limit = taxaTransferencia
        let length=0
        if(base.length>limit){
            length=limit
        }else{
           length=base.length
        }
        let ddd
        let uf=''
        
        const ddds_UFS=[
             //Lista de DDDs
            //Centro-Oeste

            //Distrito Federal 
            {ddd:61,uf:'DF'},
            //Goiás
            {ddd:62,uf:'GO'},
            {ddd:64,uf:'GO'},
            //Mato Grosso 
            {ddd:65,uf:'MT'},
            {ddd:66,uf:'MT'},
            //Mato Grosso do Sul
            {ddd:67,uf:'MS'},

            //Nordeste
            //Alagoas
            {ddd:82,uf:'AL'},
            //Bahia
            {ddd:71,uf:'BA'},
            {ddd:73,uf:'BA'},
            {ddd:74,uf:'BA'},
            {ddd:75,uf:'BA'},
            {ddd:77,uf:'BA'},
            //Ceará
            {ddd:85,uf:'CE'},
            {ddd:88,uf:'CE'},
            //Maranhão
            {ddd:98,uf:'MA'},
            {ddd:99,uf:'MA'},
            //Paraíba
            {ddd:83,uf:'PB'},
            //Pernambuco
            {ddd:87,uf:'PE'},            
            {ddd:87,uf:'PE'},
            //Piauí
            {ddd:86,uf:'PI'},
            {ddd:89,uf:'PI'},
            //Rio Grande do Norte 
            {ddd:84,uf:'RN'},
            //Sergipe
            {ddd:79,uf:'SE'},

            //Norte
            //Acre
            {ddd:68,uf:'AC'},
            //Amapá
            {ddd:96,uf:'AP'},
            //Amazonas
            {ddd:92,uf:'AM'},
            {ddd:97,uf:'AM'},
            //Pará
            {ddd:91,uf:'PA'},
            {ddd:93,uf:'PA'},
            {ddd:94,uf:'PA'},
             //Rondônia
            {ddd:69,uf:'RO'},
            //Roraima
            {ddd:95,uf:'RR'},
            //Tocantins
            {ddd:63,uf:'TO'},

            //Sudeste
            //Espírito Santo
            {ddd:27,uf:'ES'},
            {ddd:28,uf:'ES'},
            //Minas Gerais
            {ddd:31,uf:'MG'},
            {ddd:32,uf:'MG'},
            {ddd:33,uf:'MG'},
            {ddd:34,uf:'MG'},
            {ddd:35,uf:'MG'},
            {ddd:37,uf:'MG'},
            {ddd:38,uf:'MG'},
            //Rio de Janeiro
            {ddd:21,uf:'RJ'},
            {ddd:22,uf:'RJ'},
            {ddd:24,uf:'RJ'},
            //São Paulo
            {ddd:11,uf:'SP'},
            {ddd:12,uf:'SP'},
            {ddd:13,uf:'SP'},
            {ddd:14,uf:'SP'},
            {ddd:15,uf:'SP'},
            {ddd:16,uf:'SP'},
            {ddd:17,uf:'SP'},
            {ddd:18,uf:'SP'},
            {ddd:19,uf:'SP'},

            //Sul
            //Paraná
            {ddd:41,uf:'PR'},
            {ddd:42,uf:'PR'},
            {ddd:43,uf:'PR'},
            {ddd:44,uf:'PR'},
            {ddd:45,uf:'PR'},
            {ddd:46,uf:'PR'},
            //Rio Grande do Sul
            {ddd:51,uf:'RS'},
            {ddd:53,uf:'RS'},
            {ddd:54,uf:'RS'},
            {ddd:55,uf:'RS'},
            //Santa Catarina
            {ddd:47,uf:'SC'},
            {ddd:48,uf:'SC'},
            {ddd:49,uf:'SC'}            
        ]     

        //Tipo de campo onde esta o ddd
        const tipoCampo_DDD = campoDDD.tipo    

        //Campo onde esta o ddd
        const campo_DDD = campoDDD.campo

        for(let i=0;i<length; i++){ 
           
            sqlValue+=" (";
                for(let v=0; v<key.length; v++){
                    let valor=base[0][1][key[v]]
                    sqlValue+=`'${valor.replace(/'/gi,'')}',`                    
                }
               
                
                if(tipoCampo_DDD=='ddd'){                    
                     ddd = parseInt(base[0][1][campo_DDD])                    
                }else if(tipoCampo_DDD=='ddd_e_telefone'){            
                    
                     ddd = parseInt(base[0][1][campo_DDD].slice(0,2))
                     console.log(ddd)
                }
                //console.log(`ddd ${i}: ${ddd}`)

                for(let d=0; d<ddds_UFS.length; d++){
                    if (ddds_UFS[d].ddd == ddd){
                        uf = ddds_UFS[d].uf 
                    }
                }              
              
                
                

            base.shift()
            
            if(i>=length-1){
                sqlValue+="'"+ddd+"','"+uf+"',0,0,'',0);";
            }else{
                sqlValue+="'"+ddd+"','"+uf+"',0,0,'',0),";
            }
            
                  
        }

        //console.log('Query:')
        //    console.log(sqlValue) 

        
        
        //populando tabela        
        _dbConnection2.default.mailings.query(sqlValue,(erro,result)=>{ 
            if(erro) console.log(erro)

            this.totalReg(`mailings_${nomeTabela}`, (erro,resultado)=>{
                if(erro) throw erro;
               
                let totalReg = resultado[0].total
                if(base.length>0){
                    const sql = `UPDATE mailings SET totalReg='${totalReg}' WHERE id='${base_id}'`
                    _dbConnection2.default.banco.query(sql,(erro,result)=>{
                        this.importaDados(base,nomeTabela,campos,base_id,campoDDD,callback)
                    })
                }else{
                    //gravando log
                    const sql = `UPDATE mailings SET termino_importacao=now(), pronto=1, totalReg='${totalReg}' WHERE id='${base_id}'`
                    _dbConnection2.default.banco.query(sql,callback)
                      
                }                   
            })
        })
        
              
    }

    //Abre o mailing importado por paginas com a qtd de reg informada
    abrirMailing(id,p,r,callback){
        const sql = `SELECT tabela FROM mailings WHERE id=${id}`
        _dbConnection2.default.banco.query(sql,(e,result)=>{
            if(e) throw e
            const qtd=r
            const pag=((p-1)*r)
            const tabela = result[0].tabela
            console.log(`SELECT * FROM ${tabela} LIMIT ${pag},${qtd}`)
            
            const sql = `SELECT * FROM ${tabela} LIMIT ${pag},${qtd}`
            _dbConnection2.default.mailings.query(sql,callback)
            
        })
    }

    //Retorna o nome da tabela do mailing correspondente ao id enviado
    tabelaMailing(idMailing,callback){
        const sql = `SELECT tabela FROM mailings WHERE id=${idMailing}`

        _dbConnection2.default.banco.query(sql,callback)
    }
    

    //Listar mailings importados
    listaMailing(callback){
        const sql = 'SELECT * FROM mailings WHERE status = 1 ORDER BY `id` DESC'
        _dbConnection2.default.banco.query(sql,callback);
    }

    //Conta o total de registros em uma tabela de mailing
    totalReg(tabela, callback){
        const sql = `SELECT count(id_key_base) as total FROM ${tabela}`
        _dbConnection2.default.mailings.query(sql, callback)
    }

    //Remover Mailing
    removerMailing(req,callback){
        const idMailing = parseInt(req.params.idMailing);
        const sql = `SELECT tabela FROM mailings WHERE id=${idMailing}`
        _dbConnection2.default.banco.query(sql,(erro,result)=>{
            if(erro) throw erro;

            if(result.length!=0){
                //Removendo os dados do mailing
                const tabela = result[0].tabela
                const sql = `DROP TABLE ${tabela}`
                _dbConnection2.default.mailings.query(sql,(erro,result)=>{
                    if(erro) throw erro;
                    //Removendo as informações do mailing
                    const sql = `DELETE FROM mailings WHERE id=${idMailing}`
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if(erro) throw erro;

                        //Removendo os campos do mailings
                        const sql = `DELETE FROM mailing_tipo_campo WHERE tabela='${tabela}'`
                        _dbConnection2.default.banco.query(sql,(e,r)=>{
                            if(erro) throw erro;  
                            //Removendo mailing das campanhas
                            const sql = `DELETE FROM campanhas_mailing WHERE idMailing='${idMailing}'`
                            _dbConnection2.default.banco.query(sql,(e,r)=>{
                                //removendo configuracoes da tela do agente
                                const sql = `DELETE FROM campanhas_campos_tela_agente WHERE tabela='${tabela}'`
                                _dbConnection2.default.banco.query(sql,callback(e,true))
                            })
                        })
                    })                
                })
            }else{
                callback(false,false)
            }
        })
    }

    //ExportarMailing
    exportarMailing(id,res,callback){
       
        const sql = `SELECT tabela FROM mailings WHERE id=${id}` 
        _dbConnection2.default.banco.query(sql,(error, result) =>{
            if (error) throw error;
            const tabela = result[0].tabela

            console.log(tabela)

            const sql = `SELECT * FROM ${tabela}`    
            _dbConnection2.default.mailings.query(sql,(error, data, fields) =>{
                if (error) throw error;
            
                const jsonData = JSON.parse(JSON.stringify(data));
                console.log("jsonData", jsonData);

                const json2csvParser = new Json2csvParser({ header: true});
                const csv = json2csvParser.parse(jsonData);

                const inputPath = `tmp/files/`;
                const fileName = `${tabela}.csv`;
                const file = `${inputPath}${tabela}.csv`;


                _fs2.default.writeFile(file, csv, function(error) {
                    if (error) throw error;
                    console.log(`Write to ${file}.csv successfully!`);
                    res.download(file)
                    /*res.download(fileName, fileName, (err)=>{
                        if(err) throw err
                        console.log(fileName)
                    })
                    var options = {
                        root: inputPath,
                        dotfiles: 'deny',
                        headers: {
                          'x-timestamp': Date.now(),
                          'x-sent': true
                        }
                    }
                    res.sendFile(fileName, options, function (err) {
                        if (err) {
                          next(err)
                        } else {
                          console.log('Sent:', fileName)
                        }
                    })*/
                });
            })        
        })
    }

    //CONFIGURA O MAILING
    //Lista os campos disponiveis do mailing
    camposMailing(tabela,callback){
        const sql = `SELECT id, campo, apelido, tipo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND conferido=1 ORDER BY ordem ASC`
        _dbConnection2.default.banco.query(sql,callback)
    }    
    
    //Status mailing
    statusMailing(idMailing,callback){
        const sql = `SELECT configurado,totalReg,pronto,status FROM mailings WHERE id=${idMailing}`
        _dbConnection2.default.banco.query(sql,callback) 
    }
    //Prévia dos dados
    previaMailing(tabela,limit,callback){
        const sql = `SELECT * FROM ${tabela} ORDER BY RAND() LIMIT ${limit}`
        _dbConnection2.default.mailings.query(sql,callback) 
    }

    //Conta os ufs do mailing
    ufsMailing(idMailing,callback){
        const sql = `SELECT tabela FROM mailings WHERE id='${idMailing}'`;
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e

            const tabela = r[0].tabela

            const sql = `SELECT COUNT(uf_db) AS total, uf_db AS uf FROM ${tabela} GROUP BY uf_db`
            _dbConnection2.default.mailings.query(sql,(e,r)=>{
                if(e) throw e

                const estados=[
                   //Centro-Oeste       
                   {estado:'Distrito Federal',uf:'DF'},
                   {estado:'Goiás',uf:'GO'},
                   {estado:'Mato Grosso',uf:'MT'},
                   {estado:'Mato Grosso do Sul',uf:'MS'},       
                   //Nordeste
                   {estado:'Alagoas',uf:'AL'},
                   {estado:'Bahia',uf:'BA'},
                   {estado:'Ceará',uf:'CE'},
                   {estado:'Maranhão',uf:'MA'},
                   {estado:'Paraíba',uf:'PB'},
                   {estado:'Pernambuco',uf:'PE'},
                   {estado:'Piauí',uf:'PI'},
                   {estado:'Rio Grande do Norte ',uf:'RN'},
                   {estado:'Sergipe',uf:'SE'},       
                   //Norte
                   {estado:'Acre',uf:'AC'},
                   {estado:'Amapá',uf:'AP'},
                   {estado:'Amazonas',uf:'AM'},
                   {estado:'Pará',uf:'PA'},
                   {estado:'Rondônia',uf:'RO'},
                   {estado:'Roraima',uf:'RR'},
                   {estado:'Tocantins',uf:'TO'},       
                   //Sudeste
                   {estado:'Espírito Santo',uf:'ES'},
                   {estado:'Minas Gerais',uf:'MG'},
                   {estado:'Rio de Janeiro',uf:'RJ'},
                   {estado:'São Paulo',uf:'SP'},       
                   //Sul
                   {estado:'Paraná',uf:'PR'},
                   {estado:'Rio Grande do Sul',uf:'RS'},
                   {estado:'Santa Catarina',uf:'SC'}            
               ]     

                let ufs='{'
                for(let i=0; i<r.length; i++){
                    let estado
                    for(let e=0; e<estados.length; e++){
                        if (estados[e].uf == r[i].uf){
                            estado = estados[e].estado
                            break
                        }
                    }      
                  
                    ufs += `"${r[i].uf}":`
                    ufs += `{`
                    ufs += `"fill":"#185979",`
                    ufs += `"total":${r[i].total},`
                    ufs += `"name":"${estado}"`
                    if(i==r.length-1){
                        ufs += `}`
                    }else{
                        ufs += `},`
                    }                 
                    
                }
                ufs += '}'             
                
                
                callback(e,JSON.parse(ufs))
            })
        })
    }

    //DDDs por uf do mailing
    dddsUfMailing(tabela,uf,callback){
        const sql = `SELECT ddd_db AS ddd, COUNT(id_key_base) AS total FROM ${tabela} WHERE uf_db='${uf}' GROUP BY ddd_db ORDER BY ddd_db ASC`
        _dbConnection2.default.mailings.query(sql,callback)
    }

    //Resumo por ddd
    totalRegUF(tabela,callback){
        const sql = `SELECT uf_db AS UF, COUNT(id_key_base) AS registros FROM ${tabela} GROUP BY uf_db ORDER BY uf_db ASC`
        _dbConnection2.default.mailings.query(sql,callback)
    }


    //Saude do mailing
    totalRegistros(tabela,callback){
        const sql = `SELECT COUNT(id_key_base) AS total FROM ${tabela}`
        _dbConnection2.default.mailings.query(sql,callback)
    }
    registrosContatados(tabela,callback){
        const sql = `SELECT COUNT(id_key_base) AS contatados FROM ${tabela} WHERE contatado='S'`
        _dbConnection2.default.mailings.query(sql,callback)
    }
    registrosNaoContatados(tabela,callback){
        const sql = `SELECT COUNT(id_key_base) AS nao_contatados FROM ${tabela} WHERE contatado='N'`
        _dbConnection2.default.mailings.query(sql,callback)
    }

    //Campos do Mailing e seu tipo
    camposVsTipo(tabela,callback){
        const sql = `SELECT id as idCampo,campo,apelido,tipo,conferido FROM mailing_tipo_campo WHERE tabela='${tabela}'`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Atualizar tipo do campo
    atualizaTipoCampo(idCampo,apelido,novoTipo,callback){
        const sql = `UPDATE mailing_tipo_campo SET apelido='${apelido}', tipo='${novoTipo}', conferido=1 WHERE id=${idCampo}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    nomeTabela_byidCampo(idCampo,callback){
        const sql = `SELECT tabela FROM mailing_tipo_campo WHERE id=${idCampo}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    confereCampos(tabela,callback){
        const sql = `SELECT COUNT(id) AS pendentes FROM mailing_tipo_campo WHERE tabela='${tabela}' AND (conferido=0 OR conferido IS null)`
        _dbConnection2.default.banco.query(sql,callback)
    }

    configuraMailing(tabela,configurado,callback){
        const sql = `UPDATE mailings SET configurado=${configurado} WHERE tabela='${tabela}'`
        _dbConnection2.default.banco.query(sql,callback)
    }





    //ADICIONA O MAILING A UMA CAMPANHA
    addMailingCampanha(idCampanha,idMailing,callback){
        //verifica se mailing ja existem
        const sql = `SELECT id FROM campanhas_mailing WHERE idCampanha=${idCampanha} AND idMailing=${idMailing}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if (e) throw e;

            if(r.length==0){
                const sql = `INSERT INTO campanhas_mailing (idCampanha,idMailing) VALUES ('${idCampanha}','${idMailing}')`
                _dbConnection2.default.banco.query(sql,callback)

            }

            /*this.tabelaTabulacaoMailing(idMailing,idCampanha,(e,r)=>{            
            connect.banco.query(sql,(e,r)=>{ 
                    if (e) throw e;
    
                })
            })*/
        })
    }

    //Criando banco de tabulacao do mailing
    tabelaTabulacaoMailing(idMailing,idCampanha,callback){
        //recuperando o nome da tabela do mailing
        const sql = `SELECT tabela FROM mailings WHERE id=${idMailing}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if (e) throw e;
            const tabela = r[0].tabela
            //abre o mailing e insere todos os ids no mesmo com o id da campanha na tabela de tabulacao
            const sql = `SELECT id_key_base FROM ${tabela}`
            _dbConnection2.default.mailings.query(sql,(e,reg)=>{
                if (e) throw e;
                console.log(`${reg.length} registros`)
                for(let i=0; i<reg.length; i++){
                    const sql = `INSERT INTO campanhas_tabulacao_mailing (idCampanha,idMailing,idRegistro,estado,desc_estado,tentativas) VALUES (${idCampanha},${idMailing},${reg[i].id_key_base},0,'Disponivel',0)`
                    _dbConnection2.default.banco.query(sql,(e,r)=>{
                        if (e) throw e;
                    })
                }
            })
        })
        callback(false,true)
    }

    //Lista os mailings adicionados em uma campanha
    listarMailingCampanha(idCampanha,callback){
        const sql = `SELECT * FROM campanhas_mailing WHERE idCampanha=${idCampanha}`
        _dbConnection2.default.banco.query(sql,callback)
    }

    //Remove o mailing de uma campanha
    removeMailingCampanha(id,callback){
        //Recuperando o id da campanha
        const sql = `SELECT idCampanha FROM campanhas_mailing WHERE id=${id}`
        _dbConnection2.default.banco.query(sql,(e,r)=>{
            if(e) throw e;

            const idCampanha = r[0].idCampanha
            //Removendo integracao do mailing com a campanha
            const sql = `DELETE FROM campanhas_mailing WHERE id=${id}`
            _dbConnection2.default.banco.query(sql,callback)
        })
    }
}
exports. default = new Mailing();



