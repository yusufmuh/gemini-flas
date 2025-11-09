import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from "@google/genai";

console.log('index.js: module loaded');

const app = express();
const upload = multer({ dest: 'uploads/' });
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY }) ;

// ** Set your default Gemini model here :**
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express. json());

// 1. Endpoint for text generation
app.post('/generate-text', async (req, res) => {
const { prompt } = req.body;

try {
const response = await ai. models.generateContent({
model: GEMINI_MODEL,

contents: prompt
}) ;

res.status(200). json({ result: response.text }) ;
} catch (e) {
console.log(e);
res.status(500). json({ message: e.message });
}
});

// 2. Endpoint for image generation
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
const { prompt } = req.body;
const base64Image = req. file.buffer.toString("base64");

try {
const response = await ai. models.generateContent({
model: GEMINI_MODEL,
contents: [
{ text: prompt, type: "text" },
{ inlineData: { data: base64Image, mimeType: req. file.mimetype } }

],
}) ;
res.status(200). json({ result: response. text });
} catch (e) {
console.log(e);
res.status(500). json({ message: e.message });
}
});

const PORT = 3000;
console.log('index.js: about to call app.listen');
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

