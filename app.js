require('dotenv').config();
const { App } = require('@slack/bolt');
const Slack = require('./src/Slack');
const ChatGpt = require('./src/ChatGpt');
// const { default: ChatGpt } = require('./src/ChatGpt');


// Initializes your app with your bot token and signing secret
// const app = new App({
//     token: process.env.SLACK_BOT_TOKEN,
//     signingSecret: process.env.SLACK_SIGNING_SECRET
// });
const slack = new Slack(process.env.CHANNEL_NAME);


(async () => {
    // await slack.start(); // MODO ON .>
    console.log('⚡️ App is running !');
})();

slack.findConversation().then(async conversations => {
    let finaltext = "";
    let users = await slack.getProfilesConversation((await slack.getChannel()).id);
    let lasUserTalk = {};
    for (let index = 0; index < conversations.length; index++) {
        const mss = conversations[index];
        let user = users.find(x => x.userId == mss.user);
        let msj = slack.parseMessage(mss.text, true);
        if (msj != "") {

            if (lasUserTalk?.userId == user.userId) { // acoplamos si sigue hablando el mismo usuario
                finaltext += ", " + msj + " ";
            } else {
                if (finaltext != "") {
                    finaltext += "><";
                } else {
                    finaltext += "<";
                }
                finaltext += user.name + " " + slack.wordSay + " :" + msj + " ";
            }
            lasUserTalk = user;
        }
    }
    if(finaltext.substr(finaltext.length-1)!=">"){
        finaltext+=">";
    }
    console.log(finaltext);
    let resume = await ChatGpt(slack.wordSay,finaltext);
    console.log(resume);
});
