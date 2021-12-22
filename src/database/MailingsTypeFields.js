import mongoose from 'mongoose'
const MailingsTypeFields = mongoose.model('MailingsTypeFields',
{
    idMailing:Number,
    campo: String,
    nome_original_campo:String,
    apelido:String,
    tipo:String,
    conferido:Boolean,
    ordem:Number
})
module.exports = MailingsTypeFields