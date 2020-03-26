const express = require('express')
const logger = require("./logger")
const matchmaker = require("./matchmaker")

let app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server, {log: false, origins: '*:*'})

logger.io = io
matchmaker.io = io

const PORT = process.env.PORT || 5000

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

app.get("/clear",  (req, res) => {
  logger.log("info", "New clear request.")
  res.send(matchmaker.Clear())
})

server.listen(PORT, () => console.log(`Listening on ${PORT}`))

io.on('connection', (socket)=>{
  socket.emit('oldLogs', logger.logs) 
  socket.emit('oldPlayers', matchmaker.getUsers()) 
});

logger.log("info", "Server started.")

