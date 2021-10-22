import connect from '../Config/dbConnection';
import csv from 'csvtojson';
import { Parser } from 'json2csv';
import utf8 from 'utf8';
import fs from "fs";
import Campanhas from '../models/Campanhas'
import moment from 'moment';
import Clients from './Clients'

class Mailing{
    /*
    async querySync(sql,empresa){
        const hostEmp = await Clients.serversDbs(empresa)
        const connection = connect.poolConta(hostEmp)
        const promisePool =  connection.promise();
        const result = await promisePool.query(sql)
        promisePool.end();
        return result[0];       
    }
    async querySync(conn,sql,empresa){
        return new Promise(async(resolve,reject)=>{
            const hostEmp = await Clients.serversDbs(empresa)
            conn.query
            const conn = connect.poolConta(hostEmp)
            conn.query(sql,(e,rows)=>{
                if(e) reject(e);
                resolve(rows)
            })
            conn.end()                        
        })
    }*/
    async querySync(conn,sql){         
        return new Promise((resolve,reject)=>{            
            conn.query(sql, (err,rows)=>{
                if(err) return reject(err)
                resolve(rows)
            })
        })
    } 



    //Abre o csv do mailing a ser importado
    async abreCsv(path,delimitador,callback){
        await csv({delimiter:delimitador}).fromFile(path,'binary').then(callback)
    }

