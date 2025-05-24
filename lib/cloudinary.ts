// cloudinary.ts
import { Cloudinary } from "@cloudinary/url-gen";

// Keep the Cloudinary instance for URL generation
export const cld = new Cloudinary({
  cloud: {
    cloudName: "daz7u2cxx",
  },
  url: { secure: true },
});

// New direct upload function
export const uploadToCloudinary = async (
  imageUri: string,
  uploadPreset: string = "heathcare"
): Promise<{ secure_url: string; public_id: string } | null> => {
  try {
    // Create form data
    const formData = new FormData();

    // Get file name from URI
    const uriParts = imageUri.split("/");
    const fileName = uriParts[uriParts.length - 1];

    // Add file to form data
    const file = {
      uri: imageUri,
      type: "image/jpeg", // Adjust based on your needs
      name: fileName,
    } as any;

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    // Make direct API call
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/daz7u2cxx/image/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};
