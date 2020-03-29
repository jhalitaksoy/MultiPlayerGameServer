const logger = require("./logger")
const { v1: uuidv1 } = require('uuid');

// holds whole players
let players = []

//holds whole waiting to rival players
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

            //create new game
            const game = createGame(player, otherPlayer)

            //if find the rival
            play(player, otherPlayer)
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
        rival: undefined,
    }
}

//create new player name like Player0, Player1, Player2 ...
const nextName = () => "Player" + playerCount++

//find user by given id 
const getPlayer = (id, callBack) => {
    for (let user of players) {
        if (user.id == id) {
            callBack(true, user)
        }
    }
    callBack(false, undefined)
}

//clear given list
const clearList = (list) => {
    list.splice(0, list.length)
}

//remove given players from waitingList and change state to playing
function play(player1, player2) {
    _play(player1, player2)
    _play(player2, player1)

    logger.log("info", player1.name + " and " + player2.name + " playing.")
}

//state update, assing rival and remove from waiting list
function _play(player1, player2) {
    player1.state = 'playing'
    //player1.rival = player2
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
            callBack(true, eachPlayer)
            break;
        }
    }
    callBack(false, undefined)
}

//create game and send message that new game
const createGame = (player1, player2) => {

    //create game
    const game = nextGame(player1, player2)

    games.push(game)

    //send message 
    this.io.emit("newGame",  game)

    return game
}

//create game
const nextGame = (player1, player2) => {
    return {
        id: uuidv1(),
        name: nextGameName(),
        player1: player1.name,
        player2: player2.name,
    }
}

//created game count
let gameCount = 0

//next game name like Game0 , Game1 ...
const nextGameName = () => { return "Game" + gameCount++ }