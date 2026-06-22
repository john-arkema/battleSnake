// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

import runServer from "./server";
import { GameState, InfoResponse, MoveResponse } from "./types";

const HEALTH_THRESHOLD = 50;

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info(): InfoResponse {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "john-arkema",
    color: "rgb(14, 239, 231)",
    head: "beluga",
    tail: "curled",
  };
}

// start is called when your Battlesnake begins a game
function start(gameState: GameState): void {
  console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
function move(gameState: GameState): MoveResponse {
  let isMoveSafe: { [key: string]: boolean } = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  // We've included code to prevent your Battlesnake from moving backwards
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {
    // Neck is left of head, don't move left
    isMoveSafe.left = false;
  } else if (myNeck.x > myHead.x) {
    // Neck is right of head, don't move right
    isMoveSafe.right = false;
  } else if (myNeck.y < myHead.y) {
    // Neck is below head, don't move down
    isMoveSafe.down = false;
  } else if (myNeck.y > myHead.y) {
    // Neck is above head, don't move up
    isMoveSafe.up = false;
  }

  // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  if (myHead.x == 0) {
    isMoveSafe.left = false;
  } else if (myHead.x == boardWidth - 1) {
    isMoveSafe.right = false;
  }
  if (myHead.y == 0) {
    isMoveSafe.down = false;
  } else if (myHead.y == boardHeight - 1) {
    isMoveSafe.up = false;
  }
  // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
  const myBody = gameState.you.body;

  for (let i = 1; i < myBody.length; i++) {
    const bodyPart = myBody[i];
    if (bodyPart.x == myHead.x && bodyPart.y == myHead.y + 1) {
      isMoveSafe.up = false;
    } else if (bodyPart.x == myHead.x && bodyPart.y == myHead.y - 1) {
      isMoveSafe.down = false;
    } else if (bodyPart.x == myHead.x - 1 && bodyPart.y == myHead.y) {
      isMoveSafe.left = false;
    } else if (bodyPart.x == myHead.x + 1 && bodyPart.y == myHead.y) {
      isMoveSafe.right = false;
    }
  }

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  const opponents = gameState.board.snakes;
  for (let i = 0; i < opponents.length; i++) {
    const opponent = opponents[i];
    if (opponent.id == gameState.you.id) {
      continue;
    }
    const opponentBody = opponent.body;
    for (let j = 0; j < opponentBody.length; j++) {
      const bodyPart = opponentBody[j];
      if (bodyPart.x == myHead.x && bodyPart.y == myHead.y + 1) {
        isMoveSafe.up = false;
      } else if (bodyPart.x == myHead.x && bodyPart.y == myHead.y - 1) {
        isMoveSafe.down = false;
      } else if (bodyPart.x == myHead.x - 1 && bodyPart.y == myHead.y) {
        isMoveSafe.left = false;
      } else if (bodyPart.x == myHead.x + 1 && bodyPart.y == myHead.y) {
        isMoveSafe.right = false;
      }
    }
  }

  // Are there any safe moves left?
  const safeMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key]);
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Step 4 - Move towards food when health is low
  const food = gameState.board.food;
  let nextMove: string;

  if (gameState.you.health < HEALTH_THRESHOLD && food.length > 0) {
    const sortedFood = food.slice().sort((a, b) => {
      const distA = Math.abs(a.x - myHead.x) + Math.abs(a.y - myHead.y);
      const distB = Math.abs(b.x - myHead.x) + Math.abs(b.y - myHead.y);
      return distA - distB;
    });

    const candidatePos = (move: string): { x: number; y: number } => {
      if (move === "up") return { x: myHead.x, y: myHead.y + 1 };
      if (move === "down") return { x: myHead.x, y: myHead.y - 1 };
      if (move === "left") return { x: myHead.x - 1, y: myHead.y };
      return { x: myHead.x + 1, y: myHead.y };
    };

    let foodMoves: string[] = [];
    for (const target of sortedFood) {
      const targetDist =
        Math.abs(target.x - myHead.x) + Math.abs(target.y - myHead.y);
      foodMoves = safeMoves.filter((move) => {
        const pos = candidatePos(move);
        return (
          Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) < targetDist
        );
      });
      if (foodMoves.length > 0) break;
    }

    const candidates = foodMoves.length > 0 ? foodMoves : safeMoves;
    nextMove = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  }

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
