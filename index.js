const express = require('express');
const cors = require('cors');
require('dotenv').config();
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
        console.log('mongo');

        //---- login api ----//

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