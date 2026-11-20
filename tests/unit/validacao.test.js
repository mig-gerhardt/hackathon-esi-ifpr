// Testes dos schemas zod e das funções de data (sem banco de dados).
const { validar } = require('../../src/middlewares/validar');
const { ErroValidacao, ErroNaoEncontrado } = require('../../src/lib/erros');
const { lerId, ehUrlHttps } = require('../../src/lib/validacao');
const datas = require('../../src/lib/datas');
const { esquemaAvaliacao } = require('../../src/modules/avaliacoes/avaliacoes.schemas');
const { esquemaCadastro, esquemaLogin } = require('../../src/modules/auth/auth.schemas');
const { esquemaProjeto } = require('../../src/modules/projetos/projetos.schemas');
const { esquemaCriterio } = require('../../src/modules/criterios/criterios.schemas');
const { esquemaAviso } = require('../../src/modules/avisos/avisos.schemas');
const { esquemaItemAgenda } = require('../../src/modules/agenda/agenda.schemas');

function errosDe(esquema, dados) {
  try {
    validar(esquema, dados);
  } catch (erro) {
    if (erro instanceof ErroValidacao) return erro.erros;
    throw erro;
  }
  return {};
}

describe('notas da avaliação', () => {
  test('aceita de 0 a 10 com uma casa decimal, com ponto ou vírgula', () => {
    const dados = validar(esquemaAvaliacao, {
      notas: { 'criterio-1': '0', 'criterio-2': '10', 'criterio-3': '8,5', 'criterio-4': '7.3' },
      comentario: ' Ótimo ',
    });
    expect(dados).toEqual({ notas: { 1: 0, 2: 10, 3: 8.5, 4: 7.3 }, comentario: 'Ótimo' });
  });

  test('campo em branco vira "sem nota"', () => {
    expect(validar(esquemaAvaliacao, { notas: { 'criterio-1': '' } }).notas).toEqual({
      1: undefined,
    });
  });

  test('recusa notas fora da faixa, com duas casas ou que não são números', () => {
    const erros = errosDe(esquemaAvaliacao, {
      notas: {
        'criterio-1': '10.5',
        'criterio-2': '-1',
        'criterio-3': '8.25',
        'criterio-4': 'abc',
      },
    });
    expect(erros['notas.criterio-1']).toBe('Dê uma nota de 0 a 10.');
    expect(erros['notas.criterio-2']).toBe('Dê uma nota de 0 a 10.');
    expect(erros['notas.criterio-3']).toMatch(/uma casa decimal/);
    expect(erros['notas.criterio-4']).toBe('Dê uma nota de 0 a 10.');
  });

  test('recusa campos de nota com nome fora do padrão', () => {
    expect(errosDe(esquemaAvaliacao, { notas: { 3: '8' } })).not.toEqual({});
  });
});

describe('cadastro e login', () => {
  const valido = {
    nome: ' Ana ',
    email: ' ANA@Estudantes.IFPR.edu.br ',
    senha: 'senha-segura',
    confirmacaoSenha: 'senha-segura',
  };

  test('limpa espaços e põe o e-mail em minúsculas', () => {
    expect(validar(esquemaCadastro, valido)).toMatchObject({
      nome: 'Ana',
      email: 'ana@estudantes.ifpr.edu.br',
    });
  });

  test('aponta erros em cada campo', () => {
    const erros = errosDe(esquemaCadastro, {
      nome: '',
      email: 'nao-e-email',
      senha: 'curta',
      confirmacaoSenha: 'outra',
    });
    expect(Object.keys(erros).sort()).toEqual(['confirmacaoSenha', 'email', 'nome', 'senha']);
  });

  test('senhas diferentes geram erro na confirmação', () => {
    const erros = errosDe(esquemaCadastro, { ...valido, confirmacaoSenha: 'diferente' });
    expect(erros).toEqual({ confirmacaoSenha: 'As senhas não são iguais.' });
  });

  test('login exige e-mail e senha', () => {
    expect(errosDe(esquemaLogin, {})).toEqual({
      email: 'Informe o e-mail.',
      senha: 'Informe a senha.',
    });
  });
});

describe('outros formulários', () => {
  test('link do projeto precisa ser https', () => {
    expect(ehUrlHttps('https://github.com/equipe/projeto')).toBe(true);
    expect(ehUrlHttps('http://github.com/equipe/projeto')).toBe(false);
    expect(ehUrlHttps('javascript:alert(1)')).toBe(false);
    expect(ehUrlHttps('https://localhost')).toBe(false);
    expect(errosDe(esquemaProjeto, { linkRepositorio: 'ftp://x.com' })).toHaveProperty(
      'linkRepositorio',
    );
  });

  test('peso do critério é inteiro de 1 a 5', () => {
    expect(validar(esquemaCriterio, { nome: 'Impacto', peso: '2' }).peso).toBe(2);
    for (const peso of ['0', '6', '2.5', '']) {
      expect(errosDe(esquemaCriterio, { nome: 'Impacto', peso })).toHaveProperty('peso');
    }
  });

  test('checkbox marcado vira true e desmarcado (ausente) vira false', () => {
    const aviso = validar(esquemaAviso, {
      titulo: 'T',
      texto: 'X',
      fixado: 'on',
      publicadoEm: '2026-12-01T10:00',
    });
    expect(aviso).toMatchObject({ fixado: true, urgente: false });
  });

  test('data e hora inválidas geram erro no campo', () => {
    const erros = errosDe(esquemaItemAgenda, { titulo: 'T', inicio: '2026-12-01', fim: 'ontem' });
    expect(erros).toHaveProperty('inicio');
    expect(erros).toHaveProperty('fim');
  });

  test('lerId aceita inteiros positivos e trata o resto como página inexistente', () => {
    expect(lerId('12')).toBe(12);
    for (const valor of ['abc', '-1', '0', '1.5']) {
      expect(() => lerId(valor)).toThrow(ErroNaoEncontrado);
    }
  });
});

describe('datas no horário de Brasília', () => {
  const data = datas.deEntradaLocal('2026-12-02T09:05');

  test('lê o horário local e formata em pt-BR', () => {
    expect(data.toISOString()).toBe('2026-12-02T12:05:00.000Z');
    expect(datas.formatarData(data)).toBe('02/12/2026');
    expect(datas.formatarHora(data)).toBe('09:05');
    expect(datas.formatarDataHora(data)).toBe('02/12/2026 às 09:05');
    expect(datas.formatarDiaMes(data)).toBe('02/12');
    expect(datas.formatarDiaPorExtenso(data)).toBe('Quarta-feira, 2 de dezembro');
  });

  test('converte de volta para o campo datetime-local', () => {
    expect(datas.paraEntradaLocal(data)).toBe('2026-12-02T09:05');
    expect(datas.paraEntradaLocal(null)).toBe('');
  });

  test('texto em formato errado vira null', () => {
    expect(datas.deEntradaLocal('02/12/2026')).toBeNull();
    expect(datas.deEntradaLocal(undefined)).toBeNull();
  });
});
