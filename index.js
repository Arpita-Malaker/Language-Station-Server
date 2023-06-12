const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middliewire
app.use(cors());
app.use(express.json());

///jwt verify

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log({ authorization });
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];


  jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded) => {
    console.log(err)
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


////jwt verify end

// Mongodb connected

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.utsqttn.mongodb.net/?retryWrites=true&w=majority`;

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

    const instructor = client.db("languagedb1").collection("instructor");
    const usersCollection = client.db("languagedb1").collection("users");
    const classCollection = client.db("languagedb1").collection("classesInfo");
    const cartCollection = client.db("languagedb1").collection("carts");




    //JWT IN USER POST

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT, { expiresIn: '1hr' })
      res.send({ token });

    })

    // verify admin before jwt


    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' })

      }
      next();
    }
    ////

    // verify instructor before jwt


    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'instructor') {
        return res.status(403).send({ error: true, message: 'forbidden message' })

      }
      next();
    }

    //


    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    app.post('/users', async (req, res) => {

      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)

      if (existingUser) {
        return res.send({ message: "already exis" })
      }
      const result = await usersCollection.insertOne(user)
      res.send(result);

    })



    //check user is Admin or not

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(req.decoded.email);

      if (req.decoded.email !== email) {

        console.log('not admin')
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    //////

    //check user is instructor or not

    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        console.log('not Instructor')
        res.send({ instructor: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
    })

    //////

    // user update role as Admin

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {

        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // update role as instructor
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {

        $set: {
          role: 'instructor'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    //send the classesCollection on server
    app.post('/classesInfo', verifyJWT, verifyInstructor, async (req, res) => {

      const newItem = req.body;
      const result = await classCollection.insertOne(newItem);
      res.send(result);
    })



    ///
    // get 




    ////

    // update status as approve
    app.patch('/classesInfo/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {

        $set: {
          status: 'approved'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })



    //


    //update status as deny
    app.put('/classesInfo/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {

        $set: {
          status: 'deny'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })



    //
    // get the classesInfo

    app.get('/classesInfo', async (req, res) => {

      const result = await classCollection.find().toArray();
      res.send(result);
    })

    // add feed back

    app.patch('/classesInfo/:id', async (req, res) => {


      // const newItem = req.body;
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateFeedback = req.body;
      console.log(updateFeedback)
      const updateDoc = {
        $set: {
          feedback: updateFeedback.feedback
        },
      };
      // const newItem = req.body;
      const result = await classCollection.updateOne(filter, updateDoc);
      console.log('hello')
      res.send(result);

    })

    //cart collection 
    app.post('/carts', async (req, res) => {
      // const item = req.body;
      // console.log(item);

      const item = req.body;
      const query = {
        itemId: item.
          itemId
      }
      const existingcart = await cartCollection.findOne(query)

      if (existingcart) {
        return res.send({ message: "already exis" })
      }
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })


    app.get('/carts',async(req,res)=>{
      const result = await cartCollection.find().toArray();
      res.send(result);
    })

 

    app.delete('/carts/:id',async(req,res)=>{
      const id= req.params.id;
      const q={_id:new ObjectId(id)}
      const r = await cartCollection.deleteOne(q);
      res.send(r);
    })
    app.get('/instructor', async (req, res) => {
      const result = await instructor.find().toArray();
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



//



app.get('/', (req, res) => {
  res.send('School is running')
})

app.listen(port, () => {
  console.log(`school is running on port ${port}`);
})