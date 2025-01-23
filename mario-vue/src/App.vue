<template>
  <!-- Основной шаблон Vue-компонента -->
  <div>
    <!-- Компонент MapRenderer используется для рендера карты.
         mapFile передается как пропс, указывающий путь к файлу карты. -->
    <MapRenderer :mapFile="'/map/map2lvl.json'" />
  </div>
</template>

<script>
<!-- Импортируем компонент MapRenderer из файла -->
import MapRenderer from "./components/MapRenderer.vue";

export default {
  // Экспортируем объект Vue-компонента
  components: {
    // Указываем, что компонент MapRenderer используется внутри этого компонента
    MapRenderer,
  },
};
</script>

<style>
/* Стили */
</style>
