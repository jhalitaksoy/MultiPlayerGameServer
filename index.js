const express = require('express')
const logger = require("./logger")
const matchmaker = require("./matchmaker")

const PORT = process.env.PORT || 5000

let app = express()

app.get('/', (req, res) => {
  res.send('ok')
})

app.get("/login", (req, res) => {
  logger.log("info", "New login request.")
  res.send(matchmaker.Login())
})

app.get("/match", (req, res) => {
  logger.log("info", "New match request.")
  res.send(matchmaker.Match(req.query.id))
})

app.get("/isMatched", (req, res) => {
  logger.log("info", "New isMatched request.")
  res.send(matchmaker.IsMatched(req.query.id))
})

app.listen(PORT, () => console.log(`Listening on ${PORT}`))