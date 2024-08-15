const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

// Setup MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oldlbnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());



async function run() {
  try {
    // Connect to MongoDB
    await client.connect();

    // Users collection
    const userCollection = client.db("eComerce").collection("users");
    // Product collection
    const productCollection = client.db("eComerce").collection("product");

    // Product Category
    const categoryCollection = client.db("eComerce").collection("category");


    console.log("Successfully connected to MongoDB!");

    



    // jwt

    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, 
        {expiresIn: '1h'});
        res.send({token});
    });


    // verify token

    
    const verifyToken = (req, res, next) =>{
      console.log('inside verify token', req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'unauthorize access'});
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
        if(error){
          return res.status(401).send({message: 'unauthorize access'})
        }
        req.decoded = decoded;
        next();
      })
      
    }


    // use verify admin after verifyToken

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(401).send({ message: 'forbidden access'})
      }
      next();
    }




  

    // User API routes
    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
          return res.status(400).send({ message: 'User already exists', insertedId: null });
        }

        const result = await userCollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to register user', error });
      }
    });

    app.get('/users',   async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch users', error });
      }
    });


    // admin check 


    app.get('/users/:email', async(req, res ) =>{
      const email = req.params.email;

      if(email !== req.decoded.email) {
        return res.status(403).send({message: 'Forbidden access'})
      }

      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin});
    })




    // Product Add 


    app.post('/product', async(req, res) => {
      const item = req.body;
      const result = await productCollection.insertOne(item);
      res.send(result);
    })

    app.get('/product', async(req, res) => {
      const result = await productCollection.find().toArray()
      res.send(result)
  });



  app.get('/product/:id', async (req, res) => {
    const id = req.params.id;
  
    try {
      // Validate the ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid product ID' });
      }
  
      // Convert id to ObjectId
      const query = { _id: new ObjectId(id) };
      
      // Find product
      const result = await productCollection.findOne(query);
      
      if (!result) {
        return res.status(404).send({ message: 'Product not found' });
      }
  
      res.send(result);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });



  // Update Product 


  app.patch('/product/:id',async(req,res) => {
    const item = req.body;
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const updatedDoc = {
      $set: {
        name:item.name,
        category: item.category,
        price:item.price,
        recipe: item.recipe,
        image: item.image,
      }
    }

    const result = await productCollection.updateOne(filter, updatedDoc)
    res.send(result);
  })


  // Delete Product

  app.delete('/product/:id', async(req,res) => {
    const  id = req.params.id;
    const query = {_id: new ObjectId(id) }
    const result = await productCollection.deleteOne(query);
    res.send(result);
  })
  

  // Update Product

  app.patch('/product/:id',async(req,res) => {
    const item = req.body;
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const updatedDoc = {
      $set: {
        name:item.name,
        category: item.category,
        price:item.price,
        description: item.description,
        image: item.image,
        stock: item.stock,
        rating: item.rating,
        brand: item.brand,
      }
    }

    const result = await productCollection.updateOne(filter, updatedDoc)
    res.send(result);
  })



    // Get Products by Category
    app.get('/product/category/:category', async (req, res) => {
      const { category } = req.params;

      try {
        const result = await productCollection.find({ category: category }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch products by category', error });
      }
    });



    app.get('/product/category', async (req, res) => {
      const { category } = req.params;

      try {
        const result = await categoryCollection.find({ category: category }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch products by category', error });
      }
    });



    app.get('/productCategory', async(req, res) => {
      const result = await categoryCollection.find().toArray()
      res.send(result)
  });


  app.get('/product/category', async (req, res) => {
    try {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    } catch (error) {
      res.status(500).send({ message: 'Failed to fetch all categories', error });
    }
  });
  



















































   // Ping the deployment
   await client.db("admin").command({ ping: 1 });
   console.log("Pinged your deployment. You successfully connected to MongoDB!");






    // Root route
    app.get('/', (req, res) => {
      res.send('E-Commerce is Running');
    });

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  } finally {
    // The client will remain connected during the server's runtime
  }
}

// Run the server
run().catch(console.dir);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log("Shutting down server...");
  await client.close();
  process.exit();
});
