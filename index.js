const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4heos.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("tool_mine").collection("products");
        const reviewsCollection = client.db("tool_mine").collection("reviews");
        console.log('mongo');
        const userCollection = client.db("tool_mine").collection("users");
        console.log('mongo');

        //---- login api ----//

        //add & update  user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, token })
        })


        //--------------------//


        //---- user ---//

        // all products
        app.get('/products', async (req, res) => {
            const query = {}
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })

        // single product
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const product = await productsCollection.findOne(query)
            res.send(product);
        })

        // add reviews 
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result)
        })

        // all reviews
        app.get('/reviews', async (req, res) => {
            const query = {}
            const reviews = await reviewsCollection.find(query).toArray();
            res.send(reviews);
        })

        //-------------------//



        //---- admin api ----//


        //------------------//

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('toolmine server on');
})

app.listen(port, () => {
    console.log('listening port :', port);
})