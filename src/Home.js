import {useState} from 'react';
import {useEffect} from 'react';
import {useRef} from 'react';
import Featured from "./Featured";
import Start from "./Start";
import Editor from "./Editor";
import FriendsList from "./FriendsList";
import Account from "./Account";

function Home() {
  const [selectedId, setSelectedId] = useState("featured");
  const thisComponent = useRef();
  return (
    <div ref={thisComponent} className="home">
      <div><Banner /></div>
      <div className="homeContent"><TabColumn callback={(id) => setSelectedId(id)} /><ContentPane parentSelectedId={selectedId} /></div>
    </div>
  );
}

export default Home;

function Banner() {
  return <h1><b>BANNER IMAGE WILL GO HERE</b></h1>
}

function TabColumn(props) {
  const tabList = [
    {
      text: "Featured Content",
      contentId: "featured"
    },
    {
      text: "Start a Quest",
      contentId: "start"
    },
    {
      text: "Build a Quest",
      contentId: "build"
    },
    {
      text: "Friends",
      contentId: "friends"
    },
    {
      text: "Account",
      contentId: "account"
    }
  ];

  const [selectedId, setSelectedId] = useState("featured");
  const childWasClicked = (childId) => {
    setSelectedId(childId);
    props.callback(childId);
  };
  const thisComponent = useRef();

  return <div ref={thisComponent} className="tabColumn"> {
      tabList.map((tabData) =>
        <Tab key={tabData.contentId} id={tabData.contentId} parent={thisComponent} text={tabData.text} callback={childWasClicked} selected={selectedId === tabData.contentId} />)
    } </div>
}

function Tab(props) {
  const [selected, setSelected] = useState(props.selected);
  const [hovered, setHovered] = useState(false);
  const thisComponent = useRef();
  useEffect(() => {
    document.addEventListener('mousemove', (e) => {
      if (thisComponent.current.contains(e.target))
        setHovered(true);
      else
        setHovered(false);
    });
    document.addEventListener('click', (e) => {
      if (thisComponent.current.contains(e.target)) {
        setSelected(true);
        props.callback(props.id);
      } else if (props.parent.current.contains(e.target))
        setSelected(false);
    })
  }, []);
  return <h2><div ref={thisComponent}  className={
    selected ? "tabSelected"
    : hovered ? "tabHovered" : "tabUnselected"}>{props.text}</div></h2>
}

function ContentPane(props) {
  const [selectedId, setSelectedId] = useState("featured");
  useEffect(() => setSelectedId(props.parentSelectedId), [props.parentSelectedId]);
  return <div className="contentPane">{
    selectedId === 'featured' ? <Featured />
      : selectedId === 'start' ? <Start />
      : selectedId === 'build' ? <Editor />
        : selectedId === 'friends' ? <FriendsList />
          : <Account />
  }</div>;
}