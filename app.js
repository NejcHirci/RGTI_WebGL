const express = require('express');
const app = express()
const port = process.env.PORT || 8080

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
    console.log(`Server listening at ${port}`);
});