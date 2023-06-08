const { App } = require('@slack/bolt');
require('dotenv').config();
const ChatGpt = require('./ChatGpt');

class Slack {

    constructor(channelName) {
        this.app = new App({
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET
        });
        this.nameChannel = channelName;
        this.channel = {};
        this.users = [];
        this.messageAddChannel = "se ha unido al canal";
        this.wordSay = "dijo";
        this.contentSystem = "Realiza un resumen de la siguiente conversacion, sabiendo que cada mensaje es <nombre usuario " + this.wordSay + " : > y seria ideal mostrarlo a modo de listado detallando de acciones de cada uno, identificando cual fue el problema y que soluciones se propusieron";
    }

    start = async () => {
        // this.app.start(process.env.PORT || 3000)
        this.getChannel();
    };

    async getChannel() {
        if (this.channel?.id == undefined) {

            const result = await this.app.client.conversations.list({
                token: process.env.SLACK_BOT_TOKEN,
                signingSecret: process.env.SLACK_SIGNING_SECRET
            });

            for (const channel of result.channels) {
                if (channel.name == this.nameChannel) {
                    this.channel = channel;
                }
            }
        }
        // console.log(this.channel, "chanell selected")
        return this.channel;
    }

    async joinConversation(idchannel) {

        try {
            //Entrar a la conversacion
            const join = await this.app.client.conversations.join({
                token: process.env.SLACK_BOT_TOKEN,
                // signingSecret: process.env.SLACK_SIGNING_SECRET,
                channel: idchannel
            })
            if (join.ok == true) {
                return true;
            }
        } catch (error) {

            console.log(error, "error in joinConversation");
            return false;

        }
    }
    async findConversation(replies = false, channelId = this.channel.id) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.app.client.conversations.list({
                token: process.env.SLACK_BOT_TOKEN,
                signingSecret: process.env.SLACK_SIGNING_SECRET
            });

            for (const channel of result.channels) { //todo can replace with find.
                // console.log(channel.name + " " + channel.id);
                if (channel.id == channelId) {


                    if (await this.joinConversation(channel.id) == true) {

                        let messages = await this.app.client.conversations.history({
                            token: process.env.SLACK_BOT_TOKEN,
                            signingSecret: process.env.SLACK_SIGNING_SECRET,
                            channel: channel.id
                        })
                        if (messages?.messages.length > 0) {
                            messages = messages.messages;

                            if (replies == true) {
                                let messaNew = [];
                                for (let index = 0; index < messages.length; index++) {

                                    if (messages[index]?.reply_count != undefined) {
                                        replies = await this.getRepliesConversation(channel.id, messages[index].ts);
                                        // console.log(replies, "replies");
                                        replies.forEach(msj => {
                                            messaNew.push(msj);
                                        });
                                    } else {
                                        messaNew.push(messages[index]);
                                    }
                                }
                                messages = messaNew;
                            }

                            messages = messages.sort((a, b) => a.ts - b.ts);
                            console.log(messages);
                            return messages;

                        } else {
                            return [];
                        }
                    }
                }
                return [];
            }
        }
        catch (error) {
            console.error(error, "findConversation");
            console.log(error?.data?.response_metadata)
            return [];
        }
    }
    async getRepliesConversation(channelId, ts) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.app.client.conversations.replies({
                token: process.env.SLACK_BOT_TOKEN,
                channel: channelId,
                ts: ts,
            });
            // console.log(result.profile,"user");
            return result.messages;
        }
        catch (error) {
            console.error(error, "getRepliesConversation");
            console.log(error?.data?.response_metadata)
            return [];
        }

    }
    async getMembersConversation(channelId) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.app.client.conversations.members({
                token: process.env.SLACK_BOT_TOKEN,
                channel: channelId
            });
            // console.log(result.profile,"user");
            return result.members;
        }
        catch (error) {
            console.error(error, "getMembersConversation");
            console.log(error?.data?.response_metadata)
            return [];
        }

    }
    async getProfilesConversation(channelId) {
        try {

            let members = await this.getMembersConversation(channelId);
            let users = [];
            for (let index = 0; index < members.length; index++) {
                const member = members[index];
                let profile = await this.getProfile(member);
                this.users.push({
                    userId: member,
                    name: profile.real_name,
                    // profile,
                })

            }

            return this.users;
        }
        catch (error) {
            console.error(error, "getProfilesConversation");
            console.log(error?.data?.response_metadata)
            return [];
        }

    }

    parseMessage(message, removeHasConnected = false) {
        // console.log(this.users, message);
        let ms = message;
        for (let index = 0; index < this.users.length; index++) {
            const user = this.users[index];
            // console.log("ms antes",ms)
            ms = ms.replaceAll("<@" + user.userId + ">", "<" + user.name + ">");
            if (removeHasConnected)
                ms = ms.replaceAll("<" + user.name + "> " + this.messageAddChannel, "");
        }
        return ms;
    }
    async getProfile(userId) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.app.client.users.profile.get({
                token: process.env.SLACK_BOT_TOKEN,
                user: userId
            });
            // console.log(result.profile,"user");
            return result.profile;
        }
        catch (error) {
            console.error(error, "getProfile");
            console.log(error?.data?.response_metadata)
            return [];
        }

    }

    async generateSummary(replies, all, channelId) {
        let conversations = await this.findConversation(replies, channelId);
        let finaltext = "";
        let users = await this.getProfilesConversation(channelId);
        let lasUserTalk = {};
        let firstMessage = {};
        let lastMessage = {};
        for (let index = 0; index < conversations.length; index++) {
            const mss = conversations[index];
            // console.log(parseFloat(mss.ts) > parseFloat(all), parseFloat(mss.ts), parseFloat(all))
            if (all == "all" || parseFloat(mss.ts) > parseFloat(all)) {
                if (firstMessage?.text == undefined) {
                    firstMessage = mss;
                }
                lastMessage = mss;
                let user = users.find(x => x.userId == mss.user);
                let msj = this.parseMessage(mss.text, true);
                if (msj != "") {

                    if (lasUserTalk?.userId == user.userId) { // acoplamos si sigue hablando el mismo usuario
                        finaltext += ", " + msj + " ";
                    } else {
                        if (finaltext != "") {
                            finaltext += "><";
                        } else {
                            finaltext += "<";
                        }
                        finaltext += user.name + " " + this.wordSay + " :" + msj + " ";
                    }
                    lasUserTalk = user;
                }
            }
        }
        if (finaltext.substr(finaltext.length - 1) != ">") {
            finaltext += ">";
        }
        // console.log(finaltext, "finaltext")
        // return;
        if (finaltext != "") {

            let content = await ChatGpt(this.contentSystem, finaltext);
            console.log(content);
            return { content: content.content, tsStart: firstMessage.ts, tsEnd: lastMessage.ts, channelId: channelId, replies, all, date: new Date() };
        }
        return { error: "error" };

    }

    async sendMessageUser(message, channelId) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.app.client.chat.postMessage({
                token: process.env.SLACK_BOT_TOKEN,
                channel: channelId,
                text: message,
            });
            // console.log(result.profile,"user");
            return result;
        }
        catch (error) {
            console.error(error, "sendMessageUser");
            console.log(error?.data?.response_metadata)
            return [];
        }
    }



}


module.exports = Slack
