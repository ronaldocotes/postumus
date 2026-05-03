"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Eye,
  Cross,
  Clock,
  Truck,
  Church,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Phone,
  User,
  FileText,
  Filter,
} from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface DeathRecord {
  id: string;
  deceasedName: string;
  dateOfDeath: string;
  timeOfDeath: string | null;
  placeOfDeath: string;
  placeName: string | null;
  status: string;
  responsibleName: string;
  responsiblePhone: string | null;
  createdAt: string;
  client: { id: string; name: string } | null;
  createdBy: { name: string };
  _count: { services: number; history: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  LIBERACAO_PENDENTE: { label: "Liberação Pendente", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  EM_TRASLADO: { label: "Em Traslado", color: "bg-blue-100 text-blue-700", icon: Truck },
  VELORIO: { label: "Velório", color: "bg-purple-100 text-purple-700", icon: Church },
  SEPULTAMENTO: { label: "Sepultamento", color: "bg-amber-100 text-amber-700", icon: Cross },
  CREMACAO: { label: "Cremação", color: "bg-orange-100 text-orange-700", icon: Cross },
  CONCLUIDO: { label: "Concluído", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELADO: { label: "Cancelado", color: "bg-gray-100 text-gray-600", icon: X },
};

const PLACE_LABELS: Record<string, string> = {
  HOSPITAL: "Hospital",
  RESIDENCIA: "Residência",
  ACIDENTE: "Acidente",
  OUTRO: "Outro",
};

export default function ObitosPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [records, setRecords] = useState<DeathRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DeathRecord | null>(null);
  const [showDetail, setShowDetail] = useState<any>(null);

  const [clientOptions, setClientOptions] = useState<{ value: string; label: string; sub?: string }[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    deceasedName: "",
    deceasedBirthDate: "",
    deceasedCpf: "",
    deceasedRg: "",
    dateOfDeath: new Date().toISOString().slice(0, 10),
    timeOfDeath: "",
    placeOfDeath: "HOSPITAL",
    placeName: "",
    deathCertificate: "",
    causeOfDeath: "",
    doctorName: "",
    doctorCrm: "",
    responsibleName: "",
    responsiblePhone: "",
    responsibleRelation: "",
    notes: "",
  });

  useEffect(() => {
    loadRecords();
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetch("/api/clientes?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const clients = data.clients || data.data || [];
        setClientOptions(clients.map((c: any) => ({ value: c.id, label: c.name, sub: c.cpf || undefined })));
      });
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/obitos?${params}`);
      const data = await res.json();
      setRecords(data.records || []);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingRecord(null);
    setForm({
      clientId: "",
      deceasedName: "",
      deceasedBirthDate: "",
      deceasedCpf: "",
      deceasedRg: "",
      dateOfDeath: new Date().toISOString().slice(0, 10),
      timeOfDeath: "",
      placeOfDeath: "HOSPITAL",
      placeName: "",
      deathCertificate: "",
      causeOfDeath: "",
      doctorName: "",
      doctorCrm: "",
      responsibleName: "",
      responsiblePhone: "",
      responsibleRelation: "",
      notes: "",
    });
    setShowForm(true);
  }

  function openEdit(record: DeathRecord) {
    setEditingRecord(record);
    // Carregar detalhes completos para edição
    fetch(`/api/obitos/${record.id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          clientId: data.clientId || "",
          deceasedName: data.deceasedName,
          deceasedBirthDate: data.deceasedBirthDate ? data.deceasedBirthDate.slice(0, 10) : "",
          deceasedCpf: data.deceasedCpf || "",
          deceasedRg: data.deceasedRg || "",
          dateOfDeath: data.dateOfDeath.slice(0, 10),
          timeOfDeath: data.timeOfDeath || "",
          placeOfDeath: data.placeOfDeath,
          placeName: data.placeName || "",
          deathCertificate: data.deathCertificate || "",
          causeOfDeath: data.causeOfDeath || "",
          doctorName: data.doctorName || "",
          doctorCrm: data.doctorCrm || "",
          responsibleName: data.responsibleName,
          responsiblePhone: data.responsiblePhone || "",
          responsibleRelation: data.responsibleRelation || "",
          notes: data.notes || "",
        });
        setShowForm(true);
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const toastId = toastLoading(editingRecord ? "Atualizando..." : "Registrando óbito...");

    try {
      const url = editingRecord ? `/api/obitos/${editingRecord.id}` : "/api/obitos";
      const method = editingRecord ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        update(toastId, editingRecord ? "Registro atualizado!" : "Óbito registrado!", "success");
        setShowForm(false);
        loadRecords();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este registro?")) return;
    const toastId = toastLoading("Excluindo...");
    try {
      const res = await fetch(`/api/obitos/${id}`, { method: "DELETE" });
      if (res.ok) {
        update(toastId, "Registro excluído!", "success");
        loadRecords();
        if (showDetail?.id === id) setShowDetail(null);
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDetail(id: string) {
    const res = await fetch(`/api/obitos/${id}`);
    const data = await res.json();
    setShowDetail(data);
  }

  async function updateStatus(id: string, newStatus: string) {
    const toastId = toastLoading("Atualizando status...");
    try {
      const res = await fetch(`/api/obitos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        update(toastId, "Status atualizado!", "success");
        loadRecords();
        if (showDetail?.id === id) {
          const updated = await res.json();
          setShowDetail(updated);
        }
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Óbitos</h1>
          <p className="text-gray-500 mt-1">Acompanhamento do atendimento funerário</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
        >
          <Plus size={18} /> Registrar Óbito
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, responsável, certidão..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Falecido</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Local</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registrado</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Carregando...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Cross size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Nenhum registro encontrado</p>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const sInfo = STATUS_CONFIG[record.status] || STATUS_CONFIG.LIBERACAO_PENDENTE;
                  const StatusIcon = sInfo.icon;
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{record.deceasedName}</div>
                        {record.client && (
                          <div className="text-xs text-gray-500">Contratante: {record.client.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {fmtDate(record.dateOfDeath)}
                        </div>
                        {record.timeOfDeath && (
                          <div className="text-xs text-gray-500">{record.timeOfDeath}h</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{PLACE_LABELS[record.placeOfDeath] || record.placeOfDeath}</div>
                        {record.placeName && <div className="text-xs text-gray-500">{record.placeName}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sInfo.color}`}>
                          <StatusIcon size={12} /> {sInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{record.responsibleName}</div>
                        {record.responsiblePhone && <div className="text-xs text-gray-500">{record.responsiblePhone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {fmtDate(record.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDetail(record.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(record)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page} de {pages}</span>
            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal: Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingRecord ? "Editar Registro" : "Registrar Óbito"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contratante (Cliente com plano)</label>
                  <SearchSelect
                    options={clientOptions}
                    value={form.clientId}
                    onChange={(val) => setForm({ ...form, clientId: val })}
                    placeholder="Buscar cliente..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Falecido *</label>
                  <input
                    required
                    value={form.deceasedName}
                    onChange={(e) => setForm({ ...form, deceasedName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={form.deceasedBirthDate}
                    onChange={(e) => setForm({ ...form, deceasedBirthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input
                    value={form.deceasedCpf}
                    onChange={(e) => setForm({ ...form, deceasedCpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Óbito *</label>
                  <input
                    type="date"
                    required
                    value={form.dateOfDeath}
                    onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora do Óbito</label>
                  <input
                    type="time"
                    value={form.timeOfDeath}
                    onChange={(e) => setForm({ ...form, timeOfDeath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local do Óbito</label>
                  <select
                    value={form.placeOfDeath}
                    onChange={(e) => setForm({ ...form, placeOfDeath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="RESIDENCIA">Residência</option>
                    <option value="ACIDENTE">Acidente</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Local</label>
                  <input
                    value={form.placeName}
                    onChange={(e) => setForm({ ...form, placeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Hospital São Lucas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certidão de Óbito</label>
                  <input
                    value={form.deathCertificate}
                    onChange={(e) => setForm({ ...form, deathCertificate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Causa da Morte</label>
                  <input
                    value={form.causeOfDeath}
                    onChange={(e) => setForm({ ...form, causeOfDeath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
                  <input
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CRM</label>
                  <input
                    value={form.doctorCrm}
                    onChange={(e) => setForm({ ...form, doctorCrm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Responsável pelo Atendimento</h4>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    required
                    value={form.responsibleName}
                    onChange={(e) => setForm({ ...form, responsibleName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    value={form.responsiblePhone}
                    onChange={(e) => setForm({ ...form, responsiblePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                  <input
                    value={form.responsibleRelation}
                    onChange={(e) => setForm({ ...form, responsibleRelation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Filho, Cônjuge"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  {editingRecord ? "Salvar Alterações" : "Registrar Óbito"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ficha de Atendimento</h2>
                <p className="text-sm text-gray-500">#{showDetail.id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const sInfo = STATUS_CONFIG[showDetail.status] || STATUS_CONFIG.LIBERACAO_PENDENTE;
                    const StatusIcon = sInfo.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sInfo.color}`}>
                        <StatusIcon size={14} /> {sInfo.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex gap-1">
                  {showDetail.status !== "CONCLUIDO" && showDetail.status !== "CANCELADO" && (
                    <>
                      <button
                        onClick={() => {
                          const nextStatus: Record<string, string> = {
                            LIBERACAO_PENDENTE: "EM_TRASLADO",
                            EM_TRASLADO: "VELORIO",
                            VELORIO: "SEPULTAMENTO",
                            SEPULTAMENTO: "CONCLUIDO",
                            CREMACAO: "CONCLUIDO",
                          };
                          if (nextStatus[showDetail.status]) {
                            updateStatus(showDetail.id, nextStatus[showDetail.status]);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                      >
                        Avançar Status
                      </button>
                      <button
                        onClick={() => updateStatus(showDetail.id, "CANCELADO")}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Dados do Falecido */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Cross size={16} className="text-gray-500" /> Dados do Falecido
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{showDetail.deceasedName}</span></div>
                  {showDetail.deceasedBirthDate && <div><span className="text-gray-500">Nascimento:</span> {fmtDate(showDetail.deceasedBirthDate)}</div>}
                  {showDetail.deceasedCpf && <div><span className="text-gray-500">CPF:</span> {showDetail.deceasedCpf}</div>}
                  {showDetail.deceasedRg && <div><span className="text-gray-500">RG:</span> {showDetail.deceasedRg}</div>}
                  <div><span className="text-gray-500">Data do Óbito:</span> {fmtDate(showDetail.dateOfDeath)} {showDetail.timeOfDeath && `às ${showDetail.timeOfDeath}`}</div>
                  <div><span className="text-gray-500">Local:</span> {PLACE_LABELS[showDetail.placeOfDeath]} {showDetail.placeName && `- ${showDetail.placeName}`}</div>
                  {showDetail.deathCertificate && <div><span className="text-gray-500">Certidão:</span> {showDetail.deathCertificate}</div>}
                  {showDetail.causeOfDeath && <div><span className="text-gray-500">Causa:</span> {showDetail.causeOfDeath}</div>}
                  {showDetail.doctorName && <div><span className="text-gray-500">Médico:</span> {showDetail.doctorName} {showDetail.doctorCrm && `(CRM: ${showDetail.doctorCrm})`}</div>}
                </div>
              </div>

              {/* Responsável */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={16} className="text-gray-500" /> Responsável
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{showDetail.responsibleName}</span></div>
                  {showDetail.responsiblePhone && <div><span className="text-gray-500">Telefone:</span> {showDetail.responsiblePhone}</div>}
                  {showDetail.responsibleRelation && <div><span className="text-gray-500">Parentesco:</span> {showDetail.responsibleRelation}</div>}
                </div>
              </div>

              {/* Contratante */}
              {showDetail.client && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Contratante do Plano
                  </h3>
                  <p className="text-sm text-blue-800">
                    <strong>{showDetail.client.name}</strong>
                    {showDetail.client.cpf && ` - CPF: ${showDetail.client.cpf}`}
                  </p>
                </div>
              )}

              {/* Serviços */}
              {showDetail.services?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Serviços Utilizados</h3>
                  <div className="space-y-1">
                    {showDetail.services.map((s: any) => (
                      <div key={s.id} className="flex justify-between text-sm">
                        <span>{s.quantity}x {s.name}</span>
                        <span className="font-medium">
                          {s.isPlanCovered ? "Coberto" : `R$ ${s.totalPrice.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico */}
              {showDetail.history?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Histórico</h3>
                  <div className="space-y-2">
                    {showDetail.history.map((h: any) => (
                      <div key={h.id} className="text-sm border-l-2 border-gray-300 pl-3">
                        <p className="font-medium text-gray-700">{h.action}</p>
                        {h.oldValue && h.newValue && (
                          <p className="text-gray-500">{h.oldValue} → {h.newValue}</p>
                        )}
                        {h.notes && <p className="text-gray-500">{h.notes}</p>}
                        <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showDetail.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 uppercase font-medium mb-1">Observações</p>
                  <p className="text-sm text-yellow-800">{showDetail.notes}</p>
                </div>
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
