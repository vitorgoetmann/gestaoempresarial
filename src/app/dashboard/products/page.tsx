"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Tag, Percent, Image, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  margin: number;
  stockCurrent: number;
  stockMin: number;
  images: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Autopecas");
  const [brand, setBrand] = useState("MotorPro");
  const [supplier, setSupplier] = useState("Fábrica Lima");
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [stockCurrent, setStockCurrent] = useState(0);
  const [stockMin, setStockMin] = useState(0);
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setProducts([
        {
          id: "1",
          sku: "MTR-4001",
          barcode: "7890000000012",
          name: "Kit Correia Dentada",
          description: "Kit completo de distribuição com tensionadores",
          category: "Autopecas",
          brand: "MotorPro",
          supplier: "Fábrica Lima",
          costPrice: 120.00,
          salePrice: 219.90,
          margin: 99.90,
          stockCurrent: 32,
          stockMin: 8,
          images: ["https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200"]
        },
        {
          id: "2",
          sku: "FIL-2005",
          barcode: "7890000000345",
          name: "Filtro de Óleo Fram",
          description: "Filtro de óleo blindado de alta vazão",
          category: "Filtros",
          brand: "Fram",
          supplier: "Distribuidora DCar",
          costPrice: 22.00,
          salePrice: 45.00,
          margin: 23.00,
          stockCurrent: 5,
          stockMin: 10,
          images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=200"]
        },
        {
          id: "3",
          sku: "FRE-8012",
          barcode: "7890000000789",
          name: "Pastilha de Freio Bosch",
          description: "Jogo de pastilhas de freio dianteiras cerâmicas",
          category: "Freios",
          brand: "Bosch",
          supplier: "Bosch do Brasil",
          costPrice: 85.00,
          salePrice: 150.00,
          margin: 65.00,
          stockCurrent: 14,
          stockMin: 5,
          images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const marginValue = Number((salePrice - costPrice).toFixed(2));
    const productData = {
      id: selectedProduct?.id || undefined,
      sku,
      barcode,
      name,
      description,
      category,
      brand,
      supplier,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      margin: marginValue,
      stockCurrent: Number(stockCurrent),
      stockMin: Number(stockMin),
      images: imageUrl ? [imageUrl] : []
    };

    try {
      const method = selectedProduct ? "PUT" : "POST";
      const res = await fetch("/api/dashboard/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error();
      loadProducts();
    } catch {
      if (selectedProduct) {
        setProducts(prev =>
          prev.map(p => (p.id === selectedProduct.id ? { ...p, ...productData, id: selectedProduct.id } : p))
        );
      } else {
        const newProd: Product = {
          ...productData,
          id: Math.random().toString(),
          images: imageUrl ? [imageUrl] : ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200"]
        };
        setProducts(prev => [...prev, newProd]);
      }
    } finally {
      setSaving(false);
      setIsNewDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setName("");
    setSku("");
    setBarcode("");
    setDescription("");
    setCategory("Autopecas");
    setBrand("MotorPro");
    setSupplier("Fábrica Lima");
    setCostPrice(0);
    setSalePrice(0);
    setStockCurrent(0);
    setStockMin(0);
    setImageUrl("");
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    setSku(product.sku);
    setBarcode(product.barcode);
    setDescription(product.description);
    setCategory(product.category);
    setBrand(product.brand);
    setSupplier(product.supplier);
    setCostPrice(product.costPrice);
    setSalePrice(product.salePrice);
    setStockCurrent(product.stockCurrent);
    setStockMin(product.stockMin);
    setImageUrl(product.images?.[0] || "");
    setIsNewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este produto do catálogo?")) return;
    try {
      await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" });
      loadProducts();
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Catálogo de Produtos</h1>
          <p className="text-sm text-zinc-500">Gestão de produtos, controle de custos, margens e estoque mínimo.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsNewDialogOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
        >
          <Plus size={16} className="mr-1" />
          Novo Produto
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#11131a] border-[#2b303a] text-white"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "Autopecas", "Filtros", "Freios"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                categoryFilter === cat
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-[#11131a] border-[#2b303a] text-zinc-400 hover:text-white"
              }`}
            >
              {cat === "ALL" ? "Todos" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table grid */}
      <Card className="bg-[#11131a] border-[#2b303a]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#f5f2ea]">
              <thead className="text-xs uppercase bg-[#0d0f14] text-zinc-500 border-b border-[#2b303a]">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">SKU / Cód. Barras</th>
                  <th className="px-6 py-4 text-right">Preço Custo</th>
                  <th className="px-6 py-4 text-right">Preço Venda</th>
                  <th className="px-6 py-4 text-right">Margem</th>
                  <th className="px-6 py-4 text-center">Estoque Atual</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b303a]/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-500 animate-pulse">
                      Carregando catálogo de produtos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-500">
                      Nenhum produto cadastrado nesta categoria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.stockCurrent <= p.stockMin;
                    return (
                      <tr key={p.id} className="hover:bg-[#171a22] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[#2b303a] bg-[#0a0c11]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.images?.[0] || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200"}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-bold block">{p.name}</span>
                              <span className="text-xs text-zinc-500">{p.category} • {p.brand}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <span className="block text-zinc-400 font-semibold">{p.sku}</span>
                          <span className="text-zinc-600">{p.barcode}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-400">R$ {p.costPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-white">R$ {p.salePrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-bold">
                          R$ {p.margin.toFixed(2)}
                          <span className="text-[10px] text-zinc-500 block font-normal">
                            ({((p.margin / p.salePrice) * 100).toFixed(0)}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-white">{p.stockCurrent}</td>
                        <td className="px-6 py-4 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              <AlertTriangle size={10} />
                              Estoque Crítico
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck size={10} />
                              Estável
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(p)}
                              className="text-zinc-400 hover:text-white hover:bg-[#2b303a]"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(p.id)}
                              className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Product dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Gerencie precificação, códigos e níveis de estoque mínimo do item.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="prodName">Nome do Produto</Label>
                <Input
                  id="prodName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodSku">Código Interno (SKU)</Label>
                <Input
                  id="prodSku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodBarcode">Código de Barras (EAN)</Label>
                <Input
                  id="prodBarcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodCost">Preço de Custo (R$)</Label>
                <Input
                  id="prodCost"
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodSale">Preço de Venda (R$)</Label>
                <Input
                  id="prodSale"
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodStock">Estoque Atual</Label>
                <Input
                  id="prodStock"
                  type="number"
                  value={stockCurrent}
                  onChange={(e) => setStockCurrent(Number(e.target.value))}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodMin">Estoque Mínimo</Label>
                <Input
                  id="prodMin"
                  type="number"
                  value={stockMin}
                  onChange={(e) => setStockMin(Number(e.target.value))}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodCat">Categoria</Label>
                <Input
                  id="prodCat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodBrand">Marca</Label>
                <Input
                  id="prodBrand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="prodImage">URL da Imagem</Label>
                <Input
                  id="prodImage"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  placeholder="https://exemplo.com/imagem.png"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="prodDesc">Descrição Detalhada</Label>
                <Input
                  id="prodDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                {saving ? "Salvando..." : "Salvar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
