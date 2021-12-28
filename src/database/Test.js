import mongoose from 'mongoose'

const Test = mongoose.model('Test', 
{
    name: String
})
module.exports = Test
