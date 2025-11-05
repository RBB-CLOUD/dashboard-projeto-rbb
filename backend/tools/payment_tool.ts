import { Tool, Property } from "@modelcontextprotocol/sdk";

export const createPaymentLinkTool = new Tool({
  name: "create_payment_link",
  description:
    "Cria um link de pagamento via Gateway Brasileiro (PagSeguro, Mercado Pago) para a mensalidade do cliente.",
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "O ID único do cliente RBB para rastreamento.",
      } as Property,
      amount_brl: {
        type: "number",
        description: "O valor da mensalidade a ser cobrada, em Reais (BRL).",
      } as Property,
    },
    required: ["client_id", "amount_brl"],
  },
  // Stub (função inicial) que será integrada depois com a API real
  async execute(args: { client_id: string; amount_brl: number }) {
    console.log(
      `[MCP] Solicitando link de pagamento para Cliente: ${args.client_id}, Valor: R$ ${args.amount_brl.toFixed(2)}.`,
    );

    return {
      status: "pending_integration",
      link: `https://pagamento.rbb.br/link/${args.client_id}`,
      message:
        "Tool base de pagamento criada. Próximo passo é integrar a API real do Gateway.",
    };
  },
});
