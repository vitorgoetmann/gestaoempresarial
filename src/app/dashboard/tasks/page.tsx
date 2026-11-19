"use client";

import React, { useState, useEffect } from "react";
import { Plus, MessageSquare, Paperclip, Clock, ShieldAlert, ArrowRight, UserPlus, Send, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Comment {
  id: string;
  user: string;
  message: string;
  date: string;
}

interface Attachment {
  name: string;
  url: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  assignee: string;
  comments: Comment[];
  attachments: Attachment[];
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task["status"] | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("Admin Master");

  // Comment input
  const [newComment, setNewComment] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/tasks", { cache: "no-store" });
      if (res.ok) {
        setTasks(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback mock data
      setTasks([
        {
          id: "t-1",
          title: "Revisar estoque crítico",
          description: "Verificar itens com estoque abaixo do mínimo e contatar distribuidoras parceiras.",
          status: "PENDING",
          priority: "HIGH",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
          assignee: "Admin Master",
          comments: [
            { id: "c-1", user: "Auxiliar", message: "Kit Correia Dentada precisa de pedido urgente.", date: "Ontem às 15:30" }
          ],
          attachments: [{ name: "relatorio_estoque.pdf", url: "#" }]
        },
        {
          id: "t-2",
          title: "Conciliar extrato bancário",
          description: "Lançar saídas e pagamentos efetuados via banco Itaú PJ.",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          dueDate: new Date().toLocaleDateString("pt-BR"),
          assignee: "Financeiro Aux",
          comments: [],
          attachments: []
        },
        {
          id: "t-3",
          title: "Configurar integrações do SaaS",
          description: "Testar conexões de Webhooks e API de auditoria.",
          status: "DONE",
          priority: "URGENT",
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
          assignee: "Admin Master",
          comments: [
            { id: "c-2", user: "Admin Master", message: "Tudo homologado com sucesso.", date: "Há 2 dias" }
          ],
          attachments: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"),
      assignee,
    };

    try {
      const res = await fetch("/api/dashboard/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error();
      loadTasks();
    } catch {
      setTasks(prev => [...prev, {
        id: Math.random().toString(),
        status: "PENDING",
        comments: [],
        attachments: [],
        ...taskData,
      }]);
    } finally {
      setIsNewTaskOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setAssignee("Admin Master");
  };

  const moveTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    const previousTasks = tasks;
    const previousSelectedTask = selectedTask;

    setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, status: newStatus } : task)));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const res = await fetch(`/api/dashboard/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(previousTasks);
      setSelectedTask(previousSelectedTask);
      await loadTasks();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const comm: Comment = {
      id: Math.random().toString(),
      user: "Admin Master (Demo)",
      message: newComment,
      date: "Agora mesmo"
    };

    try {
      const res = await fetch(`/api/dashboard/tasks/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask.id, message: newComment })
      });
      if (!res.ok) throw new Error();
      await loadTasks();
    } catch {
      // Mock persistence
      const updatedComments = [...(selectedTask.comments || []), comm];
      setTasks(prev =>
        prev.map(t => (t.id === selectedTask.id ? { ...t, comments: updatedComments } : t))
      );
      setSelectedTask(prev => prev ? { ...prev, comments: updatedComments } : null);
    } finally {
      setNewComment("");
    }
  };

  const columns: { title: string; status: Task["status"] }[] = [
    { title: "Pendente", status: "PENDING" },
    { title: "Em Andamento", status: "IN_PROGRESS" },
    { title: "Concluído", status: "DONE" },
    { title: "Cancelado", status: "CANCELED" }
  ];

  const getPriorityColor = (p: Task["priority"]) => {
    switch (p) {
      case "URGENT": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default: return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  const handleDropTask = (newStatus: Task["status"]) => {
    if (!draggedTaskId) {
      return;
    }

    const task = tasks.find((item) => item.id === draggedTaskId);
    setDraggedTaskId(null);
    setDragOverStatus(null);

    if (!task || task.status === newStatus) {
      return;
    }

    moveTaskStatus(task.id, newStatus);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Tarefas & Atividades</h1>
          <p className="text-sm text-zinc-500">Fluxo visual de atividades corporativas interligado ao estoque e financeiro.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsNewTaskOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
        >
          <Plus size={16} className="mr-1" />
          Nova Tarefa
        </Button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <Card
              key={col.status}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverStatus(col.status);
              }}
              onDragLeave={() => {
                if (dragOverStatus === col.status) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={() => handleDropTask(col.status)}
              className={`bg-[#11131a] border-[#2b303a] text-white flex flex-col h-[500px] transition-all duration-200 ${
                dragOverStatus === col.status ? "border-orange-500/70 bg-[#131722] shadow-[0_0_0_1px_rgba(249,115,22,0.22)]" : ""
              }`}
            >
              <CardHeader className="p-4 border-b border-[#2b303a] bg-[#0d0f14] flex flex-row items-center justify-between rounded-t-lg">
                <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">{col.title}</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                  {colTasks.length}
                </span>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto flex-1 space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverStatus(null);
                    }}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsTaskDetailOpen(true);
                    }}
                    className={`p-3 rounded-lg border bg-[#0a0c11] hover:border-orange-500/50 cursor-pointer transition-all duration-200 space-y-2 select-none ${
                      draggedTaskId === task.id ? "opacity-60 scale-[0.98] border-orange-500/70" : "border-[#2b303a]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Clock size={10} />
                        {task.dueDate}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{task.title}</h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{task.description}</p>

                    <div className="flex justify-between items-center pt-2 border-t border-[#2b303a]/50 text-[10px] text-zinc-500 font-semibold">
                      <span>Resp: {task.assignee}</span>
                      <div className="flex gap-2">
                        {task.comments.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare size={10} />
                            {task.comments.length}
                          </span>
                        )}
                        {task.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Paperclip size={10} />
                            {task.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Tarefa Operacional</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Descreva a tarefa, prazos e prioridades de execução.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tTitle">Título da Atividade</Label>
              <Input
                id="tTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Conciliar nota fiscal de compra"
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tDesc">Descrição</Label>
              <Input
                id="tDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#0a0c11] border-[#2b303a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tPriority">Prioridade</Label>
                <select
                  id="tPriority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-9 rounded-md bg-[#0a0c11] border border-[#2b303a] px-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tDue">Prazo Final</Label>
                <Input
                  id="tDue"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-[#0a0c11] border-[#2b303a]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tAssignee">Responsável</Label>
              <Input
                id="tAssignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="bg-[#0a0c11] border-[#2b303a]"
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNewTaskOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                Criar Atividade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog (Comments / Attachments) */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="bg-[#11131a] border-[#2b303a] text-[#f5f2ea] max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center gap-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => moveTaskStatus(selectedTask.id, e.target.value as any)}
                    className="h-7 rounded bg-[#0a0c11] border border-[#2b303a] px-2 text-xs text-orange-400 font-bold focus:outline-none"
                  >
                    <option value="PENDING">PENDENTE</option>
                    <option value="IN_PROGRESS">EM ANDAMENTO</option>
                    <option value="DONE">CONCLUÍDO</option>
                    <option value="CANCELED">CANCELADO</option>
                  </select>
                </div>
                <DialogTitle className="text-lg font-extrabold text-zinc-100 mt-2">{selectedTask.title}</DialogTitle>
                <DialogDescription className="text-zinc-500">
                  Prazo de entrega final configurado para: {selectedTask.dueDate} • Resp: {selectedTask.assignee}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <p className="text-zinc-300 bg-[#0a0c11] p-3 rounded-lg border border-[#2b303a]/50 leading-relaxed">
                  {selectedTask.description || "Nenhuma descrição detalhada."}
                </p>

                {/* Attachments Section */}
                {selectedTask.attachments.length > 0 && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block mb-1">Anexos</span>
                    <div className="flex items-center gap-2 p-2 rounded bg-zinc-800/30 border border-[#2b303a]/50 text-zinc-400 font-bold">
                      <Paperclip size={12} />
                      <a href={selectedTask.attachments[0].url} className="hover:underline">{selectedTask.attachments[0].name}</a>
                    </div>
                  </div>
                )}

                {/* Comments section */}
                <div className="border-t border-[#2b303a] pt-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block mb-2">Discussão / Histórico</span>
                  <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                    {selectedTask.comments.length === 0 ? (
                      <p className="text-zinc-600 italic">Nenhum comentário registrado.</p>
                    ) : (
                      selectedTask.comments.map((c) => (
                        <div key={c.id} className="bg-[#0a0c11] p-2.5 rounded-lg border border-[#2b303a]/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-extrabold text-zinc-400">{c.user}</span>
                            <span className="text-[9px] text-zinc-600">{c.date}</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{c.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment input */}
                  <form onSubmit={handleAddComment} className="flex gap-2 mt-3 pt-2">
                    <Input
                      placeholder="Adicionar resposta rápida..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-[#0a0c11] border-[#2b303a] text-xs h-8"
                    />
                    <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                      <Send size={12} />
                    </Button>
                  </form>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" className="w-full text-xs" onClick={() => setIsTaskDetailOpen(false)}>
                  Fechar Atividade
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
