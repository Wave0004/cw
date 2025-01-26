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
  position, setPosition,

}) => {
  // Проверка на прыжок (true , false)
  const [isJumping, setIsJumping] = useState(false);
  // Скорость перемещения перса в виде состояния
  const [velocity, setVelocity] = useState(0);
  // Объект где лежат нажатые клавышие в момент времени
  const [keysPressed, setKeysPressed] = useState(new Set());

  const [collectedBonuses, setCollectedBonuses] = useState(new Set());
  const [bonusCount, setBonusCount] = useState(0);

  const gravity = 1.9; // Гравитация
  const jumpStrength = 14; // Сила прыжка
  const speed = 16; // Скорость движения
  const ladderSpeed = 6; // Скорость движения по лестнице


  // Находится ли перс на финише
  const checkIfPlayerReachedFinish = () => {

    if (position.x >= finish.x && position.y >= finish.y) {
      setGameOver(true); // Игрок достиг финиша
      alert("Congratulations, you reached the finish!"); // Сообщение о победе
    }
  };
  
  // Функция проверки коллизии персонажа с слоем дамага

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

  const handleCollisionWithBonusTile = () => {
    const bonusTileId = 580; // ID плитки бонуса
    const mainLayer = mapData.layers.find((layer) => layer.name === "main");

    if (mainLayer) {
      const xIndex = Math.floor(position.x / tileSize);
      const yIndex = Math.floor(position.y / tileSize);
      const index = yIndex * mainLayer.width + xIndex;

      const isOnBonusTile = mainLayer.data[index] === bonusTileId;

      if (isOnBonusTile && !collectedBonuses.has(index)) {
        setCollectedBonuses((prev) => new Set(prev).add(index));
        setBonusCount(bonusCount + 1);
        alert("Вы получили бонус!");
      }
    }
  };


  // Проверка нахождения на лестнице
  //Принимает две кординаты персонажа 
  const isOnLadder = (x, y) =>
    ladderData.some( //Перебираем все элементы в ladderData и проверяем
      (ladder) => //попадает ли персонаж в лестницу
        x + tileSize > ladder.x &&
        x < ladder.x + ladder.width &&
        y + tileSize > ladder.y &&
        y < ladder.y + ladder.height
    );

  // Проверка столкновений, принимает две координаты персонажа
  const checkCollision = (x, y) =>
    collisionData.some( //Проходимся по массиву с коллизиями и проверяем
      (obj) =>
        x < obj.x + obj.width && //не находится ли справа персонаж
        x + tileSize > obj.x && //не выходлит ли за левую границу 
        y < obj.y + obj.height && //не находится ли выше границы
        y + tileSize > obj.y // не находится ли верхняя позиция перса ниже
    );

  // Обработчик нажатия клавиш
  const handleKeyDown = (e) => {
    //Храним все клавиши, которые нажимали, как только нажали клавишу
    //она добавляется в список
    setKeysPressed((prev) => new Set(prev).add(e.key));

    // проверка на Прыжок(двойной)
    //Если персонаж уже прыгает, то не выполнится прыжок еще раз
    if ((e.key === " " || e.key === "w") && !isJumping) {
      setIsJumping(true);
      setVelocity(-jumpStrength);
    }
  };

  // Обработчик отпускания клавиш
  const handleKeyUp = (e) => {
    //prev - значение состояния до того как мы начали менять
    setKeysPressed((prev) => {
      const updated = new Set(prev); //Создаем новый набор клавиш на основе старого
      updated.delete(e.key); //Удаляем клавишу из набора так как ее отпустили
      return updated; // Возвращаем новый набор
    });
  };

  // Движение персонажа
  const handleMovement = () => {
    //Сохраняем текущие координаты перса
    let newX = position.x;
    let newY = position.y;

    // Движение влево и вправо
    if (keysPressed.has("a")) newX -= speed; //Если нажали a, то передвигаемся влево
    if (keysPressed.has("d")) newX += speed; // Если нажали d, то передвигаемся вправо

    // Движение по лестнице
    //Проверяем если персонаж находится на лестнице
    //аналогично движению влево и вправо
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
      //Если персонаж не на лестнице, то в collisionData проверяем где он стоит
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

      checkIfPlayerReachedFinish(); // Проверяем не достиг ли наш персонаж финиша
    }

    // Проверка на столкновения
    //Если столкновений нет, то обновляем позицию персонажа
    //таким образом он может перемещаться на экране
    if (!checkCollision(newX, newY)) {
      setPosition({ x: newX, y: newY });
    }
  };

  // Гравитация и прыжки
  const handleGravity = () => {
    let newY = position.y;
    let newVelocity = velocity + gravity; // Скорость перемещения задаем как сумму вертикальной скорости и гравитации

    // Если не на лестнице, то применяется гравитация
    if (isOnLadder(position.x, position.y)) {
      if (keysPressed.has("w")) newY -= ladderSpeed; // Подъем по лестнице
      if (keysPressed.has("s")) newY += ladderSpeed; // Спуск по лестнице
      setVelocity(0); // Отключить гравитацию
    } else {
      newY += velocity; // Применить гравитацию, если не на лестнице
    }

    // Проверка столкновений с землей
    //Если столкновение есть, например с землей, то jump в ноль и скорость по Y   в ноль
    if (checkCollision(position.x, newY)) {
      setIsJumping(false);
      newVelocity = 0;

      // Найти ближайший пол, с которым персонаж может столкнуться при падении
      const groundY = collisionData.find(
        (obj) =>
          position.x + tileSize > obj.x &&
          position.x < obj.x + obj.width &&
          position.y + tileSize <= obj.y &&
          newY + tileSize > obj.y
      )?.y;

      //Если мы нашли платформу, на которую преземлился перс, то устанавливаем
      //его координату на ней
      if (groundY !== undefined) {
        newY = groundY - tileSize;
      }
    }

    setVelocity(newVelocity); //Устанавоиваем новую вертикальную скорость
    setPosition((prev) => ({ ...prev, y: newY })); //меняем позицию персонажа
  };

  // Таймеры для движения и гравитации
  // Таймер для обновления движения и гравитации
  useEffect(() => {
    const gameLoop = setInterval(() => {
      handleMovement();
      handleGravity();
    }, 30);

    handleCollisionWithDamageLayer();
    handleCollisionWithBonusTile();

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

    <div //Здесь рендерится перс
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
        transition:".2s"
      }}
    />
  );
};

export default Mario;
