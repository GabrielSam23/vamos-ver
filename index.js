// Import packages
const express = require("express");
const { Client } = require('pg');
require('dotenv').config();

// Middlewares
const app = express();
app.use(express.json());

// Database connection
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const client = new Client({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function connectAndCreateTable() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        id SERIAL PRIMARY KEY,
        stock_value INTEGER
      )
    `);
    console.log('Tabela "stocks" verificada ou criada com sucesso.');
  } catch (err) {
    console.error('Erro ao conectar ou criar a tabela "stocks":', err);
  }
}

connectAndCreateTable();

// Function to get current stock value
async function getCurrentStockValue() {
  try {
    const result = await client.query('SELECT stock_value FROM stocks LIMIT 1');
    if (result.rows.length > 0) {
      return parseInt(result.rows[0].stock_value);
    } else {
      await client.query('INSERT INTO stocks (stock_value) VALUES ($1)', [100]);
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

    await client.query('UPDATE stocks SET stock_value = $1', [newStockValue]);

    io.emit('stock-update', newStockValue);
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

// Home route
app.get("/home", async (req, res) => {
  res.status(200).json({
    title: "Home Page",
    message: "Welcome to the home page!",
  });
});

// Start the server
const port = process.env.PORT || 9001;
app.listen(port, () => console.log(`Listening to port ${port}`));
