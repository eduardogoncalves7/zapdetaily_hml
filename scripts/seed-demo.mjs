import process from "node:process";
import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query("BEGIN");
  const tenant = await pool.query(`INSERT INTO tenants (nome, slug) VALUES ('Estética Demo', 'estetica-demo') ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome RETURNING id`);
  const tenantId = tenant.rows[0].id;
  await pool.query(`INSERT INTO tenant_settings (tenant_id, nome_publico, slug, slogan, logo_url, cores, whatsapp, endereco, instagram, horario_funcionamento, fuso_horario, portes_veiculo) VALUES ($1, 'Estética Demo', 'estetica-demo', 'Cuidado fictício para testar o produto.', '', '{"primary":"#94a3b8","accent":"#cbd5e1","background":"#0f172a","foreground":"#e2e8f0","surface":"#1e293b"}', '', '', '', '{}', 'America/Sao_Paulo', '[{"key":"moto","label":"Moto"},{"key":"pequeno","label":"Pequeno"},{"key":"medio","label":"Médio"},{"key":"grande","label":"Grande"}]') ON CONFLICT (tenant_id) DO UPDATE SET nome_publico = EXCLUDED.nome_publico, slogan = EXCLUDED.slogan, atualizado_em = now()`, [tenantId]);
  const category = await pool.query(`INSERT INTO categorias (tenant_id, nome, slug, descricao, ordem) VALUES ($1, 'Cuidados essenciais', 'cuidados-essenciais', 'Serviços demonstrativos da Estética Demo.', 0) ON CONFLICT (tenant_id, slug) DO UPDATE SET nome = EXCLUDED.nome RETURNING id`, [tenantId]);
  const services = [
    { nome: "Lavagem demonstrativa", slug: "lavagem-demonstrativa", descricao: "Exemplo neutro para validar o catálogo.", duracao: 60, prices: [["moto", 3500], ["pequeno", 5000], ["medio", 6500], ["grande", 8000]] },
    { nome: "Acabamento demonstrativo", slug: "acabamento-demonstrativo", descricao: "Outro serviço fictício para testes de preço por porte.", duracao: 90, prices: [["pequeno", 9000], ["medio", 11000], ["grande", 13000]] },
  ];
  for (const service of services) { const row = await pool.query(`INSERT INTO servicos (tenant_id, categoria_id, nome, slug, descricao, itens_inclusos, duracao_minutos, ordem) VALUES ($1,$2,$3,$4,$5,'["Aplicação demonstrativa","Conferência final"]',$6,$7) ON CONFLICT (tenant_id, slug) DO UPDATE SET nome=EXCLUDED.nome, descricao=EXCLUDED.descricao, duracao_minutos=EXCLUDED.duracao_minutos, ativo=true RETURNING id`, [tenantId, category.rows[0].id, service.nome, service.slug, service.descricao, service.duracao, services.indexOf(service)]); for (const [porte, cents] of service.prices) await pool.query(`INSERT INTO servico_precos (tenant_id, servico_id, porte, valor_centavos) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id, servico_id, porte) DO UPDATE SET valor_centavos=EXCLUDED.valor_centavos`, [tenantId, row.rows[0].id, porte, cents]); }
  await pool.query("COMMIT"); console.log("Seed da Estética Demo aplicado.");
} catch (error) { await pool.query("ROLLBACK"); throw error; } finally { await pool.end(); }
