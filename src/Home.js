import {useState} from 'react';
import {useEffect} from 'react';
import {useRef} from 'react';
import Featured from "./Featured";
import Start from "./Start";
import EditLaunch from "./EditLaunch";
import FriendsList from "./FriendsList";
import Account from "./Account";

function Home(props) {
  const [selectedId, setSelectedId] = useState("featured");
  const thisComponent = useRef();
  return (
    <div ref={thisComponent} className="home">
      <div><Banner /></div>
      <div className="homeContent"><TabColumn callback={(id) => setSelectedId(id)} /><ContentPane callback={props.callback} parentSelectedId={selectedId} /></div>
    </div>
  );
}

export default Home;

function Banner() {
  const canvas = useRef();
  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    ctx.fillStyle = "green";
    ctx.fillRect(0,0, canvas.current.width, canvas.current.height);
  });
  return <div className="banner"><canvas ref={canvas} width={window.innerWidth} height={0.2*window.innerHeight}/></div>
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
  const canvas = useRef();

  const clickHandler = (e) => {
    if (thisComponent.current.contains(e.target)) {
      setSelected(true);
      props.callback(props.id);
    } else if (props.parent.current.contains(e.target))
      setSelected(false);
  };

  const mouseMoveHandler = (e) => {
    if (thisComponent.current.contains(e.target))
      setHovered(true);
    else
      setHovered(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('click', clickHandler);
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('click', clickHandler);
    }
  }, []);
  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    if (selected) {
      ctx.fillStyle = "#000011";
      ctx.fillRect(0,0,canvas.current.width, canvas.current.height);

      ctx.font = "25px Segoe UI";
      ctx.fillStyle = "#BBBBDD";
      ctx.fillText(props.text, 20, canvas.current.height / 2 + 10);
    } else if (hovered) {
      ctx.fillStyle = "#8888AA";
      ctx.fillRect(0,0,canvas.current.width, canvas.current.height);

      ctx.font = "30px Segoe UI";
      ctx.fillStyle = "#332200";
      ctx.fillText(props.text, 30 - props.text.length * 5 / 3, canvas.current.height / 2 + 6);
    } else {
      ctx.fillStyle = "#BBBBFF";
      ctx.fillRect(0,0,canvas.current.width, canvas.current.height);

      ctx.font = "25px Segoe UI";
      ctx.fillStyle = "#332200";
      ctx.fillText(props.text, 20, canvas.current.height / 2 + 10);
    }
  }, [selected, hovered])
  return <div ref={thisComponent}  className="tab"><canvas ref={canvas} width={0.15 * window.innerWidth} height={0.8 * 0.2 * window.innerHeight} /></div>
}

function ContentPane(props) {
  const [selectedId, setSelectedId] = useState("featured");
  useEffect(() => setSelectedId(props.parentSelectedId), [props.parentSelectedId]);
  return <div className="contentPane">{
    selectedId === 'featured' ? <Featured />
      : selectedId === 'start' ? <Start callback={props.callback} />
      : selectedId === 'build' ? <EditLaunch />
        : selectedId === 'friends' ? <FriendsList />
          : <Account />
  }</div>;
}