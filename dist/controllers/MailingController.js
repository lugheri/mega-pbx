"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }/*import csv from 'csvtojson';*/
var _Mailing = require('../models/Mailing'); var _Mailing2 = _interopRequireDefault(_Mailing);
var _Campanhas = require('../models/Campanhas'); var _Campanhas2 = _interopRequireDefault(_Campanhas);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _moment = require('moment'); var _moment2 = _interopRequireDefault(_moment);
var _md5 = require('md5'); var _md52 = _interopRequireDefault(_md5);
var _express = require('express');


class MailingController{
    async importarBase(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        //Recebendo o arquivo
        const path=`tmp/files/`
        const filename=req.file.filename
        const file=path+filename
        const delimitador = req.body.delimitador 
        const header = req.body.header
        const nome = req.body.nome
        const tipoImportacao="horizontal"
        
      
        //Abrindo o Arquivo
        _Mailing2.default.abreCsv(file,delimitador,async (jsonFile)=>{
            //Separa as chaves para serem os campos da tabela

            //Criando tabela do novo mailing   
            const hoje = _moment2.default.call(void 0, ).format("YMMDDHHmmss")
            const nomeTabela = hoje   
            //Colunas de titulos do arquivo
            const keys = Object.keys(jsonFile[0])           
            
            const infoMailing=await _Mailing2.default.criarTabelaMailing(empresa,tipoImportacao,keys,nome,nomeTabela,header,filename,delimitador,jsonFile)
            
            res.json(infoMailing)
        })        
    }

    async iniciarConfigBase(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idBase = req.params.idBase
        const infoMailing=await _Mailing2.default.infoMailing(empresa,idBase)
        const header = infoMailing[0].header

        //Abrindo Mailing Importado 
        const resumoBase = await _Mailing2.default.resumoDadosBase(empresa,infoMailing[0].tabela_dados)

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

            let typeField=await _Mailing2.default.verificaTipoCampo(header,title[i],resumoBase[1][title[i]]) 

            item['tipoSugerido']=typeField
            item['previewData']={data}

            campos.push(item)            
        }

