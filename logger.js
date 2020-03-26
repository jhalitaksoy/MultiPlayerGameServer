var logger = exports;

logger.logs= []
logger.debugLevel = 'warn';
logger.io = undefined;

logger.log = function(level, message) {
  var levels = ['info', 'warn', 'error'];
  if (levels.indexOf(level) <= levels.indexOf(logger.debugLevel) ) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    };
    console.log(level+': '+message);

    const log = {
       evel : level,
      message : message,
    }

    this.logs.push(log)

    if(this.io !=undefined){
      this.io.emit("newLog", log)
    }
  }
}