# Assistente Plus — contrato e integração futura

Este scaffold não conecta WhatsApp, voz, LLM ou calendário. `ASSISTANT_ENABLED=false` é o padrão.

## Contrato do webhook

Endpoint: `POST /api/webhooks/whatsapp`.

O payload deve chegar como mensagem externa com identificador estável, número de origem e texto. O texto é tratado como dado de usuário: nunca altera configuração, regras ou instruções do sistema. A aplicação deve:

1. validar o plano Plus;
2. validar a assinatura usando o verificador do provedor escolhido;
3. conferir a allowlist do proprietário;
4. descartar mensagens já processadas pelo par `tenant_id + provedor + mensagem_externa_id`;
5. registrar a mensagem e aplicar limite de uso diário/mensal;
6. validar a saída do parser contra os schemas de intenção;
7. pedir esclarecimento para entidades ambíguas e confirmação antes de cancelar, remarcar ou registrar despesa;
8. executar somente services internos de agenda e financeiro.

Quando a capability está desligada, o endpoint responde `404`. Quando o Plus está ativo, mas `ASSISTANT_ENABLED=false`, responde `503` com `Assistente não configurado`. Nenhum segredo é armazenado em `integration_settings`: a tabela guarda apenas referências a configurações externas.

## Passos para ligar

1. Escolher um provedor de mensagens e confirmar o contrato de assinatura.
2. Criar a conta do provedor e configurar o webhook para o domínio da aplicação.
3. Armazenar o segredo no mecanismo de secrets do ambiente de execução, nunca no banco ou no Git.
4. Preencher apenas referências em `integration_settings`, configurar a allowlist do proprietário e revisar os limites.
5. Implementar o verificador do provedor em `verifyWebhookSignature` e um adapter `MessagingProvider`.
6. Habilitar `ASSISTANT_ENABLED=true` e testar primeiro em ambiente de homologação.

## Opções de provedor

| Opção | Prós | Contras |
| --- | --- | --- |
| WhatsApp Business Cloud API | API oficial, webhooks documentados e controle direto | Exige configuração Meta, aprovação e custos/regras da plataforma |
| BSP especializado | Onboarding e suporte operacional mais simples | Dependência comercial, custos adicionais e contrato específico |
| Gateway interno ou omnichannel | Pode centralizar canais e observabilidade | Mais componentes, maior superfície de segurança e manutenção |

A escolha permanece pendente do proprietário. O scaffold não seleciona nenhum provedor.
