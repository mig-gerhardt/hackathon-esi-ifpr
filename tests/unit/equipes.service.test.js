const equipesService = require('../../src/modules/equipes/equipes.service');
const { PAPEIS, STATUS_EQUIPE } = require('../../src/lib/constantes');
const {
  ErroValidacao,
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroRegraNegocio,
} = require('../../src/lib/erros');
const {
  prisma,
  DIA_MS,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
} = require('../helpers/banco');

// Um momento depois do prazo de inscrição do evento de teste (7 dias).
const DEPOIS_DO_PRAZO = () => new Date(Date.now() + 8 * DIA_MS);

async function membrosDaEquipe(equipeId) {
  const membros = await prisma.usuario.findMany({ where: { equipeId }, orderBy: { id: 'asc' } });
  return membros.map((membro) => membro.id);
}

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
});

describe('criarEquipe', () => {
  test('o participante cria a equipe, vira líder e primeiro integrante', async () => {
    const pessoa = await criarUsuario();
    const equipe = await equipesService.criarEquipe(pessoa, { nome: 'Byte Verde' });
    expect(equipe).toMatchObject({
      nome: 'Byte Verde',
      liderId: pessoa.id,
      status: STATUS_EQUIPE.PENDENTE,
    });
    expect(await membrosDaEquipe(equipe.id)).toEqual([pessoa.id]);
  });

  test('o nome é único sem diferenciar maiúsculas e minúsculas', async () => {
    await equipesService.criarEquipe(await criarUsuario(), { nome: 'Byte Verde' });
    await expect(
      equipesService.criarEquipe(await criarUsuario(), { nome: 'BYTE verde' }),
    ).rejects.toThrow(ErroValidacao);
  });

  test('quem já está numa equipe não cria outra', async () => {
    const pessoa = await criarUsuario();
    await equipesService.criarEquipe(pessoa, { nome: 'Primeira' });
    await expect(equipesService.criarEquipe(pessoa, { nome: 'Segunda' })).rejects.toThrow(
      'Você já faz parte de uma equipe.',
    );
  });

  test('jurados e comissão não criam equipes', async () => {
    const jurado = await criarUsuario({ papel: PAPEIS.JURADO });
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    await expect(equipesService.criarEquipe(jurado, { nome: 'A' })).rejects.toThrow(
      ErroRegraNegocio,
    );
    await expect(equipesService.criarEquipe(comissao, { nome: 'B' })).rejects.toThrow(
      ErroRegraNegocio,
    );
  });

  test('não cria depois do prazo de inscrição', async () => {
    await expect(
      equipesService.criarEquipe(await criarUsuario(), { nome: 'Atrasada' }, DEPOIS_DO_PRAZO()),
    ).rejects.toThrow(/prazo de inscrição terminou/);
  });
});

describe('editarEquipe', () => {
  test('o líder muda o nome e o status aprovado continua', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider, status: STATUS_EQUIPE.APROVADA });
    const editada = await equipesService.editarEquipe(lider, equipe.id, { nome: 'Novo Nome' });
    expect(editada).toMatchObject({ nome: 'Novo Nome', status: STATUS_EQUIPE.APROVADA });
  });

  test('pode manter o próprio nome mudando só maiúsculas', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider, nome: 'Byte Verde' });
    const editada = await equipesService.editarEquipe(lider, equipe.id, { nome: 'BYTE VERDE' });
    expect(editada.nome).toBe('BYTE VERDE');
  });

  test('não usa o nome de outra equipe', async () => {
    await criarEquipe({ lider: await criarUsuario(), nome: 'Ocupado' });
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(
      equipesService.editarEquipe(lider, equipe.id, { nome: 'ocupado' }),
    ).rejects.toThrow(ErroValidacao);
  });

  test('só o líder edita', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await expect(equipesService.editarEquipe(membro, equipe.id, { nome: 'X' })).rejects.toThrow(
      ErroNaoAutorizado,
    );
  });

  test('não edita depois do prazo', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(
      equipesService.editarEquipe(lider, equipe.id, { nome: 'X' }, DEPOIS_DO_PRAZO()),
    ).rejects.toThrow(ErroRegraNegocio);
  });
});

