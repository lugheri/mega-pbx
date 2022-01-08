import { Schema } from 'mongoose'
const schemaDadosMailing = new Schema({
    id_key_base:{type:Number, index:true},
    nome:String,
    cpf:String,
    dados:Array
});
module.exports = schemaDadosMailing