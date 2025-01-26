import React, { useState, useEffect } from "react";

import enemyTexture from "/map/enemy.png";

const Enemy = ({
  initialPosition, //начальная позиция врага
  distance, //максимальное расстояние, на которое двигается враг вправо влево
  tileSize, //размер тайла
  playerPosition, //позиция игрока
  handleIsEnemyAndPlayerCollision, //коллизия с персом и врагом
}) => {
  //состояние которое хранит позицию врага
  const [enemyPosition, setEnemyPosition] = useState(initialPosition);
  //Состояние движение врага: 1 - вправо ; -1 - влево
  const [direction, setDirection] = useState(1);

  //хук для перемещения врага
  useEffect(() => {
    //Функция которая обновляет позицию врага, движется вправо или влево в зависимости от direction
    const moveEnemy = () => {
      setEnemyPosition((prevPosition) => {
        const newX = prevPosition.x + direction * tileSize * 0.3; //новая позиция врага по оси X

        if ( //Здесь проверяем движение врага
          //проверяем, не вышел ли он за правую или левую сторону его возможного движения
          //если новая позиция по оси X больше начальной на виличину distance, то идет в другую сторону
          newX > initialPosition.x + distance ||
          newX < initialPosition.x - distance
        ) {
          setDirection((prevDirection) => -prevDirection); //Тут меняется его направление
          return { ...prevPosition, x: newX };
        }
        return { ...prevPosition, x: newX };  //обновление позиции врага
      });
    };

    //функция которая обновляет движение игрока каждые 50 милисекунд
    const interval = setInterval(moveEnemy, 50); 

    return () => clearInterval(interval);
  }, [direction, enemyPosition, distance, tileSize]);

  useEffect(() => {
    //Проферка столкновения игрока с врагом
    //Каждый раз когда меняется позиция игрока, врага - проверяется 
    const checkCollisionWithPlayer = () => {
      const isCollising =
      //Проверяем если разница координат врага и перса меньше 80% от размера плитки по оси х и у
        Math.abs(enemyPosition.x - playerPosition.x) < tileSize * 0.8 &&
        Math.abs(enemyPosition.y - playerPosition.y) < tileSize * 0.8;
      //Если True, то вызываем функцию столкновения врага с персом
      if (isCollising) {
        handleIsEnemyAndPlayerCollision();
      }
    };

    //Вызывается непосредственно, чтобы сразу проверить столкновение кода происх изменения позиций
    //игрока или врага
    checkCollisionWithPlayer();
  }, [enemyPosition, playerPosition, tileSize]);

  return (
    <div //Элемент, представляющий собой врага в игре
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
