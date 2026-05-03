"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Cross,
  Church,
  Truck,
  Briefcase,
  Wrench,
  Phone,
  MoreHorizontal,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  client: { id: string; name: string } | null;
  deathRecord: { id: string; deceasedName: string } | null;
  location: string | null;
  description: string | null;
  color: string | null;
  resources: { resource: { id: string; name: string; type: string } }[];
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

const EVENT_TYPES: Record<string, { label: string; color: string; icon: any }> = {
  VELORIO: { label: "Velório", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Church },
  SEPULTAMENTO: { label: "Sepultamento", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Cross },
  CREMACAO: { label: "Cremação", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Cross },
  REUNIAO: { label: "Reunião", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Briefcase },
  VISITA: { label: "Visita", color: "bg-green-100 text-green-700 border-green-200", icon: Users },
  MANUTENCAO: { label: "Manutenção", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Wrench },
  COBRANCA: { label: "Cobrança", color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: Phone },
  OUTRO: { label: "Outro", color: "bg-pink-100 text-pink-700 border-pink-200", icon: CalendarIcon },
};

const STATUS_LABELS: Record<string, string> = {
  AGENDADO: "Agendado",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const TYPE_COLORS: Record<string, string> = {
  VELORIO: "#9333ea",
  SEPULTAMENTO: "#d97706",
  CREMACAO: "#ea580c",
  REUNIAO: "#2563eb",
  VISITA: "#16a34a",
  MANUTENCAO: "#6b7280",
  COBRANCA: "#0891b2",
  OUTRO: "#db2777",
};

export default function AgendaPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDetail, setShowDetail] = useState<CalendarEvent | null>(null);

  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);

  const [form, setForm] = useState({
    title: "",
    type: "VELORIO",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    clientId: "",
    deathRecordId: "",
    location: "",
    description: "",
    resourceIds: [] as string[],
  });

  useEffect(() => {
    loadEvents();
    loadResources();
    fetch("/api/clientes?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const clients = data.clients || data.data || [];
        setClientOptions(clients.map((c: any) => ({ value: c.id, label: c.name })));
      });
  }, [currentDate, viewMode]);

  async function loadEvents() {
    setLoading(true);
    try {
      const start = getRangeStart();
      const end = getRangeEnd();
      const params = new URLSearchParams();
      params.set("start", start.toISOString());
      params.set("end", end.toISOString());

      const res = await fetch(`/api/agenda?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadResources() {
    try {
      const res = await fetch("/api/agenda/recursos");
      const data = await res.json();
      setResources(data.resources || []);
    } catch (err) {
      console.error(err);
    }
  }

  function getRangeStart(): Date {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      return d;
    } else if (viewMode === "week") {
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getRangeEnd(): Date {
    const start = getRangeStart();
    const end = new Date(start);
    if (viewMode === "month") {
      end.setDate(end.getDate() + 41);
    } else if (viewMode === "week") {
      end.setDate(end.getDate() + 7);
    } else {
      end.setDate(end.getDate() + 1);
    }
    return end;
  }

  function openCreate(date?: Date) {
    setEditingEvent(null);
    const baseDate = date || new Date();
    const dateStr = baseDate.toISOString().slice(0, 10);
    setForm({
      title: "",
      type: "VELORIO",
      startDate: dateStr,
      startTime: "09:00",
      endDate: dateStr,
      endTime: "10:00",
      allDay: false,
      clientId: "",
      deathRecordId: "",
      location: "",
      description: "",
      resourceIds: [],
    });
    setSelectedDate(date || null);
    setShowForm(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(event);
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : null;
    setForm({
      title: event.title,
      type: event.type,
      startDate: start.toISOString().slice(0, 10),
      startTime: event.allDay ? "" : start.toTimeString().slice(0, 5),
      endDate: end ? end.toISOString().slice(0, 10) : "",
      endTime: end && !event.allDay ? end.toTimeString().slice(0, 5) : "",
      allDay: event.allDay,
      clientId: event.client?.id || "",
      deathRecordId: event.deathRecord?.id || "",
      location: event.location || "",
      description: event.description || "",
      resourceIds: event.resources.map((r) => r.resource.id),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const toastId = toastLoading(editingEvent ? "Atualizando..." : "Criando evento...");

    try {
      const startDateTime = form.allDay
        ? new Date(form.startDate)
        : new Date(`${form.startDate}T${form.startTime}`);
      const endDateTime = form.allDay
        ? form.endDate ? new Date(form.endDate) : null
        : form.endDate && form.endTime
          ? new Date(`${form.endDate}T${form.endTime}`)
          : null;

      const payload = {
        ...form,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString() || null,
      };

      const url = editingEvent ? `/api/agenda/${editingEvent.id}` : "/api/agenda";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        update(toastId, editingEvent ? "Evento atualizado!" : "Evento criado!", "success");
        setShowForm(false);
        loadEvents();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este evento?")) return;
    const toastId = toastLoading("Excluindo...");
    try {
      const res = await fetch(`/api/agenda/${id}`, { method: "DELETE" });
      if (res.ok) {
        update(toastId, "Evento excluído!", "success");
        loadEvents();
        setShowDetail(null);
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const start = getRangeStart();
    const days = [];
    for (let i = 0; i < (viewMode === "month" ? 42 : viewMode === "week" ? 7 : 1); i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate, viewMode]);

  function getEventsForDay(date: Date) {
    return events.filter((e) => {
      const start = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : start;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      return start <= dEnd && end >= d;
    });
  }

  function navigatePrev() {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }

  function navigateNext() {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  }

  function navigateToday() {
    setCurrentDate(new Date());
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isSameMonth = (d: Date) => d.getMonth() === currentDate.getMonth();

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={navigatePrev} className="p-1.5 hover:bg-white rounded-md transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={navigateToday} className="px-3 py-1.5 text-sm font-medium hover:bg-white rounded-md transition-colors">
              Hoje
            </button>
            <button onClick={navigateNext} className="p-1.5 hover:bg-white rounded-md transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            {viewMode === "month"
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : viewMode === "week"
                ? `Semana de ${calendarDays[0]?.toLocaleDateString("pt-BR")}`
                : currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === v ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-[#4a6fa5] text-white px-4 py-2 rounded-lg hover:bg-[#3d5a87] font-medium"
          >
            <Plus size={18} /> Novo Evento
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="px-3 py-2 text-xs font-medium text-gray-500 uppercase text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={idx}
                className={`border-b border-r border-gray-100 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isSameMonth(day) ? "bg-gray-50/50" : ""
                }`}
                onClick={() => openCreate(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(day)
                        ? "bg-[#4a6fa5] text-white"
                        : isSameMonth(day)
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-400">{dayEvents.length}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const typeConfig = EVENT_TYPES[event.type] || EVENT_TYPES.OUTRO;
                    return (
                      <div
                        key={event.id}
                        className="text-xs px-2 py-1 rounded-md truncate cursor-pointer font-medium"
                        style={{
                          backgroundColor: event.color || TYPE_COLORS[event.type] || "#e5e7eb",
                          color: "#fff",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetail(event);
                        }}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">+{dayEvents.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPES).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 text-sm text-gray-600">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[key] || "#9ca3af" }}
              />
              <Icon size={14} />
              {val.label}
            </div>
          );
        })}
      </div>

      {/* Modal: Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingEvent ? "Editar Evento" : "Novo Evento"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(EVENT_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Dia inteiro</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!form.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Início</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Término</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!form.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Término</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <SearchSelect
                  options={clientOptions}
                  value={form.clientId}
                  onChange={(val) => setForm({ ...form, clientId: val })}
                  placeholder="Vincular cliente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Capela A, Cemitério Municipal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recursos</label>
                <div className="flex flex-wrap gap-2">
                  {resources.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition-colors ${
                        form.resourceIds.includes(r.id)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.resourceIds.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, resourceIds: [...form.resourceIds, r.id] });
                          } else {
                            setForm({ ...form, resourceIds: form.resourceIds.filter((id) => id !== r.id) });
                          }
                        }}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3d5a87] font-medium"
                >
                  {editingEvent ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const tConfig = EVENT_TYPES[showDetail.type] || EVENT_TYPES.OUTRO;
                  const Icon = tConfig.icon;
                  return (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: showDetail.color || TYPE_COLORS[showDetail.type] || "#e5e7eb" }}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{showDetail.title}</h2>
                  <p className="text-sm text-gray-500">{STATUS_LABELS[showDetail.status] || showDetail.status}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarIcon size={16} />
                {new Date(showDetail.startDate).toLocaleDateString("pt-BR")}
                {showDetail.endDate && ` → ${new Date(showDetail.endDate).toLocaleDateString("pt-BR")}`}
              </div>

              {!showDetail.allDay && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  {new Date(showDetail.startDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {showDetail.endDate && ` - ${new Date(showDetail.endDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              )}

              {showDetail.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} /> {showDetail.location}
                </div>
              )}

              {showDetail.client && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} /> {showDetail.client.name}
                </div>
              )}

              {showDetail.deathRecord && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Cross size={16} /> {showDetail.deathRecord.deceasedName}
                </div>
              )}

              {showDetail.resources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {showDetail.resources.map((r) => (
                    <span key={r.resource.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {r.resource.name}
                    </span>
                  ))}
                </div>
              )}

              {showDetail.description && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{showDetail.description}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowDetail(null); openEdit(showDetail); }}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(showDetail.id)}
                  className="flex-1 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
