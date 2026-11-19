import Link from "next/link";
import { ArrowRight, Boxes, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-14">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <Card className="lg:col-span-3 border-[var(--border)] bg-[var(--surface)]/85">
          <CardHeader className="space-y-5">
            <Badge variant="accent" className="w-fit">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              ERP SaaS para operação real
            </Badge>
            <CardTitle className="text-4xl leading-tight md:text-5xl">
              Gestão VG
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-relaxed">
              Plataforma de gestão comercial com vendas, estoque, financeiro, CRM e tarefas em uma única operação. Sem planilhas paralelas e sem retrabalho.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="font-bold">
              <Link href="/login">
                Entrar no painel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link href="/register">Criar empresa</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:col-span-2">
          <Card className="bg-[var(--surface)]/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Operação Integrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-[var(--accent)]" /> Estoque e catálogo sincronizados</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[var(--accent)]" /> Financeiro com lançamentos avulsos</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--accent)]" /> Auditoria e rastreabilidade</div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--surface)]/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Modo de Teste</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted)]">
              Use as credenciais padrão na tela de login para testar o sistema rapidamente com os módulos completos.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
