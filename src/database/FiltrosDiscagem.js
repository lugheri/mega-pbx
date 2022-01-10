import mongoose from 'mongoose';

const FiltrosDiscagem = mongoose.model('FiltrosDiscagem', {
    idCampanha:Number,
    filtro:String,
    valor:String,
    regiao:String
})
module.exports = FiltrosDiscagem