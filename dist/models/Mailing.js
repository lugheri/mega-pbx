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
                const field = k.replace(/�/gi, "ç")
                               .replace(" ", "_")
                               .replace("/", "_")
                console.log('campo',field)
                campos+=`${field} VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`
            }else{
                campos+=`campo_${(i+1)} VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`
            }
        }
        const sql = `CREATE TABLE IF NOT EXISTS mailings.${tableData} 
                        (id_key_base INT(11) NOT NULL AUTO_INCREMENT, 
                        ${campos}
                        get_numbers INT(4) NULL DEFAULT NULL,
                        PRIMARY KEY (id_key_base) USING BTREE) 
                        COLLATE='utf8_general_ci' ENGINE=InnoDB;`
        console.log('sql',sql)
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
                        erro VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        tentativas INT(11) NULL DEFAULT NULL,
                        status_tabulacao INT(11) NULL DEFAULT NULL,
                        contatado CHAR(2) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
                        produtivo INT(11) NULL DEFAULT NULL, 
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
                               (data,nome,arquivo,header,delimitador,tabela_dados,tabela_numeros,repetidos,pronto,status) 
                        VALUES (NOW(),'${nome}','${arquivo}',${header},'${delimitador}','${tableData}','${tableNumber}',0,0,1)`
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
                    if(value.length>9){
                        typeField='ddd_e_telefone'; 
                    }else{
                        typeField='telefone';
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

    async importaDadosBase(idBase,jsonFile,file,header,tabData){       
        const tabela = `mailings.${tabData}`
        let erros=0
        //Importa registros na tabela de dados
        let fields=Object.keys(jsonFile[0])
        let fieldsTb=[]
        for(let i = 0; i <fields.length;i++){
            fieldsTb.push(fields[i].replace(' ','_').replace("/", "_"))
        }        
        
        // fieldsTb=fields
        if(header==0){
           
            for(let i=0; i<fields.length; i++){
                fieldsTb.push(`campo_${i+1}`)
            }
        }

        const totalBase = jsonFile.length
        let transferRate
        if(totalBase<=100000){
            transferRate=2000
        }else if(totalBase<=300000){
            transferRate=1000
        }else if(totalBase<=500000){
            transferRate=500
        }else if(totalBase<=700000){
            transferRate=300
        }else if(totalBase<=900000){
            transferRate=200    
        }else{
            transferRate=100
        }

        let sqlData=`INSERT INTO ${tabela}
                                 (${fieldsTb}) 
                           VALUES `;        
        let limit=totalBase
        if(totalBase>transferRate){
            limit=transferRate
        }  

        for(let i=0; i<limit; i++){
            sqlData+=" (";
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
            jsonFile.shift()             
        } 
        
        _dbConnection2.default.pool.query(sqlData,async (erro,result)=>{ 
            if(erro) throw erro;

            let tr = await this.totalReg(tabela)
            let totalReg=tr[0].total
            if(jsonFile.length>0){
                const sql = `UPDATE mailings SET totalReg='${totalReg}' WHERE id='${idBase}'`
                _dbConnection2.default.pool.query(sql,async (erro,result)=>{                   

                    await this.importaDadosBase(idBase,jsonFile,header,tabData)
                })
            }else{
                //gravando log
                const sql = `UPDATE mailings SET termino_importacao=now(), configurado=1, pronto=0, totalReg='${totalReg}' WHERE id='${idBase}'`
                _fs2.default.unlinkSync(file)
                return await this.querySync(sql)
            }                   
        })
    }

    //Conta o total de registros em uma tabela de mailing
    async totalReg(tabela){
        const sql = `SELECT count(id_key_base) as total FROM ${tabela}`
        return await this.querySync(sql)
    }

    async separarNumeros(idBase){           
        const infoMailing=await this.infoMailing(idBase)
  
        //verificando se possuem campos apenas de ddd
        const sql_ddds = `SELECT campo FROM mailing_tipo_campo WHERE idMailing=${idBase} AND tipo='ddd'`
        const field_ddd = await this.querySync(sql_ddds)
        //verificando se possuem campos apenas de numero
        const sql_numeros = `SELECT campo FROM mailing_tipo_campo WHERE idMailing=${idBase} AND tipo='telefone'`
        const fieldNumeros = await this.querySync(sql_numeros)
        //verificando se possuem campos de ddd e numero
        const sql_completo = `SELECT campo FROM mailing_tipo_campo WHERE idMailing=${idBase} AND tipo='ddd_e_telefone'`
        const fieldCompleto = await this.querySync(sql_completo)
        let type_ddd=""
        let type_numero=[]
        let type_completo=[]

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

        const sql = `SELECT id_key_base FROM mailings.${infoMailing[0].tabela_dados} WHERE get_numbers is null ORDER BY id_key_base ASC LIMIT 1`
        const pendentes = await this.querySync(sql)
        if(pendentes.length==0){
            //contar numeros
            const totalNumeros = await this.totalNumeros(infoMailing[0].tabela_numeros)
            const sql = `UPDATE mailings SET termino_importacao = NOW(),totalNumeros=${totalNumeros[0].numeros}, pronto=1 WHERE id=${idBase}`
            await this.querySync(sql)  
            return true
        }else{
            const limit=1 
            await this.separaNumeroBase(idBase,type_ddd,type_numero,type_completo,limit)
            await this.separarNumeros(idBase)
        }
    }

    async separaNumeroBase(idBase,type_ddd,type_numero,type_completo,limit){
        const infoMailing=await this.infoMailing(idBase)
        
        const sql = `SELECT id_key_base FROM mailings.${infoMailing[0].tabela_dados} WHERE get_numbers is null ORDER BY id_key_base ASC LIMIT ${limit}`
        const registros = await this.querySync(sql)    
       
        let campos_ddd = "";
        if(type_ddd!=""){
            campos_ddd=`${type_ddd},`
        }
        
        let campos_numero=""
        for(let i=0; i<type_numero.length; i++){
            campos_numero += `${type_numero[i]},`
        }

        let campos_completo=""
        for(let i=0; i<type_completo.length; i++){
            campos_completo += `${type_completo[i]},`
        }
        
        for(let i=0; i<registros.length; i++){
            let idR=registros[i].id_key_base  
            
            const sql = `SELECT ${campos_ddd} ${campos_numero} ${campos_completo} id_key_base 
                           FROM mailings.${infoMailing[0].tabela_dados} 
                          WHERE id_key_base=${idR} AND get_numbers is null `
            let numeros = await this.querySync(sql)
           
            //iniciar separacao dos numeros
            let ddd = 0 
            if(type_ddd!=""){               
                ddd = numeros[0][type_ddd]
            }
            for(let n=0; n<type_numero.length; n++){
                let numero = numeros[0][type_numero[n]]
                let numeroCompleto = ddd+numero
                await this.insereNumero(ddd,numeroCompleto,idBase,infoMailing[0].tabela_dados,infoMailing[0].tabela_numeros,idR)//Inserindo numero
            }

            for(let nc=0; nc<type_completo.length; nc++){
                let numeroCompleto = numeros[0][type_completo[nc]]
                if(ddd==0){
                    ddd = numeroCompleto.slice(0,2)
                }               
                await this.insereNumero(ddd,numeroCompleto,idBase,infoMailing[0].tabela_dados,infoMailing[0].tabela_numeros,idR)//Inserindo numero
            }

        } 
        
    }

    async checaDuplicidade(numero,tabela){
        const sql = `SELECT id FROM mailings.${tabela} WHERE numero='${numero}' LIMIT 1`
        const rpt = await this.querySync(sql)
        if(rpt.length==1){
            return true
        }
        return false
    }

    async insereNumero(ddd,numeroCompleto,idBase,tabelaDados,tabelaNumeros,idR){ 
        if(await this.checaDuplicidade(numeroCompleto,tabelaNumeros)===true){
            const sql = `UPDATE mailings SET repetidos=repetidos+1 WHERE id=${idBase}`
            await this.querySync(sql)
            return false
        }
        //verificando ddd
        let err="ok"
        let valido=1
        let tipo=""
        let n = numeroCompleto.slice(2,3)
        if(ddd==0){
             err = "DDD não informado";
             valido=0
        }
        
        const uf = this.separandoUF(ddd)
        
        if(uf=='er'){
            err = 'DDD invalido'
            valido=0
        }

        //validando numero
        if((numeroCompleto.length<10)&&(numeroCompleto.length>11)){
            err="numero inválido"
            valido=0
        }else{
            if(numeroCompleto.length==10){
                if(n>=6){
                    err="Primeiro dígito inválido para fixo"
                    valido=0
                }else{
                    tipo='fixo'
                }
            }else{
                if(n>=7){
                    tipo='celular'
                }else{
                    err="Primeiro dígito inválido para celular"
                    valido=0
                }
            }
        }
       
        let sql = `INSERT INTO mailings.${tabelaNumeros}
                                 (id_mailing,id_registro,ddd,numero,uf,tipo,valido,erro,tentativas,status_tabulacao,contatado,produtivo) 
                          VALUES (${idBase},${idR},${ddd},'${numeroCompleto}','${uf}','${tipo}',${valido},'${err}',0,0,0,0)`
                         
        try{          
            await this.querySync(sql)     
        }catch(err){
            console.log(err);
        }
    
        sql = `UPDATE mailings.${tabelaDados} SET get_numbers=1 WHERE id_key_base=${idR}`
        try{
            await this.querySync(sql)     
        }catch(err){
            console.log(err);
        }   
        return true
    }

    separandoUF(ddd){
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

    async totalNumeros(tabela){
        const sql = `SELECT COUNT(id) AS numeros FROM mailings.${tabela} WHERE valido=1`
        
        return await this.querySync(sql)
    }

    async totalNumerosFiltrados(tabela,campanha,uf){
        const sql = `SELECT COUNT(id) AS numeros FROM mailings.${tabela} WHERE campanha_${campanha}=0 AND uf='${uf}' AND valido=1 `
        const r = await this.querySync(sql)
        return r[0].numeros
    }

    //Listar mailings importados
    async listaMailing(){
        const sql = 'SELECT * FROM mailings WHERE status = 1 ORDER BY `id` DESC'
        return await this.querySync(sql);
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
        const sql = `SELECT uf AS UF, COUNT(id) AS registros FROM mailings.${tabela} GROUP BY uf ORDER BY uf ASC`
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

   








    /*
    AGUARDANDO TESTES PARA REMOVER

    //OLD_________________________________________________________________________________________________

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
        
        connect.mailings.query(sql,callback)
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
        connect.banco.query(sql,callback)
    }

    //Adiciona as informacoes do mailing na tabela de controle de mailings
    addMailing(nome,nomeTabela,filename,callback){       
        const sql = `INSERT INTO mailings (data,termino_importacao,nome,arquivo,tabela,pronto,higienizado,status) VALUES (NOW(),now(),'${nome}','${filename[1]}','mailings_${nomeTabela}',0,0,1)`
        connect.banco.query(sql,callback)
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
            connect.mailings.query(insertHeader,(erro)=>{
                if(erro) throw erro;
                
            })
        }
        //console.log('Campos => '+campos)

        //setando o campo de ddd
        const sql=`SELECT campo,tipo FROM mailing_tipo_campo WHERE tabela='mailings_${nomeTabela}' AND (tipo = 'ddd' OR tipo = 'ddd_e_telefone') LIMIT 1`;
        connect.banco.query(sql,(erro,result)=>{
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
        connect.mailings.query(sqlValue,(erro,result)=>{ 
            if(erro) console.log(erro)

            this.totalReg(`mailings_${nomeTabela}`, (erro,resultado)=>{
                if(erro) throw erro;
               
                let totalReg = resultado[0].total
                if(base.length>0){
                    const sql = `UPDATE mailings SET totalReg='${totalReg}' WHERE id='${base_id}'`
                    connect.banco.query(sql,(erro,result)=>{
                        this.importaDados(base,nomeTabela,campos,base_id,campoDDD,callback)
                    })
                }else{
                    //gravando log
                    const sql = `UPDATE mailings SET termino_importacao=now(), pronto=1, totalReg='${totalReg}' WHERE id='${base_id}'`
                    connect.banco.query(sql,callback)
                      
                }                   
            })
        })    
    }    

    //CONFIGURA O MAILING
    //Lista os campos disponiveis do mailing
    camposMailing(tabela,callback){
        const sql = `SELECT id, campo, apelido, tipo FROM mailing_tipo_campo WHERE tabela='${tabela}' AND conferido=1 ORDER BY ordem ASC`
        connect.banco.query(sql,callback)
    }   
    
    //Campos do Mailing e seu tipo
    camposVsTipo(tabela,callback){
        const sql = `SELECT id as idCampo,campo,apelido,tipo,conferido FROM mailing_tipo_campo WHERE tabela='${tabela}'`
        connect.banco.query(sql,callback)
    }

    //Atualizar tipo do campo
    atualizaTipoCampo(idCampo,apelido,novoTipo,callback){
        const sql = `UPDATE mailing_tipo_campo SET apelido='${apelido}', tipo='${novoTipo}', conferido=1 WHERE id=${idCampo}`
        connect.banco.query(sql,callback)
    }

    nomeTabela_byidCampo(idCampo,callback){
        const sql = `SELECT tabela FROM mailing_tipo_campo WHERE id=${idCampo}`
        connect.banco.query(sql,callback)
    }

    confereCampos(tabela,callback){
        const sql = `SELECT COUNT(id) AS pendentes FROM mailing_tipo_campo WHERE tabela='${tabela}' AND (conferido=0 OR conferido IS null)`
        connect.banco.query(sql,callback)
    }

    configuraMailing(tabela,configurado,callback){
        const sql = `UPDATE mailings SET configurado=${configurado} WHERE tabela='${tabela}'`
        connect.banco.query(sql,callback)
    }

    */





    

   

    
}
exports. default = new Mailing();



