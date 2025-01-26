<template>
  <div
    v-if="gameOver"
    style="
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
    "
  >
    <!-- Сообщение о завершении игры -->
    <div v-if="lives <= 0">Game Over!</div>
    <div v-else>Вы победили! {{ timeElapsed }} сек</div>
    <!-- Кнопка для перезагрузки игры -->
    <button
      @click="reloadGame"
      style="
        margin-top: 20px;
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
      "
    >
      Еще раз?
    </button>
  </div>

  <!-- Игра показывается только если не окончена -->
  <div v-else>
    <div v-if="loading || !mapData || tilesets.length === 0">Loading...</div>

    <div
      v-else
      :style="{
        position: 'relative',
        width: mapData.width * mapData.tilewidth + 'px',
        height: mapData.height * mapData.tileheight + 'px',
      }"
    >
      <!-- Отрендерить все плитки карты -->
      <div
        v-for="(tile, index) in renderTileLayers()"
        :key="tile.key"
        :style="tile.style"
      ></div>

      <!-- Отображение сердечек -->
      <div
        v-if="lives > 0"
        :style="{
          position: 'absolute',
          top: '10px',
          left: '10px',
          fontSize: '24px',
        }"
      >
        <span
          v-for="(_, index) in Array(lives).fill(0)"
          :key="index"
          style="margin-right: 5px"
          >❤️</span
        >
      </div>

      <!-- Таймер -->
      <div
        :style="{
          position: 'absolute',
          top: '32px',
          right: '32px',
          zIndex: '9999',
          color: 'black',
          fontWeight: 'bold',
        }"
      >
        Time: {{ timeElapsed }} seconds
      </div>

      <!-- Враг -->
      <Enemy
        :initialPosition="{ x: 865, y: 323 }"
        :distance="100"
        :tileSize="32"
        :playerPosition="position"
        :handleIsEnemyAndPlayerCollision="handleIsEnemyAndPlayerCollision"
      />
      <Enemy
        :initialPosition="{ x: 768, y: 479.33 }"
        :distance="50"
        :tileSize="32"
        :playerPosition="position"
        :handleIsEnemyAndPlayerCollision="handleIsEnemyAndPlayerCollision"
      />

      <!-- Марио -->
      <Mario
        :map-data="mapData"
        :tile-size="mapData.tilewidth"
        :collision-data="collisionData"
        :ladder-data="ladderData"
        :lives="lives"
        :setLives="setLives"
        :setGameOver="setGameOver"
        :position="position"
        :initial-position="initialPosition"
        :finish="finish"
        @updatePosition="setPosition"
      />
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from "vue";
import Mario from "./Mario.vue";
import Enemy from "./Enemy.vue";

const BASE_URL = "http://localhost:5173/map/";

