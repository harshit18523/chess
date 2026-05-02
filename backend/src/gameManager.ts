import { WebSocket } from "ws";

import Game from "./game.js";
import { INIT_GAME, MOVE } from "./messages.js";

export default class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;
  private users: WebSocket[];
  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }

  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removeUser(socket: WebSocket) {
    this.users = this.users.filter(user => user !== socket);
    // stop the game here because the user left
  }

  private addHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === INIT_GAME) {
        if (this.pendingUser) {
          // start a game
          const game = new Game(this.pendingUser, socket);
          this.games.push(game);
          this.pendingUser = null;
          console.log("game started");
        } else {
          this.pendingUser = socket;
        }
      } else if (message.type === MOVE) {
        console.log("move received");
        const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
        if (game) {
          game.makeMove(socket, message.move);
        }
      }
    });
  }
}
