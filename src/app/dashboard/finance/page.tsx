"use client";

import React, { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Check, AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FinancialTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string;
  status: "PAID" | "PENDING";
  dueDate: string | null;
  paidAt: string | null;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  
  // Form fields
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Vendas");
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resTrans, resAccs] = await Promise.all([
        fetch("/api/dashboard/finance/transactions", { cache: "no-store" }),
        fetch("/api/dashboard/finance/accounts", { cache: "no-store" })
      ]);
      if (resTrans.ok && resAccs.ok) {
        setTransactions(await resTrans.json());
        setAccounts(await resAccs.json());
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setAccounts([
        { id: "a-1", name: "Caixa Operacional", balance: 50210.22, type: "CASH" },
        { id: "a-2", name: "Banco Itaú PJ", balance: 120450.00, type: "BANK" }
      ]);
      setTransactions([
        {
          id: "t-1",
          type: "INCOME",
          amount: 219.90,
          description: "Venda PIX #2c1a4001",
          category: "Vendas",
          status: "PAID",
          dueDate: null,
          paidAt: new Date().toLocaleDateString("pt-BR")
        },
        {
          id: "t-2",
          type: "EXPENSE",
          amount: 450.00,
          description: "Energia Elétrica Copel",
          category: "Custos Operacionais",
          status: "PAID",
          dueDate: new Date().toLocaleDateString("pt-BR"),
          paidAt: new Date().toLocaleDateString("pt-BR")
        },
        {
          id: "t-3",
          type: "EXPENSE",
          amount: 1200.00,
          description: "Pagamento de Fornecedor Lima",
          category: "Fornecedores",
          status: "PENDING",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
          paidAt: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const transData = {
      type,
      amount: Number(amount),
      description,
      category,
      status,
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString("pt-BR") : null,
      paidAt: status === "PAID" ? new Date().toLocaleDateString("pt-BR") : null
    };

    try {
      const res = await fetch("/api/dashboard/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transData)
      });
      if (!res.ok) throw new Error();
      const savedTransaction = await res.json();
      setTransactions(prev => [savedTransaction, ...prev.filter(t => t.id !== savedTransaction.id)]);
      await loadData();
    } catch {
      // Offline fallback state update
      const newTrans: FinancialTransaction = {
        ...transData,
        id: Math.random().toString()
      };
      setTransactions(prev => [newTrans, ...prev]);

      // Adjust account balance mock-wise
      setAccounts(prev =>
        prev.map((acc, idx) => {
          if (idx === 0) { // update Cash account
            const mod = type === "INCOME" ? Number(amount) : -Number(amount);
            return { ...acc, balance: acc.balance + mod };
          }
          return acc;
        })
      );
    } finally {
      setSaving(false);
      setIsNewTransactionOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setAmount(0);
    setDescription("");
    setCategory("Vendas");
    setStatus("PAID");
    setDueDate("");
  };

  const getSummary = () => {
    const totalIncome = transactions.filter(t => t.type === "INCOME" && t.status === "PAID").reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "EXPENSE" && t.status === "PAID").reduce((acc, t) => acc + t.amount, 0);
    const totalReceivable = transactions.filter(t => t.type === "INCOME" && t.status === "PENDING").reduce((acc, t) => acc + t.amount, 0);
    const totalPayable = transactions.filter(t => t.type === "EXPENSE" && t.status === "PENDING").reduce((acc, t) => acc + t.amount, 0);
    return { totalIncome, totalExpense, totalReceivable, totalPayable };
  };

  const summary = getSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Financeiro</h1>
          <p className="text-sm text-zinc-500">Conciliação bancária, fluxo de caixa e controle de contas a pagar e receber.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsNewTransactionOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
        >
          <Plus size={16} className="mr-1" />
          Registrar Lançamento
        </Button>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="pb-2">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Receitas Realizadas</span>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-xl font-extrabold text-emerald-400">R$ {summary.totalIncome.toFixed(2)}</span>
            <ArrowUpRight size={18} className="text-emerald-400 bg-emerald-500/10 rounded p-0.5" />
          </CardContent>
        </Card>

        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="pb-2">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Despesas Realizadas</span>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-xl font-extrabold text-red-400">R$ {summary.totalExpense.toFixed(2)}</span>
            <ArrowDownRight size={18} className="text-red-400 bg-red-500/10 rounded p-0.5" />
          </CardContent>
        </Card>

        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="pb-2">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Contas a Receber</span>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-xl font-extrabold text-blue-400">R$ {summary.totalReceivable.toFixed(2)}</span>
            <Wallet size={16} className="text-blue-400" />
          </CardContent>
        </Card>

        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="pb-2">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Contas a Pagar</span>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-xl font-extrabold text-orange-400">R$ {summary.totalPayable.toFixed(2)}</span>
            <AlertCircle size={16} className="text-orange-400 animate-pulse" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank accounts balance side */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Contas Bancárias / Caixa</CardTitle>
            <CardDescription className="text-zinc-500">Saldos atuais para conciliação operacional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between border-b border-[#2b303a]/50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-zinc-800 p-2 border border-[#2b303a]">
                    <Wallet size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{acc.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">{acc.type}</span>
                  </div>
                </div>
                <span className="text-sm font-black text-white">R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transactions log list */}
        <Card className="lg:col-span-2 bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Lançamentos Recentes</CardTitle>
            <CardDescription className="text-zinc-500">Extrato financeiro unificado.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-zinc-500 animate-pulse">Carregando livro caixa...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">Nenhum lançamento registrado no livro caixa.</div>
              ) : (
                transactions.map((t) => {
                  const isIncome = t.type === "INCOME";
                  return (
                    <div key={t.id} className="flex items-start justify-between border-b border-[#2b303a]/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-1.5 ${
                          isIncome ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{t.description}</div>
                          <div className="text-xs text-zinc-400 font-semibold mt-0.5">
                            Categoria: <span className="text-orange-400">{t.category}</span>
                          </div>
                          {t.dueDate && (
                            <span className="text-[10px] text-zinc-500 block mt-1">Vence em: {t.dueDate}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                          {isIncome ? "+" : "-"} R$ {t.amount.toFixed(2)}
                        </span>
                        <div className="mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                            t.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                          }`}>
                            {t.status === "PAID" ? "Liquidado" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Lançamento dialog */}
      <Dialog open={isNewTransactionOpen} onOpenChange={setIsNewTransactionOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Lançamento Financeiro</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Registrar contas a pagar (despesas) ou receber (receitas) no livro caixa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tType">Tipo de Lançamento</Label>
              <select
                id="tType"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-9 rounded-md bg-[#0a0c11] border border-[#2b303a] px-3 text-sm text-white focus:outline-none focus:border-orange-500"
                required
              >
                <option value="INCOME">Receita (Entrada)</option>
                <option value="EXPENSE">Despesa (Saída)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tDesc">Descrição</Label>
              <Input
                id="tDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel comercial / Faturamento balcão"
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tAmount">Valor (R$)</Label>
              <Input
                id="tAmount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tCat">Categoria Financeira</Label>
              <Input
                id="tCat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Impostos / Salários / Vendas"
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tStatus">Status da Liquidação</Label>
              <select
                id="tStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-9 rounded-md bg-[#0a0c11] border border-[#2b303a] px-3 text-sm text-white focus:outline-none focus:border-orange-500"
                required
              >
                <option value="PAID">Pago / Recebido (Conciliado)</option>
                <option value="PENDING">Pendente (Contas a Pagar/Receber)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tDueDate">Data de Vencimento (Se pendente)</Label>
              <Input
                id="tDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-[#0a0c11] border-[#2b303a]"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNewTransactionOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                Salvar Lançamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
