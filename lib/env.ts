import Constants from "expo-constants";

const ENV = {
  dev: {
    API_URL: "http://192.168.184.30:3000",
    CLOUDINARY_CLOUD_NAME: "daz7u2cxx",
    CLOUDINARY_API_KEY: "582647662267854",
    GETSTREAM_API_KEY: "s8hqchfn888p",
    GETSTREAM_APP_ID: "1388927",
    PUSHER_APP_ID: "1997409",
    PUSHER_KEY: "024cbd64277a5a0a9384",
    PUSHER_CLUSTER: "eu",
  },
  prod: {
    API_URL: "http://192.168.184.30:3000",
    CLOUDINARY_CLOUD_NAME: "daz7u2cxx",
    CLOUDINARY_API_KEY: "582647662267854",
    GETSTREAM_API_KEY: "s8hqchfn888p",
    GETSTREAM_APP_ID: "1388927",
    PUSHER_APP_ID: "1997409",
    PUSHER_KEY: "024cbd64277a5a0a9384",
    PUSHER_CLUSTER: "eu",
  },
};

const getEnvVars = (
  // @ts-ignore
  env = Constants.manifest?.releaseChannel ?? "development"
) => {
  if (env === "production") return ENV.prod;
  return ENV.dev;
};

export default getEnvVars();
