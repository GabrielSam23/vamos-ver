// Importe os pacotes necessários
const express = require("express");
const { Client } = require('pg');
require('dotenv').config();

// Inicialize o aplicativo Express
const app = express();
app.use(express.json());

// Conexão com o banco de dados
const { POSTGRES_URL } = process.env;

const client = new Client({
  connectionString: POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Função para conectar e criar tabela
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

// Chame a função de conexão e criação da tabela
connectAndCreateTable();

// Função para obter o valor atual da ação
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

// Atualize o valor da ação aleatoriamente a cada 20 segundos
setInterval(async () => {
  try {
    const currentStockValue = await getCurrentStockValue();
    const randomChange = Math.floor(Math.random() * 11) - 5; // Mudança aleatória entre -5 e +5
    const newStockValue = currentStockValue + randomChange;
    console.log(`O valor da bolsa atualizou para: ${newStockValue}`);

    await client.query('UPDATE stocks SET stock_value = $1', [newStockValue]);

    // Emita um evento de atualização de ações
    // (você precisa definir o objeto "io" em outro lugar no seu código)
    io.emit('stock-update', newStockValue);
  } catch (error) {
    console.error('Erro ao atualizar o valor das ações:', error);
  }
}, 20000);

// Rotas
app.get("/", async (req, res) => {
  res.status(200).json({
    title: "Express Testing",
    message: "The app is working properly!",
  });
});

// Rota Home
app.get("/home", async (req, res) => {
  res.status(200).json({
    title: "Home Page",
    message: "Welcome to the home page!",
  });
});

// Rota para obter o valor atual das ações
app.get("/valor-acoes", async (req, res) => {
  try {
    const currentStockValue = await getCurrentStockValue();
    res.status(200).json({
      currentValue: currentStockValue
    });
  } catch (error) {
    console.error('Erro ao obter o valor atual das ações:', error);
    res.status(500).json({
      error: 'Erro ao obter o valor atual das ações'
    });
  }
});

// Inicie o servidor
const port = process.env.PORT || 9001;
app.listen(port, () => console.log(`Listening to port ${port}`));
