import React, { useState, useEffect } from "react";
import idleAnimationGif from "/map/Goblin.gif";

const Mario = ({
  tileSize,
  collisionData,
  initialPosition,
  ladderData,
  mapData,
  setLives,
  lives,
  setGameOver,
  finish,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isJumping, setIsJumping] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [keysPressed, setKeysPressed] = useState(new Set());

  const gravity = 1.9; // Гравитация
  const jumpStrength = 14; // Сила прыжка
  const speed = 16; // Скорость движения
  const ladderSpeed = 6; // Скорость движения по лестнице

  const checkIfPlayerReachedFinish = () => {
    console.log(position.x, position.y);
    if (position.x >= finish.x && position.y >= finish.y) {
      setGameOver(true); // Игрок достиг финиша
      alert("Congratulations, you reached the finish!"); // Сообщение о победе
    }
  };

  const handleCollisionWithDamageLayer = () => {
    const damageLayerId = 122; // ID плитки повреждения

    // Находим слой с повреждением в mapData.layers
    const damageLayer = mapData.layers.find((layer) => layer.name === "damage");

    // Если слой найден, проверяем попадание
    if (damageLayer) {
      // Получаем индекс плитки на основе позиции персонажа
      const xIndex = Math.floor(position.x / tileSize);
      const yIndex = Math.floor(position.y / tileSize);
      const index = yIndex * damageLayer.width + xIndex;

      // Проверяем, есть ли повреждение в этой клетке
      const isOnDamageLayer = damageLayer.data[index] === damageLayerId;

      if (isOnDamageLayer && lives > 0) {
        setLives(lives - 1); // Уменьшаем жизнь
      }
    }
  };

  // Проверка нахождения на лестнице
  const isOnLadder = (x, y) =>
    ladderData.some(
      (ladder) =>
        x + tileSize > ladder.x &&
        x < ladder.x + ladder.width &&
        y + tileSize > ladder.y &&
        y < ladder.y + ladder.height
    );

  // Проверка столкновений
  const checkCollision = (x, y) =>
    collisionData.some(
      (obj) =>
        x < obj.x + obj.width &&
        x + tileSize > obj.x &&
        y < obj.y + obj.height &&
        y + tileSize > obj.y
    );

  // Обработчик нажатия клавиш
  const handleKeyDown = (e) => {
    setKeysPressed((prev) => new Set(prev).add(e.key));

    // Прыжок
    if ((e.key === " " || e.key === "w") && !isJumping) {
      setIsJumping(true);
      setVelocity(-jumpStrength);
    }
  };

  // Обработчик отпускания клавиш
  const handleKeyUp = (e) => {
    setKeysPressed((prev) => {
      const updated = new Set(prev);
      updated.delete(e.key);
      return updated;
    });
  };

  // Движение персонажа
  const handleMovement = () => {
    let newX = position.x;
    let newY = position.y;

    // Движение влево и вправо
    if (keysPressed.has("a")) newX -= speed;
    if (keysPressed.has("d")) newX += speed;

    // Движение по лестнице
    if (isOnLadder(position.x, position.y)) {
      if (keysPressed.has("w")) newY -= ladderSpeed; // Подъем
      if (keysPressed.has("s")) newY += ladderSpeed; // Спуск
    } else {
      // Если не на лестнице, применять гравитацию
      newY += velocity;
    }

    // Проверка выхода с лестницы
    if (!isOnLadder(newX, newY)) {
      // Убедиться, что персонаж стоит на платформе
      const platformBelow = collisionData.find(
        (obj) =>
          newX + tileSize > obj.x &&
          newX < obj.x + obj.width &&
          newY + tileSize <= obj.y &&
          newY + tileSize + gravity > obj.y
      );

      if (platformBelow) {
        newY = platformBelow.y - tileSize; // Установить персонажа на платформу
        setIsJumping(false);
      }

      checkIfPlayerReachedFinish();
    }

    // Проверка на столкновения
    if (!checkCollision(newX, newY)) {
      setPosition({ x: newX, y: newY });
    }
  };

  // Гравитация и прыжки
  const handleGravity = () => {
    let newY = position.y;
    let newVelocity = velocity + gravity;

    // Если не на лестнице, то применяется гравитация
    if (isOnLadder(position.x, position.y)) {
      if (keysPressed.has("w")) newY -= ladderSpeed; // Подъем по лестнице
      if (keysPressed.has("s")) newY += ladderSpeed; // Спуск по лестнице
      setVelocity(0); // Отключить гравитацию
    } else {
      newY += velocity; // Применить гравитацию, если не на лестнице
    }

    // Проверка столкновений с землей
    if (checkCollision(position.x, newY)) {
      setIsJumping(false);
      newVelocity = 0;

      // Найти ближайший пол
      const groundY = collisionData.find(
        (obj) =>
          position.x + tileSize > obj.x &&
          position.x < obj.x + obj.width &&
          position.y + tileSize <= obj.y &&
          newY + tileSize > obj.y
      )?.y;

      if (groundY !== undefined) {
        newY = groundY - tileSize;
      }
    }

    setVelocity(newVelocity);
    setPosition((prev) => ({ ...prev, y: newY }));
  };

  // Таймеры для движения и гравитации
  // Таймер для обновления движения и гравитации
  useEffect(() => {
    const gameLoop = setInterval(() => {
      handleMovement();
      handleGravity();
    }, 30);

    handleCollisionWithDamageLayer();

    return () => {
      clearInterval(gameLoop);
    };
  }, [keysPressed, position]);

  // Слушатели клавиш
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keysPressed]);

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: tileSize,
        height: tileSize,
        backgroundImage: `url(${idleAnimationGif})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

export default Mario;
