
/*import csv from 'csvtojson';*/
import Mailing from '../models/Mailing';


class MailingController{
    //Importa nova base para o mailing
    importarBase(req,res){
        const path = `tmp/files/${req.file.filename}`;
       // console.log('Passo 1 - Abrindo csv')
        Mailing.abreCsv(path,req.body.delimitador,async (jsonFile)=>{
           // console.log('Passo 1 . . . . . . . . . . . . . . . . ok')
            // console.log(jsonFile[0])
            //console.log('Passo 2 - Criando Base')
            Mailing.criarBase(jsonFile[0],req,(erro,result)=>{
                if(erro) throw erro
                //console.log('Passo 2 . . . . . . . . . . . . . . . . ok')

                res.json(true);

                //console.log('Passo 3 - Setando tipos de campos')
                Mailing.setaTipoCampo(jsonFile[0],req,(erro,result)=>{
                    if(erro) throw erro
                    //console.log('Passo 3 . . . . . . . . . . . . . . . . ok')
                    
                    //console.log('Passo 4 - Registrando informações do mailing')
                    Mailing.addMailing(req,(erro,result)=>{
                        if(erro) throw erro
                        //console.log('Passo 4 . . . . . . . . . . . . . . . . ok')
                    
                        const base_id=result['insertId']

                        //console.log('Passo 5 - Separando Colunas') 
                        Mailing.separarColunas(jsonFile[0],req,(nomeTabela,campos,campoDDD)=>{
                            console.log(campoDDD)
                            const base = Object.entries(jsonFile)     
                           
                            
                            //console.log('Passo 5 . . . . . . . . . . . . . . . . ok')

                            //console.log('Passo 6 - importanto dados') 
                            Mailing.importaDados(base,nomeTabela,campos,base_id,campoDDD,(erro,result)=>{
                                if(erro) throw erro

                                //console.log('Passo 6 . . . . . . . . . . . . . . . . ok')
                                console.log('Importado com sucesso!')

                            })                       
                        })
                        
                    })
                })
            })
        })          
    }   
    
    //Lista os mailings importados
    listarMailings(req,res){
        Mailing.listaMailing((erro,result)=>{
            if(erro){
                res.json(erro)
            }else{      
                if(erro) throw erro;
        
                res.json(result);          
              
            }
        })
    }

    //remove um mailing
    removerMailing(req,res){
        Mailing.removerMailing(req,(erro,result)=>{
            if(erro) throw erro
            res.json(result)
        })
    }

