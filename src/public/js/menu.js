// Menu do celular: sem JavaScript, os links aparecem em lista. Com JavaScript,
// ficam atrás do botão "Menu", que informa o estado com aria-expanded.
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const botao = document.querySelector('[data-botao-menu]');
  const navegacao = document.getElementById('navegacao-principal');
  if (!botao || !navegacao) return;

  function definirAberto(aberto) {
    botao.setAttribute('aria-expanded', String(aberto));
    navegacao.setAttribute('data-aberta', String(aberto));
  }

  definirAberto(false);

  botao.addEventListener('click', function () {
    definirAberto(botao.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') {
      definirAberto(false);
      botao.focus();
    }
  });
})();
