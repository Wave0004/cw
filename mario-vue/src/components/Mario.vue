<template>
  <div
    :style="{
      position: 'absolute',
      left: position.x + 'px',
      top: position.y + 'px',
      width: tileSize + 'px',
      height: tileSize + 'px',
      backgroundImage: 'url(' + idleAnimationGif + ')',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transition: '.2s',
    }"
  ></div>
</template>

<script>
import { ref, reactive, onMounted, watch } from "vue";

//Путь до картинки персонажа
import idleAnimationGif from "/map/Goblin.gif"; 

export default {
  props: {
    tileSize: Number, //размер тайла
    collisionData: Array, //Данные о коллизии
    ladderData: Array, //Данные о лестницах
    mapData: Object, //Данные о карте
    finish: Object, //Координаты финиша
    initialPosition: Object, //нач позиция
    lives: Number, //жизни
    setLives: Function, //изменение жизней
    setGameOver: Function, //завершение игры
    position: Object, //позиция персонажа
    setPosition: Function, //изменение позиции персонажа
  },
  setup(props, { emit }) {
    // Начальная позиция
    const position = reactive({ ...props.initialPosition });
    const velocity = ref(0); //скорость
    const isJumping = ref(false); //Флаг прыжка
    const keysPressed = ref(new Set()); //Нажатые клавиши

    const gravity = 2; //гравитация
    const jumpStrength = 11; //сила прыжка
    const speed = 14; //скорость
    const ladderSpeed = 6; //скорость на лестнице

    // Проверка на финиш
    //Если координата х,y персонажа >= координате x,y финиша то устанавливаем флаг завершения игры в true
    //Выводим сообщение о победе
    const checkIfPlayerReachedFinish = () => {
      if (position.x >= props.finish.x && position.y >= props.finish.y) {
        props.setGameOver(true);
        alert("Congratulations, you reached the finish!");
      }
    };

    // Проверка коллизии с повреждениями
    const handleCollisionWithDamageLayer = () => {
      const damageLayerId = 122; //id плитки с шипами
      //ищем слой с именем damage
      const damageLayer = props.mapData.layers.find(
        (layer) => layer.name === "damage"
      );

      if (damageLayer) {
        const xIndex = Math.floor(position.x / props.tileSize);
        const yIndex = Math.floor(position.y / props.tileSize);
        const index = yIndex * damageLayer.width + xIndex;

        const isOnDamageLayer = damageLayer.data[index] === damageLayerId;

        if (isOnDamageLayer && props.lives > 0) {
          props.setLives(props.lives - 1);
        }
      }
    };

    // Проверка находимся ли на лестнице
    //вернет булевое значение
    const isOnLadder = (x, y) =>
      props.ladderData.some(
        (ladder) =>
          x + props.tileSize > ladder.x &&
          x < ladder.x + ladder.width &&
          y + props.tileSize > ladder.y &&
          y < ladder.y + ladder.height
      );

    // Проверка столкновений
    //вернет булевое значение
    const checkCollision = (x, y) =>
      props.collisionData.some(
        (obj) =>
          x < obj.x + obj.width &&
          x + props.tileSize > obj.x &&
          y < obj.y + obj.height &&
          y + props.tileSize > obj.y
      );

    // Обработчик клавиш
    const handleKeyDown = (e) => {
      keysPressed.value.add(e.key); //Когда клавиша нажимается она добавляется в множество keysPressed
      
      //Проверка на двойной прыжок, если перс не в состояния прыжка, то он прыгает
      //двойной прыжок не произойдет
      if ((e.key === " " || e.key === "w") && !isJumping.value) {
        isJumping.value = true;
        velocity.value = -jumpStrength;
      }
    };

    //Если клавиша перестает быть  нажатой она удаляется из множества нажатых коавиш
    const handleKeyUp = (e) => {
      keysPressed.value.delete(e.key);
    };

    // Движение
    const handleMovement = () => {
      //сохраняем в переменные координаты персонажа
      let newX = position.x;
      let newY = position.y;

      //движение влево-вправо в зависимости от нажатой клавиши
      if (keysPressed.value.has("a")) newX -= speed;
      if (keysPressed.value.has("d")) newX += speed;

      //Проверяем находится ли персонаж на лестнице
      if (isOnLadder(position.x, position.y)) {
        //в зависимости от нажатой клавиши перс двигается вверх или вниз
        if (keysPressed.value.has("w")) newY -= ladderSpeed;
        if (keysPressed.value.has("s")) newY += ladderSpeed;
      } else { // в противном случае если он не на лестнице
        newY += velocity.value;
      }
      //Тут проверка на то, если он не на лестнице, то мы должны его установить на ближайший слой с коллизией
      if (!isOnLadder(newX, newY)) {
        const platformBelow = props.collisionData.find(
          (obj) =>
            newX + props.tileSize > obj.x &&
            newX < obj.x + obj.width &&
            newY + props.tileSize <= obj.y &&
            newY + props.tileSize + gravity > obj.y
        );

        if (platformBelow) {
          newY = platformBelow.y - props.tileSize;
          isJumping.value = false;
        }

        checkIfPlayerReachedFinish(); // Проверяем достиг ли наш персонаж финиша
      }
      
      //Тут просто проеряем на наличие коллизии
      //если ее нет, то обновляем координаты персонажа
      if (!checkCollision(newX, newY)) {
        position.x = newX;
        position.y = newY;

        // Эмитируем обновление позиции
        emit("updatePosition", { x: position.x, y: position.y });
      }
    };

    // Гравитация
    const handleGravity = () => {
      let newY = position.y;
      let newVelocity = velocity.value + gravity; //сумма вертикалной скорости и гравитации

      //проверяем находится ли он на лестнице
      if (isOnLadder(position.x, position.y)) {
        if (keysPressed.value.has("w")) newY -= ladderSpeed;
        if (keysPressed.value.has("s")) newY += ladderSpeed;
        velocity.value = 0;
      } else {
        newY += velocity.value;
      }
      //Проверка на коллизию
      //Если столкновение происходит: ерсонаж больше не находится в прыжке. и скорость сбрасываем чтобы остановить движение
      if (checkCollision(position.x, newY)) {
        isJumping.value = false;
        newVelocity = 0;
        
        //наодим куда ему приземлиться
        //если такой объект найден то его координата y возвращается
        const groundY = props.collisionData.find(
          (obj) =>
            position.x + props.tileSize > obj.x &&
            position.x < obj.x + obj.width &&
            position.y + props.tileSize <= obj.y &&
            newY + props.tileSize > obj.y
        )?.y;

        if (groundY !== undefined) { //если найдена такая платформа то коорректируем его позицию так чтобы он стоях прямо на ней
          newY = groundY - props.tileSize;
        }
      }

      velocity.value = newVelocity; // вертикальную скорость обновляем
      position.y = newY; // и позицию по у
    };

    // Таймер для обновления движения и гравитации
    onMounted(() => {
      const gameLoop = setInterval(() => {
        handleMovement();
        handleGravity();
      }, 30);

      handleCollisionWithDamageLayer();

      return () => clearInterval(gameLoop);
    });

    // Слушатели клавиш
    onMounted(() => {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    });

    return {
      position,
      tileSize: props.tileSize,
      idleAnimationGif, // возвращаем свойство
    };
  },
};
</script>

<style scoped>
/* Добавьте стили по вашему усмотрению */
</style>
