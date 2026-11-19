import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/server/ai/ai-provider";
import { getAuthContext } from "@/server/auth/context";
import { errorPayload } from "@/server/http/errors";

export async function POST(request: NextRequest) {
  const context = await getAuthContext(request);
  if (!context) {
    return NextResponse.json(errorPayload("Não autorizado", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const body = await request.json().catch(() => null);
  const messages = body?.messages;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(errorPayload("Mensagens inválidas", "VALIDATION"), {
      status: 400,
    });
  }

  try {
    const provider = getAiProvider();
    const responseText = await provider.generateResponse(messages);

    return NextResponse.json({ response: responseText });
  } catch (err) {
    console.error("AI chat routing failed:", err);
    return NextResponse.json(errorPayload("Erro ao processar requisição de IA", "INTERNAL_ERROR"), {
      status: 500,
    });
  }
}
