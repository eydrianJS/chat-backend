const moment = require('moment');

function formatMessage(username, text, date) {
  return {
    username,
    text,
    time: moment(date).format('h:mm a'),
  };
}

module.exports = formatMessage;