describe('adicionarMembro', () => {
  test('o líder adiciona um participante cadastrado pelo e-mail', async () => {
    const lider = await criarUsuario();
    const novo = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await equipesService.adicionarMembro(lider, equipe.id, { email: novo.email });
    expect(await membrosDaEquipe(equipe.id)).toEqual([lider.id, novo.id]);
  });

  test('e-mail sem conta gera erro no campo e-mail', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(
      equipesService.adicionarMembro(lider, equipe.id, { email: 'ninguem@ifpr.edu.br' }),
    ).rejects.toMatchObject({ erros: { email: expect.stringContaining('Não encontramos') } });
  });

  test('jurados e comissão não entram em equipes', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    for (const papel of [PAPEIS.JURADO, PAPEIS.COMISSAO]) {
      const pessoa = await criarUsuario({ papel });
      await expect(
        equipesService.adicionarMembro(lider, equipe.id, { email: pessoa.email }),
      ).rejects.toMatchObject({
        erros: { email: expect.stringContaining('não podem participar') },
      });
    }
  });

  test('quem está em outra equipe não pode ser adicionado', async () => {
    const ocupado = await criarUsuario();
    await criarEquipe({ lider: ocupado });
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(
      equipesService.adicionarMembro(lider, equipe.id, { email: ocupado.email }),
    ).rejects.toMatchObject({ erros: { email: expect.stringContaining('outra equipe') } });
  });

  test('quem já está na equipe não é adicionado de novo', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(
      equipesService.adicionarMembro(lider, equipe.id, { email: lider.email }),
    ).rejects.toMatchObject({ erros: { email: expect.stringContaining('já está na sua equipe') } });
  });

  test('respeita o máximo de integrantes', async () => {
    await prisma.configuracaoEvento.update({ where: { id: 1 }, data: { maxIntegrantes: 2 } });
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [await criarUsuario()] });
    const terceiro = await criarUsuario();
    await expect(
      equipesService.adicionarMembro(lider, equipe.id, { email: terceiro.email }),
    ).rejects.toThrow('A equipe já tem o máximo de 2 integrantes.');
  });

  test('só o líder adiciona e só até o prazo', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const novo = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await expect(
      equipesService.adicionarMembro(membro, equipe.id, { email: novo.email }),
    ).rejects.toThrow(ErroNaoAutorizado);
    await expect(
      equipesService.adicionarMembro(lider, equipe.id, { email: novo.email }, DEPOIS_DO_PRAZO()),
    ).rejects.toThrow(ErroRegraNegocio);
  });
});

describe('removerMembro', () => {
  test('o líder remove um integrante', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await equipesService.removerMembro(lider, equipe.id, membro.id);
    expect(await membrosDaEquipe(equipe.id)).toEqual([lider.id]);
  });

  test('o líder não pode remover a si mesmo', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(equipesService.removerMembro(lider, equipe.id, lider.id)).rejects.toThrow(
      /Transfira a liderança ou exclua a equipe/,
    );
  });

  test('não remove quem não é da equipe', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    const estranho = await criarUsuario();
    await expect(equipesService.removerMembro(lider, equipe.id, estranho.id)).rejects.toThrow(
      ErroNaoEncontrado,
    );
  });

  test('integrante comum não remove ninguém', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const outro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro, outro] });
    await expect(equipesService.removerMembro(membro, equipe.id, outro.id)).rejects.toThrow(
      ErroNaoAutorizado,
    );
  });

  test('a comissão remove mesmo depois do prazo', async () => {
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await equipesService.removerMembro(comissao, equipe.id, membro.id, DEPOIS_DO_PRAZO());
    expect(await membrosDaEquipe(equipe.id)).toEqual([lider.id]);
  });
});

describe('transferirLideranca e sairDaEquipe', () => {
  test('o líder passa a liderança para outro integrante', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    const atualizada = await equipesService.transferirLideranca(lider, equipe.id, membro.id);
    expect(atualizada.liderId).toBe(membro.id);
  });

  test('não transfere para quem não é da equipe nem para si mesmo', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    const estranho = await criarUsuario();
    await expect(equipesService.transferirLideranca(lider, equipe.id, estranho.id)).rejects.toThrow(
      ErroValidacao,
    );
    await expect(equipesService.transferirLideranca(lider, equipe.id, lider.id)).rejects.toThrow(
      ErroValidacao,
    );
  });

  test('integrante que não é líder pode sair da equipe', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await equipesService.sairDaEquipe(membro);
    expect(await membrosDaEquipe(equipe.id)).toEqual([lider.id]);
  });

  test('o líder não pode simplesmente sair', async () => {
    const lider = await criarUsuario();
    await criarEquipe({ lider });
    await expect(equipesService.sairDaEquipe(lider)).rejects.toThrow(/O líder não pode sair/);
  });

  test('quem não tem equipe não tem de onde sair', async () => {
    await expect(equipesService.sairDaEquipe(await criarUsuario())).rejects.toThrow(
      ErroRegraNegocio,
    );
  });
});

