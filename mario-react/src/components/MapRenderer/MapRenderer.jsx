import React, { useEffect, useState } from "react";
import Mario from "../Mario/Mario";
import Enemy from "../Enemy/Enemy"

const BASE_URL = "http://localhost:5173/map/";

const MapRenderer = ({ mapFile }) => {
  const [mapData, setMapData] = useState(null); //Храним данные о карте
  const [tilesets, setTilesets] = useState([]); //Список тайлсетов
  const [collisionData, setCollisionData] = useState([]); //Данные о коллизии
  const [ladderData, setLadderData] = useState([]); //Данные о лестницах
  const [loading, setLoading] = useState(true); //Флаг загрузки данных
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 640 }); //Начальная координата для 1 уровня

  const [position, setPosition] = useState(initialPosition); //Текущая позиция игрока



  // Жизни
  const [lives, setLives] = useState(1); //количество жизней персонажа
  const [gameOver, setGameOver] = useState(false); // Флаг завершения игры
  const [timeElapsed, setTimeElapsed] = useState(0); // Время игры в секундах
  const [timerStarted, setTimerStarted] = useState(false); // Флаг для начала таймера

  // Координаты стартовой и финишной точки
  const start = { x: 0, y: 640 }; // Начальная точка
  const finish = { x: 1500, y: 63 }; // Конечная точка

  // Функция проверки попадания на слой с повреждением

  //Функция для отрисовки "Жизней" - слева сверху в углу
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






  //Как только запускается карта - запускается таймер
  //хук запускающий игру
  useEffect(() => {
    startGame();
  }, []);

  //Хук загрузки данных о карте
  useEffect(() => {
    const loadMapData = async () => {
      const tileSize = 32; // Определите размер тайла (в пикселях)

      try {
        //загружаем json-файл карты
        const response = await fetch(mapFile);
        if (!response.ok) //Обработка ошибки загрузки карты
          throw new Error(`Failed to load map: ${response.statusText}`);
        const data = await response.json(); //Парсим json-файл карты

        setMapData(data); //Сохраняем данные карты в состояние

        // Слой коллизий
        //Проходимся по слоям карты и ищем с именем "collision"
        const collisionLayer = data.layers.find(
          (layer) => layer.name.toLowerCase() === "collision"
        );
        setCollisionData(collisionLayer?.objects || []); //Сохраняем данные о коллизии

        // Слой лестниц
        //Проходимся по слоям карты и ищем с именем "ladder"
        const ladderLayer = data.layers.find(
          (layer) => layer.name.toLowerCase() === "ladder"
        );

        //Проверяем, существует ли слой с лестницами и соответствует ли тип tilelayer
        if (ladderLayer && ladderLayer.type === "tilelayer") {
          const { data: layerData, width, height } = ladderLayer; //Распаковывае свойства объекта
          //Массив с идентификатором тайлов на слое, ширина слоя, высота слоя
          const processedLadderData = []; //Массив для данных о найденных лестницах (их координаты и размеры)

          //Проходимся по всем слоям
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const index = y * width + x; //Вычисляем индекс текущей клетки
              const tileId = layerData[index]; //Извлекаем идентификатор тайла из массива по текущему индексу 

              //Тут проверяем, если tileId !=0 значит это лестница
              if (tileId !== 0) {
                processedLadderData.push({ //добавляем в массив информацию о лестницах
                  x: x * tileSize, // Координата X лестницы в пикселях
                  y: y * tileSize, // Координата Y лестницы в пикселях
                  width: tileSize, // Ширина тайла
                  height: tileSize, // Высота тайла
                });
              }
            }
          }

          setLadderData(processedLadderData); //После обработки всех клеток сохраним массив с данными о лестницах
        }
      } catch (error) { //В случае ошибки рендеринга карты - выведем ошибку в консоль
        console.error("Error loading map:", error);
      } finally {
        setLoading(false); //Убираем флаг загрузки
      }
    };

    loadMapData();
  }, [mapFile]);

  useEffect(() => {
    if (!mapData) return;


      //Функция для загрузки тайлсетов
    const loadTilesets = async () => {
      try {
        //Перебираем массив тайлсетов и создаем для каждого из них ассинхронный запрос
        const tilesetPromises = mapData.tilesets.map(async (tileset) => {
          //отправляем запрос  для получения данных о тайлсете
          const response = await fetch(`${BASE_URL}${tileset.source}`);
          if (!response.ok) //Если ответ неуспешный - выкинем ошибку
            throw new Error(`Failed to load tileset: ${response.statusText}`);

            //Получаем данные из ответа
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "application/xml");
          
          //ищем в xml документе image
          const imageElement = xmlDoc.querySelector("image");
          return {
            name: tileset.source, //получаем имя тайлсета
            image: `${BASE_URL}${imageElement?.getAttribute("source")}`, //путь к изображению
            tilewidth: parseInt( //размеры одного тайла в пикселях
              xmlDoc.documentElement.getAttribute("tilewidth")
            ),
            tileheight: parseInt(
              xmlDoc.documentElement.getAttribute("tileheight")
            ),
            columns: parseInt(xmlDoc.documentElement.getAttribute("columns")), //количество тайлов(колонок) в изображении
          };
        });
        //ждем завершения загрузки всех тайлсетов, используем promise.all для обработки массива промисов
        const tilesetData = await Promise.all(tilesetPromises);
        setTilesets(tilesetData);
      } catch (error) { //В случае ошибки - выведем в консоль
        console.error("Error loading tilesets:", error);
      }
    };

    loadTilesets(); //Вызываем функцию загрузки тайлсетов
  }, [mapData]);

  //Если в данный момент количество жизней меньше 0, но игра еще не завершена - мы умираем и завершаем игру
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

  //Проходимся по всем слоям
  const renderTileLayers = () => {
    return mapData.layers
      .filter((layer) => layer.data) // фильтруем слои у которых есть данные из layer.data
      .map((layer, layerIndex) =>
        layer.data.map((tileId, index) => {
          if (tileId === 0) return null; // Пропускаем клетки с tileId = 0 тк они пустые

          const tileset = tilesets.find( //находим из какого тайлсета пришел текущий тайл
            (_, i) =>
              tileId >= mapData.tilesets[i].firstgid &&
              (!mapData.tilesets[i + 1] ||
                tileId < mapData.tilesets[i + 1].firstgid)
          );
          if (!tileset) return null;

          //Вычисляем индекс тайла в изображении  тайлсета
          const tileIndex =
            tileId - mapData.tilesets[tilesets.indexOf(tileset)].firstgid;
          //Определяем координаты тайла в изображении
            const sourceX = (tileIndex % tileset.columns) * tileset.tilewidth;
          const sourceY =
            Math.floor(tileIndex / tileset.columns) * tileset.tileheight;
            //Вычисляем координаты для открисовки тайла на экране
          const x = (index % layer.width) * mapData.tilewidth;
          const y = Math.floor(index / layer.width) * mapData.tileheight;

          return (
            <div //div, который представляет собой текущий тайл
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

    //Функция  столкновения с врагом
  const handleIsEnemyAndPlayerCollision = () => {
    setLives(lives => lives - 1);
    if (lives <= 0) {
     setGameOver(true);
    }
  }

  // Отображение сообщения о завершении игры
  if (gameOver) {
    return (
      <>
        <div>
          {/*  Если жизней <0, то  GmaeOver, в ином случае - победа */}
          {lives <= 0
            ? "Game Over!"
            : "Вы победили!" + { timeElapsed } + " сек"}
        </div>
        <button onClick={() => window.location.reload()}>Еще раз?</button>
        {/* Перезагрузка страницы при клике на кнопку еще раз */}
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
      {/* Отрендерить все плитки карты */}
      {renderTileLayers()}
      {/* Отрендерить сердечки */}
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
      {/* Пропсы(Данные) Марио : Информация о карте, размеры плитки, и так далее*/}
      <Enemy initialPosition={{x:500, y: 640}} distance={100} tileSize={mapData.tilewidth} playerPosition={position}
      handleIsEnemyAndPlayerCollision={handleIsEnemyAndPlayerCollision}
      
      />
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
        position={position}
        setPosition={setPosition}
      />
    </div>
  );
};

export default MapRenderer;