    //Agre um mailing
    abrirMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        const pag = parseInt(req.params.pag)
        const reg = parseInt(req.params.reg)
        Mailing.abrirMailing(idMailing,pag,reg,(erro, result)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(result)
            }
        })
    }

    //Exporta os registros de um mailing
    exportarMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)        
        Mailing.exportarMailing(idMailing,res,(erro,response)=>{
            if(erro){
                res.json(erro)
            }else{
                res.json(response)
           }
        })

    }

    //CONFIGURACOES DO MAILING
    //Status do Mailing
    statusMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        Mailing.statusMailing(idMailing,(e,statusMailing)=>{
            if(e) throw e
            if(statusMailing.length==0){
                res.json(JSON.parse('{"pronto":false,"status":"Mailing não encontrado"}'))
            }else{
                if(statusMailing[0].status==0){
                    //Verifica se o mailing esta ativo
                    res.json(JSON.parse('{"pronto":false,"status":"Mailing Inativo"}'))
                }else{
                    //Verifica se o mailing esta importado
                    if(statusMailing[0].pronto==0){
                        res.json(JSON.parse('{"pronto":false,"status":"Importação não concluída"}'))
                    }else{
                        //Verifica se o mailing esta configurado
                        if(statusMailing[0].configurado==0){
                            res.json(JSON.parse('{"pronto":false,"status":"Pendente de configuração"}'))
                        }else{
                            res.json(JSON.parse(`{"pronto":true,"status":"Pronto","Reg.":${statusMailing[0].totalReg}}`))
                        }
                    }
                }
            }
        })
        
        
        
        //retorna o total de registros
    }
    //Prévia dos dados
    previewMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        Mailing.tabelaMailing(idMailing,(e,nomeTabela)=>{
            if(e) throw e

            if(nomeTabela.length>0){
                const tabela = nomeTabela[0].tabela
                const limit = 1
                Mailing.previaMailing(tabela,limit,(e,previaMailing)=>{
                    if(e) throw e

                    delete previaMailing[0]['id_key_base']
                    delete previaMailing[0]['ddd_db']
                    delete previaMailing[0]['uf_db']
                    delete previaMailing[0]['tentativas']
                    delete previaMailing[0]['contatado']
                    delete previaMailing[0]['produtivo']
                    delete previaMailing[0]['status_tabulacao']

                    res.json(previaMailing)
                })
            }else{
                res.json('{"erro":"Tabela não encontrada, verifique o id do mailing enviado!"}')
            }
        })        
    }
    
    

    //Exibe os ufs de um mailing
    ufsMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        Mailing.ufsMailing(idMailing,(e,r)=>{
            if(e) throw e

            res.json(r)
        })
    }

    //DDDs por uf do mailing
    dddsUfMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        const UF = req.params.uf
        Mailing.tabelaMailing(idMailing,(e,nomeTabela)=>{
            if(e) throw e

            const tabela = nomeTabela[0].tabela
            Mailing.dddsUfMailing(tabela,UF,(e,ddds)=>{
                if(e) throw e

                //Montagem do json
                let retorno = '{'
                    retorno += '"dados":['
                    for(let i=0; i<ddds.length;i++){
                        retorno += ddds[i].total
                        if(i<ddds.length-1){
                            retorno +=', '  
                        }
                    }
                    retorno +='],'
                    retorno += '"categoria":['
                    for(let i=0; i<ddds.length;i++){                       
                        retorno += `"ddd ${ddds[i].ddd}"`
                        if(i<ddds.length-1){
                            retorno +=', '  
                        }
                    }
                    retorno +=']'
                    retorno += '}'                               
                
                res.json(JSON.parse(retorno))
            })
        })
    }

    //Resumo por ddd
    totalRegUF(req,res){
        const idMailing = parseInt(req.params.idMailing)
        Mailing.tabelaMailing(idMailing,(e,nomeTabela)=>{
            if(e) throw e

            const tabela = nomeTabela[0].tabela
            Mailing.totalRegUF(tabela,(e,registros)=>{
                if(e) throw e 
                
                res.json(registros)
            })
        })
    }

    //Saude do mailing
    saudeMailing(req,res){
        const idMailing = parseInt(req.params.idMailing)
        Mailing.tabelaMailing(idMailing,(e,nomeTabela)=>{
            if(e) throw e

            const tabela = nomeTabela[0].tabela

            Mailing.totalRegistros(tabela,(e,nao_Trabalhados)=>{
                if(e) throw e
                
                const totalRegistros = parseInt(nao_Trabalhados[0].total)
                //console.log(`totalRegistros ${totalRegistros}`)
                Mailing.registrosContatados(tabela,(e,ja_contatados)=>{
                    if(e) throw e

                    const contatados = parseInt(ja_contatados[0].contatados)
                //    console.log(`contatados ${contatados}`)
                    Mailing.registrosNaoContatados(tabela,(e,nao_Contatados)=>{
                        if(e) throw e

                        const naoContatados = parseInt(nao_Contatados[0].nao_contatados)
                  //      console.log(`naoContatados ${naoContatados}`)

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
                        

                        let retorno = '{'
                            retorno += `"nao_trabalhados": ${perc_naotrabalhados},`
                            retorno += `"contatados": ${perc_contatados},`
                            retorno += `"nao_contatados": ${perc_naoContatados}`
                            retorno += '}'                  
                       // console.log(retorno)
                        
                        retorno = JSON.parse(retorno)                  

                        res.json(retorno)

                    })
                })
            })
        })
    }


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
        Mailing.atualizaTipoCampo(idCampo,novoTipo,(e,r)=>{
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
    }

    
    
}

export default new MailingController();     