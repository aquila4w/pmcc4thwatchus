import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

const client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET;
const BASE = "HFGC/2026/New York/videos/";

const videos = [
  { local: "C:/Users/mytes/Downloads/HFGC NY OBB.mp4", remote: "hfgc-ny-obb.mp4", title: "HFGC NY OBB" },
  { local: "C:/Users/mytes/Downloads/New York, are you ready.mp4", remote: "new-york-ready.mp4", title: "New York, Are You Ready?" },
  { local: "C:/Users/mytes/Downloads/Bro. Warsaw Testimony.mp4", remote: "warsaw-testimony.mp4", title: "Bro. Warsaw Testimony" },
  { local: "C:/Users/mytes/Downloads/From Bay Area to New York.mp4", remote: "bay-area-to-ny.mp4", title: "From Bay Area to New York" },
];

for (const v of videos) {
  try {
    const body = readFileSync(v.local);
    const key = BASE + v.remote;
    console.log(`Uploading ${v.title} (${(body.length/1024/1024).toFixed(1)}MB)...`);
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "video/mp4",
      CacheControl: "public, max-age=31536000",
    }));
    console.log(`✅ ${key} (${(body.length/1024/1024).toFixed(1)}MB)`);
  } catch (e) {
    console.error(`❌ ${v.title} — ${e.message}`);
  }
}
