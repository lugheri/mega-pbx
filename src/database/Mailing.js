import mongoose from 'mongoose'

const Mailing = mongoose.model('Mailing', 
{
    name: String
})
module.exports = Mailing