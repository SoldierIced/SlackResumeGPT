require('dotenv').config();
const Slack = require('./src/Slack');
const createExpressServer = require("express");
const router = createExpressServer();
const slack = new Slack(process.env.CHANNEL_NAME);
// const { MongoClient } = require('mongodb');
const { saveFile, getNameFiles, getFile } = require('./src/Functions');
const { insertSummary, getCollectionSummary, getClient } = require('./src/Mongo');


router.listen(process.env.PORT, async () => {
    await slack.start();
    console.log("⚡️ server on in PORT" + process.env.PORT);

});



router.post('/command', async function (req, res, next) {
    const body = req.body; //? if you active the command and you deploy this in server.
    // const body = { "token": "fCBpYlzTIoBrvIZxgj7YC71M", "team_id": "T05BHGRF55G", "team_domain": "lemonchallengetest", "channel_id": "C05B312K8KZ", "channel_name": "lemonchallengecanal", "user_id": "U05B30WBP8X", "user_name": "nehuenfortes", "command": "\/summary", "text": "true last", "api_app_id": "A05BHEW97CK", "is_enterprise_install": "false", "response_url": "https:\/\/hooks.slack.com\/commands\/T05BHGRF55G\/5409170189729\/CY1jttZJX6gTOfXqOUvpUfc3", "trigger_id": "5389875203686.5391569515186.80a570626a6aab8066a789cd20ff6a4c" }
    // event test 
    if (body.command == "/summary") {
        let replies = true;
        let all = true;
        let text = body.text.split(" ");
        console.log(text, "text");
        if (text.length >= 1) {
            text[0] = text[0].toLowerCase();
            if (text[0] == "true" || text[0] == "false") {
                replies = Boolean(text[0]);
            }
        }

        if (text.length >= 2) {
            text[1] = text[1].toLowerCase();
            if (text[1] == "all" || text[1] == "last") {
                if (text[1] == "all") {
                    all = "all";
                } else { // search last  id created  .
                    if (process.env.MONGO_URL != "" && process.env.MONGO_URL != undefined) {
                        let client = getClient();
                        await client.connect();
                        let lastRecord = await client.db().collection("Summaries").find().sort({ id: 1 }).toArray();
                        if (lastRecord.length == 0) {
                            all = "all";
                        } else {
                            all = lastRecord[0].tsEnd;
                        }
                    } else {
                        //get last file name  
                        let files = await getNameFiles();
                        console.log(files);
                        if (files.length == 0) {
                            all = "all";
                        } else {
                            let file = JSON.parse(await getFile(files[files.length - 1]));
                            console.log(file, "file")
                            all = file.tsEnd;
                        }
                    }
                }
            }
        }

        let summary = await slack.generateSummary(replies, all, body.channel_id);
        //save summary in mongo o json
        if (summary?.error == undefined) {

            saveSummary(summary)
        }
        res.send(summary?.content != undefined ? summary?.content : summary.error);
    }


});

async function saveSummary(summary) {
    if (process.env.MONGO_URL != "" && process.env.MONGO_URL != undefined) {
        try {
            await insertSummary(summary);
        } catch (error) {
            console.log(error, "error with saving summary in mongo, saving in file");
            id = (await getNameFiles()).length + 1;
            summary.id = id;
            await saveFile("summary_" + id + ".json", JSON.stringify(summary));
        }
    } else {
        id = (await getNameFiles()).length + 1;
        summary.id = id;
        await saveFile("summary_" + id + ".json", JSON.stringify(summary));

    }
}


async function generateSummaryOffline() {

    //replies    => if you want to include thread messages
    //all        => so that it uses all the messages of the channel, be careful not to test channels with many messages
    //ID channel => the id of the channel to make the summary
    let summary = await slack.generateSummary(true, "all", "C05B312K8KZ");
    if (summary?.error == undefined) {
        let data = await slack.sendMessageUser(summary.content, "C05B315FZ7H"); //! you need to load the id channel to send summary.
        // console.log(data);
        console.log("summary sended.")
    } else {
        console.log("something is broken");
    }

}


generateSummaryOffline();


// saveSummary({ test: "test" });

// slack.findConversation(true).then(async conversations => {

//     console.log(resume);
// });
