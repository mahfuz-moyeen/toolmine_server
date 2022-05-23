const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4heos.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// token function
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("tool_mine").collection("products");
        const reviewsCollection = client.db("tool_mine").collection("reviews");
        const userCollection = client.db("tool_mine").collection("users");
        const ordersCollection = client.db("tool_mine").collection("order");
        const paymentCollection = client.db("tool_mine").collection("payment");

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

        // get user by email
        app.get('/user/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            console.log(query);
            const user = await userCollection.find(query).toArray()
            res.send(user)
        })

        //update  user
        app.patch('/user/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const data = req.body;
            const filter = { email: email }
            const updateDoc = {
                $set: data
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
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


        /////---------ORDERS API--------/////

        // add orders 
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        })

        // get orders  by user email
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const orders = await ordersCollection.find(query).toArray();
                return res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' })
            }
        })

        //delete  order
        app.delete('/order/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(filter)
            res.send(result)
        })

        // get single order 
        app.get('/order/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const order = await ordersCollection.findOne(query);
            res.send(order)
        })

        // update order and add to payment
        app.patch('/order/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updateOrder = await ordersCollection.updateOne(filter, updatedDoc);
            res.send(updateOrder);
        })

        //-------------------//



        /////---------REVIEWS API--------/////

        // add reviews 
        app.post('/review', verifyToken, async (req, res) => {
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

        //make admin
        app.put('/user/admin/:email', verifyToken, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //------------------//




        //---- payment ----//

        //create payment 
        app.post('/create-payment-intent', verifyToken, async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });

        //----------------//

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