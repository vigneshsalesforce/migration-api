
const WebSocket = require('ws');
let wss;

function init(server) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log(`Received message => ${message}`);
    });
    ws.send('Hello! Message From Server!!');
  });
}

module.exports = {
  init,
  get wss() {
    return wss;
  },
};