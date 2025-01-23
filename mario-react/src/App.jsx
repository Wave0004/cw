import "./App.css";
import MapRenderer from "./components/MapRenderer/MapRenderer.jsx";

function App() {
  return (
    <>
      <MapRenderer mapFile={"/map/map1.json"} />
    </>
  );
}

export default App;
