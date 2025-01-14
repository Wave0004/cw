import React, { useEffect, useState } from "react";
import Mario from "../Mario/Mario";

const BASE_URL = "http://localhost:5173/map/";

const MapRenderer = ({ mapFile }) => {
  const [mapData, setMapData] = useState(null);
  const [tilesets, setTilesets] = useState([]);
  const [collisionData, setCollisionData] = useState([]);
  const [ladderData, setLadderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 640 });
  const [lives, setLives] = useState(1);
  const [gameOver, setGameOver] = useState(false); // Флаг завершения игры
  const [timeElapsed, setTimeElapsed] = useState(0); // Время игры в секундах
  const [timerStarted, setTimerStarted] = useState(false); // Флаг для начала таймера

  // Координаты стартовой и финишной точки
  const start = { x: 0, y: 640 }; // Начальная точка
  const finish = { x: 1440, y: 63 }; // Конечная точка

  // Функция для проверки достижения финиша

  // Функция проверки попадания на слой с повреждением

  const drawLives = () => {
    const heartIcon = "❤️";
    return (
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "24px",
        }}
      >
        {Array.from({ length: lives }).map((_, index) => (
          <span key={index} style={{ marginRight: "5px" }}>
            {heartIcon}
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    const loadMapData = async () => {
      const tileSize = 32; // Определите размер тайла (в пикселях)

      try {
        const response = await fetch(mapFile);
        if (!response.ok)
          throw new Error(`Failed to load map: ${response.statusText}`);
        const data = await response.json();

        setMapData(data);

        // Слой коллизий
        const collisionLayer = data.layers.find(
          (layer) => layer.name.toLowerCase() === "collision"
        );
        setCollisionData(collisionLayer?.objects || []);

        // Слой лестниц
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
                  x: x * tileSize, // Координата X лестницы в пикселях
                  y: y * tileSize, // Координата Y лестницы в пикселях
                  width: tileSize, // Ширина тайла
                  height: tileSize, // Высота тайла
                });
              }
            }
          }

          setLadderData(processedLadderData);
        }
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [mapFile]);

  useEffect(() => {
    if (!mapData) return;

    const loadTilesets = async () => {
      try {
        const tilesetPromises = mapData.tilesets.map(async (tileset) => {
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

        const tilesetData = await Promise.all(tilesetPromises);
        setTilesets(tilesetData);
      } catch (error) {
        console.error("Error loading tilesets:", error);
      }
    };

    loadTilesets();
  }, [mapData]);

  useEffect(() => {
    if (lives <= 0 && !gameOver) {
      setGameOver(true);
    }
  }, [lives]);

  // Запуск таймера, если игра началась
  useEffect(() => {
    if (timerStarted) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1); // Увеличиваем время каждую секунду
      }, 1000);

      return () => clearInterval(timer); // Очищаем таймер при завершении игры
    }
  }, [timerStarted]);

  const startGame = () => {
    setTimerStarted(true); // Запускаем таймер
  };

  if (loading || !mapData || tilesets.length === 0)
    return <div>Loading...</div>;

  const renderTileLayers = () => {
    return mapData.layers
      .filter((layer) => layer.data)
      .map((layer, layerIndex) =>
        layer.data.map((tileId, index) => {
          if (tileId === 0) return null;

          const tileset = tilesets.find(
            (_, i) =>
              tileId >= mapData.tilesets[i].firstgid &&
              (!mapData.tilesets[i + 1] ||
                tileId < mapData.tilesets[i + 1].firstgid)
          );
          if (!tileset) return null;

          const tileIndex =
            tileId - mapData.tilesets[tilesets.indexOf(tileset)].firstgid;
          const sourceX = (tileIndex % tileset.columns) * tileset.tilewidth;
          const sourceY =
            Math.floor(tileIndex / tileset.columns) * tileset.tileheight;

          const x = (index % layer.width) * mapData.tilewidth;
          const y = Math.floor(index / layer.width) * mapData.tileheight;

          return (
            <div
              key={`${layerIndex}-${index}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: mapData.tilewidth,
                height: mapData.tileheight,
                backgroundImage: `url(${tileset.image.replaceAll(" ", "%20")})`,
                backgroundPosition: `-${sourceX}px -${sourceY}px`,
                backgroundSize: `${tileset.tilewidth * tileset.columns}px`,
              }}
            />
          );
        })
      );
  };

  // Отображение сообщения о завершении игры
  if (gameOver) {
    return (
      <>
        <div>
          {lives <= 0
            ? "Game Over!"
            : "Вы победили!" + { timeElapsed } + " сек"}
        </div>
        <button onClick={() => window.location.reload()}>Еще раз?</button>
      </>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: mapData.width * mapData.tilewidth,
        height: mapData.height * mapData.tileheight,
      }}
    >
      {renderTileLayers()}
      {drawLives()}
      <div
        style={{
          position: "absolute",
          top: "32px",
          right: "32px",
          zIndex: "9999",
        }}
      >
        Time: {timeElapsed} seconds
      </div>
      <Mario
        mapData={mapData}
        tileSize={mapData.tilewidth}
        collisionData={collisionData}
        ladderData={ladderData}
        lives={lives}
        setLives={setLives}
        initialPosition={initialPosition}
        setGameOver={setGameOver}
        finish={finish}
      />
    </div>
  );
};

export default MapRenderer;
