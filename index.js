const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yba5w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
    await client.connect();
    const serviceCollection=client.db('computerhub').collection('tools');
    const userCollection = client.db('computerhub').collection('users');
    const orderCollection = client.db('computerhub').collection('order');
    app.get('/service',async(req,res)=>{
      const query={};
      const cursor=serviceCollection.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })

    app.put('/user/:email',async(req,res)=>{
      const email=req.params.email;
      const user=req.body;
      const filter={email:email};
      const options={upsert:true};
      const updateDoc={
        $set:user,
      }
      const result=await userCollection.updateOne(filter,updateDoc,options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({ result, token });
    })

    app.get('/service/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:ObjectId(id)};
      const service=await serviceCollection.findOne(query);
      res.send(service);
    })

    app.put('/service/:id',async(req,res)=>{
      const id=req.params.id
      const updatedProduct=req.body
      const filter ={ _id:ObjectId(id)}
      const options = { upsert: true }
      const updatedDoc={
        $set:{
          quantity: updatedProduct.quantity
        }
      }
      const result=await serviceCollection.updateOne(filter,updatedDoc,options)
      res.send(result)
    })

    //order

    app.put('/service/:id',async(req,res)=>{
      const id=req.params.id
      const updatedProduct=req.body
      const filter ={ _id:ObjectId(id)}
      const options = { upsert: true }
      const updatedDoc={
        $set:{
          quantity: updatedProduct.quantity
        }
      }
      const result=await serviceCollection.updateOne(filter,updatedDoc,options)
      res.send(result)
    })

    app.post('/order',async(req,res)=>{
      const order=req.body;
      const result=await orderCollection.insertOne(order);
      res.send(result);
    })

  }finally{

  }
}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send('Hello From ComputerHub!')
  })
  
  app.listen(port, () => {
    console.log(`Computerhub listening on port ${port}`)
  })