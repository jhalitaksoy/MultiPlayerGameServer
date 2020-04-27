const logger = require("./logger")
const { v1: uuidv1 } = require('uuid');

// holds whole players
let players = []

//holds whole waiting for rival players
let waitingPlayers = []

//hold count for player name
let playerCount = 0

//holds created games
let games = []

//for access players from outside
exports.getPlayers = () => { return players }

//for access games from outside
exports.getGames = () => { return games }

//socket.io 
// if we want to sent message to control panel
exports.io = undefined

//create player and match if there is a rival
exports.Match = function () {

    //create player
    const player = createPlayer()

    //if there is rival find it
    findOtherPlayer(player, (isFind, otherPlayer) => {
        if (isFind) {

            const rivalLastSeen = Date.now() - otherPlayer.lastSeen;
            if(rivalLastSeen > 2000){
                logger.log("warn", `${otherPlayer.name} is offline!`)
                return false
            }

            //create new game
            const game = createGame(player, otherPlayer)

            //if find the rival
            play(game, player, otherPlayer)

            const message = {
                type : "game control",
                content : "game start",
             }

             sendMessage(player, message)
             sendMessage(otherPlayer, message)

             return true
        }
    })

    //returns player id for client to take another action like isMatched  
    return player.id
}

//Check if player has a rival and ready to play
exports.IsMatched = function (id) {

    //find user by id
    getPlayer(id, (find, player) => {

        //maybe not find user cause given id is not correct
        if (find) {
            //check user state and if it is playing return true else false
            if (player.state == "playing") {
                return true
            }
            else if (player.state == "waiting") {
                return false
            } else {
                logger.log("warn", player.name + "'s state not correct : " + player.state)
                return undefined
            }
        } else {
            if (id === "") {
                logger.log("warn", "Player not found. Player id that client send is empty! : ")
            } else {
                logger.log("warn", "Player not found. Player id that client send is not correct : " + id)
            }
            return undefined
        }
    })
}


//reset server, clear lists
exports.Reset = function () {

    //clear logs
    clearList(logger.logs)

    //clear players
    clearList(players)
    clearList(waitingPlayers)

    //clear games
    clearList(games)

    //player name counter 
    playerCount = 0

    //send clear message to clients
    if (this.io != undefined) {
        this.io.emit("reset", {})
    }
}

/////////////
///Player///
///////////

//create player, store lists and send message to client
const createPlayer = () => {

    //create a new player
    const player = nextPlayer()

    //store player in the list of players
    players.push(player)
    logger.log("info", player.name + " created.")

    //store player in the list of waiting players
    waitingPlayers.push(player)
    logger.log("info", player.name + " moved to waiting list.")

    //send a message to clients new player created
    if (this.io != undefined) {
        this.io.emit("newPlayer", player)
    }

    return player
}

//create a player 
const nextPlayer = () => {
    return {
        id: uuidv1(), //unique id
        name: nextName(),
        state: 'waiting',
        isOnline: true,
        rival: undefined, // rival's id
        inbox: [], // messages
        lastSeen : Date.now()
    }
}

//create new player name like Player0, Player1, Player2 ...
const nextName = () => "Player" + playerCount++

//find user by given id 
const getPlayer = (id, callBack) => {
    for (let user of players) {
        if (user.id == id) {
            callBack(true, user)
            return
        }
    }
    callBack(false, undefined)
}

//clear given list
const clearList = (list) => {
    list.splice(0, list.length)
}

//remove given players from waitingList and change state to playing
function play(game, player1, player2) {
    _play(game, player1, player2)
    _play(game, player2, player1)

    logger.log("info", player1.name + " and " + player2.name + " playing.")
}

//state update, assing rival and remove from waiting list
function _play(game, player1, player2) {
    player1.state = 'playing'
    player1.rival = player2.id
    player1.game = game.id
    remove(waitingPlayers, player1)
}

//remove given player from given list
function remove(players, player) {
    let i = 0
    for (let player1 of players) {
        if (player1.id == player.id) {
            players.splice(i, 1)
        }
        i++
    }
}

