<template>
  <!-- Шаблон отображения врага -->
  <div
    :style="{
      /* Абсолютное позиционирование элемента на карте */
      position: 'absolute',
      /* Установка позиции врага по оси Y */
      top: enemyPosition.y + 'px',
      /* Установка позиции врага по оси X */
      left: enemyPosition.x + 'px',
      /* Установка ширины элемента, равной размеру тайла */
      width: tileSize + 'px',
      /* Установка высоты элемента, равной размеру тайла */
      height: tileSize + 'px',
      /* Плавный переход для изменения позиции */
      transition: '.3s',
      /* Установка текстуры врага в качестве фона */
      backgroundImage: `url(${enemyTexture})`,
    }"
  ></div>
</template>

<script>
/* Импорт необходимых функций из Vue */
import { ref, reactive, onMounted, onUnmounted, watch } from "vue";
/* Импорт текстуры врага */
import enemyTexture from "/map/enemy.png";

export default {
  /* Декларация пропсов для передачи данных в компонент */
  props: {
    /* Начальная позиция врага (объект с координатами x и y) */
    initialPosition: Object,
    /* Расстояние, на которое враг может перемещаться в обе стороны от начальной позиции */
    distance: Number,
    /* Размер тайла, используемый для отображения врага */
    tileSize: Number,
    /* Текущая позиция игрока (объект с координатами x и y) */
    playerPosition: Object,
    /* Функция-обработчик для события столкновения врага и игрока */
    handleIsEnemyAndPlayerCollision: Function,
  },
  setup(props) {
    /* Создание реактивного объекта для позиции врага */
    const enemyPosition = reactive({ ...props.initialPosition });
    /* Направление движения врага: 1 (вперед) или -1 (назад) */
    const direction = ref(1);

    /* Функция для перемещения врага */
    const moveEnemy = () => {
      /* Новая координата X с учетом направления движения и шага */
      const newX = enemyPosition.x + direction.value * props.tileSize * 0.3;

      /* Проверяем, если враг достиг границ допустимого расстояния */
      if (
        newX > props.initialPosition.x + props.distance ||
        newX < props.initialPosition.x - props.distance
      ) {
        /* Меняем направление движения */
        direction.value *= -1;
      } else {
        /* Обновляем позицию врага */
        enemyPosition.x = newX;
      }
    };

    /* Функция для проверки столкновения врага с игроком */
    const checkCollisionWithPlayer = () => {
      /* Проверяем, достаточно ли близко враг и игрок */
      const isColliding =
        Math.abs(enemyPosition.x - props.playerPosition.x) <
          props.tileSize * 0.8 &&
        Math.abs(enemyPosition.y - props.playerPosition.y) <
          props.tileSize * 0.8;

      /* Если столкновение произошло, вызываем переданную функцию-обработчик */
      if (isColliding) {
        props.handleIsEnemyAndPlayerCollision();
      }
    };

    /* Переменная для хранения идентификатора интервала */
    let interval = null;

    /* Хук, срабатывающий при монтировании компонента */
    onMounted(() => {
      /* Устанавливаем интервал, чтобы враг двигался и проверял столкновения каждые 50 мс */
      interval = setInterval(() => {
        moveEnemy();
        checkCollisionWithPlayer();
      }, 50);
    });

    /* Хук, срабатывающий при размонтировании компонента */
    onUnmounted(() => {
      /* Очищаем интервал, чтобы предотвратить утечку памяти */
      if (interval) clearInterval(interval);
    });

    /* Наблюдаем за изменением позиции игрока */
    watch(props.playerPosition, (newPosition) => {
      /* Выводим обновленную позицию игрока в консоль */
      console.log("Updated player position:", newPosition);
    });

    /* Возвращаем данные и текстуру для использования в шаблоне */
    return {
      enemyPosition,
      tileSize: props.tileSize,
      enemyTexture,
    };
  },
};
</script>

<style scoped>
/* Локальные стили для компонента */
</style>
