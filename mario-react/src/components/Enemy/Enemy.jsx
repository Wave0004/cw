import React, { useState, useEffect } from "react";

import enemyTexture from "/map/enemy.png";

const Enemy = ({
  initialPosition,
  distance,
  tileSize,
  playerPosition,
  handleIsEnemyAndPlayerCollision,
}) => {
  const [enemyPosition, setEnemyPosition] = useState(initialPosition);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const moveEnemy = () => {
      setEnemyPosition((prevPosition) => {
        const newX = prevPosition.x + direction * tileSize * 0.3;

        if (
          newX > initialPosition.x + distance ||
          newX < initialPosition.x - distance
        ) {
          setDirection((prevDirection) => -prevDirection);
          return { ...prevPosition, x: newX };
        }
        return { ...prevPosition, x: newX };
      });
    };

    const interval = setInterval(moveEnemy, 50);

    return () => clearInterval(interval);
  }, [direction, enemyPosition, distance, tileSize]);

  useEffect(() => {
    const checkCollisionWithPlayer = () => {
      const isCollising =
        Math.abs(enemyPosition.x - playerPosition.x) < tileSize * 0.8 &&
        Math.abs(enemyPosition.y - playerPosition.y) < tileSize * 0.8;

      if (isCollising) {
        handleIsEnemyAndPlayerCollision();
      }
    };

    checkCollisionWithPlayer();
  }, [enemyPosition, playerPosition, tileSize]);

  return (
    <div
      style={{
        position: "absolute",
        top: `${enemyPosition.y}px`,
        left: `${enemyPosition.x}px`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        transition: ".3s",
        backgroundImage: `url(${enemyTexture})`,
      }}
    ></div>
  );
};

export default Enemy;
