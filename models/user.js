const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayPic: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true
    },
    friends: []

}, { timestamps: true });

const User = module.exports = mongoose.model('User', userSchema);