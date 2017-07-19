var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers",
        "accept, origin, content-type, cookie, X-Requested-With, X-HTTP-Method-Override");
    res.header("Access-Control-Allow-Credentials", true);

    if (req.method === 'OPTIONS') {
        // Fulfills pre-flight/promise request

        res.send(200);
    } else {
        next();
    }
});

app.use(express.static(__dirname + "/www"));
app.use(bodyParser.json());

var server = app
    .listen(
        3001,
        function () {
            try {
            } catch (x) {
                console.error("Cannot start node: ", x);

                process.exit();
            }
        });
