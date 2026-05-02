import { WebSocketServer } from "ws";
import GameManager from "./gameManager.js";

const gameManager = new GameManager();

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  gameManager.addUser(ws);

  ws.send('something');

  ws.on("close", () => gameManager.removeUser(ws));
});
