import mongoose from 'mongoose'

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