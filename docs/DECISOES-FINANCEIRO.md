# Decisões do financeiro

- Valores monetários são inteiros em centavos; não há ponto flutuante no contrato da API.
- Exclusão é lógica e estorno é uma transição de estado, ambos com `audit_log`; nenhum lançamento é apagado fisicamente.
- A conclusão de um agendamento sugere uma receita na mesma transação, com índice único parcial por agendamento para garantir idempotência.
- As fronteiras de dia, semana e mês são calculadas no fuso do tenant e convertidas para UTC apenas na consulta de agendamentos.
- O dashboard usa uma série CSS/SVG pequena, sem dependência de biblioteca gráfica pesada.
