import mongoose from 'mongoose'

const Mailing = mongoose.model('Mailing', 
{
    idMailing: Number,
    ddd: Number,
    uf: String,
    totalNumeros:Number,
})
module.exports = Mailing