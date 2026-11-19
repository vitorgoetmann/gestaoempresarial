"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Building, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState("vega-distribuidora");
  const [email, setEmail] = useState("admin@gestao.local");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao fazer login");
      }

      // Login successful, redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="order-2 border-[var(--border)] bg-[var(--surface)]/80 lg:order-1">
          <CardHeader>
            <CardTitle className="text-3xl">Operação no controle</CardTitle>
            <CardDescription className="text-base">
              Acompanhe vendas, estoque, financeiro e tarefas da sua equipe em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--muted)]">
            <p>• Cadastro e movimentação de produtos</p>
            <p>• Lançamentos avulsos de débito e crédito</p>
            <p>• Kanban operacional com fluxo de atividades</p>
          </CardContent>
        </Card>

        <Card className="relative order-1 w-full border-[var(--border)] bg-[var(--surface)]/90 text-[var(--text)] lg:order-2">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 text-xl font-bold text-white">
            V
          </div>
        </div>

          <CardHeader className="pt-10 text-center">
            <CardTitle className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              Gestão VG SaaS
            </CardTitle>
            <CardDescription>
              Acesse sua operação empresarial
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="tenantSlug">Domínio da Empresa</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4.5 w-4.5 text-[var(--muted)]" />
                  <Input
                    id="tenantSlug"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    placeholder="ex: minha-empresa"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-[var(--muted)]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-[var(--muted)]" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3 text-xs text-orange-500">
                <span className="mb-1 block font-semibold">Demo rápida:</span>
                Use os dados pré-preenchidos para entrar sem configuração adicional.
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400"
              >
                {loading ? "Autenticando..." : "Entrar no Sistema"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <div className="text-center text-xs text-[var(--muted)]">
                Precisa de uma conta?{" "}
                <Link href="/register" className="text-[var(--accent)] hover:underline">
                  Registrar empresa
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
