const { nanoid } = require("nanoid");
const fs = require("fs");
const path = require("path");
const webp=require('webp-converter');
 
// this will grant 755 permission to webp executables
webp.grant_permission();

module.exports = async function(client, req, res, fields, files, type, roomID = null){
    // console.log(files)
    const id = nanoid(15)
    let location = "";
    if (type=="user")  location = `./public/icons/users/${id}.webp`
    if (type=="room")  location = `./public/icons/rooms/${id}.webp`
    const result = await webp.cwebp(files.icon.path, location,"-q 80");
    if (type=="user") await client.schema.users.updateOne({ _id : req.session.user.id }, {icon:id});
    if (type=="room") await client.schema.chatRooms.updateOne({ _id : roomID }, {icon:id});
        }