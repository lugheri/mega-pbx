/*import csv from 'csvtojson';*/
import Mailing from '../models/Mailing';
import Campanhas from '../models/Campanhas';
import User from '../models/User';
import moment from "moment";
import md5 from "md5";
import { json } from 'express';


class MailingController{
    async importarBase(req,res){
        const empresa = await User.getEmpresa(req)
        //Recebendo o arquivo
        const path=`tmp/files/`
        const filename=req.file.filename
        const file=path+filename
        const delimitador = req.body.delimitador 
        const header = req.body.header
        const nome = req.body.nome
        //const transferRate = req.body.taxaTransferencia
      
        //Abrindo o Arquivo
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{
            //Separa as chaves para serem os campos da tabela

            //Criando tabela do novo mailing   
            const hoje = moment().format("YMMDDHHmmss")
            const nomeTabela = hoje   
            const keys = Object.keys(jsonFile[0])     
            const infoMailing=await Mailing.criarTabelaMailing(empresa,keys,nome,nomeTabela,header,filename,delimitador)
            
            res.json(infoMailing)
        })        
    }

    async iniciarConfigBase(req,res){
        const empresa = await User.getEmpresa(req)
        const idBase = req.params.idBase
        const infoMailing=await Mailing.infoMailing(empresa,idBase)
        const path=`tmp/files/`
        const filename = infoMailing[0].arquivo
        const header = infoMailing[0].header
        const delimitador = infoMailing[0].delimitador
        const file=path+filename

        //Abre arquivo
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{
            const title = Object.keys(jsonFile[0]) 

            const campos=[]
            for(let i=0; i<title.length; i++){
                let item={}
                item['titulo']=title[i]//.replace(" ", "_").replace("/", "_").normalize("NFD").replace(/[^a-zA-Z0-9]/g, "");
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

    async concluirConfigBase(req,res){
        const empresa = await User.getEmpresa(req)
        const idBase = req.body.idBase
        const tipoCampos = req.body.fields
        const infoMailing=await Mailing.infoMailing(empresa,idBase)
        const path=`tmp/files/`
        const filename = infoMailing[0].arquivo
        const header = infoMailing[0].header
        const delimitador = infoMailing[0].delimitador
        const file=path+filename

        const tabData=infoMailing[0].tabela_dados
        const tabNumbers=infoMailing[0].tabela_numeros

        await Mailing.configuraTipoCampos(empresa,idBase,header,tipoCampos)//Configura os tipos de campos
        Mailing.abreCsv(file,delimitador,async (jsonFile)=>{//abrindo arquivo
            res.json(true)
            let idKey = 1
            let transferRate=1
            await Mailing.importaDados_e_NumerosBase(empresa,idBase,jsonFile,file,header,tabData,tabNumbers,idKey,transferRate)

           
        }) 
    }
    
    //Lista os mailings importados
    async listarMailings(req,res){
        const empresa = await User.getEmpresa(req)
        const r = await Mailing.listaMailing(empresa)
        
        for(let i=0; i<r.length;i++){
            const idMailing = r[i].id
            const infoTabela= await Mailing.tabelaMailing(empresa,idMailing)
            if(infoTabela.length != 0){
                const tabela = infoTabela[0].tabela_numeros
                const totalRegistros = await Mailing.totalRegistros(empresa,tabela);
                const contatados = await Mailing.registrosContatados(empresa,tabela)
                const naoContatados = await Mailing.registrosNaoContatados(empresa,tabela)
            
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
        const empresa = await User.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing)
        const pag = parseInt(req.params.pag)
        const reg = parseInt(req.params.reg)
        const registros = await Mailing.abrirMailing(empresa,idMailing,pag,reg)
        res.json(registros)
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

    //Exporta os registros de um mailing
    async exportarMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = parseInt(req.params.idMailing)        
        await Mailing.exportarMailing(empresa,idMailing,res)       
        //res.json(false)
    }

    //Status do Mailing
    async statusMailing(req,res){
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        const statusMailing = await Mailing.statusMailing(empresa,idMailing)
        const result={}
        result['pronto']=false
        if(statusMailing.length==0){
            result['status']="Mailing não encontrado"
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
            result['status']="Importação não concluída"
            res.json(result)
            return false
        }
        result['pronto']=true
        result['status']="Pronto"
        result['Reg.']=statusMailing[0].totalReg
        result['Numeros']=statusMailing[0].totalNumeros
        res.json(result)
        return false
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
        const infoTabela= await Mailing.tabelaMailing(empresa,idMailing)
        if(infoTabela.length == 0){
            res.json(false)
            return false;
        }
        const tabela = infoTabela[0].tabela_numeros
        const r = await Mailing.totalRegUF(empresa,tabela)
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
        const empresa = await User.getEmpresa(req)
        const idMailing = req.params.idMailing
        const infoTabela= await Mailing.tabelaMailing(empresa,idMailing)
        if(infoTabela.length != 0){
            const tabela = infoTabela[0].tabela_numeros
            const totalRegistros = await Mailing.totalRegistros(empresa,tabela);
            const contatados = await Mailing.registrosContatados(empresa,tabela)
            const naoContatados = await Mailing.registrosNaoContatados(empresa,tabela)
            
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