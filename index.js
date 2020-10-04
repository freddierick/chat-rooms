require('dotenv').config();
const express = require("express");
const http = require('http');
const { lookup } = require("geoip-lite");
const bodyparser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const { nanoid } = require("nanoid");
const formidable = require('formidable');
const fs = require("fs");
const path = require("path");

mongoose.connect(process.env.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
const app = express();
const server = http.createServer(app);
module.exports.server = server;

const port = process.env.port || 9898;
server.listen(port, ()=> {
  console.log(`Listening at  http://localhost:${port}`)
})

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
const client = {};

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({ secret: 'PhotoPrint', resave: false, saveUninitialized: false, cookie: { maxAge: 600000 } }))
app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))

const imageUplad = require("./iconUpload")
const ws = require("./websocket.js");
const sendMail = require("./mail.js")
const login = require("./login.js")
client.schema = {
    users: require("./mongo/users.js"),
    chatRooms: require("./mongo/chatRooms.js"),
    messages: require("./mongo/messages.js"),
};

function checkAuth(req, res, next) {
    if (!req.session.user.loggedIn) return res.redirect("/login");
    next()
  };

app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    console.log((req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip) + " [" +req.method +"] " + req.url);
    next();
})
app.use((req, res, next) => {
    if (!req.session.user) req.session.user={loggedIn:false};
  //    req.session.user = {
  //   loggedIn: true,
  //   id: '5f78e027cfca7f243979b256',
  //   firstName: '6',
  //   lastName: '6',
  //   email: '6@6.6'
  // }

    next();
});

app.get(`/`, async (req,res) => {
    res.render('index.ejs', {
        error:req.query.error,
        user: req.session.user
    });  
})

app.get(`/invite/:id`,checkAuth, async (req,res) => {
  const room = await client.schema.chatRooms.findOne({inviteCode: req.params.id});
  if (!room) return res.redirect("../dashboard?e=That invite has not chat room!")
  if (room.members.includes(req.session.user.id)) return res.redirect("../dashboard?e=You are already in that ChatRoom!")
  const user = await client.schema.users.findOne({_id: req.session.user.id})
  ws.sendUserJoin(client, user, room._id);
  await client.schema.chatRooms.updateOne({_id: room._id}, { $push: { members: req.session.user.id } });
  return res.redirect(`../room/${room._id}`)
})

app.get(`/leave/:id`,checkAuth, async (req,res) => {
  const room = await client.schema.chatRooms.findOne({inviteCode: req.params.id});
  if (!room) return res.redirect("../dashboard?e=You cant leave a room that doesn't exist!")
  if (!room.members.includes(req.session.user.id)) return res.redirect("../dashboard?e=You are not in that ChatRoom!")
  if (room.ownerID == req.session.user.id)return await client.schema.chatRooms.deleteOne({_id: room._id});
  await client.schema.chatRooms.updateOne({_id: room._id}, { $pull: { members: req.session.user.id } });
  return res.redirect("../dashboard")
})

app.get(`/room/:id`,checkAuth, async (req,res) => {
  let room = await client.schema.chatRooms.findOne({_id: req.params.id});
  if(!room.members.includes(req.session.user.id)) return res.redirect("/dashboard");
  const messages = await client.schema.messages.find({ chatRoomID: room._id});
  let members = await client.schema.users.find({'_id' : room.members});
  members = addIconsToList(members,"user");
  room.icon = getIconURL(room.icon,"room");
  console.log(room)
  console.log(members)
  res.render('chatroom.ejs', {
    members,
    room,
    messages,
    error:req.query.error,
    user: req.session.user
});
})

app.post('/createChatRoom',checkAuth, async function (req, res) {
  console.log(req.body)
  const {name, description, bots} = req.body;
  if (!bots){ bot=false }else{ bot=true };
  if (!name || !description) res.status(400).send('no type specified');
  await client.schema.chatRooms.create({ 
      ownerID: req.session.user.id,
      name,
      description,
      bots: bot,
      icon:"null",
      members:[req.session.user.id],
      banned:[],
      inviteCode: nanoid(5),
      created: Date.now()
   });
   res.redirect("/dashboard")
});









app.get('/register', function (req, res) {
    if (req.session.user.loggedIn) return res.redirect("/dashboard")
    res.render('register.ejs', {
        error:req.query.error,
        user: req.session.user
    });  
  });

app.get('/login', function (req, res) {
    console.log(req.session)
    if (req.session.user.loggedIn) return res.redirect("/dashboard")
    res.render('login.ejs', {
        error:req.query.error,
        user: req.session.user
    });  
  });

  app.post('/auth', async function (req, res) {
    console.log(req.body)
    if (!req.body.type) res.status(400).send('no type specified');
    console.log(1)
    login(req, res, client)
    console.log(2)    
  });

  app.post('/editUserSettings', checkAuth ,async function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      const { username, email } = fields;
      if (req.session.user.email!=email) {
        const check = await client.schema.users.findOne({ email : email });
        if (check) return res.redirect("/dashboard?e=There is all ready an a account with that email!")
      }
      if (!username || !email ) return res.status(400).send();
      await client.schema.users.updateOne({ _id : req.session.user.id }, {username:username,email:email});
      if (files.icon.name=="") return res.redirect("/dashboard")
      const imageLocation = await imageUplad(client,req, res, fields, files,"user");
      res.redirect("/dashboard")
    });
  });

  app.post('/editRoomSettings', checkAuth ,async function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      const { name, description, ID } = fields;
      if (!name || !description || !ID) return res.status(400).send();
      const chatRoom = await client.schema.chatRooms.findOne({ _id : ID });
      if(req.session.user.id != chatRoom.ownerID)res.status(400).send() ;
      await client.schema.chatRooms.updateOne({ _id : ID }, {name:name,description:description});
      if (files.icon.name=="") return res.redirect(`/room/${ID}`)
      const imageLocation = await imageUplad(client,req, res, fields, files,"room",ID);
      res.redirect(`/room/${ID}`)
    });
  });
  
  app.get('/dashboard',checkAuth, async function (req, res) {
      console.log(req.session)
    const chatRooms = await client.schema.chatRooms.find({ members : { $all : [req.session.user.id] }});
    let userInfo = await client.schema.users.find({ _id : req.session.user.id });
    userInfo = addIconsToList(userInfo,"user")
    res.render('dashboard.ejs', {
        userInfo,
        chatRooms,
        error:req.query.error || req.query.e,
        user: req.session.user
    }); 
  });

  app.post('/message',checkAuth, async function (req, res) {
    const senderID = req.session.user.id;
    const { roomID, message } = req.body;
    if ( !roomID || !senderID ) return;
    const room = await client.schema.chatRooms.findOne({'_id' : roomID});
    if (!room) return;
    if (!room.members.includes(senderID)) return;
    console.log(req.body)   
    res.status(200).send()
    if (message=="") return;
    ws.sendMessage(client,{
      message:message,
      senderID:senderID,
      roomID:roomID
    });
    await client.schema.messages.create({
      chatRoomID:roomID,
      message:message,
      senderID:senderID,
      time:Date.now()
  });

  });


