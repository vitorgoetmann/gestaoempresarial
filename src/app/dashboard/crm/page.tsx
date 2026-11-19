"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Landmark, FileText, ChevronRight, PhoneCall, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: "PROSPECT" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
  contactName: string;
  phone: string;
}

export default function CrmPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState(0);
  const [stage, setStage] = useState<Opportunity["stage"]>("PROSPECT");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/crm");
      if (res.ok) {
        setOpportunities(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setOpportunities([
        {
          id: "o-1",
          title: "Parceria Frota Escolar",
          company: "TransColégio S/A",
          value: 12500.00,
          stage: "PROPOSAL",
          contactName: "Maurício Albuquerque",
          phone: "(11) 97777-1122"
        },
        {
          id: "o-2",
          title: "Fornecimento de Filtros em Lote",
          company: "Auto Mecânica Prime",
          value: 4500.00,
          stage: "NEGOTIATION",
          contactName: "Reginaldo Dias",
          phone: "(11) 98888-2233"
        },
        {
          id: "o-3",
          title: "Kit Freios Premium",
          company: "Oficina Nova Era",
          value: 8500.00,
          stage: "WON",
          contactName: "Adalberto Prado",
          phone: "(11) 90000-0000"
        },
        {
          id: "o-4",
          title: "Baterias Moura para Empilhadeiras",
          company: "Logística Vega",
          value: 16000.00,
          stage: "QUALIFICATION",
          contactName: "Renata Santos",
          phone: "(11) 94444-5566"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();

    const dealData = {
      id: Math.random().toString(),
      title,
      company,
      value: Number(value),
      stage,
      contactName,
      phone
    };

    try {
      const res = await fetch("/api/dashboard/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData)
      });
      if (!res.ok) throw new Error();
      loadCRMData();
    } catch {
      setOpportunities(prev => [...prev, dealData]);
    } finally {
      setIsNewDealOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setValue(0);
    setStage("PROSPECT");
    setContactName("");
    setPhone("");
  };

  const moveDealStage = async (id: string, nextStage: Opportunity["stage"]) => {
    try {
      await fetch(`/api/dashboard/crm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stage: nextStage })
      });
      loadCRMData();
    } catch {
      setOpportunities(prev =>
        prev.map(o => (o.id === id ? { ...o, stage: nextStage } : o))
      );
    }
  };

  const stages: { label: string; key: Opportunity["stage"] }[] = [
    { label: "Prospecção", key: "PROSPECT" },
    { label: "Qualificação", key: "QUALIFICATION" },
    { label: "Proposta", key: "PROPOSAL" },
    { label: "Negociação", key: "NEGOTIATION" },
    { label: "Fechado (Ganho)", key: "WON" }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">CRM Leads</h1>
          <p className="text-sm text-zinc-500">Pipeline de oportunidades de vendas, contatos corporativos e propostas comerciais.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsNewDealOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
        >
          <Plus size={16} className="mr-1" />
          Nova Negociação
        </Button>
      </div>

      {/* CRM Funnel Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
        {stages.map((stg) => {
          const colDeals = opportunities.filter((o) => o.stage === stg.key);
          const colTotal = colDeals.reduce((sum, o) => sum + o.value, 0);

          return (
            <Card key={stg.key} className="bg-[#11131a] border-[#2b303a] text-white flex flex-col h-[500px]">
              <CardHeader className="p-3 border-b border-[#2b303a] bg-[#0d0f14] flex flex-col gap-1 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-400">{stg.label}</span>
                  <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                    {colDeals.length}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                  Val: R$ {colTotal.toLocaleString("pt-BR")}
                </span>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto flex-1 space-y-3">
                {colDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg border border-[#2b303a] bg-[#0a0c11] space-y-2 select-none"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-black text-xs text-white block leading-tight">{deal.company}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">{deal.title}</p>
                    <div className="text-sm font-extrabold text-orange-400 font-mono">R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>

                    <div className="pt-2 border-t border-[#2b303a]/50 flex justify-between items-center text-[10px] text-zinc-500">
                      <span>{deal.contactName}</span>
                      <button
                        onClick={() => {
                          const nextIdx = stages.findIndex(s => s.key === stg.key) + 1;
                          if (nextIdx < stages.length) {
                            moveDealStage(deal.id, stages[nextIdx].key);
                          }
                        }}
                        className="text-orange-400 hover:text-orange-300 font-bold flex items-center"
                        title="Mover estágio"
                      >
                        Avançar
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Deal Dialog */}
      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade CRM</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Registre a empresa, valor estimado e contato para acompanhamento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDeal} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="crmCompany">Nome da Empresa</Label>
              <Input
                id="crmCompany"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Auto Mecânica São Paulo"
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crmTitle">Título do Negócio</Label>
              <Input
                id="crmTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Fornecimento de 50 filtros de óleo"
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="crmVal">Valor Estimado (R$)</Label>
                <Input
                  id="crmVal"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crmStage">Estágio Inicial</Label>
                <select
                  id="crmStage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full h-9 rounded-md bg-[#0a0c11] border border-[#2b303a] px-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="PROSPECT">Prospecção</option>
                  <option value="QUALIFICATION">Qualificação</option>
                  <option value="PROPOSAL">Proposta</option>
                  <option value="NEGOTIATION">Negociação</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="crmContact">Contato</Label>
                <Input
                  id="crmContact"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crmPhone">Telefone</Label>
                <Input
                  id="crmPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNewDealOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                Gravar Oportunidade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
