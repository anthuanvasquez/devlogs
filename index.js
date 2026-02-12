#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import 'dotenv/config';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

async function sendToDiscord(message) {
  if (!DISCORD_WEBHOOK_URL) return;

  console.log("🚀 Enviando a Discord...");

  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  });

  console.log("✅ Reporte enviado a Discord con éxito.");
}

async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  console.log("✈️ Enviando a Telegram...");
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });
  
  console.log("✅ Reporte enviado a Telegram con éxito.");
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

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

    const args = process.argv.slice(2);
    const when = args.includes('yesterday') ? 'yesterday' : 'today';
    const forceDiscord = args.includes('--discord');
    const forceTelegram = args.includes('--telegram');

    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateObj = new Date();
    
    if (when === 'yesterday') {
      dateObj.setDate(dateObj.getDate() - 1);
    }
    
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNum = dateObj.getDate();
    const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`;
    
    console.log(`🔍 Buscando commits de ${when === 'today' ? 'hoy' : 'ayer'} para: ${projectName}...`);
    
    let commits = "";
    
    try {
      let gitCommand = 'git log --since="00:00" --oneline --no-merges';
      if (when === 'yesterday') {
        gitCommand = 'git log --since="yesterday 00:00" --until="today 00:00" --oneline --no-merges';
      }
      commits = execSync(gitCommand, { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error("⚠️ No es un repositorio git o hubo un error.");
      return;
    }

    if (!commits) {
      console.log(`✅ No hay commits ${when === 'today' ? 'hoy' : 'ayer'}. ¡A descansar!`);
      return;
    }

    const hasDiscord = !!DISCORD_WEBHOOK_URL;
    const hasTelegram = !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);

    if (!hasDiscord && !hasTelegram) {
      throw new Error("❌ No se encontró configuración para Discord ni Telegram en el archivo .env");
    }

    let target = "";

    if (forceDiscord || forceTelegram) {
        if (forceDiscord && forceTelegram) target = "ambos";
        else if (forceDiscord) target = "discord";
        else target = "telegram";
    } else if (hasDiscord && hasTelegram) {
      const answer = await askQuestion("¿Dónde deseas enviar el reporte? (discord/telegram/ambos) [ambos]: ");
      target = answer.toLowerCase().trim() || "ambos";
    } else if (hasDiscord) {
      target = "discord";
    } else {
      target = "telegram";
    }

    const prompt = `
      Actúa como un Tech Lead conciso.
      Tengo estos commits realizados ${when === 'today' ? 'hoy' : 'ayer'} en el proyecto "${projectName}":
      
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
    
    if (target === "discord" || target === "ambos") {
      await sendToDiscord(finalMessage);
    }
    
    if (target === "telegram" || target === "ambos") {
      await sendToTelegram(finalMessage);
    }
  } catch (error) {
    console.error("❌ Error:", error.message || error);
  }
}

main();