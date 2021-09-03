import connect from '../Config/dbConnection'

class Dashboard{

    querySync(sql){
        return new Promise((resolve,reject)=>{
            connect.pool.query(sql,(e,rows)=>{
                if(e) reject(e);

                resolve(rows)
            })
        })
    }

    async painel(){
        return new Promise(async (resolve, reject) =>{
            const painel = {}
            let sql
            //USUARIOS
            //Informações dos usuários
            painel['usuarios'] = {}
            //Usuarios ativos no momento
            sql = `SELECT COUNT(id) AS logados FROM user_ramal WHERE estado>=1`
            const rows_usuariosLogados = await this.querySync(sql)
            painel['usuarios']['usuariosLogados']=rows_usuariosLogados[0].logados

            //Histórico de logins
            sql = `SELECT COUNT(DISTINCT(user_id)) AS agentes, DATE_FORMAT (data,'%d/%m/%Y') AS dia FROM registro_logins GROUP BY data ORDER BY data DESC LIMIT 7`
            const rows_historicoLogins = await this.querySync(sql)
            painel['usuarios']['historicoLogins']=rows_historicoLogins

            //Resumo Agentes            
            painel['usuarios']['totalPorEstado']={}
            //Em Ligacao
            sql = `SELECT COUNT(r.userId) AS total FROM users AS u LEFT JOIN user_ramal AS r ON r.userId=u.id WHERE u.status=1 AND r.estado=3`
            const rows_totalEmLigacao = await this.querySync(sql)
            painel['usuarios']['totalPorEstado']['emLigacao']=rows_totalEmLigacao[0].total
            //Em Pausa
            sql = `SELECT COUNT(r.userId) AS total FROM users AS u LEFT JOIN user_ramal AS r ON r.userId=u.id WHERE u.status=1 AND r.estado=2`
            const rows_totalEmPausa = await this.querySync(sql)
            painel['usuarios']['totalPorEstado']['emPausa']=rows_totalEmPausa[0].total
            //Disponíveis
            sql = `SELECT COUNT(r.userId) AS total FROM users AS u LEFT JOIN user_ramal AS r ON r.userId=u.id WHERE u.status=1 AND r.estado=1`
            const rows_totalDisponivel = await this.querySync(sql)
            painel['usuarios']['totalPorEstado']['disponivel']=rows_totalDisponivel[0].total

            //Usuarios Em Ligacao
            sql = `SELECT r.ramal,u.nome,e.equipe userId FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id LEFT JOIN user_ramal AS r ON r.userId=u.id WHERE u.status=1 AND r.estado=3 LIMIT 6`
            const rows_usuariosEmLigacao = await this.querySync(sql)
            for(let i = 0; i < rows_usuariosEmLigacao.length; i++){
                const ramal = rows_usuariosEmLigacao[i].ramal
                sql=`SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_ligacao WHERE idAgente=${ramal}  ORDER BY id DESC LIMIT 1`
                const tempo = await this.querySync(sql)
                if(tempo.length==0){
                    rows_usuariosEmLigacao[i]['tempo']=0
                }else{
                    rows_usuariosEmLigacao[i]['tempo']=await this.converteSeg_tempo(tempo[0].tempo)
                }                
            }
            painel['usuarios']['agentesEmLigacao']=rows_usuariosEmLigacao

            //Usuarios Em Pausa
            sql = `SELECT r.ramal,u.nome,e.equipe userId FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id LEFT JOIN user_ramal AS r ON r.userId=u.id WHERE u.status=1 AND r.estado=2 LIMIT 6`
            const rows_usuariosEmPausa = await this.querySync(sql)
            for(let i = 0; i < rows_usuariosEmPausa.length; i++){
                const ramal = rows_usuariosEmPausa[i].ramal
                sql=`SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_pausa WHERE idAgente=${ramal}  ORDER BY id DESC LIMIT 1`
                const tempo = await this.querySync(sql)
                if(tempo.length==0){
                    rows_usuariosEmPausa[i]['tempo']=0
                }else{
                    rows_usuariosEmPausa[i]['tempo']=await this.converteSeg_tempo(tempo[0].tempo)
                }                
            }
            painel['usuarios']['agentesEmPausa']=rows_usuariosEmPausa

            //Usuarios disponíveis
            sql = `SELECT r.ramal,u.nome,e.equipe userId FROM users AS u LEFT JOIN users_equipes AS e ON u.equipe=e.id LEFT JOIN user_ramal AS r ON r.userId=u.id WHERE u.status=1 AND r.estado=1 LIMIT 6`
            const rows_usuariosDisponiveis = await this.querySync(sql)
            for(let i = 0; i < rows_usuariosDisponiveis.length; i++){
                const ramal = rows_usuariosDisponiveis[i].ramal
                sql=`SELECT TIMESTAMPDIFF (SECOND, entrada, NOW()) as tempo FROM tempo_espera WHERE idAgente=${ramal}  ORDER BY id DESC LIMIT 1`
                const tempo = await this.querySync(sql)
                if(tempo.length==0){
                    rows_usuariosDisponiveis[i]['tempo']=0
                }else{
                    rows_usuariosDisponiveis[i]['tempo']=await this.converteSeg_tempo(tempo[0].tempo)
                }                
            }
            painel['usuarios']['agentesDisponiveis']=rows_usuariosDisponiveis

            //CAMPANHAS
            //Informações das campanhas ativas
            painel['campanhas'] = {}
            //Campanhas ativos no momento
            sql = `SELECT COUNT(id) AS ativas FROM campanhas WHERE estado=1 AND status=1`
            const rows_campanhasAtivas = await this.querySync(sql)
            painel['campanhas']['campanhasAtivas']=rows_campanhasAtivas[0].ativas

            sql = `SELECT COUNT(DISTINCT campanha) AS campanhas, DATE_FORMAT (data,'%d/%m/%Y') AS dia FROM historico_atendimento GROUP BY data ORDER BY data DESC LIMIT 7`
            const rows_historicoCampanhas = await this.querySync(sql)
            painel['campanhas']['historicoCampanhas']=rows_historicoCampanhas

            //Resumo Campanhas            
            painel['campanhas']['totalPorStatus']={}
            //Discando
            sql = `SELECT COUNT(s.id) AS total FROM campanhas_status AS s JOIN campanhas AS c ON c.id=s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado=1`
            const rows_totalDiscando = await this.querySync(sql)
            painel['campanhas']['totalPorStatus']['discando']=rows_totalDiscando[0].total
            //Em Espera
            sql = `SELECT COUNT(s.id) AS total FROM campanhas_status AS s JOIN campanhas AS c ON c.id=s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado=2`
            const rows_totalEmEspera = await this.querySync(sql)
            painel['campanhas']['totalPorStatus']['emEspera']=rows_totalEmEspera[0].total
            //Paradas
            sql = `SELECT COUNT(s.id) AS total FROM campanhas_status AS s JOIN campanhas AS c ON c.id=s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado=3`
            const rows_totalParadas = await this.querySync(sql)
            painel['campanhas']['totalPorStatus']['paradas']=rows_totalParadas[0].total

            //Campanhas Discando
            sql = `SELECT c.id,c.nome,c.descricao FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id=s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado = 1 LIMIT 6`
            const rows_campanhasDiscando = await this.querySync(sql)
            for(let i = 0; i < rows_campanhasDiscando.length; i++){
                const idCampanha = rows_campanhasDiscando[i].id                
                sql=`SELECT SUM(tempo_total) as tempo FROM tempo_ligacao WHERE idCampanha=${idCampanha} AND tempo_total is not null`
                const tempo = await this.querySync(sql)
                if(tempo.length==0){
                    rows_campanhasDiscando[i]['tempo']=0
                }else{
                    rows_campanhasDiscando[i]['tempo']=await this.converteSeg_tempo(tempo[0].tempo)
                }                
            }
            painel['campanhas']['discando']=rows_campanhasDiscando

            //Campanhas Aguardando
            sql = `SELECT c.id,c.nome,c.descricao FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id=s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado = 2 LIMIT 6`
            const rows_campanhasAguardando = await this.querySync(sql)
            for(let i = 0; i < rows_campanhasAguardando.length; i++){
                const idCampanha = rows_campanhasAguardando[i].id
                sql=`SELECT TIMESTAMPDIFF (SECOND, saida, NOW()) as tempo FROM tempo_ligacao WHERE idCampanha=${idCampanha} AND saida is not null ORDER BY id DESC LIMIT 1`
                const tempo = await this.querySync(sql)
                if(tempo.length==0){
                    rows_campanhasAguardando[i]['tempo']=0
                }else{
                    rows_campanhasAguardando[i]['tempo']=await this.converteSeg_tempo(tempo[0].tempo)
                }                
            }
            painel['campanhas']['emPausa']=rows_campanhasAguardando

            //Campanhas Paradas
            sql = `SELECT c.id,c.nome,c.descricao FROM campanhas AS c LEFT JOIN campanhas_status AS s ON c.id=s.idCampanha WHERE c.status=1 AND c.estado=1 AND s.estado = 3 LIMIT 6`
            const rows_campanhasParadas = await this.querySync(sql)
            for(let i = 0; i < rows_campanhasParadas.length; i++){
                const idCampanha = rows_campanhasParadas[i].id
                sql=`SELECT TIMESTAMPDIFF (SECOND, saida, NOW()) as tempo FROM tempo_ligacao WHERE idCampanha=${idCampanha} AND saida is not null ORDER BY id DESC LIMIT 1`
                const tempo = await this.querySync(sql)
                if(tempo.length==0){
                    rows_campanhasParadas[i]['tempo']=0
                }else{
                    rows_campanhasParadas[i]['tempo']=await this.converteSeg_tempo(tempo[0].tempo)
                }                
            }
            painel['campanhas']['paradas']=rows_campanhasParadas



            //STATUS MAILINGS
            //Informaçoes dos mailings das campanhas ativas            
            painel['statusMailings'] = {}
            sql = `SELECT SUM(totalReg) AS total FROM mailings as m JOIN campanhas_mailing AS cm ON cm.idMailing=m.id JOIN campanhas AS c ON c.id=cm.idCampanha WHERE c.estado=1 AND c.status=1`
            const rows_total_reg = await this.querySync(sql)
            let total
            if(rows_total_reg[0].total == null){
                total = 0
            }else{
                total = parseInt(rows_total_reg[0].total)
            }

            //Contatados
            sql = `SELECT count(t.id) AS contatados FROM ${connect.db.mailings}.campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='S' AND c.estado=1 AND c.status=1`
            const rows_jaContatados = await this.querySync(sql)
            const contatados = parseInt(rows_jaContatados[0].contatados)

            //Nao Contatados
            sql = `SELECT count(t.id) AS nao_contatados FROM ${connect.db.mailings}.campanhas_tabulacao_mailing AS t JOIN campanhas AS c ON c.id=t.idCampanha WHERE t.contatado='N' AND c.estado=1 AND c.status=1`
            const rows_naoContatados = await this.querySync(sql)
            const naoContatados = parseInt(rows_naoContatados[0].nao_contatados)
            const trabalhados = contatados + naoContatados
            let perc_trabalhados = 0
            let perc_contatados = 0
            let perc_naoContatados = 0
    
            if(total!=0){
                perc_trabalhados = parseFloat((trabalhados / total)*100).toFixed(1)
                perc_contatados = parseFloat((contatados / total)*100).toFixed(1)
                perc_naoContatados = parseFloat((naoContatados / total)*100).toFixed(1)
            }   
            
            painel['statusMailings']['trabalhado'] = perc_trabalhados
            painel['statusMailings']['contatados'] = perc_contatados
            painel['statusMailings']['nao_contatados'] = perc_naoContatados
             
                      
            //CHAMADAS SIMULTÃNEAS
            //Informações das chamadas simultaneas
            painel['chamadasSimultaneas'] = {}
            const limit = 9
            //TODAS
            sql = `SELECT total FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT ${limit}`
            const row_chamadasSimultaneas = await this.querySync(sql)
            //CONECTADAS
            sql = `SELECT conectadas FROM log_chamadas_simultaneas ORDER BY id DESC LIMIT ${limit}`
            const row_chamadasConectadas = await this.querySync(sql)

            let totasChamadas = []
            for(let i=0; i<row_chamadasSimultaneas.length; i++) {
                totasChamadas[i] = row_chamadasSimultaneas[i].total
            }

            let chamadasConectadas = []
            for(let i=0; i<row_chamadasConectadas.length; i++) {
                chamadasConectadas[i] = row_chamadasConectadas[i].conectadas
            }

            painel['chamadasSimultaneas']['total'] = totasChamadas
            painel['chamadasSimultaneas']['conectadas'] = chamadasConectadas
            
            resolve(painel)
        })        
    }
    
    async converteSeg_tempo(segundos_totais){
        return new Promise((resolve, reject)=>{
            let horas = Math.floor(segundos_totais / 3600);
            let minutos = Math.floor((segundos_totais - (horas * 3600)) / 60);
            let segundos = Math.floor(segundos_totais % 60);
            if(horas<=9){horas="0"+horas}
            if(minutos<=9){minutos="0"+minutos}
            if(segundos<=9){segundos="0"+segundos}

            const tempo =`${horas}:${minutos}:${segundos}`

            resolve(tempo);

        })
    }

}

export default new Dashboard()