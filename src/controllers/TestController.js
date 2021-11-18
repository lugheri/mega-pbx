import Discador from '../models/Discador'
import User from '../models/User'
import Redis from '../Config/Redis'

class TestController{

    //Test
    async dialPowerTest(req,res){
        //await this.debug('dialPowerTest',empresa)
        const empresa = await User.getEmpresa(req)
            //await this.debug(empresa,empresa)
        const fila='teste'
        const ramal = req.params.ramal
        const numero = req.params.numero
        const idAtendimento = 0
        const saudacao = 'feminino-bom-dia'
        const aguarde = ""
            //await this.debug(ramal,empresa)
            //await this.debug(numero,empresa)
        const d = await Discador.discar(empresa,ramal,numero,fila,idAtendimento,saudacao,aguarde)
        res.json(true)
    }

    async getRedisKeys(req,res){
        const empresa = req.body.empresa
        const idCampanha = req.body.idCampanha
        const idAgente = req.body.idAgente
        const keys = []
        //DASHBOARD
        const nomeEmpresa = {}
              nomeEmpresa['key']=`${empresa}:nomeEmpresa`
              nomeEmpresa['value'] = await Redis.getter(`${empresa}:nomeEmpresa`)
              nomeEmpresa['expire'] = 120
        keys.push(nomeEmpresa)
        const agentesLogados = {}
              agentesLogados['key']=`${empresa}:agentesLogados`
              agentesLogados['value'] = await Redis.getter(`${empresa}:agentesLogados`)
              agentesLogados['expire'] = 0
        keys.push(agentesLogados)
        const chamadasProdutividade_CampanhasAtivas_dia_0 = {}
              chamadasProdutividade_CampanhasAtivas_dia_0['key']=`${empresa}:chamadasProdutividade_CampanhasAtivas_dia:0`
              chamadasProdutividade_CampanhasAtivas_dia_0['value'] = await Redis.getter(`${empresa}:chamadasProdutividade_CampanhasAtivas_dia:0`)
              chamadasProdutividade_CampanhasAtivas_dia_0['expire'] = 0
        keys.push(chamadasProdutividade_CampanhasAtivas_dia_0)
        const chamadasProdutividade_CampanhasAtivas_dia_1 = {}
              chamadasProdutividade_CampanhasAtivas_dia_1['key']=`${empresa}:chamadasProdutividade_CampanhasAtivas_dia:1`
              chamadasProdutividade_CampanhasAtivas_dia_1['value'] = await Redis.getter(`${empresa}:chamadasProdutividade_CampanhasAtivas_dia:1`)
              chamadasProdutividade_CampanhasAtivas_dia_1['expire'] = 0
        keys.push(chamadasProdutividade_CampanhasAtivas_dia_1)
        const totalChamadas_CampanhasAtivas_dia = {}
              totalChamadas_CampanhasAtivas_dia['key']=`${empresa}:totalChamadas_CampanhasAtivas_dia`
              totalChamadas_CampanhasAtivas_dia['value'] = await Redis.getter(`${empresa}:totalChamadas_CampanhasAtivas_dia`)
              totalChamadas_CampanhasAtivas_dia['expire'] = 0
        keys.push(totalChamadas_CampanhasAtivas_dia)
        const agentesPorEstado_1 = {}
              agentesPorEstado_1['key']=`${empresa}:agentesPorEstado:1`
              agentesPorEstado_1['value'] = await Redis.getter(`${empresa}:agentesPorEstado:1`)
              agentesPorEstado_1['expire'] = 0
        keys.push(agentesPorEstado_1)
        const agentesPorEstado_2 = {}
              agentesPorEstado_2['key']=`${empresa}:agentesPorEstado:2`
              agentesPorEstado_2['value'] = await Redis.getter(`${empresa}:agentesPorEstado:2`)
              agentesPorEstado_2['expire'] = 0
        keys.push(agentesPorEstado_2)
        const agentesPorEstado_3 = {}
              agentesPorEstado_3['key']=`${empresa}:agentesPorEstado:3`
              agentesPorEstado_3['value'] = await Redis.getter(`${empresa}:agentesPorEstado:3`)
              agentesPorEstado_3['expire'] = 0
        keys.push(agentesPorEstado_3)
        const agentesPorEstado_5 = {}
              agentesPorEstado_5['key']=`${empresa}:agentesPorEstado:5`
              agentesPorEstado_5['value'] = await Redis.getter(`${empresa}:agentesPorEstado:5`)
              agentesPorEstado_5['expire'] = 0
        keys.push(agentesPorEstado_5)
        const agentesPorEstado_6 = {}
              agentesPorEstado_6['key']=`${empresa}:agentesPorEstado:6`
              agentesPorEstado_6['value'] = await Redis.getter(`${empresa}:agentesPorEstado:6`)
              agentesPorEstado_6['expire'] = 0
        keys.push(agentesPorEstado_6)
        const chamadasAbandonadas_campanhasAtivas = {}
              chamadasAbandonadas_campanhasAtivas['key']=`${empresa}:chamadasAbandonadas_campanhasAtivas`
              chamadasAbandonadas_campanhasAtivas['value'] = await Redis.getter(`${empresa}:chamadasAbandonadas_campanhasAtivas`)
              chamadasAbandonadas_campanhasAtivas['expire'] = 0
        keys.push(chamadasAbandonadas_campanhasAtivas)
        const chamadasPorContato_dia_N = {}
              chamadasPorContato_dia_N['key']=`${empresa}:chamadasPorContato_dia:N`
              chamadasPorContato_dia_N['value'] = await Redis.getter(`${empresa}:chamadasPorContato_dia:N`)
              chamadasPorContato_dia_N['expire'] = 0
        keys.push(chamadasPorContato_dia_N)
        const chamadasPorContato_dia_S = {}
              chamadasPorContato_dia_S['key']=`${empresa}:chamadasPorContato_dia:S`
              chamadasPorContato_dia_S['value'] = await Redis.getter(`${empresa}:chamadasPorContato_dia:S`)
              chamadasPorContato_dia_S['expire'] = 0
        keys.push(chamadasPorContato_dia_S)
        const campanhasAtivas = {}
              campanhasAtivas['key']=`${empresa}:campanhasAtivas`
              campanhasAtivas['value'] = await Redis.getter(`${empresa}:campanhasAtivas`)
              campanhasAtivas['expire'] = 0
        keys.push(campanhasAtivas)
        const statusCampanha = {}
              statusCampanha['key']=`${empresa}:statusCampanha:${idCampanha}`
              statusCampanha['value'] = await Redis.getter(`${empresa}:statusCampanha:${idCampanha}`)
              statusCampanha['expire'] = 0
        keys.push(statusCampanha)
        const mailingCampanha = {}
              mailingCampanha['key']=`${empresa}:mailingCampanha:${idCampanha}`
              mailingCampanha['value'] = await Redis.getter(`${empresa}:mailingCampanha:${idCampanha}`)
              mailingCampanha['expire'] = 0
        keys.push(mailingCampanha)
        const totalRegistrosCampanha = {}
              totalRegistrosCampanha['key']=`${empresa}:totalRegistrosCampanha:${idCampanha}`
              totalRegistrosCampanha['value'] = await Redis.getter(`${empresa}:totalRegistrosCampanha:${idCampanha}`)
              totalRegistrosCampanha['expire'] = 0
        keys.push(totalRegistrosCampanha)
        const mailingsCampanhasAtivas = {}
              mailingsCampanhasAtivas['key']=`${empresa}:mailingsCampanhasAtivas`
              mailingsCampanhasAtivas['value'] = await Redis.getter(`${empresa}:mailingsCampanhasAtivas`)
              mailingsCampanhasAtivas['expire'] = 0
        keys.push(mailingsCampanhasAtivas)
        const listarAgentesLogados = {}
              listarAgentesLogados['key']=`${empresa}:listarAgentesLogados`
              listarAgentesLogados['value'] = await Redis.getter(`${empresa}:listarAgentesLogados`)
              listarAgentesLogados['expire'] = 0
        keys.push(listarAgentesLogados)
        const chamadasProdutividade_Agente_0 = {}
              chamadasProdutividade_Agente_0['key']=`${empresa}:chamadasProdutividade_Agente:${idAgente}:status:0`
              chamadasProdutividade_Agente_0['value'] = await Redis.getter(`${empresa}:chamadasProdutividade_Agente:${idAgente}:status:0`)
              chamadasProdutividade_Agente_0['expire'] = 0
        keys.push(chamadasProdutividade_Agente_0)
        const chamadasProdutividade_Agente_1 = {}
              chamadasProdutividade_Agente_1['key']=`${empresa}:chamadasProdutividade_Agente:${idAgente}:status:1`
              chamadasProdutividade_Agente_1['value'] = await Redis.getter(`${empresa}:chamadasProdutividade_Agente:${idAgente}:status:1`)
              chamadasProdutividade_Agente_1['expire'] = 0
        keys.push(chamadasProdutividade_Agente_1)
        const chamadasManuais_Agente = {}
              chamadasManuais_Agente['key']=`${empresa}:chamadasManuais_Agente:${idAgente}`
              chamadasManuais_Agente['value'] = await Redis.getter(`${empresa}:chamadasManuais_Agente:${idAgente}`)
              chamadasManuais_Agente['expire'] = 0
        keys.push(chamadasManuais_Agente)
        const tempoFaladoAgente = {}
              tempoFaladoAgente['key']=`${empresa}:tempoFaladoAgente:${idAgente}`
              tempoFaladoAgente['value'] = await Redis.getter(`${empresa}:tempoFaladoAgente:${idAgente}`)
              tempoFaladoAgente['expire'] = 0
        keys.push(tempoFaladoAgente)
        const chamadasSimultaneas = {}
              chamadasSimultaneas['key']=`${empresa}:chamadasSimultaneas`
              chamadasSimultaneas['value'] = await Redis.getter(`${empresa}:chamadasSimultaneas`)
              chamadasSimultaneas['expire'] = 0
        keys.push(chamadasSimultaneas)
        const atendimentoAgente = {}
              atendimentoAgente['key']=`${empresa}:atendimentoAgente:${idAgente}`
              atendimentoAgente['value'] = await Redis.getter(`${empresa}:atendimentoAgente:${idAgente}`);
              atendimentoAgente['expire'] = 0
        keys.push(atendimentoAgente)
        const chamadasEmAtendimento = {}
              chamadasEmAtendimento['key']=`${empresa}:chamadasEmAtendimento`
              chamadasEmAtendimento['value'] = await Redis.getter(`${empresa}:chamadasEmAtendimento`);
              chamadasEmAtendimento['expire'] = 0
        keys.push(chamadasEmAtendimento)
        

        


        
        



        

        

        

        







        res.json(keys)
    }
}
export default new TestController()