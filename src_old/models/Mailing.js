import connect from '../Config/dbConnection';
class Mailing{
    criarBase(base,req,res){
        const keys = Object.keys(base[0])
        let campos='';
        let camposInsert='';
        let valores='';
        if(req.body.header){
            console.log('Headers '+keys)
            for(let i=0; i<keys.length; i++){
                camposInsert+="`"+keys[i]+"`,"
                campos+="`"+keys[i]+"` VARCHAR(50) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci',"
            }           
        }else{
            console.log('Sem Header');
            for(let i=0; i<keys.length; i++){
                camposInsert+="`campo_"+(i+1)+"`,"
                campos+="`campo_"+(i+1)+"` VARCHAR(50) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci',"
            }
            valores+="(";
            for(let i=0; i<keys.length; i++){
                valores+=`'${keys[i]}',`
            }
            valores+="1),";
        }
        
        for(let i = 0; i < base.length; i++){
            let key = Object.keys(base[i])
            valores+="(";
            for(let v=0; v<key.length; v++){
                valores+=`'${base[i][key[v]]}',`
            }
            valores+="1),";
        }
        valores = valores.slice(0,-1);
             
        //criando tabela
        const nomeTabela=req.body.nome.replace(/ /gi, '_').toLowerCase()
        const sql = "CREATE TABLE IF NOT EXISTS `mailings_"+nomeTabela+"` (`id` INT(11) NOT NULL AUTO_INCREMENT, "+campos+" `status` INT(11) NULL DEFAULT NULL, PRIMARY KEY (id) USING BTREE) COLLATE='latin1_swedish_ci' ENGINE=InnoDB;"
        
        connect.query(sql,(erro,result)=>{
            if(erro){
                res.json(erro)
            }else{
                console.log(result)
                //populando tabela
                const sql = "INSERT INTO `mailings_"+nomeTabela+"` ("+camposInsert+"`status`) VALUES "+valores+";"
                connect.query(sql,(erro,result)=>{
                    if(erro){
                        res.json(erro)
                    }else{
                        console.log(result)
                        //gravando log
                        const filename = req.file.filename.split('-');
                        
                        const sql = `INSERT INTO mailings (data,nome,arquivo,tabela,higienizado,status) VALUES (NOW(),'${req.body.nome}','${filename[1]}','mailings_${nomeTabela}',0,1)`
                        connect.query(sql,(erro,result)=>{
                            if(erro){
                                res.json(erro)
                            }else{
                                console.log(result);
                                res.json({
                                    "tabela":`mailings_${nomeTabela}`
                                })
                            }
                        })
                    }
                })
            }
        });
    }

    higienizarBase(base,callback) {}
}
export default new Mailing();