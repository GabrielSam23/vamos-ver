// Import packages
const express = require("express");
const { Pool } = require('pg');
const cors = require('cors'); // Adicionando o pacote CORS
const { Server } = require("socket.io"); // Importando o Server do Socket.io
require('dotenv').config();

// Middlewares
const app = express();
app.use(express.json());
app.use(cors()); // Usando o middleware CORS para permitir solicitações de qualquer origem

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

// Function to get current stock value
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

// Update stock value randomly every 20 seconds
setInterval(async () => {
  try {
    const currentStockValue = await getCurrentStockValue();
    const randomChange = Math.floor(Math.random() * 11) - 5; // Random change between -5 and +5
    const newStockValue = currentStockValue + randomChange;
    console.log(`O valor da bolsa atualizou para: ${newStockValue}`);

    await pool.query('UPDATE stocks SET stock_value = $1', [newStockValue]);
  } catch (error) {
    console.error('Erro ao atualizar o valor das ações:', error);
  }
}, 20000);

// Routes
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

// Home route
app.get("/home", async (req, res) => {
  res.status(200).json({
    title: "Home Page",
    message: "Welcome to the home page!",
  });
});

// Start the server
const port = process.env.PORT || 9001;
const server = app.listen(port, () => console.log(`Listening to port ${port}`));

// Configuração do Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});
