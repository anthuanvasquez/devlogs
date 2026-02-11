#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import 'dotenv/config';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function main() {
  try {
    const projectRoot = process.cwd();
    let projectName = "Proyecto Desconocido";
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      projectName = packageJson.name || path.basename(projectRoot);
    } catch (e) {
      projectName = path.basename(projectRoot);
    }

    projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);

    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const todayStr = new Date().toLocaleDateString('es-ES', dateOptions);
    const dayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNum = new Date().getDate();
    const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`;
    console.log(`🔍 Buscando commits de hoy para: ${projectName}...`);
    
    let commits = "";
    try {
      commits = execSync('git log --since="00:00" --oneline --no-merges', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error("⚠️ No es un repositorio git o hubo un error.");
      return;
    }

    if (!commits) {
      console.log("✅ No hay commits hoy. ¡A descansar!");
      return;
    }

    const prompt = `
      Actúa como un Tech Lead conciso.
      Tengo estos commits realizados hoy en el proyecto "${projectName}":
      
      ${commits}
      
      Genera un resumen muy breve en formato lista (markdown).
      - Agrupa tareas similares.
      - Usa emojis técnicos.
      - Destaca si hubo corrección de bugs o nuevas features.
      - NO pongas título, solo los bullets.
    `;

    console.log("🤖 Generando reporte con Gemini Flash...");
    
    const result = await model.generateContent(prompt);
    const aiSummary = result.response.text();
    const finalMessage = `## 📝 Resumen Diario - ${formattedDate} - ${projectName}\n\n${aiSummary}`;
    
    console.log("🚀 Enviando a Discord...");
    
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: finalMessage
      })
    });

    console.log("✅ Reporte enviado con éxito.");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();