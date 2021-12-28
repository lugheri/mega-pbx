import mongoose from 'mongoose'
const MailingsTypeFields = mongoose.model('MailingsTypeFields',
{
<<<<<<< HEAD
    idMailing:Number,
=======
    idMailing:{type:Number, index:true},
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
    campo: String,
    nome_original_campo:String,
    apelido:String,
    tipo:String,
    conferido:Boolean,
    ordem:Number
})
module.exports = MailingsTypeFields