//find player that waiting for rival 
function findOtherPlayer(player, callBack) {
    for (let eachPlayer of waitingPlayers) {
        if (eachPlayer.id != player.id) {
            if(callBack(true, eachPlayer) === true){
                break;
            }
        }
    }
    callBack(false, undefined)
}

/////////////
/// Game ///
///////////

//create game and send message that new game
const createGame = (player1, player2) => {

    //create game
    const game = nextGame(player1, player2)

    games.push(game)

    //send message 
    this.io.emit("newGame", game)

    return game
}

//create game
const nextGame = (player1, player2) => {
    return {
        id: uuidv1(),
        name: nextGameName(),
        player1: player1.id,
        player2: player2.id,
        player1Name: player1.name,
        player2Name: player2.name,
        //player1Messages: [],
        //player2Messages: [],
    }
}

//created game count
let gameCount = 0

//next game name like Game0 , Game1 ...
const nextGameName = () => { return "Game" + gameCount++ }

//get the game by id
const getGame = (id, callBack) => {
    for (let game of games) {
        if (game.id == id) {
            callBack(true, game)
            return
        }
    }
    callBack(false, undefined)
}

//////////////////
/// Messaging ///
////////////////

exports.getMessages = (data) => {

    let resData =  {
        messages: []
    }

    if (!CheckDataisCorrect(data)) {
        logger.log("err", "[UpdateRequest] Post data is incorrect!")
        return resData
    }

    //todo : refactor

    //find the player who send a update request
    getPlayer(data.playerId, (find, player) => {
        if (find) {
            resData = {
                messages: getNewMessages(player, data.localMessageCount)
            }
            player.lastSeen = Date.now()
        } else {
            logger.log("err", "[UpdateRequest] Player ID is not correct!")
        }
    })

    return resData
}

/*
 * return form : {
     messages : [
         {
            type : "game control",
            content : "finished",
         },
         ...
     ]
 }
 *
 * 
 * 
 */
exports.sendMessages = (data) => {

    let resData = {}

    if (!CheckDataisCorrect(data)) {
        logger.log("err", "[sendMessageRequest] Post data is incorrect!")
        return resData
    }

    //find the player who send a update request
    getPlayer(data.playerId, (find, player) => {
        if (find) {
            getPlayer(player.rival, (find2, rival) => {
                if (find2) {
                    sendNewMessages(rival, data.messages)
                    logger.log("info", "Sended messages to rival. Count : " + data.messages.length)
                    player.lastSeen = Date.now()
                }else{
                    logger.log("err", "Player hasn't a rival.")
                }
            })
        } else {
            logger.log("err", "[sendMessageRequest] Player ID is not correct!")
        }
    })

    return resData
}

//Check client sended data is correct form
const CheckDataisCorrect = (data) => {

    if (data == undefined) {
        return false
    }
    if (data.playerId == undefined) {
        return false
    }

    //maybe more control 

    return true
}

//add new messages that player send 
const sendNewMessages = (player, messages) => {
    for (let message of messages) {
        sendMessage(player, message)
    }
}

//
const sendMessage = (player, message) => {
    player.inbox.push(message)
}

//Get new message from rival
//algoritm : check equal local message count and real message count then
//if it is not equal return messages 
const getNewMessages = (player, localMessageCount) => {

    //const rivalMessages = getMessageList(game, rival)
    const rivalMessages = player.inbox

    const diff = rivalMessages.length - localMessageCount
    const readed = rivalMessages.length - diff

    if (rivalMessages != undefined) {
        if (diff > 0) {
            logger.log("info", player.name + " received new messages. Count : " + diff)
            return rivalMessages.slice(readed)
        }else{
            return []
        }
    } else {
        logger.log("err", "[UpdateRequest] Game and player not matching. Cannot get rivalMessages list.")
    }
}

//get player message list from game object
//const getMessageList = (game, player) => {
//    if (game.player1 == player.id) {
//        return game.player1Messages
//    } else if (game.player2 == player.id) {
//        return game.player2Messages
//    }
//    else {
//        return undefined
//    }
//}