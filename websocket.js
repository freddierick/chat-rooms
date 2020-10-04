const { server } = require("./index");

function getIconURL(icon, type){
    if(icon=="null") return "https://i1.wp.com/www.godisinthetvzine.co.uk/wp-content/uploads/2020/06/IMG_20200602_120716_501.jpg?fit=1080%2C1080";
    if(type=="user") return `${process.env.baseURL}/icons/users/${icon}.webp`;
    if(type=="room") return `${process.env.baseURL}/icons/rooms/${icon}.webp`;
};
function addIconsToList(members,type){
  for (let index = 0; index < members.length; index++) {
      members[index].icon = getIconURL(members[index].icon, type)
  };
  return members;
}

const io = require('socket.io')(server);
io.on('connection', (socket) => {
    try {
        const roomID = socket.handshake.headers.referer.split("/")[4].split("?")[0];
        socket.join(roomID);
    } catch (error) {
        console.log("THE WS CONNECTION WILL NOT WORK ON A LOCALHOST!!!")
    }
    
    
})
const ws={};

ws.sendMessage = async function(client, data){
    let { message, senderID, roomID } = data
    const author = await client.schema.users.findOne({'_id' : senderID});
    author.icon = getIconURL(author.icon, "user")
    info = {
        username: author.username,
        icon:author.icon
    }
    if (message=="/tableflip") message="(╯°□°）╯︵ ┻━┻";
    if (message=="/unflip") message="┬─┬ ノ( ゜-゜ノ)";
    const messageToSend = {
        content:message,
        time:Date.now(),
        author: info
    }

    // console.log(io.sockets.adapter.rooms)

    io.to(roomID).emit("message",messageToSend);
}
ws.sendUserJoin = async function(client, user, id){
    console.log(user.username,id)
    userInfo = {
        username:user.username,
        icon: getIconURL(user.icon, "user")
    }
    io.to(id).emit("userJoin",userInfo);
}

module.exports = ws;