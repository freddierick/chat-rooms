var nodemailer = require('nodemailer');
module.exports = async function(data, to){
    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'freddiePostBox',
        pass: '8UB4xPpyubQq'
    }
    });
    let thing = "";
    Object.keys(data).forEach(element => {
        thing += element + ": " + data[element] + `\n`;
    });
    var mailOptions = {
    from: 'freddiePostBox@gmail.com',
    to,
    subject: 'You got mail! (post.freddie.pw)',
    text: thing
    };

    await transporter.sendMail(mailOptions)//, function(error, info){
    // if (error) {
    //     console.log(error);
    // } else {
    //     console.log('Email sent: ' + info.response);
    // }
    // });
    return;
}