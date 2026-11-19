"use client";

import React, { useState, useEffect } from "react";
import { Plus, ArrowDown, ArrowUp, Edit, ClipboardList, Info, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InventoryMovement {
  id: string;
  productName: string;
  sku: string;
  type: "ENTRY" | "EXIT" | "ADJUSTMENT" | "LOSS" | "RETURN" | "TRANSFER";
  quantity: number;
  reason: string;
  user: string;
  occurredAt: string;
}

export default function InventoryPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [moveType, setMoveType] = useState<"ENTRY" | "EXIT" | "ADJUSTMENT" | "LOSS" | "RETURN">("ENTRY");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resMoves, resProds] = await Promise.all([
        fetch("/api/dashboard/inventory"),
        fetch("/api/dashboard/products")
      ]);
      if (resMoves.ok && resProds.ok) {
        setMovements(await resMoves.json());
        setProducts(await resProds.json());
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setProducts([
        { id: "1", sku: "MTR-4001", name: "Kit Correia Dentada", stockCurrent: 32 },
        { id: "2", sku: "FIL-2005", name: "Filtro de Óleo Fram", stockCurrent: 5 },
        { id: "3", sku: "FRE-8012", name: "Pastilha de Freio Bosch", stockCurrent: 14 }
      ]);
      setMovements([
        {
          id: "m-1",
          productName: "Kit Correia Dentada",
          sku: "MTR-4001",
          type: "ENTRY",
          quantity: 12,
          reason: "Reposição de fornecedor - Fabrica Lima",
          user: "Admin Master",
          occurredAt: new Date().toLocaleString("pt-BR")
        },
        {
          id: "m-2",
          productName: "Filtro de Óleo Fram",
          sku: "FIL-2005",
          type: "EXIT",
          quantity: 2,
          reason: "Venda PDV #441",
          user: "Vendedor Auxiliar",
          occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString("pt-BR")
        },
        {
          id: "m-3",
          productName: "Pastilha de Freio Bosch",
          sku: "FRE-8012",
          type: "LOSS",
          quantity: 1,
          reason: "Item danificado na prateleira",
          user: "Admin Master",
          occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString("pt-BR")
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    const moveData = {
      productId: selectedProductId,
      type: moveType,
      quantity: Number(quantity),
      reason
    };

    try {
      const res = await fetch("/api/dashboard/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moveData)
      });
      if (!res.ok) throw new Error();
      loadData();
    } catch {
      // Offline fallback state updater
      const newMove: InventoryMovement = {
        id: Math.random().toString(),
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        type: moveType,
        quantity: Number(quantity),
        reason,
        user: "Admin Master (Demo)",
        occurredAt: new Date().toLocaleString("pt-BR")
      };

      setMovements(prev => [newMove, ...prev]);

      // Update local product stock count
      setProducts(prevProds =>
        prevProds.map(p => {
          if (p.id === selectedProductId) {
            let nextStock = p.stockCurrent;
            if (moveType === "ENTRY" || moveType === "RETURN") nextStock += Number(quantity);
            else nextStock -= Number(quantity);
            return { ...p, stockCurrent: nextStock };
          }
          return p;
        })
      );
    } finally {
      setIsMoveDialogOpen(false);
      setSelectedProductId("");
      setQuantity(1);
      setReason("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Estoque (Kardex)</h1>
          <p className="text-sm text-zinc-500">Histórico de movimentações, entradas, saídas, perdas e auditoria.</p>
        </div>
        <Button
          onClick={() => setIsMoveDialogOpen(true)}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
        >
          <Plus size={16} className="mr-1" />
          Registrar Movimentação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kardex chronological log feed */}
        <Card className="lg:col-span-2 bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold">Livro Diário de Estoque</CardTitle>
                <CardDescription className="text-zinc-500">Fluxo cronológico de movimentações físicas do inventário.</CardDescription>
              </div>
              <ClipboardList size={16} className="text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-zinc-500 animate-pulse">Carregando livro Kardex...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">Nenhuma movimentação registrada no Kardex.</div>
              ) : (
                movements.map((move) => {
                  const isPositive = move.type === "ENTRY" || move.type === "RETURN";
                  return (
                    <div key={move.id} className="flex items-start justify-between border-b border-[#2b303a]/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-1.5 ${
                          isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{move.productName}</div>
                          <div className="text-xs text-zinc-400 font-semibold mt-0.5">
                            SKU: <span className="font-mono text-orange-400">{move.sku}</span> • Por: {move.user}
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 italic">"{move.reason}"</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                          {isPositive ? "+" : "-"}{move.quantity} un
                        </span>
                        <div className="text-[10px] text-zinc-600 mt-0.5">{move.occurredAt}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current stock status overview */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Níveis do Inventário</CardTitle>
            <CardDescription className="text-zinc-500">Resumo da contagem física em prateleiras.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-[#2b303a]/50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <span className="text-sm font-bold block">{p.name}</span>
                    <span className="text-xs text-zinc-500 font-mono">{p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white block">{p.stockCurrent} un</span>
                    <span className="text-[10px] text-zinc-500">Saldo Atual</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement form Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação de Estoque</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Registrar entradas de fornecedores, ajustes fiscais, perdas ou devoluções no Kardex.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMovement} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="moveProduct">Selecione o Produto</Label>
              <select
                id="moveProduct"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0a0c11] border border-[#2b303a] px-3 text-sm text-white focus:outline-none focus:border-orange-500"
                required
              >
                <option value="">-- Escolha um item --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Saldo: {p.stockCurrent} un)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="moveType">Tipo de Movimento</Label>
              <select
                id="moveType"
                value={moveType}
                onChange={(e) => setMoveType(e.target.value as any)}
                className="w-full h-9 rounded-md bg-[#0a0c11] border border-[#2b303a] px-3 text-sm text-white focus:outline-none focus:border-orange-500"
                required
              >
                <option value="ENTRY">Entrada (Compra/Reposição)</option>
                <option value="EXIT">Saída (Retirada/Consumo)</option>
                <option value="ADJUSTMENT">Ajuste de Inventário</option>
                <option value="LOSS">Perda / Roubo / Quebra</option>
                <option value="RETURN">Devolução de Venda</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="moveQty">Quantidade</Label>
              <Input
                id="moveQty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="moveReason">Motivo / Justificativa</Label>
              <Input
                id="moveReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Nota Fiscal 1245 / Acerto de balanço"
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsMoveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                Gravar no Kardex
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
