const logger = require("./logger")
const { v1: uuidv1 } = require('uuid');

const waitingUsers = []
const playingUsers = []

exports.Login = function() {
    //todo check request id is correct
    let id = uuidv1()
    waitingUsers.push({
        id: id,
    })

    logger.log("info", "New player created : " + id)
    logger.log("info", "Player moved to waiting list : " + id)

    return id
}

exports.Match =  function(id) {
    if (IsWaiting(id)) {
        FindOtherPlayer(id, (isFind, otherUser) => {
            if (isFind) {
                Play(id, otherUser.id)
            }
        })
    }
    return "ok"
}

exports.IsMatched = function(id){
    console.log("id : " + id)
    return !IsWaiting(id)
}

exports.Clear = function(){
    waitingUsers.splice(0,waitingUsers.length)
    playingUsers.splice(0,playingUsers.length)
}

function Play(id, otherId) {
    _Play(id, otherId)
    _Play(otherId, id)
    logger.log("info", "Users playing :  " + id + "  " + otherId)
}

function _Play(id, otherId) {
    playingUsers.push({ id: id, otherUser: otherId })
    Remove(waitingUsers, id)
}

function Remove(users, id) {
    let i = 0
    for (let user1 of users) {
        if (user1.id == id) {
            users.splice(i, 1)
        }
        i++
    }
}

function IsWaiting(id) {
    for (let user of waitingUsers) {
        if (user.id == id) {
            return true
        }
    }
    return false
}

function FindOtherPlayer(id, callBack) {
    for (let user of waitingUsers) {
        if (user.id != id) {
            callBack(true, user)
        }
    }
    callBack(false, null)
}