    async criarTabelaMailing(empresa,keys,nome,nomeTabela,header,filename,delimitador){
        return new Promise (async (resolve,reject)=>{ 
            const pool = await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                if(err) throw err
            
                let campos='';
                //Dados do Mailing
                const tableData=`dados_${nomeTabela}`

                for(let i=0; i<keys.length; i++){
                    if(header==1){
                        let k = keys[i]
                        const field = k.replace(" ", "_")
                                    .replace("/", "_")
                                    .normalize("NFD").replace(/[^a-zA-Z0-9]/g, "");
                        campos+=`${field} VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`
                    }else{
                        campos+=`campo_${(i+1)} VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_general_ci',`
                    }
                }
                const sql = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.${tableData} 
                                (id_key_base INT(11) NOT NULL AUTO_INCREMENT, 
                                ${campos}
                                valido INT(4) NULL DEFAULT NULL,
                                tratado INT(4) NULL DEFAULT NULL,
                                PRIMARY KEY (id_key_base) USING BTREE) 
                                COLLATE='utf8_general_ci' ENGINE=InnoDB;`
                await this.querySync(conn,sql)      

                //Numeros do Mailing        
                const tableNumbers=`numeros_${nomeTabela}`
                 const sqlN = `CREATE TABLE IF NOT EXISTS ${empresa}_mailings.${tableNumbers} 
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
                                selecionado INT(11) NULL DEFAULT '0', 
                                PRIMARY KEY (id) USING BTREE,
                                INDEX ddd (ddd),
                                INDEX uf (uf),
                                INDEX tipo (tipo),
                                INDEX produtivo (produtivo),
                                INDEX contatado (contatado),
                                INDEX status_tabulacao (status_tabulacao)) 
                                COLLATE='utf8_general_ci' ENGINE=InnoDB;`
                await this.querySync(conn,sqlN)  
                
                const insertMailing = await this.addInfoMailing(empresa,nome,tableData,tableNumbers,filename,header,delimitador)
                const retorno = await this.infoMailing(empresa,insertMailing['insertId']);     
               
                pool.end((err)=>{
                    if(err) console.log('Mailings 111', err)
                })

                resolve(retorno)
                
            }) 
           
        })   
    }

    //Adiciona as informacoes do mailing na tabela de controle de mailings
    async addInfoMailing(empresa,nome,tableData,tableNumber,arquivo,header,delimitador){
        return new Promise (async (resolve,reject)=>{       
            const sql = `INSERT INTO ${empresa}_dados.mailings
                                (data,nome,arquivo,header,delimitador,tabela_dados,tabela_numeros,configurado,repetidos,numerosInvalidos,pronto,status) 
                            VALUES (NOW(),'${nome}','${arquivo}',${header},'${delimitador}','${tableData}','${tableNumber}',0,0,0,0,1)`
            //Executando query
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log('Mailings 132', err)
                }) 
                resolve(rows)   
            })
        })                   
    }

    async infoMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{       
            const sql = `SELECT * 
                        FROM ${empresa}_dados.mailings 
                        WHERE id=${idMailing}`
            
            //Executando query
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                   if(err) console.log('Mailings 150', err)
                }) 
                resolve(rows)   
            })
        })   
    }

    async infoMailingAtivo(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{ 
            const sql = `SELECT * 
                        FROM ${empresa}_dados.mailings 
                        WHERE id=${idMailing} AND pronto=1`
           //Executando query
           const pool =  await connect.pool(empresa,'dados')
           pool.getConnection(async (err,conn)=>{                           
               const rows =  await this.querySync(conn,sql)                  
               pool.end((err)=>{
                  if(err) console.log('Mailings 167', err)
               }) 
               resolve(rows)   
           }) 
        })
    }

    async tabelaMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{
            const sql = `SELECT tabela_dados, tabela_numeros 
                       FROM ${empresa}_dados.mailings
                      WHERE id=${idMailing}`
            //Executando query
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                if(err) console.log('Mailings 184', err)
                }) 
                resolve(rows)   
            })
        })
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
                    if((value.length>=8)&&(value.length<=9)){
                        typeField='telefone';
                    }else if(value.length>9){
                        typeField='ddd_e_telefone'; 
                    }else{
                        typeField='dados';
                    }
                }else if((title=='cpf')||
                         (title=='CPF')){
                    typeField = 'cpf';                
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

    async configuraTipoCampos(empresa,idBase,header,campos){
        return new Promise (async (resolve,reject)=>{      
      
            let sql=`INSERT INTO ${empresa}_dados.mailing_tipo_campo 
                            (idMailing,campo,nome_original_campo,apelido,tipo,conferido,ordem) 
                     VALUES `;       

            for(let i=0; i<campos.length; i++){
                let nomeCampo=campos[i].name                
                
                nomeCampo.replace(" ", "_")
                        .replace("/", "_")
                        .normalize("NFD")
                        .replace(/[^a-zA-Z0-9]/g, "");
                let nomeOriginal=campos[i].name//.replace("-", "_").replace(" ", "_").replace("/", "_").normalize("NFD").replace(/[^a-zA-Z0-9]/g, "")
                let apelido = campos[i].apelido
                if(header==0){
                    nomeCampo=`campo_${i+1}`
                    nomeOriginal=nomeCampo
                }
                //Caso o tipo seja nome a ordem será zero
                let ordem = i+1
                if(campos[i].tipo=="nome"){
                    ordem=0
                }
                sql +=`(${idBase},'${nomeCampo}','${nomeOriginal}','${apelido}','${campos[i].tipo}',1,${ordem})`
                if((i+1)<campos.length){ sql +=', '}
            }
            
            //Executando query
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{                           
                const rows =  await this.querySync(conn,sql)                  
                pool.end((err)=>{
                    if(err) console.log('Mailings 285', err)
                }) 
                resolve(rows)   
            })
        })
    }

    async importarDadosMailing(empresa,idBase,jsonFile,file,delimitador,header,dataTab,numTab,idKey,transferRate){
        return new Promise (async (resolve,reject)=>{    
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{         
        
                //Tabela para importação dos dados
                const tabelaDados = `${empresa}_mailings.${dataTab}`
                //contador de erros
                let erros=0
                //Lendo linha de titulo das colunas do arquivo
                let fields=Object.keys(jsonFile[0])
                let fieldsTb=[]//array dos campos que irao para query

                //Populando array com o titulo das colunas conforme foram formatadas na tabela
                for(let i = 0; i <fields.length;i++){
                    fieldsTb.push(fields[i]
                            .replace("-", "_")
                            .replace(" ", "_")
                            .replace("/", "_")
                            .normalize("NFD")
                            .replace(/[^a-zA-Z0-9]/g, ""))
                } 

                //Verifica se o arquivo possui linha de titulo
                if(header==0){//Caso nao possua, cria uma linha para titulo de acordo com a qtd. Ex.: campo_1, campo_2, campo_3, ...
                    for(let i=0; i<fields.length; i++){
                        fieldsTb.push(`campo_${i+1}`)
                    }
                }

                //Le o total de registros a serem importados
                const totalBase = jsonFile.length
                let rateInicial=0
                if(transferRate==1){
                    rateInicial=totalBase
                }else{
                    rateInicial=transferRate
                }
                //Calcula o rate de transferencia
                const rate = await this.calcRate(totalBase,100,5000,rateInicial,1)
        
                //Iniciar query de importação
                let sqlData=`INSERT INTO ${tabelaDados}
                                (id_key_base,${fieldsTb},valido,tratado) 
                            VALUES `;

                //Verifica se registro possui campo de cpf para validacao de repetição de clientes
                //Verificando qual é a coluna do cpf 
                const sql_col_cpf = `SELECT nome_original_campo as colCPF
                                    FROM ${empresa}_dados.mailing_tipo_campo
                                    WHERE idMailing=${idBase}
                                        AND tipo='cpf'`
            
                const col_cpf = await this.querySync(conn,sql_col_cpf)        

                //Iniciar separação dos registros

                //Id do registro
                let indice = idKey
                const cpfs=[]//Array dos cpf a serem inseridos nesse loop
                const verificarCPF = false //Inativa/Ativa a verificacao de CPF para mailings verticais

                //Iniciando o loop dos dados a serem inseridos de acordo com o transferRate
                for(let i=0; i<rate; i++){
                    //Cria o indice do registro de acordo com o id da base, um inicializador (1000000) + o indice do idKey(1+)
                    let indiceReg = (idBase * 1000000) + indice
                    let regValido=1//Flag de registro valido
                    //Separa o cpf caso exista
                
                    if((col_cpf.length>=1)&&(verificarCPF==true)){
                        let cpf = jsonFile[0][col_cpf[0].colCPF]
                
                        //Verifica se o cpf existe
                        if(cpfs.includes(cpf)==true){//Caso o cpf conste no array de cpfs
                            regValido=0
                        }else{
                            //checa se o cpf ja foi adicionado nesta tabela
                            let checkCPF = await this.checkCPF(empresa,col_cpf[0].colCPF,cpf,tabelaDados)
                            if(checkCPF==true){
                                regValido=0
                            }                    
                        }
                        //adiciona o cpf atual no array
                        cpfs.push(cpf);
                    }

                    //Começa a montagem da query de cada registro
                    sqlData+=" (";
                    sqlData+=`${indiceReg},`  
                    //Percorrendo todos as colunas da tabela
                    for(let f=0; f<fields.length; f++){
                        //separa o valor da coluna na linha correspondente
                        let valor=jsonFile[0][fields[f]]
                        sqlData+=`'${valor.toString().replace(/'/gi,'')}',`//Insere o valor formatado de cada coluna na query
                    }

                    sqlData+=`${regValido},`//CPF
                    sqlData+='0)'//Tratado

                    //Fecha a query
                    if(i>=rate-1){
                        sqlData+=`;`;
                    }else{
                        sqlData+=`,`; 
                    }
                    //Incrementa o indice para proximo loop
                    indice++
                    //Removendo campos importados do arquivo carregado 
                    jsonFile.shift()  
                }            
                //Executa a query de insersão de dados       
                await this.querySync(conn,sqlData)
                
                //Conta quantos registros ja foram importados      
                let tR = await this.totalReg(empresa,tabelaDados)//Nome da empresa ja incluido no nome da tabela
                let totalReg=tR[0].total
                //atualiza no resumo do mailing
                let sql = `UPDATE ${empresa}_dados.mailings 
                            SET configurado=1, 
                                totalReg='${totalReg}',
                                totalNumeros='0'
                            WHERE id='${idBase}'`
                await this.querySync(conn,sql)        

                //Verificando restantes para reexecução
                if(jsonFile.length>0){
                    //continua a importação dos dados
                    pool.end((err)=>{
                        if(err) console.log('Mailings 434', err)
                        console.log('Continuando importacao ...')
                    }) 
                    await this.importarDadosMailing(empresa,idBase,jsonFile,file,delimitador,header,dataTab,numTab,indice,rate)
                }else{     
                    //Cria indice na coluna de cpf caso o mesmo exista
                    if((col_cpf.length>=1)&&(verificarCPF==true)){
                        const sqlIndex = `ALTER TABLE ${tabelaDados} ADD FULLTEXT INDEX ${col_cpf[0].colCPF} (${col_cpf[0].colCPF})`;
                        await this.querySync(conn,sqlIndex)
                    }      
                    //Inicia separação dos numeros    
                    this.abreCsv(file,delimitador,async (jsonFile)=>{//abrindo arquivo
                        let idKey = 1
                        let transferRate=1
                        const fileOriginal=jsonFile
                        await this.separaNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,idKey,transferRate,verificarCPF)  
                    })
                    pool.end((err)=>{
                        if(err) console.log('Mailings 434', err)

                        console.log('encerrou importacao dos dados')
                    }) 
                }
              
            })
        })
    }
    
    async separaNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,indice,transferRate,verificarCPF){ 
        return new Promise (async (resolve,reject)=>{   
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{          
                //Verifica se o numero possui cpf
                let colunaCPF=""
                const sql_col_cpf = `SELECT nome_original_campo as colCPF
                                    FROM ${empresa}_dados.mailing_tipo_campo
                                    WHERE idMailing=${idBase}
                                        AND tipo='cpf'`
                const col_cpf = await this.querySync(conn,sql_col_cpf)
                if(col_cpf.length>0){
                    colunaCPF=col_cpf[0].colCPF
                }

                //Iniciando separacao das colunas de numeros
                let colunaDDD=""
                let colunaNumero=[]
                let colunaNumeroCompleto=[]
                
                //Verificando coluna dos ddds
                const col_sql_ddds = `SELECT nome_original_campo as campo 
                                    FROM ${empresa}_dados.mailing_tipo_campo 
                                WHERE idMailing=${idBase} 
                                    AND tipo='ddd'`
                const col_ddd = await this.querySync(conn,col_sql_ddds)
                
                //verificando coluna dos numeros
                const col_sql_numeros = `SELECT nome_original_campo as campo 
                                    FROM ${empresa}_dados.mailing_tipo_campo 
                                    WHERE idMailing=${idBase} 
                                        AND tipo='telefone'`                                
                const col_numeros = await this.querySync(conn,col_sql_numeros)
                

                //verificando colunas de  ddd e numero
                const col_sql_completo = `SELECT nome_original_campo as campo 
                                        FROM ${empresa}_dados.mailing_tipo_campo 
                                    WHERE idMailing=${idBase} 
                                        AND tipo='ddd_e_telefone'`                       
                const col_numeroCompleto = await this.querySync(conn,col_sql_completo)

                /*console.log('colunaDDD',col_ddd)
                console.log('colunaNumero',col_numeros)
                console.log('colunaNumeroCompleto',col_numeroCompleto[0].campo)
                console.log('jsonFile',jsonFile)*/
                
                if(col_ddd.length>0){
                    colunaDDD=col_ddd[0].campo
                }
                if(col_numeros.length>0){
                    for(let i=0; i<col_numeros.length; i++){
                        colunaNumero.push(col_numeros[i].campo)
                    }
                }
                if(col_numeroCompleto.length>0){
                    for(let i=0; i<col_numeroCompleto.length; i++){
                        colunaNumeroCompleto.push(col_numeroCompleto[i].campo)
                    }
                } 

                //Inicia a query
                let sqlNumbers=`INSERT INTO ${empresa}_mailings.${numTab}
                                        (id_mailing,id_registro,ddd,numero,uf,tipo,valido,duplicado,erro,tentativas,status_tabulacao,contatado,produtivo)
                                    VALUES `;

                //Calcula o rate de transferencia
                const totalBase = jsonFile.length
                let rateInicial=0
                if(transferRate==1){
                    rateInicial=totalBase
                }else{
                    rateInicial=transferRate
                }
                const rate = await this.calcRate(totalBase,100,5000,rateInicial,1)
                /*let rate=5
                if(totalBase<=5){
                    rate = totalBase
                }*/
                
                //console.log('totalBase',totalBase)
                //console.log('rate',rate)

                let idReg = indice

                for(let i=0; i<rate; i++){
                    let idRegistro = (idBase * 1000000) + idReg
                    //verifica se existe cpf
                    if((colunaCPF!="")&&(verificarCPF==true)){
                        let cpf = jsonFile[0][colunaCPF]
                            console.log('checou cpf')
                        //verifica id do registro deste cpf que é valido
                        const idReg_cpf = await this.checkIdReg_cpf(empresa,dataTab,colunaCPF,cpf)
                        if(idReg_cpf!=false){
                            //atualiza o id do registro com o id do registro valido deste cpf
                            idRegistro=idReg_cpf
                        }
                    }
                    
                    //Separando Telefones
                    let ddd = 0 
                    if(colunaDDD!=""){               
                        ddd = jsonFile[0][colunaDDD]               

                        ddd.toString().replace(/[^0-9]/g, "")
                        .replace("-", "")
                        .replace(" ", "")
                        .replace("/", "")
                        //console.log('DDD',ddd)         
                    }            

                
                    
                    for(let n=0; n<colunaNumero.length; n++){//Numeros
                    
                        let numero = jsonFile[0][colunaNumero[n]]
                        numero.toString()
                            .replace(/[^0-9]/g, "")
                            .replace("-", "")
                            .replace(" ", "")
                            .replace("/", "")
                        if(numero){ 
                            let numeroCompleto = ddd+numero     
                        //  console.log('numero',numeroCompleto)              
                            let duplicado = 0//await this.checaDuplicidade(empresa,numeroCompleto,tabelaNumeros)
                            //Inserindo ddd e numero na query
                            numeroCompleto= this.filterInt(numeroCompleto)
                            const infoN = this.validandoNumero(ddd,numeroCompleto)
                            
                            
                            sqlNumbers+=`(${idBase},${idRegistro},${infoN['ddd']},'${numeroCompleto}','${infoN['uf']}','${infoN['tipo']}',${infoN['valido']},${duplicado},'${infoN['message']}',0,0,0,0),`;
                        
                        }
                    }
                    
                    for(let nc=0; nc<colunaNumeroCompleto.length; nc++){//Numeros
                        let numeroCompleto = jsonFile[0][colunaNumeroCompleto[nc]]
                        //console.log('numeroCompleto',numeroCompleto)    
                        if(numeroCompleto){
                            numeroCompleto.toString()
                                        .replace(/[^0-9]/g, "")
                                        .replace("-", "")
                                        .replace(" ", "")
                                        .replace("/", "") 
                            let dddC = numeroCompleto.slice(0,2)     
                            let duplicado = 0 //await this.checaDuplicidade(numeroCompleto,tabelaNumeros)
                            numeroCompleto= this.filterInt(numeroCompleto)
                            const infoN = this.validandoNumero(dddC,numeroCompleto)
                            
                        
                            sqlNumbers+=` (${idBase},${idRegistro},${infoN['ddd']},'${numeroCompleto}','${infoN['uf']}','${infoN['tipo']}',${infoN['valido']},${duplicado},'${infoN['message']}',0,0,0,0),`;
                        }
                    }
                    idReg++
                    jsonFile.shift()//Removendo campos importados do arquivo carregado   
                } 
                
                
                let queryNumeros = sqlNumbers.slice(0,sqlNumbers.length-1)+';'
            

                //console.log('queryNumeros',queryNumeros)
                await this.querySync(conn,queryNumeros)   
                    
                let tN = await this.totalNumeros(empresa,`${empresa}_mailings.${numTab}`)//Nome da empresa ja incluido no nome da tabela
                let totalNumeros=tN[0].total
                let sql = `UPDATE ${empresa}_dados.mailings 
                            SET configurado=1, 
                                totalNumeros='${totalNumeros}'
                            WHERE id='${idBase}'`                   
                await this.querySync(conn,sql)        

                //Verificando restantes para reexecução
                if(jsonFile.length>0){
                    //console.log('Continuando separacao')
                    pool.end((err)=>{
                        if(err) console.log('Mailings 624', err)                        
                        console.log('Continuando importacao dos numeros')
                    })   
                    await this.separaNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,idReg,rate,verificarCPF)    
                }else{
                    //console.log('encerrando')
                    //gravando log
                    const invalidos = await this.numerosInvalidos(empresa,numTab)
                    console.log('invalidos',invalidos)

                    sql = `UPDATE ${empresa}_dados.mailings 
                            SET termino_importacao=now(), 
                                pronto=1,numerosInvalidos=${invalidos}
                            WHERE id='${idBase}'`           
                    fs.unlinkSync(file)//Removendo Arquivo
                    //console.log("sql final",sql)
                    await this.querySync(conn,sql) 
                    pool.end((err)=>{
                        if(err) console.log('Mailings 634', err)
                        resolve(true)
                        console.log('encerrou importacao dos numeros')
                    })          
                }
               
            })
        })       
    }  

    filterInt(value){
        if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
            return Number(value);
        return 0;
    }


    async selecionaNumeroBase(empresa,tabelaDados,colunaCPF,colunaDDD,colunaNumero,colunaNumeroCompleto,rate){
        let colCPF="";
        let colddd="";
        if(colunaCPF!=""){ colCPF=`${colunaCPF}, `}
        if(colunaDDD!=""){ colddd=`${colunaDDD}, `}
        let colNumero=""
        for(let i=0; i<colunaNumero.length; i++){//Numeros
            colNumero+=`${colunaNumero[i]}, `
        }
        let colNumeroCompleto=""
        for(let i=0; i<colunaNumeroCompleto.length; i++){//Numeros
            colNumeroCompleto+=`${colunaNumeroCompleto[i]}, `
        }

        return new Promise (async (resolve,reject)=>{   
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
       
                const sql = `SELECT id_key_base,${colCPF}${colddd}${colNumero}${colNumeroCompleto}valido
                            FROM ${empresa}_mailings.${tabelaDados}
                            WHERE tratado=0
                            LIMIT ${rate}`
                const row = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 675', err)
                })
                resolve(row)
            })
        })
    }

    async trataRegBase(empresa,dataTab,idReg){
        return new Promise (async (resolve,reject)=>{  
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `UPDATE ${empresa}_mailings.${dataTab}
                                SET tratado=1
                            WHERE id_key_base=${idReg}`
                const row = await this.querySync(conn,sql)    
                pool.end((err)=>{
                    if(err) console.log('Mailings 691', err)
                })
                resolve(row)
            })
        })
    }

    async calcRate(total,min,max,rate,multiplicador){
        if(min>=total){
            min=total
        }
        if(total>=800000){
            max=1000
        }else if(total>=400000){
            max=2000
        }else if(total>=200000){
            max=3000
        }
        if(rate>=max){//Setando limite de acordo com o transferRate
            rate=max
        }
        if(rate>=total){
            rate=total
        }
        if(rate<=min){
            rate = min
        }
        return rate*multiplicador
    }

    async checkCPF(empresa,colunaCPF,cpf,tabelaDados){
        return new Promise (async (resolve,reject)=>{  
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{  
                const sql = `SELECT id_key_base
                            FROM ${tabelaDados}
                            WHERE ${colunaCPF}='${cpf}'
                            LIMIT 1`
                const check = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Mailings 731', err)
                })
                if(check.length==0){
                    resolve(false)
                    return
                }
                resolve(true)
            })
        })
    }

    async checkIdReg_cpf(empresa,dataTab,colunaCPF,cpf){
        return new Promise (async (resolve,reject)=>{  
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT id_key_base
                            FROM ${empresa}_mailings.${dataTab}
                            WHERE ${colunaCPF}='${cpf}'
                                AND valido=1
                            LIMIT 1`
                const idCPF = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 753', err)
                })
                if(idCPF.length==0){
                    resolve(false)
                    return
                }
                resolve(idCPF[0].id_key_base)
            })
        })
    }

    




    validandoNumero(ddd,numeroCompleto){
        const info = {}

        let uf = this.checaUF(ddd)
        let error=false
        let message='ok'
        let valido = 1
        let tipo=""
        let dddCorrigido=ddd
        //validando uf
        if(uf=='er'){
            message = 'DDD invalido'
            error=true
            valido=0
            dddCorrigido='0'
        }
        let digitos = numeroCompleto.toString().slice(2,3)
        //validando numero
        if((numeroCompleto.toString().length<10)&&(numeroCompleto.toString().length>11)){
            message="numero inválido"
            error=true
            valido=0
        }else{
            if(numeroCompleto.toString().length==10){
                if(digitos>=6){
                    message=`Primeiro dígito inválido para fixo numero`
                    valido=0
                    error=true
                }else{
                    tipo='fixo'
                }
            }else{
                if(digitos>=7){
                    tipo='celular'
                }else{
                    message=`Primeiro dígito inválido para celular `
                    valido=0
                    error=true
                }
            }
        }
        info['ddd']=dddCorrigido
        info['uf']=uf
        info['tipo']=tipo
        info['valido']=valido
        info['error']=error   
        info['message']=message
        return info;
    }

    async numerosInvalidos(empresa,tabelaNumeros){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
                    const sql = `SELECT COUNT(id) AS invalidos
                                FROM  ${empresa}_mailings.${tabelaNumeros} 
                                WHERE valido=0`
                                
                    const r = await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.log('Mailings 829', err)
                    })
                    resolve(r[0].invalidos)
                    
            })
        })
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
    async totalReg(empresa,tabela){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
                    const sql = `SELECT count(id_key_base) as total 
                                FROM ${tabela}
                                WHERE valido=1`
                    const rows =  await this.querySync(conn,sql);
                    pool.end((err)=>{
                        if(err) console.log('Mailings 958', err)
                    })
                    resolve(rows) 
                })
            })
    }

    async totalNumeros(empresa,tabela){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT count(id) as total 
                            FROM ${tabela}`
                const rows =  await this.querySync(conn,sql);
                pool.end((err)=>{
                    if(err) console.log('Mailings 973', err)
                })
                resolve(rows) 
            })
        })
    }

    async checaDuplicidade(empresa,numero,tabela,numeros){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT id FROM ${tabela} WHERE numero='${numero}' LIMIT 1`       
                const rpt = await this.querySync(conn,sql)
                //console.log('duplicado',rpt.length)
                if(rpt.length==1){
                    const sql = `UPDATE ${tabela} SET duplicado=1 WHERE id=${rpt[0].id}`     
                    await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.log('Mailings 991', err)
                    })
                    resolve(1) 
                }            
              
                pool.end((err)=>{
                    if(err) console.log('Mailings 997', err)
                })
                resolve(0) 
            })
        })
    }

    async totalNumerosFiltrados(empresa,tabela,campanha,uf){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT COUNT(id) AS numeros
                            FROM ${empresa}_mailings.${tabela} 
                            WHERE campanha_${campanha}=0 AND uf='${uf}' AND valido=1 `
                const r = await this.querySync(conn,sql)
                
                pool.end((err)=>{
                    if(err) console.log('Mailings 1014', err)
                })
                resolve(r[0].numeros) 
            })
        })
    }

    async totalRegBaseDados(empresa,idBase){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                        pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT totalReg
                            FROM ${empresa}_dados.mailings 
                            WHERE id='${idBase}'`
                const r = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 1030', err)
                })
                resolve(r[0].totalReg)  
            })
        })
    }

    //Listar mailings importados
    async listaMailing(empresa){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
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
                                FROM ${empresa}_dados.mailings 
                                WHERE configurado=1 AND status=1 ORDER BY id DESC`
                    const rows =  await this.querySync(conn,sql);
                    pool.end((err)=>{
                        if(err) console.log('Mailings 1060', err)
                    })
                    resolve(rows)  
            })
        }) 
    }

    //Abre o mailing importado por paginas com a qtd de reg informada
    async abrirMailing(empresa,id,p,r){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
                    let sql = `SELECT tabela_dados 
                                FROM ${empresa}_dados.mailings 
                                WHERE id=${id}`
                    const rows = await this.querySync(conn,sql)
                    const qtd=r
                    const pag=((p-1)*r)
                    const tabela = rows[0].tabela_dados
                    //console.log(`SELECT * FROM ${empresa}_mailings.${tabela} LIMIT ${pag},${qtd}`)            
                    sql = `SELECT * 
                            FROM ${empresa}_mailings.${tabela} 
                            LIMIT ${pag},${qtd}`
                    const retorno =  await this.querySync(conn,sql)
                    pool.end((err)=>{
                        if(err) console.log('Mailings 1085', err)
                    })
                    resolve(retorno)
            })
        })
    }

    //ExportarMailing
    async exportarMailing(empresa,idMailing,res){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
                pool.getConnection(async (err,conn)=>{ 
                    let sql = `SELECT tabela_dados,nome 
                                FROM ${empresa}_dados.mailings 
                                WHERE id=${idMailing}` 
                    const r = await this.querySync(conn,sql)
                    sql = `SELECT * 
                            FROM ${empresa}_mailings.${r[0].tabela_dados}`
                    const data = await this.querySync(conn,sql)
                    const json2csvParser = new Parser({ delimiter: ';' });
                    const csv = json2csvParser.parse(data);
                    res.attachment(`mailing_${r[0].nome}.csv`)
                    res.status(200).send(csv);
                    pool.end((err)=>{
                        if(err) console.log('Mailings 1109', err)
                    })
                    resolve(true)
                })
            })
    }   

    //Remover Mailing
    async removerMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                let sql = `SELECT tabela_dados,tabela_numeros 
                            FROM ${empresa}_dados.mailings 
                            WHERE id=${idMailing}`
                const result = await this.querySync(conn,sql)
                if(result.length==0){
                    return false
                }
                //Removendo os dados do mailing
                const tabelaDados = result[0].tabela_dados
                const tabelaNumeros = result[0].tabela_numeros
                sql = `DROP TABLE ${empresa}_mailings.${tabelaDados}`//Removendo tabela de dados
                await this.querySync(conn,sql)
                sql = `DROP TABLE ${empresa}_mailings.${tabelaNumeros}`//Removendo tabela de numeros
                await this.querySync(conn,sql)
                sql=`DELETE FROM ${empresa}_dados.mailings 
                    WHERE id=${idMailing}` //Removendo informações do Mailing
                await this.querySync(conn,sql)
                sql=`DELETE FROM ${empresa}_dados.mailing_tipo_campo 
                    WHERE idMailing=${idMailing}` //Removendo configuracoes dos tipos de campos
                await this.querySync(conn,sql)
                sql=`DELETE FROM ${empresa}_dados.campanhas_mailing 
                    WHERE idMailing=${idMailing}`//Removendo mailing das campanhas
                await this.querySync(conn,sql)
                sql=`DELETE FROM ${empresa}_dados.campanhas_campos_tela_agente 
                    WHERE idMailing='${idMailing}'` //Removendo configurações da tela do agente
                await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 1148', err)
                })
                resolve(true)
            })
        })
    }

    //Status mailing
    async statusMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT configurado,totalReg,totalNumeros,numerosInvalidos,pronto,status 
                            FROM ${empresa}_dados.mailings 
                            WHERE id=${idMailing}`
                const rows = await this.querySync(conn,sql) 
                pool.end((err)=>{
                    if(err) console.log('Mailings 1165', err)
                })
                resolve(rows)
            })
        })
    }

    //Conta os ufs do mailing
    async ufsMailing(empresa,idCampanha){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const infoMailing = await Campanhas.infoMailingCampanha(empresa,idCampanha)
                if(infoMailing.length==0){
                    pool.end((err)=>{
                        if(err) console.log('Mailings 1188', err)
                    }) 
                    
                    resolve(false)
                    return false
                }
                const idMailing = infoMailing[0].id
                const tabela = infoMailing[0].tabela_numeros

                let sql = `SELECT COUNT(uf) AS total, uf 
                            FROM ${empresa}_mailings.${tabela} 
                            WHERE valido=1 GROUP BY uf`
                const r = await  this.querySync(conn,sql)    
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
                    let numerosFiltrados = await this.totalNumerosFiltrados(empresa,tabela,idCampanha,r[i].uf)
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
                pool.end((err)=>{
                    if(err) console.log('Mailings 1241', err)
                }) 
                
                resolve(ufs)
            })
        })
    }

    async retrabalharMailing(empresa,idMailing){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const infoMailing = await this.infoMailing(empresa,idMailing)
                const tabelaNumeros =  infoMailing[0].tabela_numeros
                const hoje = moment().format("Y-MM-DD")
                //verifica tabulacao da campanha
                let sql = `UPDATE ${empresa}_mailings.campanhas_tabulacao_mailing 
                            SET data='${hoje} 00:00:00',
                                estado=0,
                                desc_estado='Disponivel',
                                tentativas=0
                            WHERE idMailing=${idMailing} AND (produtivo = 0 OR produtivo is null)`
                //console.log(sql)
                await this.querySync(conn,sql)
                //Libera numero na base de numeros
                sql = `UPDATE ${empresa}_mailings.${tabelaNumeros} 
                        SET discando=0 
                        WHERE produtivo != 1`
                await this.querySync(conn,sql)     
                pool.end((err)=>{
                    if(err) console.log('Mailings 1271', err)
                }) 
                resolve(true)
            })
        })       
    }

    //DDDs por uf do mailing
    async dddsUfMailing(empresa,tabela,uf){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT ddd, COUNT(id) AS total 
                       FROM ${empresa}_mailings.${tabela} 
                      WHERE uf='${uf}' GROUP BY ddd ORDER BY ddd ASC`
                      const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                   if(err) console.log('Mailings 1288', err)
                }) 
                resolve(rows)
            })
        })
    }

    //Resumo por ddd
    async totalRegUF(empresa,tabela){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT uf AS UF, COUNT(id) AS numeros, COUNT(DISTINCT id_registro) AS registros 
                            FROM ${empresa}_mailings.${tabela} 
                            GROUP BY uf 
                            ORDER BY uf ASC`
                const rows = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 1306', err)
                }) 
                resolve(rows)
            })
        })
    }

    //Saude do mailing
    async totalRegistros(empresa,tabela){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_mailings.${tabela}
                            WHERE valido=1`
                const reg = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 1323', err)
                })
                resolve(reg[0].total)
            })
        })
    }

    async registrosContatados(empresa,tabela){
        return new Promise (async (resolve,reject)=>{
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT COUNT(id) AS total 
                            FROM ${empresa}_mailings.${tabela} 
                            WHERE contatado='S'`
                const reg = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 1339', err)
                })
            resolve(reg[0].total)
            })
        })
    }

    async registrosNaoContatados(empresa,tabela){
        return new Promise (async (resolve,reject)=>{  
            const pool =  await connect.pool(empresa,'dados')
            pool.getConnection(async (err,conn)=>{ 
                const sql = `SELECT COUNT(id) AS total 
                               FROM ${empresa}_mailings.${tabela}
                              WHERE selecionado>0 AND contatado<>'S'`
                const reg = await this.querySync(conn,sql)
                pool.end((err)=>{
                    if(err) console.log('Mailings 1355', err)
                })
                
                resolve(reg[0].total)
                
            })
        })
    }
    
}
export default new Mailing();