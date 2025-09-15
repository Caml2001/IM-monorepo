import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload an image to R2 from a URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  key: string,
  contentType: string = "image/png"
): Promise<string> {
  try {
    // Fix Replicate URLs if needed
    let fullUrl = imageUrl;
    if (imageUrl.startsWith("https://replicate.delivery/")) {
      // URL is already complete
      fullUrl = imageUrl;
    } else if (imageUrl.includes("replicate.delivery")) {
      // Partial URL, add https://
      fullUrl = `https://${imageUrl}`;
    } else if (!imageUrl.startsWith("http")) {
      // Relative URL from Replicate
      fullUrl = `https://replicate.delivery/${imageUrl}`;
    }
    
    console.log("Fetching image from:", fullUrl);
    
    // Fetch the image
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the image as a Blob/ArrayBuffer
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: uint8Array,
      ContentType: contentType,
      // Make it publicly accessible
      ACL: "public-read",
    });
    
    await s3Client.send(command);
    
    // Return the public URL
    return `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
}

/**
 * Upload an image to R2 from base64
 */
export async function uploadImageFromBase64(
  base64Data: string,
  key: string,
  contentType: string = "image/png"
): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to Uint8Array without Buffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      ACL: "public-read",
    });
    
    await s3Client.send(command);
    
    // Return the public URL
    return `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
}

/**
 * Delete an image from R2
 */
export async function deleteImage(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw error;
  }
}

/**
 * Generate a unique key for an image
 */
export function generateImageKey(
  userId: string,
  type: string,
  extension: string = "png"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `images/${userId}/${type}/${timestamp}-${random}.${extension}`;
}

/**
 * Generate a thumbnail key from an image key
 */
export function getThumbnailKey(imageKey: string): string {
  return imageKey.replace(/\.(\w+)$/, '-thumb.$1');
}