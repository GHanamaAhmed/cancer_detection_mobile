import React, { createContext, useContext, useEffect, useState } from "react";
import { Pusher } from "@pusher/pusher-websocket-react-native";
import ENV from "./env";

// Define context type
interface PusherContextType {
  pusherClient: Pusher | null;
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType>({
  pusherClient: null,
  isConnected: false,
});

export const PusherProvider = ({ children }: { children: React.ReactNode }) => {
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initPusher = async () => {
      try {
        const pusherInstance = Pusher.getInstance();

        await pusherInstance.init({
          apiKey: ENV.PUSHER_KEY,
          cluster: ENV.PUSHER_CLUSTER,
          authEndpoint: `${ENV.API_URL}/api/pusher/auth`,
        });

        await pusherInstance.connect();
        setPusherClient(pusherInstance);
        setIsConnected(true);
      } catch (error) {
        console.error("Error initializing Pusher:", error);
      }
    };

    initPusher();

    return () => {
      pusherClient?.disconnect();
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusherClient, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
};

// Custom hook to use the context
export const usePusher = () => useContext(PusherContext);
