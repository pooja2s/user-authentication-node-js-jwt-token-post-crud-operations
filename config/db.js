const { MongoClient } = require("mongodb");
 
// Replace the following with your Atlas connection string                                                                                                                                        
const url = process.env.DB_CONNECTION;

// Connect to your Atlas cluster
const client = new MongoClient(url);
let connectedDb;
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected successfully to server");
        // Establish and validate successful connection
         connectedDb = client.db('basicmongodb');
        // // Make a request to the collection we want
        // const col = db.collection('users');
        // const doc = await col.findOne({});
        // console.dir(doc || 'No documents found!');
        return connectedDb;
        
        console.log("Successfully connected to Atlas");

    } catch (err) {
        console.log(err.stack);
        throw err;

    }
}


connectToDatabase().catch(console.dir);

module.exports = { connectToDatabase };