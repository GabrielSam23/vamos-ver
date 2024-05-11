// Import packages
const express = require("express");
const { Pool } = require('pg');
const cors = require('cors'); // Adicionando o pacote CORS
require('dotenv').config();

// Middlewares
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://maze-banksa.netlify.app',
  credentials: true
}));

// Database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Use sua variável de ambiente para a conexão do banco de dados
});

async function connectAndCreateTable() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        id SERIAL PRIMARY KEY,
        stock_value INTEGER
      )
    `);
    console.log('Tabela "stocks" verificada ou criada com sucesso.');
    client.release(); // Libera o cliente de volta para o pool
  } catch (err) {
    console.error('Erro ao conectar ou criar a tabela "stocks":', err);
  }
}

connectAndCreateTable();

// Função para obter o valor atual das ações
async function getCurrentStockValue() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT stock_value FROM stocks LIMIT 1');
    client.release(); // Libera o cliente de volta para o pool
    if (result.rows.length > 0) {
      return parseInt(result.rows[0].stock_value);
    } else {
      const insertQuery = 'INSERT INTO stocks (stock_value) VALUES ($1)';
      await pool.query(insertQuery, [100]);
      return 100;
    }
  } catch (error) {
    console.error('Erro ao obter o valor atual das ações:', error);
    return null;
  }
}

// Função para atualizar o valor das ações
async function updateStockValue() {
  try {
    const currentStockValue = await getCurrentStockValue();
    // Definindo a tendência de mercado
    const trend = Math.floor(Math.random() * 11) - 5; // Valor de tendência entre -5 e 5
    // Gerando uma variação aleatória
    const randomChange = Math.floor(Math.random() * 6) - 3; // Variação aleatória entre -3 e 3
    // Calculando o novo valor das ações com base na tendência e na variação aleatória
    let newStockValue = currentStockValue + trend + randomChange;
    // Limitando o valor das ações entre 50 e 150
    newStockValue = Math.max(50, Math.min(150, newStockValue));
    console.log(`O valor da bolsa atualizou para: ${newStockValue}`);
    // Atualizando o valor no banco de dados
    await pool.query('UPDATE stocks SET stock_value = $1', [newStockValue]);
  } catch (error) {
    console.error('Erro ao atualizar o valor das ações:', error);
  }
}

// Atualizar o valor das ações a cada 20 segundos
setInterval(updateStockValue, 20000);

// Rotas
app.get("/", async (req, res) => {
  res.status(200).json({
    title: "Express Testing",
    message: "The app is working properly!",
  });
});

// Rota para obter o valor atual das ações
app.get("/stock-value", async (req, res) => {
  try {
    const currentValue = await getCurrentStockValue();
    res.status(200).json({ value: currentValue });
  } catch (error) {
    console.error('Erro ao obter o valor atual das ações:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Rota home
app.get("/home", async (req, res) => {
  res.status(200).json({
    title: "Home Page",
    message: "Welcome to the home page!",
  });
});

// Iniciar o servidor
const port = process.env.PORT || 9001;
const server = app.listen(port, () => console.log(`Listening to port ${port}`));