describe('excluirEquipe', () => {
  test('o líder exclui até o prazo e os integrantes ficam sem equipe', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await equipesService.excluirEquipe(lider, equipe.id);
    expect(await prisma.equipe.findUnique({ where: { id: equipe.id } })).toBeNull();
    expect(await membrosDaEquipe(equipe.id)).toEqual([]);
  });

  test('o líder não exclui depois do prazo, mas a comissão sim', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await expect(equipesService.excluirEquipe(lider, equipe.id, DEPOIS_DO_PRAZO())).rejects.toThrow(
      ErroRegraNegocio,
    );
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    await equipesService.excluirEquipe(comissao, equipe.id, DEPOIS_DO_PRAZO());
    expect(await prisma.equipe.count()).toBe(0);
  });

  test('integrante comum não exclui', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const equipe = await criarEquipe({ lider, membros: [membro] });
    await expect(equipesService.excluirEquipe(membro, equipe.id)).rejects.toThrow(
      ErroNaoAutorizado,
    );
  });
});

describe('aprovação e recusa pela comissão', () => {
  test('aprova equipe com o mínimo de integrantes', async () => {
    const equipe = await criarEquipe({
      lider: await criarUsuario(),
      membros: [await criarUsuario()],
    });
    const aprovada = await equipesService.aprovarEquipe(equipe.id);
    expect(aprovada.status).toBe(STATUS_EQUIPE.APROVADA);
  });

  test('equipe abaixo do mínimo não pode ser aprovada', async () => {
    const equipe = await criarEquipe({ lider: await criarUsuario() });
    await expect(equipesService.aprovarEquipe(equipe.id)).rejects.toThrow(
      /tem 1 integrante\(s\) e o mínimo é 2/,
    );
  });

  test('recusa com motivo e, ao aprovar depois, o motivo é apagado', async () => {
    const equipe = await criarEquipe({
      lider: await criarUsuario(),
      membros: [await criarUsuario()],
    });
    const recusada = await equipesService.recusarEquipe(equipe.id, {
      motivo: 'Tema fora do edital',
    });
    expect(recusada).toMatchObject({
      status: STATUS_EQUIPE.RECUSADA,
      motivoRecusa: 'Tema fora do edital',
    });
    const aprovada = await equipesService.aprovarEquipe(equipe.id);
    expect(aprovada.motivoRecusa).toBeNull();
  });

  test('o motivo da recusa é opcional', async () => {
    const equipe = await criarEquipe({ lider: await criarUsuario() });
    const recusada = await equipesService.recusarEquipe(equipe.id, { motivo: '' });
    expect(recusada.motivoRecusa).toBeNull();
  });

  test('equipe inexistente gera ErroNaoEncontrado', async () => {
    await expect(equipesService.aprovarEquipe(999)).rejects.toThrow(ErroNaoEncontrado);
  });
});

describe('consultas', () => {
  test('lista com filtro por status e conta por status', async () => {
    await criarEquipe({ lider: await criarUsuario(), status: STATUS_EQUIPE.APROVADA });
    await criarEquipe({ lider: await criarUsuario() });
    await criarEquipe({ lider: await criarUsuario() });

    expect(await equipesService.listarEquipes()).toHaveLength(3);
    expect(await equipesService.listarEquipes({ status: STATUS_EQUIPE.PENDENTE })).toHaveLength(2);
    expect(await equipesService.listarEquipesAprovadas()).toHaveLength(1);
    expect(await equipesService.contarEquipesPorStatus()).toEqual({
      PENDENTE: 2,
      APROVADA: 1,
      RECUSADA: 0,
    });
  });

  test('buscarIdDaEquipeDoUsuario falha para quem não tem equipe', async () => {
    await expect(
      equipesService.buscarIdDaEquipeDoUsuario((await criarUsuario()).id),
    ).rejects.toThrow('Você não faz parte de nenhuma equipe.');
  });
});