        res.json(campos)    

    }

    async concluirConfigBase(req,res){
        res.json(true)
        const empresa = await _User2.default.getEmpresa(req)
        const idBase = req.body.idBase
        const tipoCampos = req.body.fields
        const infoMailing=await _Mailing2.default.infoMailing(empresa,idBase)
        const path=`tmp/files/`
        const filename = infoMailing[0].arquivo
        const header = infoMailing[0].header
        const delimitador = infoMailing[0].delimitador
        const file=path+filename
        const tipoImportacao="horizontal"

        const tabData=infoMailing[0].tabela_dados
        const tabNumbers=infoMailing[0].tabela_numeros

       
        await _Mailing2.default.configuraTipoCampos(empresa,idBase,header,tipoCampos)//Configura os tipos de campos
       
        _Mailing2.default.abreCsv(file,delimitador,async (jsonFile)=>{//abrindo arquivo            
            let idKey = 1
            let transferRate=1
            const fileOriginal=jsonFile
            if(tipoImportacao=="horizontal"){
                const infoMailing = await _Mailing2.default.infoMailing(empresa,idBase)
                const dataTab = infoMailing[0].tabela_dados
                const numTab = infoMailing[0].tabela_numeros

                await _Mailing2.default.importarMailing(empresa,idBase,jsonFile,file,delimitador,header,dataTab,numTab,idKey,transferRate)

               // await Mailing.insereNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,idKey,transferRate)
            }else{
                await _Mailing2.default.importarDadosMailing(empresa,idBase,jsonFile,file,delimitador,header,tabData,tabNumbers,idKey,transferRate)
            }            
        }) 
    }
    
    //Lista os mailings importados
    async listarMailings(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const r = await _Mailing2.default.listaMailing(empresa)
        
        for(let i=0; i<r.length;i++){
            const idMailing = r[i].id
            const infoTabela= await _Mailing2.default.tabelaMailing(empresa,idMailing)
            if(infoTabela.length != 0){
                const tabela = infoTabela[0].tabela_numeros
                const totalRegistros = infoTabela[0].totalNumeros
                let contatados = 0
                let naoContatados = 0
                if(infoTabela[0].pronto!=0){
                    contatados = await _Mailing2.default.registrosContatados(empresa,tabela)
                    naoContatados = await _Mailing2.default.registrosNaoContatados(empresa,tabela)
                }
            
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
                const saude={}
                saude['nao_trabalhados']=perc_naotrabalhados
                saude['contatados']=perc_contatados
                saude['nao_contatados']=perc_naoContatados                
                r[i]['saude']=[]
                r[i]['saude'].push(saude);
            }
        }       
        res.json(r);
    }

    //Abre um mailing
    async abrirMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing)
        const pag = parseInt(req.params.pag)
        const reg = parseInt(req.params.reg)
        const registros = await _Mailing2.default.abrirMailing(empresa,idMailing,pag,reg)
        res.json(registros)
    }

    //remove um mailing
    async removerMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing);
        const check = await _Campanhas2.default.campanhaDoMailing(empresa,idMailing)
        if(check.length==1){
            const rt={}
            rt['error']=true
            rt['message']=`O mailing est?? ativo na campanha '${check[0].nome}'`
            res.send(rt)
            return false
        }
            
        const r = await _Mailing2.default.removerMailing(empresa,idMailing)
        res.json(r)
    }

    //Exporta os registros de um mailing
    async exportarMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing)        
        await _Mailing2.default.exportarMailing(empresa,idMailing,res)       
        //res.json(false)
    }

    //Status do Mailing
    async statusMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = req.params.idMailing
        const statusMailing = await _Mailing2.default.statusMailing(empresa,idMailing)
        const result={}
        result['pronto']=false
        if(statusMailing.length==0){
            result['status']="Mailing n??o encontrado"
            res.json(result)
            return false
        }
        if(statusMailing[0].status==0){
            result['status']="Mailing Inativo"
            res.json(result)
            return false
        }
        //Verifica se o mailing esta importado
        if(statusMailing[0].pronto==0){            
            result['status']="Importa????o n??o conclu??da"
            res.json(result)
            return false
        }
        result['pronto']=true
        result['status']="Pronto"
        result['Reg.']=statusMailing[0].totalReg
        result['Numeros']=statusMailing[0].totalNumeros-statusMailing[0].numerosInvalidos
        res.json(result)
        return false
    }    
    //Exibe os ufs de um mailing
    async ufsMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = req.params.idMailing
        const r = await _Mailing2.default.ufsMailing(empresa,idMailing)
        res.json(r)
    }

    async retrabalharMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = req.params.idMailing
        await _Mailing2.default.retrabalharMailing(empresa,idMailing)
        res.json(true)
    }

    //DDDs por uf do mailing
    async dddsUfMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = (req.params.idMailing)
        const UF = req.params.uf
        const infoTabela= await _Mailing2.default.tabelaMailing(empresa,idMailing)
        const tabela = infoTabela[0].tabela_numeros
        
        const ddds = await _Mailing2.default.dddsUfMailing(empresa,tabela,UF)
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
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = req.params.idMailing
        const infoTabela= await _Mailing2.default.tabelaMailing(empresa,idMailing)
        if(infoTabela.length == 0){
            res.json(false)
            return false;
        }
        const tabela = infoTabela[0].tabela_numeros
        const r = await _Mailing2.default.totalRegUF(empresa,tabela)
        const registros=[]
        for(let i=0; i<r.length;i++){
            let reg={}
                reg['fill']='#185979'
                reg['UF']=r[i].UF
                reg['registros']=r[i].registros
                reg['numeros']=r[i].numeros
            registros.push(reg)
        }
        res.json(registros)
    }
    //Saude do mailing
    async saudeMailing(req,res){
        const empresa = await _User2.default.getEmpresa(req)
        const idMailing = req.params.idMailing
        const infoTabela= await _Mailing2.default.tabelaMailing(empresa,idMailing)
        if(infoTabela.length != 0){
            const tabela = infoTabela[0].tabela_numeros
            const totalRegistros = infoTabela[0].totalNumeros
            const contatados = await _Mailing2.default.registrosContatados(empresa,tabela)
            const naoContatados = await _Mailing2.default.registrosNaoContatados(empresa,tabela)

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

exports. default = new MailingController();     







    //Aguardando testes para remo????o

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
                    //console.log('Passo 4 - Registrando informa????es do mailing')
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