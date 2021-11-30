import Api from '../models/Api';
import Mailing from '../models/Mailing';

import moment from "moment";

class ApiController{
    async importarMailing(req,res){
        console.log(req)
        const token = req.headers.token
        const empresa = await Api.checkToken(token)
        if(empresa==false){
            res.json("Token Inválido")
            return 
        }
        //Recebendo o arquivo
        const path=`tmp/files/`
        const nome = req.body.nome      
        console.log('nome',nome)
        const filename=req.file.filename
        const file=path+filename
        const delimitador = ";"
        const header = 1
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
            if(infoMailing.length==0){
                res.json("Ocorreu uma falha ao receber o arquivo!")
                return
            }

            const idBase = infoMailing[0].id
            const tipoCampos = [	
                {
                    "name": "COD",
                    "apelido": "Código",
                    "tipo": "dados"
                },
                {
                    "name": "NOME",
                    "apelido": "Nome",
                    "tipo": "nome"
                },
                {
                    "name": "CPF",
                    "apelido": "CPF",
                    "tipo": "cpf"
                },
                {
                    "name": "TELEFONE",
                    "apelido": "Telefone",
                    "tipo": "ddd_e_telefone"
                }
            ]  
            
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
                   
                    setTimeout(()=>{
                        console.log('Iniciando Importacao')
                        Mailing.importarMailing(empresa,idBase,jsonFile,file,delimitador,header,dataTab,numTab,idKey,transferRate)
                    },5000)
                    console.log('Retornando True')
                    res.json(infoMailing)
                    return true
                   // await Mailing.insereNumeros(empresa,idBase,jsonFile,file,dataTab,numTab,idKey,transferRate)
                }else{
                    await Mailing.importarDadosMailing(empresa,idBase,jsonFile,file,delimitador,header,tabData,tabNumbers,idKey,transferRate)
                }            
            }) 
        })
    }
}

export default new ApiController()