export default {
  name: "MapRenderer",
  components: {
    Mario,
    Enemy,
  },
  props: {
    mapFile: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const mapData = ref(null);
    const tilesets = ref([]);
    const collisionData = ref([]);
    const ladderData = ref([]);
    const loading = ref(true);
    const initialPosition = reactive({ x: 31, y: 193 });
    const position = reactive({ x: initialPosition.x, y: initialPosition.y });

    const lives = ref(1);
    const gameOver = ref(false);
    const timeElapsed = ref(0);
    const timerStarted = ref(false);
    const start = reactive({ x: 0, y: 640 });
    const finish = reactive({ x: 1470, y: 737 });

    // Методы для обновления состояния
    const setLives = (newLives) => {
      lives.value = newLives;
    };

    const setGameOver = (isOver) => {
      gameOver.value = isOver;
    };

    const setPosition = (newPosition) => {
      position.x = newPosition.x;
      position.y = newPosition.y;
    };

    const loadMapData = async () => {
      const tileSize = 32;
      try {
        const response = await fetch(props.mapFile);
        if (!response.ok)
          throw new Error(`Failed to load map: ${response.statusText}`);
        const data = await response.json();

        mapData.value = data;

        // Логирование всех слоев карты
    mapData.value.layers.forEach((layer, index) => {
      console.log(`Layer ${layer.name} (${index}):`, layer);
    });

        const collisionLayer = data.layers.find(
          (layer) => layer.name.toLowerCase() === "collision"
        );
        collisionData.value = collisionLayer?.objects || [];

        const ladderLayer = data.layers.find(
          (layer) => layer.name.toLowerCase() === "ladder"
        );

        if (ladderLayer && ladderLayer.type === "tilelayer") {
          const { data: layerData, width, height } = ladderLayer;
          const processedLadderData = [];

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const index = y * width + x;
              const tileId = layerData[index];

              if (tileId !== 0) {
                processedLadderData.push({
                  x: x * tileSize,
                  y: y * tileSize,
                  width: tileSize,
                  height: tileSize,
                });
              }
            }
          }

          ladderData.value = processedLadderData;
        }
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        loading.value = false;
      }
    };

    const loadTilesets = async () => {
      try {
        const tilesetPromises = mapData.value.tilesets.map(async (tileset) => {
          const response = await fetch(`${BASE_URL}${tileset.source}`);
          if (!response.ok)
            throw new Error(`Failed to load tileset: ${response.statusText}`);

          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "application/xml");

          const imageElement = xmlDoc.querySelector("image");
          return {
            name: tileset.source,
            image: `${BASE_URL}${imageElement?.getAttribute("source")}`,
            tilewidth: parseInt(
              xmlDoc.documentElement.getAttribute("tilewidth")
            ),
            tileheight: parseInt(
              xmlDoc.documentElement.getAttribute("tileheight")
            ),
            columns: parseInt(xmlDoc.documentElement.getAttribute("columns")),
          };
        });

        tilesets.value = await Promise.all(tilesetPromises);
      } catch (error) {
        console.error("Error loading tilesets:", error);
      }
    };

    const renderTileLayers = () => {
      return mapData.value.layers
        .filter((layer) => layer.data)
        .flatMap((layer, layerIndex) =>
          layer.data.map((tileId, index) => {
            if (tileId === 0) return null;

            const tileset = tilesets.value.find(
              (_, i) =>
                tileId >= mapData.value.tilesets[i].firstgid &&
                (!mapData.value.tilesets[i + 1] ||
                  tileId < mapData.value.tilesets[i + 1].firstgid)
            );
            if (!tileset) return null;

            const tileIndex =
              tileId -
              mapData.value.tilesets[tilesets.value.indexOf(tileset)].firstgid;
            const sourceX = (tileIndex % tileset.columns) * tileset.tilewidth;
            const sourceY =
              Math.floor(tileIndex / tileset.columns) * tileset.tileheight;

            const x = (index % layer.width) * mapData.value.tilewidth;
            const y =
              Math.floor(index / layer.width) * mapData.value.tileheight;

            return {
              key: `${layerIndex}-${index}`,
              style: {
                position: "absolute",
                left: x + "px",
                top: y + "px",
                width: mapData.value.tilewidth + "px",
                height: mapData.value.tileheight + "px",
                backgroundImage: `url(${tileset.image.replaceAll(" ", "%20")})`,
                backgroundPosition: `-${sourceX}px -${sourceY}px`,
                backgroundSize: `${tileset.tilewidth * tileset.columns}px`,
              },
            };
          })
        )
        .filter(Boolean);
    };

    const handleIsEnemyAndPlayerCollision = () => {
      lives.value--;
      if (lives.value <= 0) {
        gameOver.value = true;
      }
    };

    const startGame = () => {
      timerStarted.value = true;
    };

    const reloadGame = () => {
      window.location.reload();
    };

    onMounted(() => {
      loadMapData();
      startGame();
    });

    watch(mapData, (newValue) => {
      if (newValue) {
        loadTilesets();
      }
    });

    watch(timerStarted, (started) => {
      if (started) {
        const timer = setInterval(() => {
          timeElapsed.value++;
        }, 1000);

        return () => clearInterval(timer);
      }
    });

    watch(position, (newPosition) => {
      console.log("Updated player position in MapRenderer:", newPosition);
    });

    return {
      mapData,
      tilesets,
      collisionData,
      ladderData,
      loading,
      initialPosition,
      position,
      lives,
      gameOver,
      timeElapsed,
      renderTileLayers,
      handleIsEnemyAndPlayerCollision,
      finish,
      setLives,
      setGameOver,
      setPosition,
      reloadGame,
    };
  },
};
</script>

<style scoped></style>
