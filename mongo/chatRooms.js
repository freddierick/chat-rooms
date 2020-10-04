const mongoose = require('mongoose');
const productSchema = mongoose.Schema({
    name: {type: String, required: true},
    ownerID: {type: String, required: true},
    created: {type: String, required: true},
    description: {type: String, required: true},
    bots: {type: Boolean, required: true},
    icon: {type: String, required: true},
    members: {type: Array, required: true},
    banned: {type: Array, required: true},
    inviteCode: {type: String, required: true},
});

module.exports = mongoose.model('chatRooms', productSchema);
