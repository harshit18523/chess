import { useEffect, useState, useRef } from 'react';
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard';
import { Chess } from 'chess.js';

const Game = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [color, setColor] = useState<'white' | 'black' | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);
  const gameRef = useRef<Chess>(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    setSocket(ws);

    ws.onopen = () => {
      console.log('Connected to server');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'init_game') {
        setColor(message.payload.color);
        setGameStarted(true);
        setWaitingForOpponent(false);
        console.log('Game started, color:', message.payload.color);
      } else if (message.type === 'move') {
        // Update the board with opponent's move
        const newGame = new Chess(gameRef.current.fen());
        newGame.move(message.payload);
        setGame(newGame);
      } else if (message.type === 'game_over') {
        alert('Game over! Winner: ' + (message.payload?.winner || 'Draw'));
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const makeMove = (move: { from: string, to: string }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'move',
        move: move
      }));
    }
  };

  const onPieceDrop = ({
    sourceSquare,
    targetSquare
  }: PieceDropHandlerArgs) => {
    if (!gameStarted || !color || !targetSquare) return false;

    // Check if it's the player's turn
    const currentTurn = game.turn() === 'w' ? 'white' : 'black';
    if (currentTurn !== color) return false;

    const move: { from: string, to: string, promotion?: string } = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // always promote to queen for simplicity
    };

    try {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      setGame(newGame);
      makeMove(move);
      return true;
    } catch (error) {
      return false;
    }
  };

  const startGame = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      setWaitingForOpponent(true);
      socket.send(JSON.stringify({
        type: 'init_game'
      }));
    }
  };

  const chessboardOptions = {
    position: game.fen(),
    onPieceDrop,
    boardWidth: 400,
    // boardOrientation: color === 'black' ? 'black' : 'white'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Chess Game</h1>
      {!gameStarted && !waitingForOpponent && (
        <button
          onClick={startGame}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Game
        </button>
      )}
      {waitingForOpponent && !gameStarted && (
        <p className="mb-4 text-lg text-blue-600">Waiting for opponent...</p>
      )}
      {color && <p className="mb-4">You are playing as {color}</p>}
      <div className="w-121">
        <Chessboard
          options={chessboardOptions}
        />
      </div>
    </div>
  );
};

export default Game;