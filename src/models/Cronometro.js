import connect from '../Config/dbConnection';

class Cronometro{
    //LOGIN CAMPANHA
    iniciaDiscador(ramal,callback){
        const sql = `INSERT INTO tempo_login (idAgente,entrada) VALUES (${ramal},now())`
        connect.banco.query(sql,callback);
    }

    pararDiscador(ramal,callback){
        const sql = `UPDATE tempo_login SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) WHERE idAgente=${ramal} AND saida is null`
        connect.banco.query(sql,callback);
    }

    //TEMPO ESPERA (Ociosidade)
    iniciaTabulacao(ramal,callback){
        const sql = `INSERT INTO tempo_espera (idAgente,entrada) VALUES (${ramal},now())`
        connect.banco.query(sql,callback);
    }

    encerrouTabulacao(idCampanha,ramal,callback){
        const sql = `UPDATE tempo_espera SET  idCampanha=${idCampanha}, saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) WHERE idAgente=${ramal} AND saida is null`
        connect.banco.query(sql,callback);
    } 

    //TEMPO DE PAUSA (Ociosidade)
    entrouEmPausa(idPausa,idAgente,callback){
        const sql = `INSERT INTO tempo_pausa (idAgente,idPausa,entrada) VALUES (${idPausa},${idAgente},now())`
        connect.banco.query(sql,callback);
    }

    //encerra contagem da fila
    saiuDaPausa(idAgente,callback){
        const sql = `UPDATE tempo_pausa SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) WHERE idAgente=${idAgente} AND saida is null`
        connect.banco.query(sql,callback);
    } 


    //TEMPO DE FILA 
     //Inicia contagem da fila  
    entrouNaFila(idCampanha,idMailing,idRegistro,numero,callback){
        const sql = `INSERT INTO tempo_fila (idCampanha,idMailing,idRegistro,numero,entrada) VALUES (${idCampanha},${idMailing},${idRegistro},${numero},now())`
        connect.banco.query(sql,callback);
    }

    //encerra contagem da fila
    saiuDaFila(numero,callback){
        const sql = `UPDATE tempo_fila SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) WHERE numero=${numero} AND saida is null`
        connect.banco.query(sql,callback);
    } 
    
   

   

    //TEMPO DE ATENDIMENTO  
    iniciouAtendimento(idCampanha,idMailing,idRegistro,numero,ramal,callback){
        const sql = `INSERT INTO tempo_ligacao (idCampanha,idMailing,idRegistro,numero,idAgente,entrada) VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},now())`
        connect.banco.query(sql,callback);
    }

    saiuLigacao(idCampanha,numero,ramal,callback){
        const sql = `UPDATE tempo_ligacao SET saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) WHERE idCampanha=${idCampanha} AND numero=${numero} AND idAgente=${ramal} AND saida is null`
        connect.banco.query(sql,callback);
    } 

    //TEMPO DE TABULACAO (Ociosidade)
    iniciaTabulacao(idCampanha,idMailing,idRegistro,numero,ramal,callback){
        const sql = `INSERT INTO tempo_tabulacao (idCampanha,idMailing,idRegistro,numero,idAgente,entrada) VALUES (${idCampanha},${idMailing},${idRegistro},${numero},${ramal},now())`
        connect.banco.query(sql,callback);
    }

    encerrouTabulacao(idCampanha,numero,ramal,idTabulacao,callback){
        const sql = `UPDATE tempo_tabulacao SET  idTabulacao=${idTabulacao}, saida=NOW(), tempo_total=TIMESTAMPDIFF (SECOND, entrada, NOW()) WHERE idCampanha=${idCampanha} AND numero=${numero} AND idAgente=${ramal} AND saida is null`
        connect.banco.query(sql,callback);
    } 


}

export default new Cronometro()