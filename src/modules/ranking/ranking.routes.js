const { Router } = require('express');
const controller = require('./ranking.controller');

const rotas = Router();

// Pública. Antes da publicação, só a comissão vê o ranking (como prévia).
rotas.get('/resultados', controller.mostrarResultados);

module.exports = rotas;
