const express = require('express')
const logger = require("./logger")
const matchmaker = require("./matchmaker")

let app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server, {log: false, origins: '*:*'})

//assign socket.IO to logger and matchmaker module 
logger.io = io
matchmaker.io = io

const PORT = process.env.PORT || 5000

app.get('/', (req, res) => {
  res.send('ok')
})

//create user and match 
app.get("/match", (req, res) => {
  //logger.log("info", "New match request.")
  res.send(matchmaker.Match())
})

//check player has a rival
app.get("/isMatched", (req, res) => {
  //logger.log("info", "New isMatched request.")
  res.send(matchmaker.IsMatched(req.query.id))
})

//server listen
server.listen(PORT, () => console.log(`Listening on ${PORT}`))

//Socket.IO connection for control panel
io.on('connection', (socket)=>{

  //Send logs, players and games that have been created before connection
  socket.emit('oldLogs', logger.logs) 
  socket.emit('oldPlayers', matchmaker.getPlayers()) 
  socket.emit('oldGames', matchmaker.getGames())

  //listen the addPlayer action from control panel
  socket.on("addPlayer", (data)=>{
      matchmaker.Match()  
  })

  //listen the reset server action from control panel
  socket.on("reset", (data)=>{
    matchmaker.Reset()  
  })
  
});

logger.log("info", "Server started.")

