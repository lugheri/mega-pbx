import { Schema } from 'mongoose'
const schemaNumerosMailing = new Schema({
    idNumero: Number,
    idRegistro: Number,
    ddd: String,
    numero: String,
    uf:String,
    tipo:String,
    valido: Boolean,
    message: String,
    tratado:Boolean,
    trabalhado:Boolean,
    contatado: Boolean,
    produtivo: Boolean
});
module.exports = schemaNumerosMailing