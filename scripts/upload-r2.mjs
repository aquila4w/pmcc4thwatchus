import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
const BASE = "HFGC/2026/New York/";

// New organized structure
const structure = {
  "posters/poster-main.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/image-001.jpg",
  "posters/poster-artists.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/post2/image-001.jpg",
  "merch/merch-1.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/merch/image-001.jpg",
  "merch/merch-2.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/merch/image-002.jpg",
  "merch/merch-3.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/merch/image-003.jpg",
  "merch/merch-4.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/merch/image-004.jpg",
  "merch/merch-5.jpg": "C:/Users/mytes/AppData/Local/Temp/hfgc-assets/merch/image-005.jpg",
};

// First, delete the old flat files
const oldKeys = [
  "poster-main.jpg", "poster-artists.jpg",
  "merch-1.jpg", "merch-2.jpg", "merch-3.jpg", "merch-4.jpg", "merch-5.jpg",
];
for (const old of oldKeys) {
  try {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: BASE + old }));
  } catch {}
}

// Upload with new folder structure
for (const [remote, local] of Object.entries(structure)) {
  try {
    const body = readFileSync(local);
    const key = BASE + remote;
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: remote.endsWith(".jpg") ? "image/jpeg" : "image/png",
      CacheControl: "public, max-age=31536000",
    }));
    console.log(`✅ ${key} (${(body.length/1024).toFixed(0)}KB)`);
  } catch (e) {
    console.error(`❌ ${remote} — ${e.message}`);
  }
}

// Create placeholder folders for videos and artists
for (const folder of ["videos/", "artists/"]) {
  try {
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: BASE + folder + ".gitkeep",
      Body: Buffer.from(""),
      ContentType: "text/plain",
    }));
    console.log(`📁 Created folder: ${BASE}${folder}`);
  } catch (e) {
    console.error(`❌ Folder ${folder} — ${e.message}`);
  }
}
