import "./App.css";
import MapRenderer from "./components/MapRenderer/MapRenderer.jsx";

function App() {
  return (
    <>
      <MapRenderer mapFile={"/map/map3lvl.json"} />
    </>
  );
}

export default App;
