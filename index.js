const express = require('express')
const PORT = process.env.PORT || 5000

var app = express()

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
  res.send('hello world')
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))