// test-scripts/test-gemini-key.js (CORRIGIDO)
// CORREÇÃO: Chamamos config() sem 'path' para ele procurar .env no diretório atual
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

console.log("--- INICIANDO TESTE DIRETO DA API KEY ---");
console.log("API Key Carregada:", apiKey ? `Sim (termina com ...${apiKey.slice(-4)})` : "NÃO!!! Verifique o .env");

if (!apiKey) {
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
  try {
    console.log("Tentando acessar o modelo: gemini-pro");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Usando gemini-pro para o teste

    console.log("Enviando prompt simples...");
    const prompt = "Escreva uma frase curta sobre inteligência artificial.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("--- SUCESSO! ---");
    console.log("Resposta da IA:", text);

  } catch (error) {
    console.error("--- FALHA NO TESTE ---");
    console.error("Erro detalhado:", error);
  }
}

runTest();