const mongoose = require('mongoose');
const productSchema = mongoose.Schema({
    chatRoomID: {type: String, required: true},
    message: {type: Object, required: true},
    senderID: {type: String, required: true},
    time: {type: Number, required: true},
});

module.exports = mongoose.model('post', productSchema);
