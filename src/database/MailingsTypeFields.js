import mongoose from 'mongoose'
const MailingsTypeFields = mongoose.model('MailingsTypeFields',
{
    idMailing:{type:Number, index:true},
    campo: String,
    nome_original_campo:String,
    apelido:String,
    tipo:String,
    conferido:Boolean,
    ordem:Number
})
module.exports = MailingsTypeFields