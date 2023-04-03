const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tiiizrg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRETE_KEY, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    // Collections --------------
    const userCollection = client.db('jobPortal').collection('users');
    const jobCategoriesCollection = client.db('jobPortal').collection('jobCategories');
    const jobsCollection = client.db('jobPortal').collection('jobs');




    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const option = { upsert: true };
      const updateDoc = {
        $set: user
      }
      const result = await userCollection.updateOne(query, updateDoc, option);
      const token = jwt.sign(user, process.env.JWT_SECRETE_KEY, { expiresIn: '10d' })
      res.send({ result, userToken: token })
    });

    // get user
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result)
    });

    // get categories jobs
    app.get('/categories-job', async (req, res) => {
      const filter = {};
      const result = await jobCategoriesCollection.find(filter).toArray();
      res.send(result);
    });

    // get categories jobs
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      console.log('req ID', id)
      const query = { id: id }
      console.log('query', query);
      const jobs = await jobsCollection.find(query).toArray();
      res.send(jobs);
    });

    // get job details
    app.get('/job-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })
  }
  finally { }
}
run().catch(error => console.log(error))

app.get('/', (req, res) => {
  res.send('jobPortal api is running')
});

app.listen(port, (req, res) => {
  console.log(`JopPortal Server is Running on port ${port}`)
})