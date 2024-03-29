const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
//mongodb connected
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yba5w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('computerhub').collection('tools');
    const userCollection = client.db('computerhub').collection('users');
    const orderCollection = client.db('computerhub').collection('order');
    const profileCollection = client.db('computerhub').collection('profile');
    const reviewCollection = client.db('computerhub').collection('review');
    const paymentCollection = client.db('computerhub').collection('payment');
    const shopCollection = client.db('computerhub').collection('dokan');


    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }

    app.get('/shop', async (req, res) => {
      const query = {};
      const cursor = shopCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/shop/:id', async (req, res) => {
      const id = req.params.id;
      console.log(req);
      const query = { _id: ObjectId(id) };
      const shop = await shopCollection.findOne(query);
      res.send(shop);
    })

    // app.post('/shop/:id', verifyJWT, verifyAdmin, async (req, res) => {
    //   const id=req.params.id;
    //   const service = req.body;
    //   const result = await shopCollection.updateOne(
    //     {subId:id},
    //     {$push:{products:service}}
    //   );
    //   res.send(result);
    // })


    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    

    // app.delete('/service/:id', verifyJWT, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: ObjectId(id) };
    //   const result = await serviceCollection.deleteOne(filter);
    //   res.send(result);
    // })

    // app.get('/user', verifyJWT, async (req, res) => {
    //   const users = await userCollection.find().toArray();
    //   res.send(users);
    // });

    // app.get('/user/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   res.send(user);
    // })

    // app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
    //   const email = req.params.email;

    //   const filter = { email: email };
    //   const updateDoc = {
    //     $set: { role: 'admin' },
    //   };
    //   const result = await userCollection.updateOne(filter, updateDoc);
    //   res.send(result);
    // })

    // app.put('/user/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const user = req.body;
    //   const filter = { email: email };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: user,
    //   }
    //   const result = await userCollection.updateOne(filter, updateDoc, options);
    //   const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
    //   res.send({ result, token });
    // })

    // app.get('/service/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const service = await serviceCollection.findOne(query);
    //   res.send(service);
    // })



    // app.put('/service/:id', async (req, res) => {
    //   const id = req.params.id
    //   const quantity = req.body.newQuantity;
    //   const filter = { _id: ObjectId(id) }
    //   const updatedDoc = {
    //     $set: {
    //       quantity: quantity
    //     },
    //   };
    //   const result = await serviceCollection.updateOne(filter, updatedDoc)
    //   res.send(result)
    // })





    // admin
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })

    })


    //order

    app.get('/allorder', async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/order', verifyJWT, async (req, res) => {
      const userId = req.query.userId;
      // const decodedEmail = req.decoded.email;
      // console.log(req);
      if (!userId) {
        return res.status(403).send({ message: "forbidden access" });
      }
      else {
        const query = { userId: userId };
        const orders = await orderCollection.find(query).toArray();
        res.send(orders)
        
      }
    })

    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    })

    app.patch('/order/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
          shipped: false
        }
      }

      const result = await paymentCollection.insertOne(payment);
      const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
      res.send(updatedOrder);
    })
    //getting order by id
    app.get('/order/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    })

    //delete
    // app.delete('/order/:email', verifyJWT, async (req, res) => {
    //   const email = req.params.email;
    //   const filter = { email: email };
    //   const result = await orderCollection.deleteOne(filter);
    //   res.send(result);
    // })
    // app.delete('/allorder/:id', verifyJWT, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: ObjectId(id) };
    //   const result = await orderCollection.deleteOne(filter);
    //   res.send(result);
    // })


    // app.post('/create-payment-intent', verifyJWT, async (req, res) => {
    //   const service = req.body;
    //   const orderAmount = parseInt(service.quantity);
    //   const price = parseInt(service.price);
    //   console.log(typeof (price));
    //   const amount = price * 100;
    //   console.log(amount)
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: 'usd',
    //     payment_method_types: ['card']
    //   });
    //   res.send({ clientSecret: paymentIntent.client_secret })
    // });

    //review
    // app.post('/review', async (req, res) => {
    //   const review = req.body;
    //   const result = await reviewCollection.insertOne(review);
    //   res.send(result);
    // })

    // app.get('/allreview', async (req, res) => {
    //   const query = {};
    //   const cursor = reviewCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // })

    //profile
    // app.post('/profile', async (req, res) => {
    //   const profile = req.body;
    //   const result = await profileCollection.insertOne(profile);
    //   res.send(result);
    // })

    // app.get('/profile', verifyJWT, async (req, res) => {
    //   const email = req.query.email;
    //   const decodedEmail = req.decoded.email;
    //   if (email === decodedEmail) {
    //     const query = { email: email };
    //     const profile = await profileCollection.findOne(query);
    //     res.send(profile);
    //   }
    // })

    // app.put('/profile', async (req, res) => {
    //   const id = req.params.id
    //   const address = req.body.address;
    //   const filter = { _id: ObjectId(id) }
    //   const updatedDoc = {
    //     $set: {
    //       address: address
    //     },
    //   };
    //   const result = await userCollection.updateOne(filter, updatedDoc)
    //   res.send(result)
    // })

  } finally {

  }
}
run().catch(console.dir)




app.get('/', (req, res) => {
  res.send('Hello From ComputerHub!')
})

app.listen(port, () => {
  // console.log(email,decodedEmail);
  console.log(`Computerhub listening on port ${port}`)
})