const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
let MongoClient = require('mongodb').MongoClient;
const DATABASE_NAME = "wpfn-pics";

const app = express();

const corsOptions = {
    origin: "https://wpfn-bot.herokuapp.com",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models");
const Links = db.Url

// db.mongoose
//     .connect(CONNECTION_URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(() => {
//         console.log("Successfully connect to MongoDB.");
//         // initial();
//     })
//     .catch(err => {
//         console.error("Connection error", err);
//         process.exit();
//     });

// set port, listen for requests
const PORT = process.env.PORT || 8080;
let database, collection;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    MongoClient.connect('mongodb+srv://root:root@wpfn-db.cap5z.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("Nature");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

// get all collections
app.get("/api/get", (req, res) => {
    collection = database.collection(req.query.category);
    try{
        collection.find({}).toArray((error, result) => {
            if(error) return res.status(500).send(error);
            res.send(result);
        });

    }catch(e){
        res.json({error: e.toString()})
    }
});

app.post("/api/store", (req, res) => {
    collection = database.collection("Users");
    const {body} = req;
    const {from, chat} = body;
    const data = {
        first_name: from.first_name ?? "",
        last_name: from.last_name ?? "",
        username: from.username ?? "",
        language_code: from.language_code ?? null,
        chat_id: chat.id,
        date: body.date
    }
    collection.find({chat_id: chat.id}, {})
        .toArray()
        .then(items => {
            const checkExistUser = items.find(el => el.chat_id === chat.id)
            if(checkExistUser !== undefined){
                res.json({
                    message: 'Error: There is already a user with this chat id!',
                    result: false
                })
            }else{
                collection.insertOne(data, (error, result) => {
                    if(error) return res.status(500).send(error)
                    res.json({
                        message: 'Successfully added user',
                        result: true
                    })
                });
            }
        })
        .catch(err => res.json({result: err}))

});
