const mongoose = require('mongoose');
const productSchema = mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    icon: {type: String, required: true},
    email: {type: String, required: true},
    username: {type: String, required: true},
    password: {type: String, required: true},
    services: {type: Array, required: true},
    settings: {type: Object,required: true},
    WsToken: {type: String},

});

module.exports = mongoose.model('users', productSchema);
