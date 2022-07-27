const mongoose = require("mongoose");

const Url = mongoose.model(
    "links",
    new mongoose.Schema({
        urls: [String]
    })
);

module.exports = Url