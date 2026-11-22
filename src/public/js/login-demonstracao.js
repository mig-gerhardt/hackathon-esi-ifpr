// Caixa "Entrar como" da página de login (só existe fora de produção).
// Cada link preenche o formulário com o e-mail e a senha de uma conta do seed.
(function () {
  'use strict';

  const email = document.getElementById('email');
  const senha = document.getElementById('senha');
  if (!email || !senha) return;

  document.querySelectorAll('[data-login-demonstracao]').forEach(function (link) {
    link.addEventListener('click', function (evento) {
      evento.preventDefault();
      email.value = link.getAttribute('data-email');
      senha.value = link.getAttribute('data-senha');
      senha.focus();
    });
  });
})();
