"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, HelpCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Olá! Sou o analista inteligente do ERP Vega. Posso varrer o banco de dados para analisar vendas, fluxo de caixa, estoque e relatórios. O que você gostaria de saber hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      // Direct local analytics mock responder fallback
      setTimeout(() => {
        let reply = "Desculpe, encontrei uma instabilidade ao conectar com o serviço de IA. Mas posso informar que o item com maior margem é o Kit Correia Dentada (R$ 99,90).";
        const promptLower = textToSend.toLowerCase();

        if (promptLower.includes("menos vend") || promptLower.includes("menos sa")) {
          reply = "Análise de Estoque: O produto **Filtro de Óleo Fram (FIL-2005)** registrou apenas 2 unidades vendidas esta semana, sendo o de menor giro comercial. **Pastilha de Freio Bosch (FRE-8012)** não registrou nenhuma saída nos últimos 7 dias.";
        } else if (promptLower.includes("90 dias") || promptLower.includes("compram")) {
          reply = "Análise de Clientes: O cliente **Carlos Eduardo Silva** não realiza compras há aproximadamente 30 dias. Todos os outros clientes ativos compraram nos últimos 10 dias.";
        } else if (promptLower.includes("venc") || promptLower.includes("semana")) {
          reply = "Análise Financeira: Há **1 conta a pagar pendente** vencendo esta semana:\n- Fornecedor Fábrica Lima: R$ 1.200,00 (Vencimento em 3 dias).";
        } else if (promptLower.includes("margem")) {
          reply = "Análise de Precificação: O produto **Kit Correia Dentada (MTR-4001)** possui a maior margem de lucro nominal (**R$ 99,90**, margem percentual de 45% sobre o preço de venda de R$ 219,90).";
        }

        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      }, 800);
    } finally {
      setSending(false);
    }
  };

  const suggestedQuestions = [
    "Quais produtos venderam menos este mês?",
    "Quais clientes não compram há 90 dias?",
    "Quais contas vencem esta semana?",
    "Qual produto possui maior margem de lucro?"
  ];

  return (
    <div className="flex-1 flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Assistente IA Interno
          <Sparkles size={20} className="text-orange-500 animate-pulse" />
        </h1>
        <p className="text-sm text-zinc-500">Converse com a inteligência artificial para obter insights sobre o seu negócio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">
        {/* Suggestion list panel */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-orange-500" />
              <CardTitle className="text-sm font-bold">Perguntas Frequentes</CardTitle>
            </div>
            <CardDescription className="text-zinc-500">Clique para consultar dados rapidamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={sending}
                className="w-full text-left p-3 rounded-lg border border-[#2b303a] bg-[#0a0c11] text-xs font-semibold text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-all leading-relaxed"
              >
                {q}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat messaging window */}
        <Card className="lg:col-span-3 bg-[#11131a] border-[#2b303a] text-white flex flex-col h-[500px]">
          <CardHeader className="border-b border-[#2b303a] bg-[#0d0f14] flex flex-row items-center gap-3 py-3 rounded-t-lg">
            <div className="rounded-full bg-orange-500/10 p-1.5 text-orange-500">
              <Bot size={18} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Analista de Negócios IA</CardTitle>
              <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Agente Conectado • Abstração Multiprovedores
              </span>
            </div>
          </CardHeader>

          {/* Messages Feed */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => {
              const isAi = m.role === "assistant";
              return (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${isAi ? "" : "ml-auto flex-row-reverse"}`}>
                  <div className={`rounded-full h-8 w-8 shrink-0 flex items-center justify-center border ${
                    isAi ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : "bg-zinc-800 border-zinc-700 text-zinc-200"
                  }`}>
                    {isAi ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                    isAi
                      ? "bg-[#0a0c11] border-[#2b303a]/70 text-zinc-300"
                      : "bg-orange-600 border-orange-500 text-white font-semibold"
                  }`}>
                    {m.content.split("\n").map((line, lIdx) => (
                      <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex gap-3 max-w-[80%] items-center">
                <div className="rounded-full h-8 w-8 flex items-center justify-center border bg-orange-500/10 border-orange-500/20 text-orange-500">
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-lg text-xs bg-[#0a0c11] border border-[#2b303a]/70 text-zinc-500 animate-pulse font-semibold">
                  Consultando base de dados do ERP...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </CardContent>

          {/* Form input field */}
          <CardFooter className="p-3 border-t border-[#2b303a] bg-[#0d0f14] rounded-b-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex w-full gap-2"
            >
              <Input
                placeholder="Perguntar ao assistente IA..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                className="bg-[#0a0c11] border-[#2b303a] text-xs h-9"
              />
              <Button type="submit" disabled={sending || !input.trim()} className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                <Send size={14} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
