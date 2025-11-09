import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from "@google/genai";

console.log('index.js: module loaded');

const app = express();
const upload = multer({ dest: 'uploads/' });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

// 3. Chat endpoint matching frontend spec: accepts { messages: [{ role, content }] }
app.post('/api/chat', async (req, res) => {
	try {
		const { messages } = req.body || {};
		if (!Array.isArray(messages) || messages.length === 0) {
			return res.status(400).json({ error: 'messages array is required' });
		}

		// Prefer the last user message as the prompt; fallback to concatenation
		const last = messages.slice().reverse().find(m => m && m.content && m.role === 'user') || messages[messages.length - 1];
		const prompt = last && last.content ? last.content : messages.map(m => m.content || '').join('\n');

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt
		});

		// Normalize response to { result: string }
		const text = response && (response.text || response.output || JSON.stringify(response));
		res.status(200).json({ result: text });
	} catch (e) {
		console.error('Error in /api/chat:', e);
		res.status(500).json({ error: e?.message || 'generation failed' });
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
app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// Client-side script moved to public/script.js; serving static files from /public above.