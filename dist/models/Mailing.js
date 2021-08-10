"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dbConnection = require('../Config/dbConnection'); var _dbConnection2 = _interopRequireDefault(_dbConnection);
var _csvtojson = require('csvtojson'); var _csvtojson2 = _interopRequireDefault(_csvtojson);
var _json2csv = require('json2csv');
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);

class Mailing{
    querySync(sql){
        return new Promise((resolve,reject)=>{
            _dbConnection2.default.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    //Abre o csv do mailing a ser importado
    async abreCsv(path,delimitador,callback){
        await _csvtojson2.default.call(void 0, {delimiter:delimitador}).fromFile(path).then(callback)
    }

    async criarTabelaMailing(keys,nome,nomeTabela,header,filename,delimitador){
        let campos='';
        //Dados do Mailing
        const tableData=`dados_${nomeTabela}`
        for(let i=0; i<keys.length; i++){
            if(header==1){
                let k = keys[i]
                const field = k.replace(" ", "_")
                               .replace("/", "_")
                               .normalize("NFD").replace(/[^a-zA-Z0-9s]/g, "");
                campos+=`${field} VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`
            }else{
                campos+=`campo_${(i+1)} VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`
            }
        }
        const sql = `CREATE TABLE IF NOT EXISTS mailings.${tableData} 
                        (id_key_base INT(11) NOT NULL AUTO_INCREMENT, 
                        ${campos}
                        test INT(4) NULL DEFAULT NULL,
                        PRIMARY KEY (id_key_base) USING BTREE) 
                        COLLATE='utf8_general_ci' ENGINE=InnoDB;`
        await this.querySync(sql)    

        //Numeros do Mailing        
        const tableNumbers=`numeros_${nomeTabela}`
        const sqlN = `CREATE TABLE IF NOT EXISTS mailings.${tableNumbers} 
                        (id INT(11) NOT NULL AUTO_INCREMENT,
                        id_mailing INT(11) NULL DEFAULT NULL,
                        id_registro INT(11) NULL DEFAULT NULL,
                        ddd INT(2) NULL DEFAULT NULL,
                        numero CHAR (12) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        uf CHAR(2) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        tipo CHAR(8) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        valido INT(4) NULL DEFAULT NULL,
                        duplicado INT(4) NULL DEFAULT NULL,
                        erro VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        tentativas INT(11) NULL DEFAULT NULL,
                        status_tabulacao INT(11) NULL DEFAULT NULL,
                        contatado CHAR(2) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        produtivo INT(11) NULL DEFAULT NULL, 
                        discando INT(11) NULL DEFAULT '0', 
                        PRIMARY KEY (id) USING BTREE,
                        INDEX dd (ddd),
                        INDEX uf (uf),
                        INDEX tipo (tipo),
                        INDEX produtivo (produtivo),
                        INDEX contatado (contatado),
                        INDEX status_tabulacao (status_tabulacao)) 
                        COLLATE='utf8_general_ci' ENGINE=InnoDB;`
        await this.querySync(sqlN)   
        
        const insertMailing = await this.addInfoMailing(nome,tableData,tableNumbers,filename,header,delimitador)
        return await this.infoMailing(insertMailing['insertId']);        
    }

    //Adiciona as informacoes do mailing na tabela de controle de mailings
    async addInfoMailing(nome,tableData,tableNumber,arquivo,header,delimitador){       
        const sql = `INSERT INTO mailings
                               (data,nome,arquivo,header,delimitador,tabela_dados,tabela_numeros,configurado,repetidos,pronto,status) 
                        VALUES (NOW(),'${nome}','${arquivo}',${header},'${delimitador}','${tableData}','${tableNumber}',0,0,0,1)`
        return await this.querySync(sql)  
    }

    async infoMailing(idMailing){
        const sql = `SELECT * FROM mailings WHERE id=${idMailing}`
        return await this.querySync(sql)  
    }

    async tabelaMailing(idMailing){
        const sql = `SELECT tabela_dados, tabela_numeros FROM mailings WHERE id=${idMailing}`
        return await this.querySync(sql)
    }
    

    verificaTipoCampo(header,title,value){
        return new Promise ((resolve,reject)=>{
            let typeField='dados'
            if(header==1){
                if((title=='nome')||(title=='name')||(title=='titular')||
                   (title=='NOME')||(title=='NAME')||(title=='TITULAR')){
                    typeField = 'nome';
                }else if((title=='ddd')||
                         (title=='DDD')){
                    typeField = 'ddd';                
                }else if((title=='numero')||(title=='telefone')||(title=='celular')||(title=='tel')||(title=='cel')||(title=='contato')||
                         (title=='NUMERO')||(title=='TELEFONE')||(title=='CELULAR')||(title=='TEL')||(title=='CEL')||(title=='CONTATO')){
                    if(value.length>=8){
                        typeField='telefone';
                    }else if(value.length>9){
                        typeField='ddd_e_telefone'; 
                    }else{
                        typeField='dados';
                    }
                }else{
                    typeField='dados';
                }
            }else{
                let nValue=parseInt(value)      
                if(Number.isInteger(parseInt(nValue))){//verifica se eh numero   
                    if(value.length==2){//verifica a quantidade de caracteres  
                        typeField = 'ddd';
                    }else if(value.length==11){                       
                        let t = parseInt(value.slice(2, 3))
                        if(t>=9){
                            typeField = 'ddd_e_telefone'; 
                        }                        
                    }else if(value.length==10){
                        let t = parseInt(value.slice(2, 3))
                        if(t<9){
                            typeField = 'ddd_e_telefone'; 
                        } 
                    }else if(value.length==9){                        
                        let t = parseInt(value.slice(0,1))                       
                        if(t>=9){                            
                            typeField = 'telefone'; 
                        } 
                    }else if(value.length==8){
                        let t = parseInt(value.slice(0,1))
                        if(t<=9){
                            typeField = 'telefone'; 
                        } 
                    }
                }else{
                    typeField='dados';
                }
            }
            resolve(typeField)
        })        
    }

    async configuraTipoCampos(idBase,header,campos){
        let sql='INSERT INTO mailing_tipo_campo (idMailing,campo,apelido,tipo,conferido,ordem) VALUES ';
        for(let i=0; i<campos.length; i++){
            let nomeCampo=campos[i].name
            if(header==0){
                nomeCampo=`campo_${i+1}`
            }
            sql +=`(${idBase},'${nomeCampo}','${campos[i].apelido}','${campos[i].tipo}',1,${i+1})`
            if((i+1)<campos.length){ sql +=', '}
        }
        await this.querySync(sql)
    }

    async importaDados_e_NumerosBase(idBase,jsonFile,file,header,dataTab,numTab,idKey,transferRate){
        const tabelaDados = `mailings.${dataTab}`
        const tabelaNumeros = `mailings.${numTab}`
        let erros=0
        let fields=Object.keys(jsonFile[0])//Campos do arquivo
        let fieldsTb=[]//array dos campos que irao para query
        for(let i = 0; i <fields.length;i++){
            fieldsTb.push(fields[i].replace(" ", "_").replace("/", "_").normalize("NFD").replace(/[^a-zA-Z0-9s]/g, ""))
        } 
        // fieldsTb=fields
        if(header==0){           
            for(let i=0; i<fields.length; i++){
                fieldsTb.push(`campo_${i+1}`)
            }
        }
      
        const totalBase = jsonFile.length
        let limit=0
        let min=100
        if(min>=totalBase){
            min=totalBase
        }
        let max = 5000
        let rate=transferRate*2
        if(totalBase>=800000){
            max=1000
        }else if(totalBase>=400000){
            max=2000
        }else if(totalBase>=200000){
            max=3000
        }
        if(rate>=max){//Setando limite de acordo com o transferRate
            rate=max
        }
        limit=rate
        
        if(limit>=totalBase){
            limit=totalBase
        }

        //QUERY DE DADOS
        //Cabecario da query
        let sqlData=`INSERT INTO ${tabelaDados}
                                 (id_key_base,${fieldsTb}) 
                           VALUES `;
        let sqlNumbers=`INSERT INTO ${tabelaNumeros}
                                   (id,id_mailing,id_registro,ddd,numero,uf,tipo,valido,duplicado,erro,tentativas,status_tabulacao,contatado,produtivo)
                            VALUES `;
       
        let type_ddd=""
        let type_numero=[]
        let type_completo=[]
        //Verificando campos de telefones
        const sql_ddds = `SELECT campo FROM mailing_tipo_campo WHERE idMailing=${idBase} AND tipo='ddd'`
        const field_ddd = await this.querySync(sql_ddds)
        //verificando se possuem campos apenas de numero
        const sql_numeros = `SELECT campo FROM mailing_tipo_campo WHERE idMailing=${idBase} AND tipo='telefone'`
        const fieldNumeros = await this.querySync(sql_numeros)
        //verificando se possuem campos de ddd e numero
        const sql_completo = `SELECT campo FROM mailing_tipo_campo WHERE idMailing=${idBase} AND tipo='ddd_e_telefone'`
        const fieldCompleto = await this.querySync(sql_completo)       

        if(field_ddd.length>0){              
            type_ddd=field_ddd[0].campo
        }
        if(fieldNumeros.length>0){
            for(let i=0; i<fieldNumeros.length; i++){
                type_numero.push(fieldNumeros[i].campo)
            }
        }
        if(fieldCompleto.length>0){
            for(let i=0; i<fieldCompleto.length; i++){
                type_completo.push(fieldCompleto[i].campo)
            }
        }

        const totalTelefones = fieldNumeros.length+fieldCompleto.length
        if(limit>=totalTelefones){
            limit=limit/totalTelefones
        }
        if(limit<=min){
            limit = min
        }

        //console.log('Limite',limit)
        //Populando a query

        let indice = idKey
        let idNumber = (idBase * 1000000) + 1
        for(let i=0; i<limit; i++){
            let indiceReg = (idBase * 1000000) + indice
            sqlData+=" (";
            sqlData+=`${indiceReg},`  
            for(let f=0; f<fields.length; f++){
                let valor=jsonFile[0][fields[f]]
                sqlData+=`'${valor.replace(/'/gi,'')}'`
               
                if(f>=fields.length-1){
                    sqlData+=``;
                }else{
                    sqlData+=`,`;
                }   
            }            
            if(i>=limit-1){
                sqlData+=`);`;
            }else{
                sqlData+=`),`; 
            }

            //Separando Telefones
            let ddd = 0 
            if(type_ddd!=""){               
                ddd = jsonFile[0][type_ddd].replace(/[^0-9]/g, "")
            }
            
            for(let i=0; i<type_numero.length; i++){//Numeros
                let numero = jsonFile[0][type_numero[i]]
                if(numero){ 
                    numero.replace(/[^0-9]/g, "")
                    let numeroCompleto = ddd+numero                    
                    let duplicado = 0//await this.checaDuplicidade(numeroCompleto,tabelaNumeros)
                    //Inserindo ddd e numero na query
                    const infoN = this.validandoNumero(ddd,numeroCompleto)
                    sqlNumbers+=` (${idNumber},${idBase},${indiceReg},${ddd},'${numeroCompleto}','${infoN['uf']}','${infoN['tipo']}',${infoN['valido']},${duplicado},'${infoN['erro']}',0,0,0,0),`;
                    idNumber++
                }
            }

            for(let nc=0; nc<type_completo.length; nc++){//Numeros
                let numeroCompleto = jsonFile[0][type_completo[nc]]              

                if(numeroCompleto){
                    numeroCompleto.replace(/[^0-9]/g, "")
                    let dddC = numeroCompleto.slice(0,2)                   
                    let duplicado = 0 //await this.checaDuplicidade(numeroCompleto,tabelaNumeros)
                
                    //Inserindo ddd e numero na query
                    const infoN = this.validandoNumero(dddC,numeroCompleto)
                    sqlNumbers+=` (${idNumber},${idBase},${indiceReg},${dddC},'${numeroCompleto}','${infoN['uf']}','${infoN['tipo']}',${infoN['valido']},${duplicado},'${infoN['erro']}',0,0,0,0),`;
                    idNumber++
                }
            }
            indice++
            jsonFile.shift()//Removendo campos importados do arquivo carregado   
        } 
              
        let queryNumeros = sqlNumbers.slice(0,sqlNumbers.length-1)+';'

        await this.querySync(sqlData)
        await this.querySync(queryNumeros)
       
        let tR = await this.totalReg(tabelaDados)
        let tN = await this.totalNumeros(tabelaNumeros)
        let totalReg=tR[0].total
        let totalNumeros=tN[0].total
        let sql = `UPDATE mailings SET configurado=1, totalReg='${totalReg}',totalNumeros='${totalNumeros}'
                   WHERE id='${idBase}'`
        await this.querySync(sql)        

        //Verificando restantes para reexecução
        if(jsonFile.length>0){
            await this.importaDados_e_NumerosBase(idBase,jsonFile,file,header,dataTab,numTab,indice,rate)
           
        }else{
            //gravando log
            sql = `UPDATE mailings SET termino_importacao=now(), pronto=1 WHERE id='${idBase}'`
            _fs2.default.unlinkSync(file)//Removendo Arquivo
            await this.querySync(sql)           
        }
    }

    validandoNumero(ddd,numeroCompleto){
        const info = {}
        let uf = this.checaUF(ddd)
        let error='ok'
        let valido = 1
        let tipo=""
        //validando uf
        if(uf=='er'){
            error = 'DDD invalido'
            valido=0
        }
        let digitos = numeroCompleto.slice(2,3)
        //validando numero
        if((numeroCompleto.length<10)&&(numeroCompleto.length>11)){
            error="numero inválido"
            valido=0
        }else{
            if(numeroCompleto.length==10){
                if(digitos>=6){
                    error="Primeiro dígito inválido para fixo"
                    valido=0
                }else{
                    tipo='fixo'
                }
            }else{
                if(digitos>=7){
                    tipo='celular'
                }else{
                    error="Primeiro dígito inválido para celular"
                    valido=0
                }
            }
        }
        info['uf']=uf
        info['tipo']=tipo
        info['valido']=valido
        info['erro']=error   
        return info;
    }

    checaUF(ddd){
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

       const filter = ddds_UFS.find(uf => uf.ddd == ddd)
       if(filter===undefined){
           return "er";
       }
       return filter.uf
    }

    //Conta o total de registros em uma tabela de mailing
    async totalReg(tabela){
        const sql = `SELECT count(id_key_base) as total FROM ${tabela}`
        return await this.querySync(sql)
    }

    async totalNumeros(tabela){
        const sql = `SELECT count(id) as total FROM ${tabela}`
        return await this.querySync(sql)
    }

    async checaDuplicidade(numero,tabela,numeros){
        const sql = `SELECT id FROM ${tabela} WHERE numero='${numero}' LIMIT 1`       
        const rpt = await this.querySync(sql) 
        console.log('duplicado',rpt.length)
        if(rpt.length==1){
            const sql = `UPDATE ${tabela} SET duplicado=1 WHERE id=${rpt[0].id}`     
            await this.querySync(sql) 
            return 1
        }            
        return 0
    }

    async totalNumerosFiltrados(tabela,campanha,uf){
        const sql = `SELECT COUNT(id) AS numeros FROM mailings.${tabela} WHERE campanha_${campanha}=0 AND uf='${uf}' AND valido=1 `
        const r = await this.querySync(sql)
        return r[0].numeros
    }

    //Listar mailings importados
    async listaMailing(){
        const sql = `SELECT id,
                            DATE_FORMAT (data,'%d/%m/%Y') AS data_importacao,
                            DATE_FORMAT (termino_importacao,'%d/%m/%Y') AS conclusao_importacao,
                            nome,
                            arquivo,
                            tabela_dados,
                            tabela_numeros,                            
                            totalReg,
                            totalNumeros,
                            repetidos as numerosRepetidos,
                            numerosInvalidos,
                            configurado,
                            pronto,
                            status 
                       FROM mailings WHERE  configurado=1 AND status=1 ORDER BY id DESC`
        return  await this.querySync(sql);       
    }

    //Abre o mailing importado por paginas com a qtd de reg informada
    async abrirMailing(id,p,r){
        let sql = `SELECT tabela_dados FROM mailings WHERE id=${id}`
        const rows = await this.querySync(sql)
        const qtd=r
        const pag=((p-1)*r)
        const tabela = rows[0].tabela_dados
        console.log(`SELECT * FROM mailings.${tabela} LIMIT ${pag},${qtd}`)            
        sql = `SELECT * FROM mailings.${tabela} LIMIT ${pag},${qtd}`
        return await this.querySync(sql)
    }

    //ExportarMailing
    async exportarMailing(idMailing,res){
        let sql = `SELECT tabela_dados,nome FROM mailings WHERE id=${idMailing}` 
        const r = await this.querySync(sql)
        sql = `SELECT * FROM mailings.${r[0].tabela_dados}`
        const data = await this.querySync(sql)
        const json2csvParser = new (0, _json2csv.Parser)({ delimiter: ';' });
        const csv = json2csvParser.parse(data);
        res.attachment(`mailing_${r[0].nome}.csv`)
        res.status(200).send(csv);
    }   

    //Remover Mailing
    async removerMailing(idMailing){
        let sql = `SELECT tabela_dados,tabela_numeros FROM mailings WHERE id=${idMailing}`
        const result = await this.querySync(sql)
        if(result.length==0){
            return false
        }
        //Removendo os dados do mailing
        const tabelaDados = result[0].tabela_dados
        const tabelaNumeros = result[0].tabela_numeros
        sql = `DROP TABLE mailings.${tabelaDados}`//Removendo tabela de dados
        await this.querySync(sql)
        sql = `DROP TABLE mailings.${tabelaNumeros}`//Removendo tabela de numeros
        await this.querySync(sql)
        sql=`DELETE FROM mailings WHERE id=${idMailing}` //Removendo informações do Mailing
        await this.querySync(sql)
        sql=`DELETE FROM mailing_tipo_campo WHERE idMailing=${idMailing}` //Removendo configuracoes dos tipos de campos
        await this.querySync(sql)
        sql=`DELETE FROM campanhas_mailing WHERE idMailing=${idMailing}`//Removendo mailing das campanhas
        await this.querySync(sql)
        sql=`DELETE FROM campanhas_campos_tela_agente WHERE idMailing='${idMailing}'` //Removendo configurações da tela do agente
        await this.querySync(sql)
        return true
    }

    //Status mailing
    async statusMailing(idMailing,callback){
        const sql = `SELECT configurado,totalReg,totalNumeros,pronto,status FROM mailings WHERE id=${idMailing}`
        return await this.querySync(sql) 
    }

    //Conta os ufs do mailing
    async ufsMailing(idCampanha){
        const infoMailing = await _Campanhas2.default.infoMailingCampanha(idCampanha)
        if(infoMailing.length==0){
            return false
        }
        const idMailing = infoMailing[0].id
        const tabela = infoMailing[0].tabela_numeros

        let sql = `SELECT COUNT(uf) AS total, uf FROM mailings.${tabela} WHERE valido=1 GROUP BY uf`
        const r = await  this.querySync(sql)     
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
        const ufs={}
        for(let i=0; i<r.length; i++){
            let fill = "#185979"
            let totalNumeros=r[i].total
            let numerosFiltrados = await this.totalNumerosFiltrados(tabela,idCampanha,r[i].uf)
            let disponiveis = totalNumeros-numerosFiltrados
           
            if(disponiveis==0){
                fill="#f74c4c"
            }
            ufs[`${r[i].uf}`]={}
            ufs[`${r[i].uf}`]['fill']=fill
            ufs[`${r[i].uf}`]['total']=totalNumeros
            ufs[`${r[i].uf}`]['filtrados']=numerosFiltrados,
            ufs[`${r[i].uf}`]['disponiveis']=disponiveis
            const filter = estados.find(estado => estado.uf == r[i].uf)
            ufs[`${r[i].uf}`]['name']=`${filter.estado}`
        }
        
        return ufs
    }

    //DDDs por uf do mailing
    async  dddsUfMailing(tabela,uf){
        const sql = `SELECT ddd, COUNT(id) AS total FROM mailings.${tabela} WHERE uf='${uf}' GROUP BY ddd ORDER BY ddd ASC`
        return await this.querySync(sql)
    }

    //Resumo por ddd
    async totalRegUF(tabela){
        const sql = `SELECT uf AS UF, COUNT(id) AS numeros, COUNT(DISTINCT id_registro) AS registros FROM mailings.${tabela} GROUP BY uf ORDER BY uf ASC`
        return await this.querySync(sql)
    }

    //Saude do mailing
    async totalRegistros(tabela){
        const sql = `SELECT COUNT(id) AS total FROM mailings.${tabela}`
        const reg = await this.querySync(sql)
        return reg[0].total
    }

    async registrosContatados(tabela){
        const sql = `SELECT COUNT(id) AS total FROM mailings.${tabela} WHERE contatado='S'`
        const reg = await this.querySync(sql)
        return reg[0].total
    }

    async registrosNaoContatados(tabela){
        const sql = `SELECT COUNT(id) AS total FROM mailings.${tabela} WHERE contatado='N'`
        const reg = await this.querySync(sql)
        return reg[0].total
    }
    
}
exports. default = new Mailing();