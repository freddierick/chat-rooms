const bcrypt = require('bcrypt');

module.exports = async function(req, res, client){
  console.log(req.body.type)

    const { username, password, name, lastname, email, confurmPassword } = req.body;


    let userData = await client.schema.users.findOne({ email: username || email });


switch(req.body.type) {
    case "login":
  console.log(req.body.type)
        if(!userData) userData = await client.schema.users.findOne({ username: username || email });
        if (!username || !password) return res.status(400).send('missing data');
        if (!userData) return res.redirect('/login?error=That email or password is wrong');
        if (!await bcrypt.compare(password,userData.password)) return res.redirect('/login?error=That email or password is wrong');
        req.session.user={
            loggedIn:true,
            id:userData._id,
            firstName:userData.firstName,
            lastName:userData.lastName,
            email:userData.email,
        };
        console.log(req.session.user)
        return res.redirect('/dashboard');
      break;
    case "register":
        if (!name ||  !lastname || !email || !password || !username || !confurmPassword) res.status(400).send('missing data');
        if (confurmPassword!=password) return res.redirect('/register?error=Those passwords don\'t match!');
        if (userData) return res.redirect('/register?error=There is all ready a account with that username!');
        let hashedPass = await bcrypt.hash(password,10);
        await client.schema.users.create({
            firstName:name,
            lastName:lastname,
            username:username,
            email:email,
            icon:"null",
            password: hashedPass,
            services:[],
            settings:{colPref:true,timZone:"GMT"},
        });
        userDataa = await client.schema.users.findOne({ email: email });
        await client.schema.chatRooms.updateOne({_id: "5f78cf5499cd19c5cca2d261"}, { $push: { members: userDataa._id } });
        await client.schema.chatRooms.updateOne({_id: "5f78cfff747410d738ce1582"}, { $push: { members: userDataa._id } });
        return res.redirect('/login?error=Account created now you need to log in ...')
      break;
    default:
        res.status(400).send('bad type');
  }
}