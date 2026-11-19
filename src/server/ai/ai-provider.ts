import { getEnv } from "../env";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiProvider {
  name: string;
  generateResponse(messages: ChatMessage[]): Promise<string>;
}

export class MockAiProvider implements AiProvider {
  name = "mock";

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    const userPrompt = messages[messages.length - 1].content.toLowerCase();

    // Context analysis rules
    if (userPrompt.includes("menos vend") || userPrompt.includes("menos sa")) {
      return "Análise de Estoque: O produto **Filtro de Óleo Fram (FIL-2005)** registrou apenas 2 unidades vendidas esta semana, sendo o de menor giro comercial. **Pastilha de Freio Bosch (FRE-8012)** não registrou nenhuma saída nos últimos 7 dias.";
    }

    if (userPrompt.includes("90 dias") || userPrompt.includes("compram")) {
      return "Análise de Clientes: O cliente **Carlos Eduardo Silva** não realiza compras há aproximadamente 30 dias (última compra em 06/05/2026). Todos os outros clientes ativos (Oficina Nova Era e Auto Center Prime) compraram nos últimos 10 dias.";
    }

    if (userPrompt.includes("venc") || userPrompt.includes("semana")) {
      return "Análise Financeira: Há **1 conta a pagar pendente** vencendo esta semana:\n- Fornecedor Fábrica Lima: R$ 1.200,00 (Vencimento em 3 dias).";
    }

    if (userPrompt.includes("margem")) {
      return "Análise de Precificação: O produto **Kit Correia Dentada (MTR-4001)** possui a maior margem de lucro nominal (**R$ 99,90**, margem percentual de 45% sobre o preço de venda de R$ 219,90).";
    }

    return "Olá! Sou o Assistente IA do ERP Vega. Posso te ajudar a analisar vendas, margem de lucro, contas a pagar/receber e níveis críticos de estoque. Tente me perguntar: 'Qual produto possui maior margem de lucro?' ou 'Quais contas vencem esta semana?'";
  }
}

export class OllamaProvider implements AiProvider {
  name = "ollama";
  private baseUrl: string;

  constructor() {
    this.baseUrl = getEnv().OLLAMA_BASE_URL || "http://localhost:11434";
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.message?.content || "Sem resposta do modelo local Ollama.";
    } catch {
      return new MockAiProvider().generateResponse(messages);
    }
  }
}

// Factory client getter
export function getAiProvider(): AiProvider {
  const env = getEnv();
  const provider = env.AI_PROVIDER;

  switch (provider) {
    case "ollama":
      return new OllamaProvider();
    default:
      return new MockAiProvider();
  }
}
