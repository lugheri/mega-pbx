import mongoose from 'mongoose'

<<<<<<< HEAD
const Mailing = mongoose.model('Mailing', 
{
    idMailing: Number,
    ddd: Number,
    uf: String,
    totalNumeros:Number,
})
module.exports = Mailing
=======
const dddsMailing = mongoose.model('dddsMailing', 
{
    idMailing:{type:Number, index:true},   
    uf: String,
    totalNumerosUF:Number,
    totalRegistrosUF:Number,
    ddd: Number,
    totalNumerosDDD:Number,    
    totalRegistrosDDD:Number
})
module.exports = dddsMailing
>>>>>>> 6e6f0827f14de2b2f25c763a3fac3100573bd98d
