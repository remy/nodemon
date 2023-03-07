import { Routes, Route } from "react-router-dom";
import Home from "./components/home/home.component";
import Section from "./components/section/section.component";

const App = () => {
  return (
    <Routes>
      <Route path="/">
        <Route index element={<Home />} />
        <Route path="documentation" element={<Section />} />
      </Route>
    </Routes>
  );
};

export default App;
