export default function Start(props) {
  const launch = () => props.callback("start");
  return <button onClick={launch}>Launch game</button>
}