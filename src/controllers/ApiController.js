import Api from '../models/Api';
import Mailing from '../models/Mailing';
import Campanhas from '../models/Campanhas';
import moment from "moment";

class ApiController{
    async importarMailing(req,res){
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


            const tipoCampos = []
            for(let i=0; i<keys.length; i++){
                console.log("campo",keys[i])
                const campo =keys[i].toUpperCase()
                console.log("campo upper",campo)
                const infoCampo = {}
                switch(campo){
                    case 'TELEFONE':
                        infoCampo["name"]="TELEFONE"
                        infoCampo["apelido"]="Telefone"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 1':
                        infoCampo["name"]="TELEFONE 1"
                        infoCampo["apelido"]="Telefone 1"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 2':
                        infoCampo["name"]="TELEFONE 2"
                        infoCampo["apelido"]="Telefone 2"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 3':
                        infoCampo["name"]="TELEFONE 3"
                        infoCampo["apelido"]="Telefone 3"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 4':
                        infoCampo["name"]="TELEFONE 4"
                        infoCampo["apelido"]="Telefone 4"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 5':
                        infoCampo["name"]="TELEFONE 5"
                        infoCampo["apelido"]="Telefone 5"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 5':
                        infoCampo["name"]="TELEFONE 5"
                        infoCampo["apelido"]="Telefone 5"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 6':
                        infoCampo["name"]="TELEFONE 6"
                        infoCampo["apelido"]="Telefone 6"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 7':
                        infoCampo["name"]="TELEFONE 7"
                        infoCampo["apelido"]="Telefone 7"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 8':
                        infoCampo["name"]="TELEFONE 8"
                        infoCampo["apelido"]="Telefone 8"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 9':
                        infoCampo["name"]="TELEFONE 9"
                        infoCampo["apelido"]="Telefone 9"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'TELEFONE 10':
                        infoCampo["name"]="TELEFONE 10"
                        infoCampo["apelido"]="Telefone 10"
                        infoCampo["tipo"]="ddd_e_telefone"
                    break;
                    case 'NOME':
                        infoCampo["name"]="NOME"
                        infoCampo["apelido"]="Nome"
                        infoCampo["tipo"]="nome"
                    break;
                    case 'CPF':
                        infoCampo["name"]="CPF"
                        infoCampo["apelido"]="Cpf"
                        infoCampo["tipo"]="cpf"
                    break;
                    case 'CLIENTE_ID':
                        infoCampo["name"]="CLIENTE_ID"
                        infoCampo["apelido"]="Cliente_Id"
                        infoCampo["tipo"]="var_1"
                    break;
                    case 'SK':
                        infoCampo["name"]="SK"
                        infoCampo["apelido"]="SK"
                        infoCampo["tipo"]="var_2"
                    break;
                    default:
                        infoCampo["name"]=campo
                        infoCampo["apelido"]=campo
                        infoCampo["tipo"]="dados"
                }
                tipoCampos.push(infoCampo)
            }

            console.log(`Tipo Campos`,tipoCampos)
            
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

    async listarMailing(req,res){
        const token = req.headers.token
        const empresa = await Api.checkToken(token)
        if(empresa==false){
            res.json("Token Inválido")
            return 
        }
        const r = await Mailing.listaMailing(empresa)       
        
        res.json(r);
    }

    async infoMailing(req,res){
        const token = req.headers.token
        const empresa = await Api.checkToken(token)
        if(empresa==false){
            res.json("Token Inválido")
            return 
        }
        const idMailing = parseInt(req.params.idMailing);
        const infoTabela= await Mailing.infoMailing(empresa,idMailing)        
        const tabela = infoTabela[0].tabela_numeros
        const totalRegistros = infoTabela[0].totalNumeros
        let contatados = 0
        let naoContatados = 0
        if(infoTabela[0].pronto!=0){
            contatados = await Mailing.registrosContatados(empresa,tabela)
            naoContatados = await Mailing.registrosNaoContatados(empresa,tabela)
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
        infoTabela[0]['saude']=[]
        infoTabela[0]['saude'].push(saude);
        res.json(infoTabela);
    }

    async removeMailing(req,res){
        const token = req.headers.token
        const empresa = await Api.checkToken(token)
        if(empresa==false){
            res.json("Token Inválido")
            return 
        }
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

}

export default new ApiController()