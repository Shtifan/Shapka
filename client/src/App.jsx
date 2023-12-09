import { Routes, Route } from "react-router-dom";
import Path from "./paths";
import Home from './components/Home';
function App() {
  
  return (
    <>
      <Routes>
        <Route path={Path.Home} element={<Home />} />
      </Routes>
    </>
  );
}

export default App
