import Constants from "expo-constants";

const ENV = {
  dev: {
    API_URL: "http://10.42.0.1:3000",
    CLOUDINARY_CLOUD_NAME: "daz7u2cxx",
    CLOUDINARY_API_KEY: "582647662267854",
  },
  prod: {
    API_URL: "http://10.42.0.1:3000",
    CLOUDINARY_CLOUD_NAME: "daz7u2cxx",
    CLOUDINARY_API_KEY: "582647662267854",
  },
};

const getEnvVars = (
  env = Constants.manifest?.releaseChannel ?? "development"
) => {
  if (env === "production") return ENV.prod;
  return ENV.dev;
};

export default getEnvVars();
