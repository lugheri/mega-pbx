/*import csv from 'csvtojson';*/
import Mailing from '../models/Mailing';
import Campanhas from '../models/Campanhas';
import User from '../models/User';
import moment from "moment";
import { Parser } from 'json2csv';
import connect from '../Config/dbConnection';
import mongoose from 'mongoose'

import { Readable } from "stream"
import readLine from "readline"

import csvtojson from 'csvtojson';
import {pipeline, Readable, Writable, Transform } from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import { createWriteStream } from 'fs';
import Redis from '../Config/Redis';



class MailingController{
    //Nova Controller Mailings Mongo
    //Listar Mailings
    //Lista os mailings importados
    async listarMailings(req,res){
        const empresa = await User.getEmpresa(req)
        const mailingData = await Mailing.listaMailing(empresa)

        const mailings = []

        
        for(let i=0; i<mailingData.length;i++){
            const infoMailing={}
                  infoMailing['id'] = mailingData[i].id
                  infoMailing['data_importacao'] = mailingData[i].id
                  infoMailing['conclusao_importacao'] = mailingData[i].id
                  infoMailing['nome'] = mailingData[i].nome
                  infoMailing['arquivo'] = mailingData[i].arquivo
                  /*infoMailing['tabela_dados'] = mailingData[i].arquivo
                  infoMailing['tabela_numeros'] = mailingData[i].id*/
                  infoMailing['totalReg'] = mailingData[i].totalRegistros
                  infoMailing['totalNumeros'] = mailingData[i].totalNumeros
                  infoMailing['numerosRepetidos'] = mailingData[i].repetidos
                  infoMailing['numerosInvalidos'] = mailingData[i].numerosInvalidos
                  
                  let configurado = 0
                  if(mailingData[i].configurado==true){
                    configurado=1
                  }
                  let pronto = 0
                  if(mailingData[i].pronto==true){
                      pronto=1
                  }
                  let status = 0
                  if(mailingData[i].status==true){
                    status=1
                  }
                  infoMailing['configurado'] = configurado
                  infoMailing['pronto'] = pronto
                  infoMailing['status'] = status
            
            const totalRegistros = mailingData[i].totalRegistros
            let contatados = 0
            let naoContatados = 0
            if(pronto!=0){
                contatados = 0//await Mailing.registrosContatados(empresa,tabela)
                naoContatados = 0//await Mailing.registrosNaoContatados(empresa,tabela)
            }
            
            const trabalhados = contatados + naoContatados
            const naoTrabalhados = totalRegistros-trabalhados
            let perc_naotrabalhados = 100
            let perc_contatados = 0
            let perc_naoContatados = 0            
            if(totalRegistros!=0){
                perc_naotrabalhados = parseFloat((naoTrabalhados / totalRegistros)*100).toFixed(1)
                perc_contatados = parseFloat((contatados / totalRegistros)*100).toFixed(1)
                perc_naoContatados = parseFloat((naoContatados / totalRegistros)*100).toFixed(1)                            
            }          
                infoMailing['saude']=[]       
            const saude={}
                  saude['nao_trabalhados']=perc_naotrabalhados
                  saude['contatados']=perc_contatados
                  saude['nao_contatados']=perc_naoContatados                
                infoMailing['saude'].push(saude);       
                mailings.push(infoMailing);   
        }       
        res.json(mailings);
    }

