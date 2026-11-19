"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Calendar, Phone, Mail, Building, FileText, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string;
  whatsapp: string;
  email: string;
  postalCode: string;
  addressLine: string;
  city: string;
  state: string;
  notes: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseAt: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setCustomers([
        {
          id: "1",
          name: "Oficina Nova Era",
          document: "12.345.678/0001-90",
          phone: "(11) 90000-0000",
          whatsapp: "(11) 90000-0000",
          email: "financeiro@novaera.com",
          postalCode: "01001-000",
          addressLine: "Av. Paulista, 1000",
          city: "São Paulo",
          state: "SP",
          notes: "Cliente especial - faturamento quinzenal.",
          totalSpent: 12890.40,
          totalOrders: 18,
          lastPurchaseAt: new Date().toLocaleDateString("pt-BR")
        },
        {
          id: "2",
          name: "Auto Center Prime",
          document: "98.765.432/0001-10",
          phone: "(11) 95555-5555",
          whatsapp: "(11) 95555-5555",
          email: "compras@autocenterprime.com",
          postalCode: "04578-000",
          addressLine: "Rua Funchal, 200",
          city: "São Paulo",
          state: "SP",
          notes: "Contatar preferencialmente via whatsapp.",
          totalSpent: 9450.00,
          totalOrders: 12,
          lastPurchaseAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")
        },
        {
          id: "3",
          name: "Carlos Eduardo Silva",
          document: "123.456.789-00",
          phone: "(21) 98888-8888",
          whatsapp: "(21) 98888-8888",
          email: "cadu@gmail.com",
          postalCode: "22000-000",
          addressLine: "Av. Atlântica, 500",
          city: "Rio de Janeiro",
          state: "RJ",
          notes: "Consumidor final.",
          totalSpent: 420.00,
          totalOrders: 2,
          lastPurchaseAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const customerData = {
      id: selectedCustomer?.id || undefined,
      name,
      document,
      phone,
      whatsapp,
      email,
      postalCode,
      addressLine,
      city,
      state,
      notes
    };

    try {
      // Simulate saving to API or local state fallback
      const method = selectedCustomer ? "PUT" : "POST";
      const res = await fetch("/api/dashboard/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData)
      });

      if (!res.ok) throw new Error();
      loadCustomers();
    } catch {
      // Fail-safe offline state update
      if (selectedCustomer) {
        setCustomers(prev =>
          prev.map(c => (c.id === selectedCustomer.id ? { ...c, ...customerData, id: selectedCustomer.id } : c))
        );
      } else {
        const newCust: Customer = {
          ...customerData,
          id: Math.random().toString(),
          totalSpent: 0,
          totalOrders: 0,
          lastPurchaseAt: null
        };
        setCustomers(prev => [...prev, newCust]);
      }
    } finally {
      setSaving(false);
      setIsNewDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setName("");
    setDocument("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setPostalCode("");
    setAddressLine("");
    setCity("");
    setState("");
    setNotes("");
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setName(customer.name);
    setDocument(customer.document);
    setPhone(customer.phone);
    setWhatsapp(customer.whatsapp);
    setEmail(customer.email);
    setPostalCode(customer.postalCode);
    setAddressLine(customer.addressLine);
    setCity(customer.city);
    setState(customer.state);
    setNotes(customer.notes);
    setIsNewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return;
    try {
      await fetch(`/api/dashboard/customers?id=${id}`, { method: "DELETE" });
      loadCustomers();
    } catch {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.document.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Clientes</h1>
          <p className="text-sm text-zinc-500">Gestão e cadastro de clientes e histórico de faturamento.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsNewDialogOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
        >
          <Plus size={16} className="mr-1" />
          Novo Cliente
        </Button>
      </div>

      {/* Filters & search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Pesquisar por nome, CPF/CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#11131a] border-[#2b303a] text-white"
          />
        </div>
      </div>

      {/* Grid listing */}
      <Card className="bg-[#11131a] border-[#2b303a]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#f5f2ea]">
              <thead className="text-xs uppercase bg-[#0d0f14] text-zinc-500 border-b border-[#2b303a]">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF / CNPJ</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4 text-right">Total Gasto</th>
                  <th className="px-6 py-4 text-right">Pedidos</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b303a]/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500 animate-pulse">
                      Carregando dados dos clientes...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500">
                      Nenhum cliente cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#171a22] transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDetailDialogOpen(true);
                          }}
                          className="font-bold text-orange-400 hover:underline text-left block"
                        >
                          {customer.name}
                        </button>
                        <span className="text-xs text-zinc-500">{customer.city} - {customer.state}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{customer.document}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs gap-0.5">
                          <span className="text-zinc-300 font-semibold">{customer.phone}</span>
                          <span className="text-zinc-500">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-white">
                        R$ {customer.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-300 font-bold">{customer.totalOrders}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                            className="text-zinc-400 hover:text-white hover:bg-[#2b303a]"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer.id)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Insira as informações do cliente para controle de vendas e financeiro.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="custName">Nome Completo / Razão Social</Label>
                <Input
                  id="custName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custDoc">CPF / CNPJ</Label>
                <Input
                  id="custDoc"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custEmail">E-mail</Label>
                <Input
                  id="custEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  placeholder="financeiro@empresa.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custPhone">Telefone</Label>
                <Input
                  id="custPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custWhats">WhatsApp</Label>
                <Input
                  id="custWhats"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custCep">CEP</Label>
                <Input
                  id="custCep"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custAddress">Endereço</Label>
                <Input
                  id="custAddress"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custCity">Cidade</Label>
                <Input
                  id="custCity"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custState">Estado (UF)</Label>
                <Input
                  id="custState"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  placeholder="SP"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="custNotes">Observações</Label>
                <Input
                  id="custNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                {saving ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Details Drawer/Modal */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-md">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold text-orange-400">{selectedCustomer.name}</DialogTitle>
                <DialogDescription className="text-zinc-500">
                  Resumo cadastral e faturamento comercial.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#0a0c11] p-4 border border-[#2b303a]">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Faturado</span>
                    <p className="text-lg font-black text-emerald-400">R$ {selectedCustomer.totalSpent.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Pedidos</span>
                    <p className="text-lg font-black text-white">{selectedCustomer.totalOrders}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#2b303a] pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">CPF / CNPJ:</span>
                    <span className="font-mono text-zinc-300">{selectedCustomer.document || "Não cadastrado"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Última Compra:</span>
                    <span className="text-zinc-300 font-semibold">{selectedCustomer.lastPurchaseAt || "Nunca comprou"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Telefone:</span>
                    <span className="text-zinc-300">{selectedCustomer.phone || "Não cadastrado"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cidade / UF:</span>
                    <span className="text-zinc-300">{selectedCustomer.city} - {selectedCustomer.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Endereço:</span>
                    <span className="text-zinc-300 text-right max-w-[200px] truncate">{selectedCustomer.addressLine || "Sem endereço"}</span>
                  </div>
                </div>

                <div className="border-t border-[#2b303a] pt-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Notas Internas</span>
                  <p className="text-xs text-zinc-400 bg-[#0a0c11] p-2 rounded border border-[#2b303a]/50">
                    {selectedCustomer.notes || "Nenhuma observação cadastrada."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" className="w-full" onClick={() => setIsDetailDialogOpen(false)}>
                  Fechar Detalhes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
