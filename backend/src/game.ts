import { WebSocket } from "ws";
import { Chess } from "chess.js";

import { GAME_OVER, MOVE, INIT_GAME } from "./messages.js";

export default class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;
  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
    this.player1.send(JSON.stringify({
      type: INIT_GAME,
      payload: {
        color: "white"
      }
    }));
    this.player2.send(JSON.stringify({
      type: INIT_GAME,
      payload: {
        color: "black"
      }
    }));
  }

  makeMove(socket: WebSocket, move: {
    from: string;
    to: string;
  }) {
    // validate type of move using zod
    // validation here
    // is it this user's move
    // is move valid
    // update board
    // push move
    // check if game is over
    // send updated board to both players
    if (this.board.history().length % 2 === 0 && socket !== this.player1) return;
    else if (this.board.history().length % 2 === 1 && socket !== this.player2) return;
    console.log("did not early return");
    try {
      this.board.move(move);
    } catch (e) {
      console.error(e);
      return;
    }
    console.log(this.board.ascii());
    console.log(this.board.history());
    if (this.board.isGameOver()) {
      this.player1.send(JSON.stringify({
        type: GAME_OVER
      }));
      this.player2.send(JSON.stringify({
        type: GAME_OVER,
        payload: {
          winner: this.board.turn() === "w" ? "black" : "white"
        }
      }));
      return;
    } else if (this.board.history().length % 2 === 0) {
      this.player1.send(JSON.stringify({
        type: MOVE,
        payload: move
      }));
      console.log("sent move to player 1");
    } else {
      this.player2.send(JSON.stringify({
        type: MOVE,
        payload: move
      }));
      console.log("sent move to player 2");
    }
  }
}