const express = require('express');
const app = express();
const port = 4173;

app.use(express.static('wwwroot'));

app.listen(port, () => {
    console.log(`Local: http://localhost:${port}`)
});