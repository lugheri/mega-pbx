import Report from '../models/Report';

class ReportController{  
    async monitoramentoAgente(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        const idEquipe = parseInt(req.params.idEquipe)
        const idUser = parseInt(req.params.idUser)
        const agentes = await Report.monitorarAgentes(idCampanha,idEquipe,idUser)
        res.json(agentes)
    }

    monitoramentoCampanhas(req,res){
        const idCampanha = parseInt(req.params.idCampanha)
        Report.monitorarCampanhas(idCampanha,(e,campanhas)=>{
            if(e) throw e;

            res.send(campanhas);
        })
    }



    filtroCampanhas(req,res){
        Report.filtroCampanhas((e,campanhas)=>{
            if(e) throw e;

            res.json(campanhas)
        })
    } 
    
    filtroEquipes(req,res){
        Report.filtroEquipes((e,equipes)=>{
            if(e) throw e;

            res.json(equipes)
        })
    }

    

    
    
    criarRelatorio(req,res){
            const data = req.body
            Report.criarRelatorio(data,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })

        }

        listarRelatorios(req,res){
            Report.listarRelatorios((e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        infoRelatorio(req,res){
            const idRelatorio = parseInt(req.params.idRelatorio)
            Report.infoRelatorio(idRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        editarRelatorio(req,res){
            const idRelatorio = parseInt(req.params.idRelatorio)
            const dados = req.body
            Report.editarRelatorio(idRelatorio,dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })

        }

        addCampoDisponiveis(req,res){
            const dados = req.body
            Report.addCampoDisponiveis(dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        listCamposDisponiveis(req,res){
            Report.listCamposDisponiveis((e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        editarCampoDisponiveis(req,res){
            const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
            const dados = req.body
            Report.editarCampoDisponiveis(idCampoDisponivel,dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        delCampoDisponiveis(req,res){
            const idCampoDisponivel = parseInt(req.params.idCampoDisponivel);
            Report.delCampoDisponiveis(idCampoDisponivel,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })

        }



        addCampoRelatorio(req,res){
            const dados = req.body
            Report.addCampoRelatorio(dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        listarCamposRelatorio(req,res){
            const idRelatorio = parseInt(req.params.idRelatorio)
            Report.listarCamposRelatorio(idRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        infoCamposRelatorio(req,res){
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            Report.infoCamposRelatorio(idCampoRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        editCampoRelatorio(req,res){
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            const dados = req.body
            Report.editCampoRelatorio(idCampoRelatorio,dados,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }

        delCampoRelatorio(req,res){
            const idCampoRelatorio = parseInt(req.params.idCampoRelatorio)
            Report.delCampoRelatorio(idCampoRelatorio,(e,r)=>{
                if(e) throw e;
                res.send(r);
            })
        }
}

export default new ReportController();