     //Novo modelo de importação de dados
     async importarMailing(req,res){
        const empresa = await User.getEmpresa(req)
        //Recebendo o arquivo
        const path=`tmp/files/`
        const filename=req.file.filename
        const file=path+filename
        const delimitador = req.body.delimitador 
        const header = req.body.header
        const nome = req.body.nome
        const tipoImportacao="horizontal"        
      
        //Abrindo o Arquivo        
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{
            //Separa as chaves para serem os campos da tabela
            //Criando tabela do novo mailing   
            const hoje = moment().format("YMMDDHHmmss")
            const nomeTabela = hoje   
            //Colunas de titulos do arquivo
            const keys = Object.keys(jsonFile[0])           
            const infoMailing=await Mailing.salvaDadosMailing(empresa,tipoImportacao,keys,nome,header,filename,delimitador,jsonFile)
            
            res.json([infoMailing])
        })        
    } 

    async iniciarConfigMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idBase = req.params.idBase
        const infoMailing=await Mailing.infoMailing(empresa,idBase)
        console.log('info',infoMailing)
        const header = infoMailing['header']
        const path=`tmp/files/`
        const filename= infoMailing['arquivo']
        const file=path+filename
        const delimitador= infoMailing['delimitador']
        //Abrindo Mailing Importado 
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{
            const title = Object.keys(jsonFile[0]) 
            const campos=[]
            for(let i=0; i<title.length; i++){
                let item={}
                    item['titulo']=title[i]
                    item['ordem']=i+1
                let data=[]
                for(let d=0; d<10; d++){
                    if(d<=(jsonFile.length-1)){
                        let value=jsonFile[d][title[i]]                                                             
                        data.push(value)
                    }                    
                }
                let typeField=await Mailing.verificaTipoCampo(header,title[i],jsonFile[1][title[i]]) 
                item['tipoSugerido']=typeField
                item['previewData']={data}
                campos.push(item)            
            }
            res.json(campos) 
        })
    }

    async concluirConfigMailing(req, res) {
        res.json(true)
        const empresa = await User.getEmpresa(req)
        const idBase = req.body.idBase
        const tipoCampos = req.body.fields
        const infoMailing=await Mailing.infoMailing(empresa,idBase)
        const path=`tmp/files/`
        const filename = infoMailing['arquivo']
        const header = infoMailing['header']
        const delimitador = infoMailing['delimitador']
        const file=path+filename
        const tipoImportacao="horizontal"
        const idKey=1

        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{//abrindo arquivo   
            connect.mongoose('megaconecta')  
            console.log('iniciando a importacao')      
            console.time('importacao')      
            const keys = Object.keys(jsonFile[0]) 
            
            await Mailing.configuraTipoCampos(empresa,idBase,header,tipoCampos,keys)//Configura os tipos de campos
            //modelDados
            const modelDadosMailing = mongoose.model(`dadosMailing_${idBase}`,{
                id_key_base:{type:[Number], index:true},
                nome:String,
                cpf:String,
                dados:Array
            })

            //modelNumeros
            const modelNumerosMailing = mongoose.model(`numerosMailing_${idBase}`,{
                idNumero: Number,
                idRegistro: String,
                ddd: String,
                numero: String,
                uf:String,
                valido: Boolean,
                message: String
            })
            const limit=1
            await Mailing.geraArquivoMailing(empresa,idBase,jsonFile,infoMailing,tipoCampos,idKey,modelDadosMailing,modelNumerosMailing,limit)
            
            console.log('Concluido')
             //Salvando mailing no Redis
             return true
             //await Mailing.insereNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,idKey,transferRate)
        }) 
    }

    //remove um mailing
    async removerMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing);
        const check = await Campanhas.campanhaDoMailing(empresa,idMailing)
        if(check.length==1){
            const rt={}
            rt['error']=true
            rt['message']=`O mailing está ativo na campanha '${check[0].nome}'`
            res.send(rt)
            return false
        }
            
        const r = await Mailing.removerMailing(empresa,idMailing)
        res.json(r)
    }

    //Status do Mailing
    async statusMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        const statusMailing = await Mailing.statusMailing(empresa,idMailing)
        console.log('totalRegistros',statusMailing)
        console.log('totalRegistros',statusMailing[0].totalRegistros)
        const result={}
        result['pronto']=false
        if(statusMailing.length==0){
            result['status']="Mailing não encontrado"
            res.json(result)
            return false
        }
        if(statusMailing[0].status==false){
            result['status']="Mailing Inativo"
            res.json(result)
            return false
        }    
        //Verifica se o mailing esta importado
        if(statusMailing[0].pronto==false){            
            result['status']="Importação não concluída"
            res.json(result)
            return false
        }
        result['pronto']=true
        result['status']="Pronto"
        result['Reg.']=statusMailing[0].totalRegistros
        result['Numeros']=statusMailing[0].totalNumeros-statusMailing[0].numerosInvalidos
        res.json(result)
        return false
    } 







































   

    

    
    

    async formataValor(req,res){
        const valor = req.body.valor;
        const valorFormatado = Mailing.removeCaracteresEspeciais(valor)
        res.json(valorFormatado)
    }









    async importarBase(req,res){
        const empresa = await User.getEmpresa(req)
        //Recebendo o arquivo
        const path=`tmp/files/`
        const filename=req.file.filename
        const file=path+filename
        const delimitador = req.body.delimitador 
        const header = req.body.header
        const nome = req.body.nome
        const tipoImportacao="horizontal"
        
      
        //Abrindo o Arquivo
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{
            //Separa as chaves para serem os campos da tabela

            //Criando tabela do novo mailing   
            const hoje = moment().format("YMMDDHHmmss")
            const nomeTabela = hoje   
            //Colunas de titulos do arquivo
            const keys = Object.keys(jsonFile[0])           
            
            const infoMailing=await Mailing.criarTabelaMailing(empresa,tipoImportacao,keys,nome,nomeTabela,header,filename,delimitador,jsonFile)
            
            res.json(infoMailing)
        })        
    }

    async iniciarConfigBase(req,res){
        const empresa = await User.getEmpresa(req)
        const idBase = req.params.idBase
        const infoMailing=await Mailing.infoMailing(empresa,idBase)
        const header = infoMailing[0].header

        //Abrindo Mailing Importado 
        const resumoBase = await Mailing.resumoDadosBase(empresa,infoMailing[0].tabela_dados)

        const title = Object.keys(resumoBase[0]) 
              title.shift();
              title.pop();
              title.pop();
        console.log(title)
        const campos=[]
        for(let i=0; i<title.length; i++){
            let item={}
                item['titulo']=title[i]
                item['ordem']=i+1
            let data=[]
            for(let d=0; d<10; d++){
                if(d<=(resumoBase.length-1)){
                    let value=resumoBase[d][title[i]]                                                             
                    data.push(value)
                }                    
            }

            let typeField=await Mailing.verificaTipoCampo(header,title[i],resumoBase[1][title[i]]) 

            item['tipoSugerido']=typeField
            item['previewData']={data}

            campos.push(item)            
        }

        res.json(campos)    

    }

    async concluirConfigBase(req,res){
        res.json(true)
        const empresa = await User.getEmpresa(req)
        const idBase = req.body.idBase
        const tipoCampos = req.body.fields
        const infoMailing=await Mailing.infoMailing(empresa,idBase)
        const path=`tmp/files/`
        const filename = infoMailing[0].arquivo
        const header = infoMailing[0].header
        const delimitador = infoMailing[0].delimitador
        const file=path+filename
        const tipoImportacao="horizontal"

        const tabData=infoMailing[0].tabela_dados
        const tabNumbers=infoMailing[0].tabela_numeros

       
        
       
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{//abrindo arquivo            
            let idKey = 1
            let transferRate=1
            const fileOriginal=jsonFile
            const keys = Object.keys(jsonFile[0]) 
            await Mailing.configuraTipoCampos(empresa,idBase,header,tipoCampos,keys)//Configura os tipos de campos
            if(tipoImportacao=="horizontal"){
                const infoMailing = await Mailing.infoMailing(empresa,idBase)
                const dataTab = infoMailing[0].tabela_dados
                const numTab = infoMailing[0].tabela_numeros
                console.log('Agendando a Importacao')
                setTimeout(()=>{
                    console.log('Iniciando Importacao')
                    Mailing.importarMailing(empresa,idBase,jsonFile,file,delimitador,header,dataTab,numTab,idKey,transferRate)
                },5000)
                console.log('Retornando True')
                //Salvando mailing no Redis
                return true
                //await Mailing.insereNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,idKey,transferRate)

                
            }else{
                await Mailing.importarDadosMailing(empresa,idBase,jsonFile,file,delimitador,header,tabData,tabNumbers,idKey,transferRate)
            }            
        }) 
    }
    
    //Lista os mailings importados
   

    //Abre um mailing
    async abrirMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing)
        const pag = parseInt(req.params.pag)
        const reg = parseInt(req.params.reg)
        const registros = await Mailing.abrirMailing(empresa,idMailing,pag,reg)
        res.json(registros)
    }

    

    //Exporta os registros de um mailing
    async exportarMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing)        
        const data = await Mailing.exportarMailing(empresa,idMailing,res) 

        const json2csvParser = new Parser({ delimiter: ';' });
        const csv = json2csvParser.parse(data);
        res.setHeader('Content-disposition', 'attachment; filename=data.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
        
    }

       
    //Exibe os ufs de um mailing
    async ufsMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        const r = await Mailing.ufsMailing(empresa,idMailing)
        res.json(r)
    }

    async retrabalharMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        await Mailing.retrabalharMailing(empresa,idMailing)
        res.json(true)
    }

    //DDDs por uf do mailing
    async dddsUfMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = (req.params.idMailing)
        const UF = req.params.uf
        const infoTabela= await Mailing.tabelaMailing(empresa,idMailing)
        const tabela = infoTabela[0].tabela_numeros
        
        const ddds = await Mailing.dddsUfMailing(empresa,tabela,UF)
        const retorno={}
              retorno['dados']=[]
            for(let i=0; i<ddds.length;i++){
              retorno['dados'].push(ddds[i].total)
            }
            retorno['categoria']=[]
            for(let i=0; i<ddds.length;i++){                       
                retorno['categoria'].push(`ddd ${ddds[i].ddd}`)
            }                              
         res.json(retorno)      
    }
    //Resumo por ddd
    async totalRegUF(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        
        const ufs = await Mailing.totalRegUF(empresa,idMailing)
        const registros=[]
        for(let i=0; i<ufs.length;i++){
            const uf=ufs[i]
            let reg={}
                reg['fill']='#185979'
                reg['UF']=uf
                const totalRegistros = await Mailing.totalRegistrosUF(empresa,idMailing,uf)
                const totalNumeros = await Mailing.totalNumerosUF(empresa,idMailing,uf)
                reg['registros']=totalRegistros
                reg['numeros']=totalNumeros
            registros.push(reg)
        }
        res.json(registros)
    }
    //Saude do mailing
    async saudeMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        const infoTabela= await Mailing.tabelaMailing(empresa,idMailing)
        if(infoTabela.length != 0){
            const tabela = infoTabela[0].tabela_numeros
            const totalRegistros = infoTabela[0].totalNumeros
            const contatados = 0//await Mailing.registrosContatados(empresa,tabela)
            const naoContatados = 0//await Mailing.registrosNaoContatados(empresa,tabela)

            const trabalhados = contatados + naoContatados
            const naoTrabalhados = totalRegistros-trabalhados
            let perc_naotrabalhados = 0
            let perc_contatados = 0
            let perc_naoContatados = 0
            

            if(totalRegistros!=0){
                perc_naotrabalhados = parseFloat((naoTrabalhados / totalRegistros)*100).toFixed(1)
                perc_contatados = parseFloat((contatados / totalRegistros)*100).toFixed(1)
                perc_naoContatados = parseFloat((naoContatados / totalRegistros)*100).toFixed(1)                            
            } 
                
            const retorno={}
                  retorno['nao_trabalhados']=perc_naotrabalhados
                  retorno['contatados']=perc_contatados
                  retorno['nao_contatados']=perc_naoContatados
                  res.json(retorno)
            return false
        }
        res.json(false)
    }
    
}

