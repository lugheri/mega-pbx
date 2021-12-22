import mongoose from 'mongoose';
const Mailings = mongoose.model('Mailings', 
{
    id: Number,
    data: Date,
    termino_importacao: Date,
    nome: String,
    arquivo: String,
    header: String,
    delimitador: String,
    configurado: Boolean,
    totalRegistros: Number,
    totalNumeros: Number,
    repetidos: Number,
    numerosInvalidos: Number,
    pronto: Boolean,
    status: Boolean
})
module.exports = Mailings