import Home from "./Home";
import Main from "./main";
import Editor from "./Editor";
import {useState} from "react";
import {useEffect} from "react";

function App() {
  const [context, setContext] = useState("editor");

  return (
    context === "start" ? <Main callback={(c) => setContext(c)} />
    : context === "editor" ? <Editor />
    : <Home callback={(c) => setContext(c)} />
  );
}

export default App;
