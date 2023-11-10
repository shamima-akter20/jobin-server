const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 1212;

//middleware
app.use(cors());
app.use(express.json());


console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k5sapwk.mongodb.net/?retryWrites=true&w=majority `;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const addJobCollection = client.db('jobStore').collection('addJob');

    //add jobs
    app.post('/addJob', async(req, res) =>{
        const addJobs = req.body;
        console.log(addJobs);
        const result = await addJobCollection.insertOne(addJobs);
        res.send(result);
    })

    app.get('/addjob', async(req, res) =>{
        const cursor = addJobCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

// ------------------   new   ---------------------
    app.get("/addjob/:id", async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)} // to find data by id from mongodb
        const cursor = await addJobCollection.findOne(query)
        res.send(cursor);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req, res) =>{
    res.send('job store running')
})

app.listen(port, () =>{
    console.log(`${port}`);
})