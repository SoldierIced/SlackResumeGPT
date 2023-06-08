require('dotenv').config();
const { MongoClient } = require('mongodb');
let client = null;
try {
    client = new MongoClient(process.env.MONGO_URL);
    console.log("mongo  connected ");


} catch (error) {
    client = null;
    console.log("mongo not connected ");
}




module.exports = {

    async insertSummary(summary) {
        if (client != null) {

            await client.connect();
            if (summary.id == undefined) {
                let lastRecord = await client.db().collection("Summaries").find().sort({ id: 1 }).toArray();
                lastRecord = (lastRecord[0]?.id ? lastRecord[0]?.id : 0) + 1;
                summary.id = lastRecord;
            }
            await client.db().collection("Summaries").insertOne(summary);
        }
    },
     getClient() {
       
        return client;
    }
}