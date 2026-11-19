const config = require('./config/env');
const app = require('./app');

const servidor = app.listen(config.porta, () => {
  console.info(`Hackathon BCC rodando em http://localhost:${config.porta}`);
});

// Ao receber o pedido de parada (Ctrl+C ou o Render reiniciando), termina as
// requisições em andamento e fecha a conexão com o banco antes de sair.
function desligar() {
  servidor.close(async () => {
    await app.encerrar();
    process.exit(0);
  });
}

process.on('SIGTERM', desligar);
process.on('SIGINT', desligar);
