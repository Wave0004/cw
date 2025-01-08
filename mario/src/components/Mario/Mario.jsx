import React, { useState, useEffect } from "react";

// Текстуры (спрайты) перса
import idleAnimationGif from "/map/Goblin.gif";

const Mario = ({ mapData, tileSize, collisionData, initialPosition }) => {

  const [position, setPosition] = useState(initialPosition);
  const [isJumping, setIsJumping] = useState(false); // Состояние прыжка
  const [velocity, setVelocity] = useState(0); // Скорость по оси Y

  //Здесь храним все нажатые клавиши в данный момент
  const [keysPressed, setKeysPressed] = useState({});

  // МОжно редактировать
  const gravity = 2; // Сила гравитации
  const jumpStrength = 20; // Сила прыжка
  const speed = 16; // Скорость движения
  

  // Проверка на столкновение
  const checkCollision = (x, y) => {
    //Проеверяем, пересекается ли перрсонаж хотя бы по одной из осей с коллизие
    return collisionData.some((obj) => {
      //Получаем координаты координаты  начала колллизии
      const objX = obj.x;
      const objY = obj.y;
      
      // Размеры плитки колизииии
      const objWidth = obj.width;
      const objHeight = obj.height;

      return (
        x < objX + objWidth && //Если координаты нашего персонажа хоть где то начинают пересекаться - вернем false, если
        //вернет true -  то идти можно
        x + tileSize > objX &&
        y < objY + objHeight &&
        y + tileSize > objY
      );
    });
  };

  // const handleKeyDown = (e) => {
  //   let newX = position.x;
  //   let newY = position.y;

  //   if (e.key === "a") newX -= speed;
  //   if (e.key === "d") newX += speed;

  //   console.log(newX, position);

  //   // Прыжок, если не в прыжке
  //   if (e.key === "w" && !isJumping) {
  //     setIsJumping(true); //Флаг, о том, что мы прыгнули
  //     setVelocity(-jumpStrength);
  //   }

  //   // Проверяем коллизии перед обновлением позиции по горизонтали
  //   if (!checkCollision(newX, position.y)) {
  //     setPosition((prev) => ({ ...prev, x: newX }));
  //   }
  // };

  //При нажатии клавиши отрабатывает
  //Записываем все предыдущие и новую клавишу с булевым значением true (она нажата)
  const handleKeyDown =(e) => {
    setKeysPressed(prev => ({...prev, [e.key]: true}))



    if (e.key === "w" && !isJumping) {
      setIsJumping(true);
      setVelocity(-jumpStrength);
    }
    



// прыжок под вопросом
  }
  //Отпускание клавиши
  const handleKeyUp = (e) => {
    setKeysPressed(prev => {
      const newKeys = {...prev}; //получаем все старые клавиши
      delete newKeys[e.key] //Удалить, ту клавишу которую мы отпустили

      console.log(newKeys)
      return newKeys; //Возвращаем новый объект клавиш
    })
  }



  useEffect(() => {
    
    const handleMovement = () => {
      let newX = position.x;
      let newY = position.y;

      if (keysPressed['a']) newX -= speed;
      if (keysPressed['d']) newX += speed;


      if (!checkCollision(newX, newY)) {
        setPosition(prev => ({...prev, x: newX}))
      }

    }

    const interval = setInterval(handleMovement, 30);
  
    return () => {
      clearInterval(interval);
    }
  }, [position, keysPressed])
  



  useEffect(() => {
    //Функция запуска работы гравитации в игре
    //Работа: срабатывает при прыжке, работает до того момента, пока не найдется первый попавшийся слой коллизии
    //по оси Y.
    const handleGravity = () => {
      let newY = position.y;
      let newVelocity = velocity + gravity; // Увеличиваем скорость под воздействием гравитации
      //К нашей координате добавили новую координату(при прыжке)
      newY += newVelocity;


      // Проверяем столкновение с землей
      if (checkCollision(position.x, newY)) {
        setIsJumping(false);
        newVelocity = 0;

        // Останавливаем персонажа на земле
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
      setPosition((prev) => ({ ...prev, y: newY })); //Устанавливаем позицию персонажа
    };

    const interval = setInterval(handleGravity, 30);
    return () => clearInterval(interval);
  }, [position.y, position.x, velocity]);



  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [keysPressed])
  








  // ----------------------------------------------------
  // useEffect(() => {
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, [position, isJumping]);

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
        backgroundPosition:'center',
        backgroundRepeat: "no-repeat",
        transition: "left 0.1s, top 0.1s",
      }}
    />
  );
};

export default Mario;
