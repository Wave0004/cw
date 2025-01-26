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
    // передаем emit как второй аргумент в setup
    // Начальная позиция
    const position = reactive({ ...props.initialPosition });
    const velocity = ref(0);
    const isJumping = ref(false);
    const keysPressed = ref(new Set());

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

    // Проверка лестницы
    const isOnLadder = (x, y) =>
      props.ladderData.some(
        (ladder) =>
          x + props.tileSize > ladder.x &&
          x < ladder.x + ladder.width &&
          y + props.tileSize > ladder.y &&
          y < ladder.y + ladder.height
      );

    // Проверка столкновений
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
      keysPressed.value.add(e.key);

      if ((e.key === " " || e.key === "w") && !isJumping.value) {
        isJumping.value = true;
        velocity.value = -jumpStrength;
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.value.delete(e.key);
    };

    // Движение
    const handleMovement = () => {
      let newX = position.x;
      let newY = position.y;

      if (keysPressed.value.has("a")) newX -= speed;
      if (keysPressed.value.has("d")) newX += speed;

      if (isOnLadder(position.x, position.y)) {
        if (keysPressed.value.has("w")) newY -= ladderSpeed;
        if (keysPressed.value.has("s")) newY += ladderSpeed;
      } else {
        newY += velocity.value;
      }

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

        checkIfPlayerReachedFinish();
      }

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
      let newVelocity = velocity.value + gravity;

      if (isOnLadder(position.x, position.y)) {
        if (keysPressed.value.has("w")) newY -= ladderSpeed;
        if (keysPressed.value.has("s")) newY += ladderSpeed;
        velocity.value = 0;
      } else {
        newY += velocity.value;
      }

      if (checkCollision(position.x, newY)) {
        isJumping.value = false;
        newVelocity = 0;

        const groundY = props.collisionData.find(
          (obj) =>
            position.x + props.tileSize > obj.x &&
            position.x < obj.x + obj.width &&
            position.y + props.tileSize <= obj.y &&
            newY + props.tileSize > obj.y
        )?.y;

        if (groundY !== undefined) {
          newY = groundY - props.tileSize;
        }
      }

      velocity.value = newVelocity;
      position.y = newY;
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
