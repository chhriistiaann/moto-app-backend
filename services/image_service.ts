const axios = require("axios");
const path = require("path");

const SUPABASE_URL = "https://ueuippbvnakvmdjzlbat.supabase.co/storage/v1";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldWlwcGJ2bmFrdm1kanpsYmF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwOTYzNywiZXhwIjoyMDY2ODg1NjM3fQ.woz-K-7rgWAAjS2zL6A2fBpKpuZPW_ar2uONiMsHh9c";
const BUCKET_ID = "images";

export async function uploadImageToSupabase(imageBuffer: any, filename: any) {
  try {
    const cleanedFilename = cleanFilename(filename);
    const extension = path.extname(cleanedFilename);
    const nameWithoutExt = path.basename(cleanedFilename, extension);
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.]/g, "")
      .slice(0, 15);
    const fileKey = `uploads/${nameWithoutExt}_${timestamp}${extension}`;

    const url = `${SUPABASE_URL}/object/${BUCKET_ID}/${fileKey}`;
    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/octet-stream",
    };

    const response = await axios.post(url, imageBuffer, { headers });

    if ([200, 201].includes(response.status)) {
      return `${SUPABASE_URL}/object/public/${BUCKET_ID}/${fileKey}`;
    } else {
      console.error("Supabase upload failed:", response.status, response.data);
      return null;
    }
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    return null;
  }
}

function cleanFilename(filename: any) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ ()]/g, "_")
    .replace(/[^a-zA-Z0-9_\.-]/g, "");
}

