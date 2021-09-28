import csv from 'csvtojson';

import Mailing from '../models/Mailing';

class MailingController{
    async importarBase(req,res){
        const path = `tmp/files/${req.file.filename}`;
       
        console.log('Delimitador: '+req.body.delimitador)
        await csv({delimiter:req.body.delimitador}).fromFile(path).then((jsonObj)=>{
           // res.json(jsonObj.length); 
            Mailing.criarBase(jsonObj,req,res)
        })
    }    

    higienizarBase(req,res){
        
    }
}

export default new MailingController();     