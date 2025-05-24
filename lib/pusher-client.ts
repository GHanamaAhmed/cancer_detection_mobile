import { Pusher } from "@pusher/pusher-websocket-react-native";
import ENV from "./env";
const pusherClient = Pusher.getInstance();
export { pusherClient };
