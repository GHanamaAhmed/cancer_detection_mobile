// cloudinary.ts
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "cloudinary-react-native";
import { upload } from "cloudinary-react-native";

export const cld = new Cloudinary({
  cloud: {
    cloudName: "daz7u2cxx",
    apiKey: "582647662267854",
  },
  url: { secure: true },
});
export { AdvancedImage, upload };
