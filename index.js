#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import 'dotenv/config'; // Asegúrate de tener tu archivo .env en esta carpeta

// --- CONFIGURACIÓN ---
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inicializar Gemini (Modelo Flash para ahorrar tokens)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function main() {
  try {
    // 1. Obtener información del proyecto actual
    const projectRoot = process.cwd();
    let projectName = "Proyecto Desconocido";
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      projectName = packageJson.name || path.basename(projectRoot);
    } catch (e) {
      projectName = path.basename(projectRoot);
    }

    // Capitalizar nombre
    projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);

    // 2. Obtener la fecha en español (ej. "Martes 10")
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const todayStr = new Date().toLocaleDateString('es-ES', dateOptions);
    // Formatear a "Martes 10" (aprox)
    const dayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNum = new Date().getDate();
    const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`;

    // 3. Obtener commits de hoy (desde las 00:00)
    console.log(`🔍 Buscando commits de hoy para: ${projectName}...`);
    
    let commits = "";
    try {
      // --since="00:00" toma los commits desde la medianoche de hoy
      commits = execSync('git log --since="00:00" --oneline --no-merges', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error("⚠️ No es un repositorio git o hubo un error.");
      return;
    }

    if (!commits) {
      console.log("✅ No hay commits hoy. ¡A descansar!");
      return;
    }

    // 4. Preparar Prompt para Gemini
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

    // 5. Generar reporte con IA
    console.log("🤖 Generando reporte con Gemini Flash...");
    const result = await model.generateContent(prompt);
    const aiSummary = result.response.text();

    // 6. Construir el mensaje final
    const finalMessage = `## 📝 Resumen Diario - ${formattedDate} - ${projectName}\n\n${aiSummary}`;

    // 7. Enviar a Discord
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