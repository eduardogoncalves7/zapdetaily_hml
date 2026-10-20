import process from "node:process";
import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query("BEGIN");
  const tenant = await pool.query("INSERT INTO tenants (nome, slug) VALUES ('Estetica Demo', 'estetica-demo') ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome RETURNING id");
  const tenantId = tenant.rows[0].id;
  await pool.query("INSERT INTO tenant_settings (tenant_id, nome_publico, slug, slogan, logo_url, cores, whatsapp, endereco, instagram, horario_funcionamento, fuso_horario, portes_veiculo) VALUES ($1, 'Estetica Demo', 'estetica-demo', 'Cuidado ficticio para testar o produto.', '', '{\"primary\":\"#74786f\",\"accent\":\"#686c65\",\"background\":\"#f3f1ed\",\"foreground\":\"#202422\",\"surface\":\"#e4e0d9\"}', '', '', '', '{}', 'America/Sao_Paulo', '[{\"key\":\"moto\",\"label\":\"Moto\"},{\"key\":\"pequeno\",\"label\":\"Pequeno\"},{\"key\":\"medio\",\"label\":\"Medio\"},{\"key\":\"grande\",\"label\":\"Grande\"}]') ON CONFLICT (tenant_id) DO UPDATE SET nome_publico = EXCLUDED.nome_publico, slogan = EXCLUDED.slogan, cores = EXCLUDED.cores, atualizado_em = now()", [tenantId]);
  const category = await pool.query("INSERT INTO categorias (tenant_id, nome, slug, descricao, ordem) VALUES ($1, 'Cuidados essenciais', 'cuidados-essenciais', 'Servicos comuns de estetica automotiva para demonstracao.', 0) ON CONFLICT (tenant_id, slug) DO UPDATE SET nome = EXCLUDED.nome RETURNING id", [tenantId]);
  await pool.query("INSERT INTO financeiro_categorias (tenant_id, tipo, nome, slug, ordem) VALUES ($1, 'receita', 'Servicos', 'servicos', 0), ($1, 'despesa', 'Operacao', 'operacao', 0) ON CONFLICT (tenant_id, tipo, slug) DO UPDATE SET ativo = true", [tenantId]);
  const services = [
    { nome: "Lavagem detalhada", slug: "lavagem-detalhada", descricao: "Limpeza cuidadosa da carroceria, rodas e areas externas.", duracao: 60, prices: [["moto", 3500], ["pequeno", 5000], ["medio", 6500], ["grande", 8000]] },
    { nome: "Higienizacao interna", slug: "higienizacao-interna", descricao: "Limpeza e renovacao das superficies internas do veiculo.", duracao: 120, prices: [["pequeno", 9000], ["medio", 11000], ["grande", 13000]] },
    { nome: "Polimento tecnico", slug: "polimento-tecnico", descricao: "Acabamento da pintura para realcar brilho e uniformidade.", duracao: 180, prices: [["pequeno", 18000], ["medio", 22000], ["grande", 26000]] },
  ];
  for (const [index, service] of services.entries()) {
    const row = await pool.query("INSERT INTO servicos (tenant_id, categoria_id, nome, slug, descricao, itens_inclusos, duracao_minutos, ordem) VALUES ($1,$2,$3,$4,$5,'[\"Limpeza cuidadosa\",\"Conferencia final\"]',$6,$7) ON CONFLICT (tenant_id, slug) DO UPDATE SET nome=EXCLUDED.nome, descricao=EXCLUDED.descricao, duracao_minutos=EXCLUDED.duracao_minutos, ativo=true RETURNING id", [tenantId, category.rows[0].id, service.nome, service.slug, service.descricao, service.duracao, index]);
    for (const [porte, cents] of service.prices) await pool.query("INSERT INTO servico_precos (tenant_id, servico_id, porte, valor_centavos) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id, servico_id, porte) DO UPDATE SET valor_centavos=EXCLUDED.valor_centavos", [tenantId, row.rows[0].id, porte, cents]);
  }
  await pool.query("COMMIT");
  console.log("Seed da Estetica Demo aplicado.");
} catch (error) {
  await pool.query("ROLLBACK");
  throw error;
} finally {
  await pool.end();
}
