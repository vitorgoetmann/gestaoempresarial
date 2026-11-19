"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  DollarSign,
  Kanban,
  GitBranch,
  Bot,
  ShieldCheck,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  Sun,
  Moon
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [tenant, setTenant] = useState<{ name: string; slug: string } | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string }>>([
    { id: "1", title: "Estoque Baixo", message: "Kit Correia Dentada está abaixo do mínimo (32/8).", type: "warning" },
    { id: "2", title: "Conta Vencida", message: "A conta da Copasa venceu ontem.", type: "danger" },
    { id: "3", title: "Nova Venda", message: "Venda realizada para Oficina Nova Era - R$ 219,90.", type: "success" }
  ]);

  useEffect(() => {
    // Attempt to load profile from a window check or sessionStorage for demo persistence
    const savedUser = sessionStorage.getItem("user");
    const savedTenant = sessionStorage.getItem("tenant");
    if (savedUser && savedTenant) {
      setUser(JSON.parse(savedUser));
      setTenant(JSON.parse(savedTenant));
    } else {
      // Defaults for demo
      setUser({ name: "Admin Master", email: "admin@gestao.local" });
      setTenant({ name: "Vega Distribuidora", slug: "vega-distribuidora" });
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    sessionStorage.clear();
    router.push("/login");
    router.refresh();
  };

  const menuItems: MenuItem[] = [
    { name: "Painel Principal", path: "/dashboard", icon: LayoutDashboard },
    { name: "Clientes", path: "/dashboard/customers", icon: Users },
    { name: "Produtos", path: "/dashboard/products", icon: Package },
    { name: "Estoque (Kardex)", path: "/dashboard/inventory", icon: ArrowLeftRight },
    { name: "Vendas (PDV)", path: "/dashboard/sales", icon: ShoppingCart },
    { name: "Financeiro", path: "/dashboard/finance", icon: DollarSign },
    { name: "CRM Leads", path: "/dashboard/crm", icon: GitBranch },
    { name: "Kanban / Tarefas", path: "/dashboard/tasks", icon: Kanban },
    { name: "Assistente IA", path: "/dashboard/ai", icon: Bot },
    { name: "Auditoria", path: "/dashboard/audit", icon: ShieldCheck },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#11131a] text-[#f5f2ea] border-r border-[#2b303a]">
      {/* Brand logo header */}
      <div className="flex items-center gap-3 p-6 select-none">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-orange-400 font-extrabold text-white text-lg">
          V
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-[#f5f2ea] text-lg">VEGA ERP</span>
          <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">{tenant?.name || "DISTRIBUIDORA"}</span>
        </div>
      </div>

      <Separator className="bg-[#2b303a] px-6" />

      {/* Menu links list */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-4 space-y-7">
          <div>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest pl-2">Menu Geral</span>
            <div className="mt-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border-l-2 ${
                      isActive
                        ? "bg-orange-500/10 border-orange-500 text-orange-400"
                        : "border-transparent text-zinc-400 hover:bg-[#171a22] hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-orange-400" : "text-zinc-500"} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer / User card */}
      <div className="p-4 border-t border-[#2b303a] bg-[#0d0f14]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-[#2b303a]">
              <AvatarFallback className="bg-orange-950/50 text-orange-400 font-bold text-xs uppercase">
                {user?.name?.slice(0, 2) || "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate max-w-[120px]">
              <span className="text-sm font-bold text-zinc-200 truncate">{user?.name || "Admin Master"}</span>
              <span className="text-[10px] text-zinc-500 truncate">{user?.email || "admin@gestao.local"}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
            title="Sair do sistema"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0c11] text-[#f5f2ea] overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-full max-w-[280px] flex-col h-full animate-in slide-in-from-left duration-250">
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-white hover:bg-[#2b303a]"
              >
                <X size={18} />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main dashboard content container */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-[#2b303a] bg-[#11131a] select-none">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white hover:bg-[#2b303a]"
            >
              <Menu size={20} />
            </Button>
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Pesquisar registros, relatórios, ajuda..."
                className="w-full h-9 pl-9 pr-4 text-xs rounded-full border border-[#2b303a] bg-[#0a0c11] text-[#f5f2ea] placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Demo Mode Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles size={10} className="animate-pulse" />
              Demo Mode Active
            </div>

            {/* Notification drop menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-[#2b303a]">
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#11131a] border-[#2b303a] text-[#f5f2ea]">
                <DropdownMenuLabel className="font-extrabold flex justify-between items-center text-[#f5f2ea]">
                  <span>Notificações Críticas</span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                    {notifications.length} Alertas
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2b303a]" />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">Nenhum alerta crítico ativo.</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start gap-1 p-3 border-b border-[#2b303a]/50 focus:bg-[#171a22] text-[#f5f2ea]"
                      >
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className={`text-xs font-bold ${
                            n.type === "danger" ? "text-red-400" : n.type === "warning" ? "text-orange-400" : "text-emerald-400"
                          }`}>{n.title}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{n.message}</p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Light / Dark Mode */}
            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none">
                  <Avatar className="h-8 w-8 border border-orange-500">
                    <AvatarFallback className="bg-orange-600 text-white font-bold text-xs uppercase">
                      {user?.name?.slice(0, 2) || "AD"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#11131a] border-[#2b303a] text-[#f5f2ea]">
                <DropdownMenuLabel className="text-zinc-400 font-medium">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2b303a]" />
                <DropdownMenuItem className="focus:bg-[#171a22] focus:text-white cursor-pointer gap-2">
                  <UserIcon size={14} />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2b303a]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="focus:bg-red-950/20 focus:text-red-400 cursor-pointer gap-2 text-red-500"
                >
                  <LogOut size={14} />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Body viewport */}
        <main className="flex-1 overflow-auto bg-[#0a0c11] p-6 relative">
          <div className="mx-auto max-w-7xl h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
