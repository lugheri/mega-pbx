import mongoose from 'mongoose'

const MailingCampanha = mongoose.model('MailingCampanha', 
{
    id: {type:Number, index:true},
    idMailing:Number,
    idCampanha:Number,
    retrabalho:Boolean,
    camposMailing: Array    
})
module.exports = MailingCampanha