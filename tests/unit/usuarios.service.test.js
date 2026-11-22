const bcrypt = require('bcrypt');
const usuariosService = require('../../src/modules/usuarios/usuarios.service');
const authService = require('../../src/modules/auth/auth.service');
const { PAPEIS } = require('../../src/lib/constantes');
const { ErroValidacao, ErroNaoEncontrado, ErroRegraNegocio } = require('../../src/lib/erros');
const {
  prisma,
  SENHA_PADRAO,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
} = require('../helpers/banco');

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
});

describe('cadastro e login (auth.service)', () => {
  const dados = {
    nome: 'Ana Souza',
    email: 'ana@estudantes.ifpr.edu.br',
    senha: 'senha-forte-123',
  };

  test('o cadastro público cria sempre um participante, com a senha em hash', async () => {
    const usuario = await authService.cadastrar(dados);
    expect(usuario).toMatchObject({ nome: 'Ana Souza', papel: PAPEIS.PARTICIPANTE });
    expect(usuario.senhaHash).toBeUndefined();
    const salvo = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    expect(salvo.senhaHash).not.toBe(dados.senha);
    expect(await bcrypt.compare(dados.senha, salvo.senhaHash)).toBe(true);
  });

  test('não cadastra o mesmo e-mail duas vezes', async () => {
    await authService.cadastrar(dados);
    await expect(authService.cadastrar(dados)).rejects.toMatchObject({
      erros: { email: 'Já existe uma conta com este e-mail.' },
    });
  });

  test('login com senha correta devolve o usuário sem o hash', async () => {
    const pessoa = await criarUsuario();
    const usuario = await authService.autenticar({ email: pessoa.email, senha: SENHA_PADRAO });
    expect(usuario).toEqual({
      id: pessoa.id,
      nome: pessoa.nome,
      email: pessoa.email,
      papel: PAPEIS.PARTICIPANTE,
      equipeId: null,
    });
  });

  test('senha errada e e-mail inexistente dão a mesma mensagem genérica', async () => {
    const pessoa = await criarUsuario();
    await expect(authService.autenticar({ email: pessoa.email, senha: 'errada' })).rejects.toThrow(
      authService.MENSAGEM_LOGIN_INVALIDO,
    );
    await expect(
      authService.autenticar({ email: 'ninguem@ifpr.edu.br', senha: 'qualquer' }),
    ).rejects.toThrow(authService.MENSAGEM_LOGIN_INVALIDO);
  });
});

describe('gestão de usuários pela comissão', () => {
  test('cria conta de jurado', async () => {
    const jurado = await usuariosService.criarJurado({
      nome: 'Carlos',
      email: 'carlos@ifpr.edu.br',
      senha: 'senha-inicial',
    });
    expect(jurado.papel).toBe(PAPEIS.JURADO);
  });

  test('não cria jurado com e-mail já usado', async () => {
    const pessoa = await criarUsuario();
    await expect(
      usuariosService.criarJurado({ nome: 'X', email: pessoa.email, senha: 'senha-inicial' }),
    ).rejects.toThrow(ErroValidacao);
  });

  test('muda o papel de outro usuário', async () => {
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    const pessoa = await criarUsuario();
    const atualizado = await usuariosService.alterarPapel(comissao, pessoa.id, PAPEIS.JURADO);
    expect(atualizado.papel).toBe(PAPEIS.JURADO);
  });

  test('a comissão não remove o próprio papel de comissão', async () => {
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    await expect(
      usuariosService.alterarPapel(comissao, comissao.id, PAPEIS.PARTICIPANTE),
    ).rejects.toThrow('Você não pode remover o seu próprio papel de comissão.');
  });

  test('não promove a jurado ou comissão quem está numa equipe', async () => {
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    const lider = await criarUsuario();
    await criarEquipe({ lider });
    for (const papel of [PAPEIS.JURADO, PAPEIS.COMISSAO]) {
      await expect(usuariosService.alterarPapel(comissao, lider.id, papel)).rejects.toThrow(
        ErroRegraNegocio,
      );
    }
  });

  test('usuário inexistente gera ErroNaoEncontrado', async () => {
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    await expect(usuariosService.alterarPapel(comissao, 9999, PAPEIS.JURADO)).rejects.toThrow(
      ErroNaoEncontrado,
    );
  });

  test('lista com filtro por papel e conta por papel', async () => {
    await criarUsuario({ papel: PAPEIS.JURADO });
    await criarUsuario({ papel: PAPEIS.JURADO });
    await criarUsuario();
    expect(await usuariosService.listarUsuarios()).toHaveLength(3);
    expect(await usuariosService.listarUsuarios({ papel: PAPEIS.JURADO })).toHaveLength(2);
    expect(await usuariosService.contarUsuariosPorPapel(PAPEIS.JURADO)).toBe(2);
  });
});
