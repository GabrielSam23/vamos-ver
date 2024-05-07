// index.js (backend)
const express = require("express");
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { Client } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

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

setInterval(async () => {
  try {
    const currentStockValue = await getCurrentStockValue();
    const randomChange = Math.floor(Math.random() * 11) - 5;
    const newStockValue = currentStockValue + randomChange;
    console.log(`O valor da bolsa atualizou para: ${newStockValue}`);

    await client.query('UPDATE stocks SET stock_value = $1', [newStockValue]);

    io.emit('stock-update', newStockValue);
  } catch (error) {
    console.error('Erro ao atualizar o valor das ações:', error);
  }
}, 20000);

// Configurar Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected');
});

// Definir rotas
app.get("/", async (req, res) => {
  res.status(200).json({
    title: "Express Testing",
    message: "The app is working properly!",
  });
});

app.post('/comprar-acoes', async (req, res) => {
  const { quantity, totalPrice } = req.body;

  // Aqui você pode processar a compra e atualizar o banco de dados
  // Exemplo simplificado:
  // await client.query('INSERT INTO compras (quantity, total_price) VALUES ($1, $2)', [quantity, totalPrice]);

  res.json({ message: `Compra de ${quantity} ações concluída por um total de $${totalPrice}.` });
});

// Iniciar o servidor
const port = process.env.PORT || 9001;
http.listen(port, () => console.log(`Listening to port ${port}`));
