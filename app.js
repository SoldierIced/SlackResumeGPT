require('dotenv').config();
const { App } = require('@slack/bolt');
const Slack = require('./src/Slack');
const ChatGpt = require('./src/ChatGpt');
// const express = require('express');
// const router = express.Router();
// const { default: ChatGpt } = require('./src/ChatGpt');
const createExpressServer =require("express");
const Functions = require('./src/Functions');
const router = createExpressServer();
const slack = new Slack(process.env.CHANNEL_NAME);
const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env.MONGO_URL);

router.listen(process.env.PORT, async() => {
    console.log("⚡️ server on in PORT" + process.env.PORT);
    await slack.start();
});

router.post('/command', async function (req, res, next) {
    console.log(req.params,req.body)
    res.send(Functions.response("success"));
});



// slack.findConversation(true).then(async conversations => {
//     let finaltext = "";
//     console.log(conversations);
//     return;
//     let users = await slack.getProfilesConversation((await slack.getChannel()).id);
//     let lasUserTalk = {};
//     for (let index = 0; index < conversations.length; index++) {
//         const mss = conversations[index];
//         let user = users.find(x => x.userId == mss.user);
//         let msj = slack.parseMessage(mss.text, true);
//         if (msj != "") {

//             if (lasUserTalk?.userId == user.userId) { // acoplamos si sigue hablando el mismo usuario
//                 finaltext += ", " + msj + " ";
//             } else {
//                 if (finaltext != "") {
//                     finaltext += "><";
//                 } else {
//                     finaltext += "<";
//                 }
//                 finaltext += user.name + " " + slack.wordSay + " :" + msj + " ";
//             }
//             lasUserTalk = user;
//         }
//     }
//     if (finaltext.substr(finaltext.length - 1) != ">") {
//         finaltext += ">";
//     }

//     let resume = await ChatGpt(slack.contentSystem, finaltext);
//     console.log(resume);
// });
