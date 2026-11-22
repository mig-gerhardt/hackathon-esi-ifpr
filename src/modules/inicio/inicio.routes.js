const { Router } = require('express');
const config = require('../../config/env');
const controller = require('./inicio.controller');

const rotas = Router();

rotas.get('/', controller.mostrarInicio);

if (!config.ehProducao) {
  rotas.get('/estilo', controller.mostrarEstilo);
}

module.exports = rotas;
