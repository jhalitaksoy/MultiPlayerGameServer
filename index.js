const express = require('express')
const logger = require("./logger")
const matchmaker = require("./matchmaker")
const cors = require('cors')
const bodyParser = require('body-parser')

let app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server, {log: false, origins: '*:*'})

//assign socket.IO to logger and matchmaker module 
logger.io = io
matchmaker.io = io

const PORT = process.env.PORT || 5000

app.use(cors({
  origin: 'http://localhost:3000'
}));

//app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('ok')
})

//create user and match 
app.post("/match", bodyParser.json(), (req, res) => {
  //logger.log("info", "New match request.")
  res.send(matchmaker.Match())
})

/*
 * Example post data : 
 * {
 *    playerId : 'unique string',
 *    localMessageCount : 0
 *    messages : [
 *                  {
 *                      type :    "normal",
 *                      content : "finished",
 *                  },
 *                  ...
 *               ]
 * }
 *
 *
 *
 */
app.post("/getMessages", bodyParser.json(), (req, res) => {
  const data = {
    playerId : req.body.playerId,
    localMessageCount : req.body.localMessageCount,
  }
  
  const returnData = matchmaker.getMessages(data)

  res.end(JSON.stringify(returnData))
})

app.put("/getMessages", bodyParser.json(), (req, res) => {
  const data = {
    playerId : req.body.playerId,
    localMessageCount : req.body.localMessageCount,
  }
  
  const returnData = matchmaker.getMessages(data)

  res.end(JSON.stringify(returnData))
})

app.post("/sendMessages", bodyParser.json(), (req, res) => {
  const data = {
    playerId : req.body.playerId,
    messages : req.body.messages,
  }
  const returnData = matchmaker.sendMessages(data)
  res.end(JSON.stringify(returnData))
})

app.put("/sendMessages", bodyParser.json(), (req, res) => {
  const data = {
    playerId : req.body.playerId,
    messages : req.body.messages,
  }
  const returnData = matchmaker.sendMessages(data)
  res.end(JSON.stringify(returnData))
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

