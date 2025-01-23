export async function loadTileset(tilesetSource) {
  const response = await fetch(tilesetSource);
  const text = await response.text();

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");

  console.log(xml)

  const imageSource = xml.querySelector("image").getAttribute("source");
  const tileWidth = parseInt(
    xml.querySelector("tileset").getAttribute("tilewidth"),
    10
  );
  const tileHeight = parseInt(
    xml.querySelector("tileset").getAttribute("tileheight"),
    10
  );
  const columns = parseInt(
    xml.querySelector("tileset").getAttribute("columns"),
    10
  );

  return {
    imageSource,
    tileWidth,
    tileHeight,
    columns,
  };
}
