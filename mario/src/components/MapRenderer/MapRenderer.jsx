import React, { useEffect, useState } from "react";
import Mario from "../Mario/Mario";

const BASE_URL = "http://localhost:5173/map/";

const MapRenderer = ({ mapFile }) => {
  const [mapData, setMapData] = useState(null);
  const [tilesets, setTilesets] = useState([]);
  const [collisionData, setCollisionData] = useState([]); // Данные о коллизиях
  const [loading, setLoading] = useState(true);

  const [initialPosition, setInitialPosition] = useState({x:0, y:640}) //Начальная позиция персонажа для 1-го уровня(Start)

  // Загрузка карты
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch(mapFile);
        if (!res.ok) throw new Error(`Failed to load map: ${res.statusText}`);
        const data = await res.json();
        setMapData(data);

        // Ищем слой коллизий с помощью метода find в слоях карты
        const collisionLayer = data.layers.find(
          (layer) => layer.name.toLowerCase() === "collision"
        );
        if (collisionLayer) {
          setCollisionData(collisionLayer.objects || []); //Запись массива коллизий, если нашли
        }
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [mapFile]);

  // Загрузка тайлсетов
  useEffect(() => {
    if (mapData) {
      const fetchTilesets = async () => {
        try {
          const tilesetData = await Promise.all(
            mapData.tilesets.map(async (tileset) => {
              const res = await fetch(BASE_URL + tileset.source);
              if (!res.ok)
                throw new Error(`Failed to load tileset: ${res.statusText}`);
              const xmlText = await res.text();
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlText, "application/xml");

              // Извлечение информации о изображении
              const imageElement = xmlDoc.querySelector("image");
              return {
                name: tileset.source,
                image: BASE_URL + imageElement?.getAttribute("source"),
                tilewidth: parseInt(
                  xmlDoc.documentElement.getAttribute("tilewidth")
                ),
                tileheight: parseInt(
                  xmlDoc.documentElement.getAttribute("tileheight")
                ),
                columns: parseInt(
                  xmlDoc.documentElement.getAttribute("columns")
                ),
              };
            })
          );
          setTilesets(tilesetData);
        } catch (error) {
          console.error("Error loading tilesets:", error);
        }
      };

      fetchTilesets();
    }
  }, [mapData]);

  // Пока данные не загружены, отображаем "Загрузка..."
  if (loading || !mapData || tilesets.length === 0)
    return <div>Loading...</div>;

  const tileLayers = mapData.layers.filter((layer) => layer.data);

  return (
    <div
      style={{
        position: "relative",
        width: mapData.width * mapData.tilewidth,
        height: mapData.height * mapData.tileheight,
      }}
    >
      {tileLayers.map((layer, layerIndex) =>
        layer.data.map((tileId, index) => {
          if (tileId === 0) return null; // Пропустить пустые тайлы
          const tileset = tilesets.find(
            (ts, i) =>
              tileId >= mapData.tilesets[i].firstgid &&
              (!mapData.tilesets[i + 1] ||
                tileId < mapData.tilesets[i + 1].firstgid)
          );
          if (!tileset) return null;

          const tileIndex =
            tileId - mapData.tilesets[tilesets.indexOf(tileset)].firstgid;
          const columns = tileset.columns;
          const sourceX = (tileIndex % columns) * tileset.tilewidth;
          const sourceY = Math.floor(tileIndex / columns) * tileset.tileheight;

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
      )}

      {/* Рендерим персонажа Mario с передачей данных о коллизиях */}
      <Mario
        mapData={mapData}
        tileSize={mapData.tilewidth}
        collisionData={collisionData}
        initialPosition={initialPosition} // Передаем данные о коллизиях
      />
    </div>
  );
};

export default MapRenderer;