export default new MailingController();     







    //Aguardando testes para remoção

    //////OLD____________________________________________________________________________________________
    /*

    //Importa nova base para o mailing
    importarBaseV1(req,res){
       
        const path = `tmp/files/${req.file.filename}`;
       // console.log('Passo 1 - Abrindo csv')
        const delimitador = req.body.delimitador 
        Mailing.abreCsv(path,delimitador,async (jsonFile)=>{
            //console.log('Passo 1 . . . . . . . . . . . . . . . . ok')
            // console.log(jsonFile[0])
            //console.log('Passo 2 - Criando Base')
            const hoje = moment().format("Y-MM-DD HH:mm:ss")
            const nome = req.body.nome
            const nomeTabela = md5(nome+hoje)
            const header = req.body.header
            Mailing.criarBase(jsonFile[0],nomeTabela,header,(erro,result)=>{
                if(erro) throw erro
                //console.log('Passo 2 . . . . . . . . . . . . . . . . ok')
                res.json(true);
                //console.log('Passo 3 - Setando tipos de campos')
                Mailing.setaTipoCampo(jsonFile[0],nomeTabela,(erro,result)=>{
                    if(erro) throw erro
                    //console.log('Passo 3 . . . . . . . . . . . . . . . . ok')
                    //console.log('Passo 4 - Registrando informações do mailing')
                    const filename = req.file.filename.split('-');
                    Mailing.addMailing(nome,nomeTabela,filename,(erro,result)=>{
                        if(erro) throw erro
                        //console.log('Passo 4 . . . . . . . . . . . . . . . . ok')                    
                        const base_id=result['insertId']
                        //console.log('Passo 5 - Separando Colunas') 
                        Mailing.separarColunas(jsonFile[0],nomeTabela,header,(nomeTabela,campos,campoDDD)=>{
                            //console.log(campoDDD)
                            const base = Object.entries(jsonFile)     
                            //console.log('Passo 5 . . . . . . . . . . . . . . . . ok')
                            //console.log('Passo 6 - importanto dados') 
                            Mailing.importaDados(base,nomeTabela,campos,base_id,campoDDD,(erro,result)=>{
                                if(erro) throw erro
                                //console.log('Passo 6 . . . . . . . . . . . . . . . . ok')
                                //console.log('Importado com sucesso!')
                            })                       
                        })
                        
                    })
                })
            })
        })     
          
    }   
      

    //CONFIGURACOES DO MAILING
       //Campos do Mailing e seu tipo
    camposVsTipo(req,res){
        const idMailing = parseInt(req.params.idMailing)

        Mailing.tabelaMailing(idMailing,(e,nomeTabela)=>{
            if(e) throw e

            const tabela = nomeTabela[0].tabela
            Mailing.camposVsTipo(tabela,(e,campos)=>{
                if(e) throw e

                res.json(campos)
            })
        })
    }

    //Atualizar tipo do campo
    atualizaTipoCampo(req,res){
        //atualizando tipo do campo
        const idCampo = parseInt(req.params.idCampo)
        const novoTipo = req.body.tipo
        const apelido = req.body.apelido
        Mailing.atualizaTipoCampo(idCampo,apelido,novoTipo,(e,r)=>{
            if(e) throw e

            //retornando nome da tabela
            Mailing.nomeTabela_byidCampo(idCampo,(e,nomeTabela)=>{
                if(e) throw e
               
                const tabela = nomeTabela[0].tabela
                //console.log(`Tabela.................${tabela}`)

                //verifica se todos campos ja estao conferidos
                Mailing.confereCampos(tabela,(e,pendentes)=>{
                    if(e) throw e

                    //console.log(`Pendentes.................${pendentes[0].pendentes}`)
                    if(pendentes[0].pendentes == 0){
                        //atualiza o status do mailing para configurado
                        const configurado = 1
                        //console.log(`STATUS................. configurado`)
                        Mailing.configuraMailing(tabela,configurado,(e,r)=>{
                            if(e) throw e

                            res.json(true)
                        })
                    }else{
                        //atualiza o status do mailing para nao configurado
                        const configurado = 0
                        //console.log(`STATUS................. pendente`)
                        Mailing.configuraMailing(tabela,configurado,(e,r)=>{
                            if(e) throw e

                            res.json(true)
                        })
                    }
                })           
            })
        })
    }

    //old
    confCamposMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        console.log(`Id Mailing: ${idMailing}`)
        Mailing.tabelaMailing(idMailing,(e,r)=>{
            if(e) throw e

            const tabela = r[0].tabela
            console.log(`Tabela: ${tabela}`)
        

            Mailing.confCamposMailing(tabela,(e,r)=>{
                if(e) throw e

                res.json(r)
            })
        })
    }*/