import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import type { AssistantRepository, InboundMessage } from "./orchestrator";
import { hashPhone } from "./orchestrator";

export class PostgresAssistantRepository implements AssistantRepository {
  async hasMessage(id: string, tenantId: string): Promise<boolean> { const result = await getDb().query("SELECT 1 FROM assistant_messages WHERE tenant_id=$1 AND mensagem_externa_id=$2 LIMIT 1", [tenantId, id]); return result.rowCount === 1; }
  async isAllowlisted(tenantId: string, phoneHash: string): Promise<boolean> { const result = await getDb().query("SELECT 1 FROM assistant_contacts WHERE tenant_id=$1 AND numero_hash=$2 AND papel='owner' AND ativo=true", [tenantId, phoneHash]); return result.rowCount === 1; }
  async saveMessage(message: InboundMessage, status: string): Promise<void> { await getDb().query("INSERT INTO assistant_messages (tenant_id, provedor, mensagem_externa_id, numero_hash, texto, status, processado_em) VALUES ($1,'pending',$2,$3,$4,$5,CASE WHEN $5='executada' THEN now() ELSE NULL END) ON CONFLICT (tenant_id, provedor, mensagem_externa_id) DO UPDATE SET status=EXCLUDED.status, processado_em=EXCLUDED.processado_em", [message.tenantId, message.id, hashPhone(message.from), message.text, status]); }
  async consumeUsage(tenantId: string): Promise<boolean> {
    const client = await getDb().connect(); const env = getEnv();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO assistant_usage (tenant_id,periodo,referencia,mensagens,limite) VALUES ($1,'dia',CURRENT_DATE,0,$2),($1,'mes',date_trunc('month',CURRENT_DATE)::date,0,$3) ON CONFLICT (tenant_id,periodo,referencia) DO NOTHING", [tenantId, env.ASSISTANT_DAILY_LIMIT, env.ASSISTANT_MONTHLY_LIMIT]);
      const result = await client.query<{ periodo: string; mensagens: number; limite: number }>("SELECT periodo,mensagens,limite FROM assistant_usage WHERE tenant_id=$1 AND ((periodo='dia' AND referencia=CURRENT_DATE) OR (periodo='mes' AND referencia=date_trunc('month',CURRENT_DATE)::date)) FOR UPDATE", [tenantId]);
      if (result.rows.some((row) => row.mensagens >= row.limite)) { await client.query("ROLLBACK"); return false; }
      await client.query("UPDATE assistant_usage SET mensagens=mensagens+1,atualizado_em=now() WHERE tenant_id=$1 AND ((periodo='dia' AND referencia=CURRENT_DATE) OR (periodo='mes' AND referencia=date_trunc('month',CURRENT_DATE)::date))", [tenantId]);
      await client.query("COMMIT"); return true;
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; } finally { client.release(); }
  }
}
