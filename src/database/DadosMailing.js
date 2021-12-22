import mongoose from 'mongoose';
const DadosMailing = mongoose.model('DadosMailing',
{
    id_key_base:Number,
    nome:String,
    cpf:String,
    dados:Array,
    telefones:Array
})
module.exports = DadosMailing