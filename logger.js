var logger = exports;

logger.logs = []
logger.debugLevel = 'warn';
logger.io = undefined;

//for log something
logger.log = function (level, message) {

  //log level
  var levels = ['info', 'warn', 'error'];

  if (levels.indexOf(level) <= levels.indexOf(logger.debugLevel)) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    };

    //log to console
    console.log(level + ': ' + message);

    //
    const log = createLog(level, message)

    //store logs in the list
    this.logs.push(log)

    //send message that new log to control panel
    this.io.emit("newLog", log)

  }
}

//create new log and return
const createLog = (level, message) => {
  return {
      level: level,
      message: message,
    }
}