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

    async getAllRedisKeys(req,res){
          const empresa = req.body.empresa
          const idAgente = req.body.idAgente

          const allKeys={}
         
          allKeys['Todas Empresas'] = {}
          const keysEmpresas = await Redis.getAllKeys('empresas') 
          for(let k=0;k<keysEmpresas.length;k++){
                allKeys['Todas Empresas'][`${keysEmpresas[k]}`]=await Redis.getter(`${keysEmpresas[k]}`)
          }
          allKeys['Agente'] = {}
          const keysAgente = await Redis.getAllKeys(idAgente) 
          for(let k=0;k<keysAgente.length;k++){
                allKeys['Agente'][`${keysAgente[k]}`]=await Redis.getter(`${keysAgente[k]}`)
          }
          allKeys['empresa'] = {}
          const keysEmpresa = await Redis.getAllKeys(empresa) 
          for(let k=0;k<keysEmpresa.length;k++){
                allKeys['empresa'][`${keysEmpresa[k]}`]=await Redis.getter(`${keysEmpresa[k]}`)
          }
          
          res.json(allKeys)
    }

    async delAllRedisKeys(req,res){
      await Redis.deleteAll()
      
      res.json(true)
    }

    
    async chamadasSimultaneas(req,res){
      const empresa = req.params.empresa
      const idAgente = req.params.ramal
      const keys = []
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

  async simularChamadasSimultaneas(req, res) {
      const empresa = req.body.empresa
      const ramal= req.body.ramal
      const idAtendimento = req.body.idAtendimento
      const idCampanha = req.body.idCampanha
      const modoAtendimento = req.body.modoAtendimento
      const tipoDiscador = req.body.tipoDiscador
      const idMailing = req.body.idMailing
      const tabela_dados = req.body.tabela_dados
      const tabela_numeros = req.body.tabela_numeros
      const id_reg = req.body.id_reg
      const id_numero = req.body.id_numero
      const numero = req.body.numero
      const fila = req.body.fila
      const falando = req.body.falando
      await Discador.registraChamada(empresa,ramal,idAtendimento,idCampanha,modoAtendimento,tipoDiscador,idMailing,tabela_dados,tabela_numeros,id_reg,id_numero,numero,fila,falando)
        
        res.json(true)
  }

  async mailingCampanha(req,res){
      const empresa = req.params.empresa
      const idCampanha = req.params.idCampanha
      const keys = []
      const mailingCampanha = {}
            mailingCampanha['key']=`${empresa}:mailingCampanha:${idCampanha}`
            mailingCampanha['value'] = await Redis.getter(`${empresa}:mailingCampanha:${idCampanha}`)
            mailingCampanha['expire'] = 0
      keys.push(mailingCampanha)
     
      res.json(keys)
  }
}
export default new TestController()