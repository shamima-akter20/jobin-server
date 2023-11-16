const express = require('express');
const jwt = require('jsonwebtoken')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 1212;

//middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

const verifyToken = async (req, res, next)=>{
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
}

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
    const bidJobCollection = client.db('jobStore').collection('bidJob');

    // jwt
    app.post('/createToken', async(req, res)=>{
      const payload = req.body;
      const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'})
      console.log(token);
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      }).send({message: "Token created successfully"})
    })

    app.get('/clearToken', async (req, res)=>{
      res.clearCookie('token', {httpOnly: true}).send({message: 'token clear'})
    })

    //add jobs
    app.post('/addJob', async(req, res) =>{
        const addJobs = req.body;
        console.log(addJobs);
        const result = await addJobCollection.insertOne(addJobs);
        res.send(result);
    })

    app.get('/addJob', async(req, res) =>{
        const cursor = addJobCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/getMyJob/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      const filter = {email}
      const result = await addJobCollection.find(filter).toArray()
      res.send(result)
    })

    app.delete('/addJob/:id', async(req, res) =>{
       const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const result = await addJobCollection.deleteOne(query);
       res.send(result);
    })

    app.put('/addJob/:id', async(req, res) =>{
       const id = req.params.id;
       const filter = {_id: new ObjectId(id)}
       const options = {upsert: true};
       const updateJob = req.body;
    //  console.log('put route ', upd);
       const Job = {
        $set:{
          email: updateJob.email,    
          job_title: updateJob.job_title,
          deadline: updateJob.deadline,
          Category: updateJob.Category,
          max_price: updateJob.max_price,
          min_price: updateJob.min_price,
          description: updateJob.description,
        }
       }
       const result = await addJobCollection.updateOne(filter, Job, options);
       res.send(result);
    })



// ------------------   new   ---------------------
    app.get("/addjob/:id", async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)} // to find data by id from mongodb
        const cursor = await addJobCollection.findOne(query)
        res.send(cursor);
    })

    // bid job section
    app.post('/bidJob', async(req, res) =>{
      const bidJobs = req.body;
      console.log(bidJobs);
      const result = await bidJobCollection.insertOne(bidJobs);
      res.send(result)
    })

    app.get('/bidJob', async(req, res) =>{
      const cursor = bidJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
  })


  app.get('/bidJobQuery', async(req, res)=>{
    const result = await bidJobCollection.find(req.query).toArray()
    res.send(result)
  })

  // http://localhost:1212/myBid?propertyName=propertyNameervalue

  app.get('/myBid', async(req, res)=>{
    const filter = req.query;
    const result = await bidJobCollection.find(filter).toArray()
    res.send(result)
  })

  app.put('/acceptedBid/:id', async(req, res)=>{
    const filter = {_id: new ObjectId(req.params.id)}
    const doc = {
      $set: {
        status: "In Progress"
      }
    }
    const result = await bidJobCollection.updateOne(filter, doc, {upsert: true})

    res.send(result)

  })

  // ------------------------------ tik  tik ---------------------------------
  app.put('/rejectedBid/:id', async(req, res)=>{
    const filter = {_id: new ObjectId(req.params.id)}
    const doc = {
      $set: {
        status: "Caneled"
      }
    }

    const result = await bidJobCollection.updateOne(filter, doc, {upsert: true})

    res.send(result)

  })

  app.put('/completeBid/:id', async(req, res)=>{
    const filter = {_id: new ObjectId(req.params.id)}
    const doc = {
      $set: {
        status: "Complete"
      }
    }

    const result = await bidJobCollection.updateOne(filter, doc, {upsert: true})

    res.send(result)

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