"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, Key, ShoppingCart, UserPlus, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  module: string;
  action: string;
  entity: string;
  user: string;
  ipAddress: string;
  createdAt: string;
  details: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/audit");
      if (res.ok) {
        setLogs(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setLogs([
        {
          id: "log-1",
          module: "AUTH",
          action: "LOGIN",
          entity: "SESSION",
          user: "admin@gestao.local",
          ipAddress: "127.0.0.1",
          createdAt: new Date().toLocaleString("pt-BR"),
          details: "Login efetuado com sucesso (Sessão iniciada)."
        },
        {
          id: "log-2",
          module: "INVENTORY",
          action: "ENTRY",
          entity: "PRODUCT",
          user: "admin@gestao.local",
          ipAddress: "127.0.0.1",
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toLocaleString("pt-BR"),
          details: "Entrada de 12 unidades do produto Kit Correia Dentada (MTR-4001)."
        },
        {
          id: "log-3",
          module: "SALES",
          action: "CREATE",
          entity: "SALE",
          user: "vendedor@gestao.local",
          ipAddress: "192.168.1.50",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString("pt-BR"),
          details: "Venda faturada com PIX para Oficina Nova Era - R$ 219,90."
        },
        {
          id: "log-4",
          module: "CRM",
          action: "UPDATE",
          entity: "OPPORTUNITY",
          user: "admin@gestao.local",
          ipAddress: "127.0.0.1",
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString("pt-BR"),
          details: "Negócio 'Parceria Frota Escolar' movido para o estágio PROPOSAL."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l =>
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.module.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  const getModuleIcon = (m: string) => {
    switch (m) {
      case "AUTH": return <Key size={14} className="text-orange-500" />;
      case "SALES": return <ShoppingCart size={14} className="text-emerald-500" />;
      case "CRM": return <UserPlus size={14} className="text-blue-500" />;
      default: return <Database size={14} className="text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Logs de Auditoria
            <ShieldAlert size={20} className="text-orange-500" />
          </h1>
          <p className="text-sm text-zinc-500">Histórico de ações de usuários, alterações de dados e auditoria fiscal.</p>
        </div>
        <Button
          onClick={loadAuditLogs}
          variant="ghost"
          className="text-zinc-400 hover:text-white hover:bg-[#11131a] gap-1.5 text-xs font-semibold"
        >
          <RefreshCw size={14} />
          Atualizar Logs
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por usuário, módulo ou ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#11131a] border-[#2b303a] text-white"
          />
        </div>
      </div>

      {/* Logs timeline audit card */}
      <Card className="bg-[#11131a] border-[#2b303a] text-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#f5f2ea]">
              <thead className="text-xs uppercase bg-[#0d0f14] text-zinc-500 border-b border-[#2b303a]">
                <tr>
                  <th className="px-6 py-4">Módulo</th>
                  <th className="px-6 py-4">Ação / Entidade</th>
                  <th className="px-6 py-4">Usuário / IP</th>
                  <th className="px-6 py-4">Descrição do Evento</th>
                  <th className="px-6 py-4 text-center">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b303a]/50 text-xs font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-500 animate-pulse">
                      Carregando trilha de auditoria...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-500">
                      Nenhum evento registrado.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#171a22] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getModuleIcon(log.module)}
                          <span className="font-bold text-zinc-300">{log.module}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-orange-400 block font-bold">{log.action}</span>
                        <span className="text-[10px] text-zinc-500">{log.entity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-300 block">{log.user}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{log.ipAddress}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{log.details}</td>
                      <td className="px-6 py-4 text-center text-zinc-500 font-mono">{log.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
