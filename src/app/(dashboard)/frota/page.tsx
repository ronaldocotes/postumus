"use client";

import { useEffect, useState } from "react";
import {
  Plus, Search, Edit, Trash2, X, Eye, Car, Fuel, Wrench, AlertTriangle,
  FileCheck, Users, Gauge, DollarSign, Calendar, MapPin, ClipboardList,
  ChevronDown, CheckCircle2, Clock, XCircle, TrendingUp
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Vehicle {
  id: string; plate: string; brand: string; model: string; year?: number;
  color?: string; type: string; chassis?: string; renavam?: string;
  mileage: number; status: string; acquisitionDate?: string; notes?: string;
  active: boolean; _count?: { fuelRecords: number; maintenances: number; tickets: number; documents: number };
}

interface Driver {
  id: string; name: string; cnh?: string; cnhCategory?: string; cnhExpiry?: string;
  phone?: string; email?: string; status: string; active: boolean;
  _count?: { tickets: number };
}

interface FuelRecord {
  id: string; vehicleId: string; date: string; liters: number; totalValue: number;
  mileage: number; fuelType: string; stationName?: string; notes?: string;
  vehicle?: { plate: string; brand: string; model: string };
}

interface Maintenance {
  id: string; vehicleId: string; date: string; type: string; description: string;
  cost?: number; workshop?: string; nextKm?: number; nextDate?: string;
  status: string; notes?: string;
  vehicle?: { plate: string; brand: string; model: string };
}

interface Ticket {
  id: string; vehicleId: string; driverId?: string; date: string; infraction: string;
  location?: string; value: number; points: number; dueDate?: string; paidAt?: string;
  status: string; notes?: string;
  vehicle?: { plate: string; brand: string; model: string };
  driver?: { name: string };
}

interface VehicleDocument {
  id: string; vehicleId: string; type: string; number?: string; issueDate?: string;
  expiryDate?: string; status: string; notes?: string;
  vehicle?: { plate: string; brand: string; model: string };
}

interface DashboardData {
  totalVehicles: number; activeVehicles: number; maintenanceVehicles: number;
  totalDrivers: number; activeDrivers: number; totalFuelCost: number;
  totalMaintenanceCost: number; totalTicketsValue: number; pendingTicketsValue: number;
  upcomingDocuments: number; recentFuelRecords: FuelRecord[]; recentMaintenances: Maintenance[];
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "veiculos", label: "Veículos", icon: Car },
  { id: "motoristas", label: "Motoristas", icon: Users },
  { id: "abastecimento", label: "Abastecimento", icon: Fuel },
  { id: "manutencao", label: "Manutenção", icon: Wrench },
  { id: "multas", label: "Multas", icon: AlertTriangle },
  { id: "documentos", label: "Documentos", icon: FileCheck },
];

const vehicleStatusLabels: Record<string, string> = {
  ACTIVE: "Ativo", INACTIVE: "Inativo", MAINTENANCE: "Em Manutenção", SOLD: "Vendido", SCRAPPED: "Sucata",
};
const vehicleStatusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800", INACTIVE: "bg-gray-100 text-gray-800",
  MAINTENANCE: "bg-amber-100 text-amber-800", SOLD: "bg-blue-100 text-blue-800", SCRAPPED: "bg-red-100 text-red-800",
};

const driverStatusLabels: Record<string, string> = { ACTIVE: "Ativo", INACTIVE: "Inativo", SUSPENDED: "Suspenso" };
const driverStatusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800", INACTIVE: "bg-gray-100 text-gray-800", SUSPENDED: "bg-red-100 text-red-800",
};

const maintenanceStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendada", IN_PROGRESS: "Em Andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada",
};
const maintenanceStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800", IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-100 text-red-800",
};

const ticketStatusLabels: Record<string, string> = { PENDING: "Pendente", PAID: "Paga", APPEALED: "Recorrida", CANCELLED: "Cancelada" };
const ticketStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800", PAID: "bg-emerald-100 text-emerald-800",
  APPEALED: "bg-blue-100 text-blue-800", CANCELLED: "bg-red-100 text-red-800",
};

const documentStatusLabels: Record<string, string> = { VALID: "Válido", EXPIRING: "Vencendo", EXPIRED: "Vencido" };
const documentStatusColors: Record<string, string> = {
  VALID: "bg-emerald-100 text-emerald-800", EXPIRING: "bg-amber-100 text-amber-800", EXPIRED: "bg-red-100 text-red-800",
};

const documentTypeLabels: Record<string, string> = {
  IPVA: "IPVA", LICENCIAMENTO: "Licenciamento", SEGURO: "Seguro", DPVAT: "DPVAT", CRLV: "CRLV", OUTRO: "Outro",
};

const fuelTypeLabels: Record<string, string> = {
  GASOLINA: "Gasolina", ETANOL: "Etanol", DIESEL: "Diesel", GNV: "GNV", FLEX: "Flex", ELETRICO: "Elétrico",
};

const maintenanceTypeLabels: Record<string, string> = {
  PREVENTIVA: "Preventiva", CORRETIVA: "Corretiva", TROCA_PECA: "Troça de Peça", REVISAO: "Revisão", OUTRO: "Outro",
};

const vehicleTypeLabels: Record<string, string> = {
  CARRO: "Carro", MOTO: "Moto", CAMINHAO: "Caminhão", VAN: "Van", ONIBUS: "Ônibus", UTILITARIO: "Utilitário", OUTRO: "Outro",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d?: string) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(d));
}

export default function FrotaPage() {
  const { success, error: toastError, loading: toastLoading, update, dismiss } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Lists
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);

  // Search & pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");

  // Modals
  const [modalType, setModalType] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [formLoading, setFormLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);

  // Loaders por aba
  useEffect(() => { if (activeTab === "dashboard") loadDashboard(); }, [activeTab]);
  useEffect(() => { if (activeTab === "veiculos") loadVehicles(); }, [activeTab, search, statusFilter]);
  useEffect(() => { if (activeTab === "motoristas") loadDrivers(); }, [activeTab, search, statusFilter]);
  useEffect(() => { if (activeTab === "abastecimento") loadFuelRecords(); }, [activeTab, vehicleFilter]);
  useEffect(() => { if (activeTab === "manutencao") loadMaintenances(); }, [activeTab, statusFilter, vehicleFilter]);
  useEffect(() => { if (activeTab === "multas") loadTickets(); }, [activeTab, statusFilter, vehicleFilter]);
  useEffect(() => { if (activeTab === "documentos") loadDocuments(); }, [activeTab, statusFilter, vehicleFilter]);

  async function loadDashboard() {
    try {
      const res = await fetch("/api/frota/dashboard");
      if (!res.ok) throw new Error("Erro ao carregar dashboard");
      const data = await res.json();
      setDashboard(data);
    } catch (e) { console.error(e); }
  }

  async function loadVehicles() {
    try {
      const params = new URLSearchParams({ search, page: "1", limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/frota/veiculos?${params}`);
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setVehicles(data.vehicles || []);
    } catch (e) { console.error(e); }
  }

  async function loadDrivers() {
    try {
      const params = new URLSearchParams({ search, page: "1", limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/frota/motoristas?${params}`);
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch (e) { console.error(e); }
  }

  async function loadFuelRecords() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (vehicleFilter) params.set("vehicleId", vehicleFilter);
      const res = await fetch(`/api/frota/abastecimentos?${params}`);
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setFuelRecords(data.records || []);
    } catch (e) { console.error(e); }
  }

  async function loadMaintenances() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (vehicleFilter) params.set("vehicleId", vehicleFilter);
      const res = await fetch(`/api/frota/manutencoes?${params}`);
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setMaintenances(data.records || []);
    } catch (e) { console.error(e); }
  }

  async function loadTickets() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (vehicleFilter) params.set("vehicleId", vehicleFilter);
      const res = await fetch(`/api/frota/multas?${params}`);
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setTickets(data.records || []);
    } catch (e) { console.error(e); }
  }

  async function loadDocuments() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (vehicleFilter) params.set("vehicleId", vehicleFilter);
      const res = await fetch(`/api/frota/documentos?${params}`);
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setDocuments(data.records || []);
    } catch (e) { console.error(e); }
  }

  function openModal(type: string, item?: any) {
    setModalType(type);
    setEditId(item?.id || null);
    if (type === "vehicle") {
      setForm(item ? { ...item, acquisitionDate: item.acquisitionDate ? item.acquisitionDate.split("T")[0] : "" } : { plate: "", brand: "", model: "", year: "", color: "", type: "CARRO", chassis: "", renavam: "", mileage: 0, status: "ACTIVE", notes: "" });
    } else if (type === "driver") {
      setForm(item ? { ...item, cnhExpiry: item.cnhExpiry ? item.cnhExpiry.split("T")[0] : "" } : { name: "", cnh: "", cnhCategory: "", cnhExpiry: "", phone: "", email: "", status: "ACTIVE" });
    } else if (type === "fuel") {
      setForm(item ? { ...item, date: item.date ? item.date.split("T")[0] : "" } : { vehicleId: vehicleFilter || "", date: new Date().toISOString().split("T")[0], liters: "", totalValue: "", mileage: "", fuelType: "GASOLINA", stationName: "", notes: "" });
    } else if (type === "maintenance") {
      setForm(item ? { ...item, date: item.date ? item.date.split("T")[0] : "", nextDate: item.nextDate ? item.nextDate.split("T")[0] : "" } : { vehicleId: vehicleFilter || "", date: new Date().toISOString().split("T")[0], type: "PREVENTIVA", description: "", cost: "", workshop: "", nextKm: "", nextDate: "", status: "COMPLETED", notes: "" });
    } else if (type === "ticket") {
      setForm(item ? { ...item, date: item.date ? item.date.split("T")[0] : "", dueDate: item.dueDate ? item.dueDate.split("T")[0] : "", paidAt: item.paidAt ? item.paidAt.split("T")[0] : "" } : { vehicleId: vehicleFilter || "", driverId: "", date: new Date().toISOString().split("T")[0], infraction: "", location: "", value: "", points: 0, dueDate: "", status: "PENDING", notes: "" });
    } else if (type === "document") {
      setForm(item ? { ...item, issueDate: item.issueDate ? item.issueDate.split("T")[0] : "", expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "" } : { vehicleId: vehicleFilter || "", type: "IPVA", number: "", issueDate: "", expiryDate: "", status: "VALID", notes: "" });
    }
  }

  function closeModal() {
    setModalType(null);
    setEditId(null);
    setForm({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const toastId = toastLoading(editId ? "Atualizando..." : "Salvando...");

    let url = "";
    let method = editId ? "PUT" : "POST";
    let body = { ...form };

    // Convert numeric fields
    if (body.year) body.year = parseInt(body.year);
    if (body.mileage !== undefined) body.mileage = parseInt(body.mileage) || 0;
    if (body.liters) body.liters = parseFloat(body.liters);
    if (body.totalValue) body.totalValue = parseFloat(body.totalValue);
    if (body.cost) body.cost = parseFloat(body.cost);
    if (body.nextKm) body.nextKm = parseInt(body.nextKm);
    if (body.value) body.value = parseFloat(body.value);
    if (body.points !== undefined) body.points = parseInt(body.points) || 0;

    if (modalType === "vehicle") url = editId ? `/api/frota/veiculos/${editId}` : "/api/frota/veiculos";
    else if (modalType === "driver") url = editId ? `/api/frota/motoristas/${editId}` : "/api/frota/motoristas";
    else if (modalType === "fuel") url = editId ? `/api/frota/abastecimentos/${editId}` : "/api/frota/abastecimentos";
    else if (modalType === "maintenance") url = editId ? `/api/frota/manutencoes/${editId}` : "/api/frota/manutencoes";
    else if (modalType === "ticket") url = editId ? `/api/frota/multas/${editId}` : "/api/frota/multas";
    else if (modalType === "document") url = editId ? `/api/frota/documentos/${editId}` : "/api/frota/documentos";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        closeModal();
        if (activeTab === "veiculos") loadVehicles();
        if (activeTab === "motoristas") loadDrivers();
        if (activeTab === "abastecimento") loadFuelRecords();
        if (activeTab === "manutencao") loadMaintenances();
        if (activeTab === "multas") loadTickets();
        if (activeTab === "documentos") loadDocuments();
        if (activeTab === "dashboard") loadDashboard();
        update(toastId, editId ? "Atualizado com sucesso!" : "Criado com sucesso!", "success");
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro ao salvar", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
    setFormLoading(false);
  }

  async function handleDelete(type: string, id: string) {
    if (!confirm("Deseja realmente remover este registro?")) return;
    const toastId = toastLoading("Removendo...");
    let url = "";
    if (type === "vehicle") url = `/api/frota/veiculos/${id}`;
    else if (type === "driver") url = `/api/frota/motoristas/${id}`;
    else if (type === "fuel") url = `/api/frota/abastecimentos/${id}`;
    else if (type === "maintenance") url = `/api/frota/manutencoes/${id}`;
    else if (type === "ticket") url = `/api/frota/multas/${id}`;
    else if (type === "document") url = `/api/frota/documentos/${id}`;

    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        if (activeTab === "veiculos") loadVehicles();
        if (activeTab === "motoristas") loadDrivers();
        if (activeTab === "abastecimento") loadFuelRecords();
        if (activeTab === "manutencao") loadMaintenances();
        if (activeTab === "multas") loadTickets();
        if (activeTab === "documentos") loadDocuments();
        if (activeTab === "dashboard") loadDashboard();
        update(toastId, "Removido com sucesso!", "success");
      } else {
        update(toastId, "Erro ao remover", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDetail(type: string, id: string) {
    let url = "";
    if (type === "vehicle") url = `/api/frota/veiculos/${id}`;
    else if (type === "driver") url = `/api/frota/motoristas/${id}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setDetailItem(data);
    } catch {}
  }

  // ---------- RENDER ----------
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Frota</h1>
          <p className="text-sm text-gray-600">Gerencie veículos, motoristas, abastecimento, manutenção e multas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); setStatusFilter(""); setVehicleFilter(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-[#4a6fa5] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-[#d4e4f7] hover:text-[#4a6fa5]"
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Veículos Ativos</span>
                <Car size={20} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.activeVehicles} <span className="text-sm font-normal text-gray-500">/ {dashboard.totalVehicles}</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Motoristas Ativos</span>
                <Users size={20} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.activeDrivers} <span className="text-sm font-normal text-gray-500">/ {dashboard.totalDrivers}</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Em Manutenção</span>
                <Wrench size={20} className="text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.maintenanceVehicles}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Documentos Vencendo</span>
                <FileCheck size={20} className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.upcomingDocuments}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Abastecimento</span>
                <Fuel size={20} className="text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.totalFuelCost)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Manutenção</span>
                <Wrench size={20} className="text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.totalMaintenanceCost)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Multas Pendentes</span>
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.pendingTicketsValue)}</div>
              <div className="text-xs text-gray-500 mt-1">Total: {formatCurrency(dashboard.totalTicketsValue)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Fuel size={16} /> Últimos Abastecimentos</h3>
              {dashboard.recentFuelRecords.length === 0 && <p className="text-sm text-gray-500">Nenhum registro</p>}
              <div className="space-y-3">
                {dashboard.recentFuelRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.vehicle?.plate} - {r.vehicle?.brand} {r.vehicle?.model}</p>
                      <p className="text-xs text-gray-500">{formatDate(r.date)} • {r.liters}L • {fuelTypeLabels[r.fuelType]}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(r.totalValue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Wrench size={16} /> Últimas Manutenções</h3>
              {dashboard.recentMaintenances.length === 0 && <p className="text-sm text-gray-500">Nenhum registro</p>}
              <div className="space-y-3">
                {dashboard.recentMaintenances.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.vehicle?.plate} - {m.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(m.date)} • {maintenanceTypeLabels[m.type]}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{m.cost ? formatCurrency(m.cost) : "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VEÍCULOS */}
      {activeTab === "veiculos" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar por placa, marca, modelo..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="MAINTENANCE">Em Manutenção</option>
              <option value="SOLD">Vendido</option>
              <option value="SCRAPPED">Sucata</option>
            </select>
            <button onClick={() => openModal("vehicle")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Novo Veículo
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Placa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Veículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Ano</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Km</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-[#d4e4f7]">
                    <td className="px-4 py-3 font-semibold text-gray-900">{v.plate}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{v.brand} {v.model}</div>
                      <div className="text-xs text-gray-500">{vehicleTypeLabels[v.type]} {v.color ? `• ${v.color}` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.year || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{v.mileage.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicleStatusColors[v.status] || "bg-gray-100 text-gray-800"}`}>
                        {vehicleStatusLabels[v.status] || v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => handleDetail("vehicle", v.id)} className="text-emerald-600 hover:text-emerald-800" title="Visualizar"><Eye size={16} /></button>
                      <button onClick={() => openModal("vehicle", v)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete("vehicle", v.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum veículo encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOTORISTAS */}
      {activeTab === "motoristas" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar por nome, CNH..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="SUSPENDED">Suspenso</option>
            </select>
            <button onClick={() => openModal("driver")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Novo Motorista
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">CNH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Vencimento CNH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-[#d4e4f7]">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.cnh || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{d.cnhCategory || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(d.cnhExpiry)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${driverStatusColors[d.status] || "bg-gray-100 text-gray-800"}`}>
                        {driverStatusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => openModal("driver", d)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete("driver", d.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum motorista encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABASTECIMENTO */}
      {activeTab === "abastecimento" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none flex-1">
              <option value="">Todos os veículos</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
            </select>
            <button onClick={() => openModal("fuel")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Novo Abastecimento
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Veículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Km</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Litros</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Valor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fuelRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#d4e4f7]">
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.vehicle?.plate} - {r.vehicle?.brand} {r.vehicle?.model}</td>
                    <td className="px-4 py-3 text-gray-600">{r.mileage.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-gray-600">{r.liters}L</td>
                    <td className="px-4 py-3 text-gray-600">{fuelTypeLabels[r.fuelType]}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(r.totalValue)}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => openModal("fuel", r)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete("fuel", r.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {fuelRecords.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum registro encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANUTENÇÃO */}
      {activeTab === "manutencao" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none flex-1">
              <option value="">Todos os veículos</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
              <option value="">Todos os status</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
            <button onClick={() => openModal("maintenance")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Nova Manutenção
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Veículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Oficina</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Custo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-[#d4e4f7]">
                    <td className="px-4 py-3 text-gray-600">{formatDate(m.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.vehicle?.plate} - {m.vehicle?.brand} {m.vehicle?.model}</td>
                    <td className="px-4 py-3 text-gray-600">{maintenanceTypeLabels[m.type]}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{m.description}</td>
                    <td className="px-4 py-3 text-gray-600">{m.workshop || "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{m.cost ? formatCurrency(m.cost) : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${maintenanceStatusColors[m.status] || "bg-gray-100 text-gray-800"}`}>
                        {maintenanceStatusLabels[m.status] || m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => openModal("maintenance", m)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete("maintenance", m.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {maintenances.length === 0 && <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum registro encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MULTAS */}
      {activeTab === "multas" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none flex-1">
              <option value="">Todos os veículos</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Paga</option>
              <option value="APPEALED">Recorrida</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
            <button onClick={() => openModal("ticket")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Nova Multa
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Veículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Infração</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Local</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Pontos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#d4e4f7]">
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.vehicle?.plate} - {t.vehicle?.brand} {t.vehicle?.model}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.infraction}</td>
                    <td className="px-4 py-3 text-gray-600">{t.location || "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(t.value)}</td>
                    <td className="px-4 py-3 text-gray-600">{t.points}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticketStatusColors[t.status] || "bg-gray-100 text-gray-800"}`}>
                        {ticketStatusLabels[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => openModal("ticket", t)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete("ticket", t.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum registro encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENTOS */}
      {activeTab === "documentos" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none flex-1">
              <option value="">Todos os veículos</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
              <option value="">Todos os status</option>
              <option value="VALID">Válido</option>
              <option value="EXPIRING">Vencendo</option>
              <option value="EXPIRED">Vencido</option>
            </select>
            <button onClick={() => openModal("document")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Novo Documento
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Veículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Emissão</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-[#d4e4f7]">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.vehicle?.plate} - {d.vehicle?.brand} {d.vehicle?.model}</td>
                    <td className="px-4 py-3 text-gray-600">{documentTypeLabels[d.type]}</td>
                    <td className="px-4 py-3 text-gray-600">{d.number || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(d.issueDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(d.expiryDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${documentStatusColors[d.status] || "bg-gray-100 text-gray-800"}`}>
                        {documentStatusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => openModal("document", d)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete("document", d.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum registro encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (Vehicle / Driver) */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#4a6fa5]">{detailItem.plate || detailItem.name}</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(detailItem).map(([k, v]) => {
                if (k === "id" || k === "createdAt" || k === "updatedAt" || k === "active" || k === "_count" || Array.isArray(v)) return null;
                return (
                  <div key={k}>
                    <span className="text-[#4a6fa5] font-medium capitalize">{k}:</span>{" "}
                    <span className="text-gray-900">{typeof v === "string" && v.includes("T") ? formatDate(v) : String(v || "-")}</span>
                  </div>
                );
              })}
            </div>
            {/* Sub lists */}
            {detailItem.fuelRecords && detailItem.fuelRecords.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-[#4a6fa5] mb-2">Abastecimentos ({detailItem.fuelRecords.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-40 overflow-y-auto">
                  {detailItem.fuelRecords.map((r: any) => (
                    <div key={r.id} className="flex justify-between py-1 border-b border-gray-200 last:border-0 text-sm">
                      <span>{formatDate(r.date)} - {r.liters}L</span>
                      <span className="font-medium">{formatCurrency(r.totalValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailItem.maintenances && detailItem.maintenances.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-[#4a6fa5] mb-2">Manutenções ({detailItem.maintenances.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-40 overflow-y-auto">
                  {detailItem.maintenances.map((m: any) => (
                    <div key={m.id} className="flex justify-between py-1 border-b border-gray-200 last:border-0 text-sm">
                      <span>{formatDate(m.date)} - {m.description}</span>
                      <span className="font-medium">{m.cost ? formatCurrency(m.cost) : "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailItem.tickets && detailItem.tickets.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-[#4a6fa5] mb-2">Multas ({detailItem.tickets.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-40 overflow-y-auto">
                  {detailItem.tickets.map((t: any) => (
                    <div key={t.id} className="flex justify-between py-1 border-b border-gray-200 last:border-0 text-sm">
                      <span>{formatDate(t.date)} - {t.infraction}</span>
                      <span className="font-medium">{formatCurrency(t.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-200 shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Editar" : "Novo"}{" "}
                {modalType === "vehicle" ? "Veículo" : modalType === "driver" ? "Motorista" : modalType === "fuel" ? "Abastecimento" : modalType === "maintenance" ? "Manutenção" : modalType === "ticket" ? "Multa" : "Documento"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {/* Vehicle Form */}
              {modalType === "vehicle" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Placa *</label><input required name="plate" value={form.plate || ""} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label><input required name="brand" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label><input required name="model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Ano</label><input type="number" name="year" value={form.year || ""} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Cor</label><input name="color" value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select name="type" value={form.type || "CARRO"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(vehicleTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Chassi</label><input name="chassis" value={form.chassis || ""} onChange={(e) => setForm({ ...form, chassis: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Renavam</label><input name="renavam" value={form.renavam || ""} onChange={(e) => setForm({ ...form, renavam: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Quilometragem</label><input type="number" name="mileage" value={form.mileage || 0} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={form.status || "ACTIVE"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(vehicleStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Aquisição</label><input type="date" name="acquisitionDate" value={form.acquisitionDate || ""} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea name="notes" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              )}

              {/* Driver Form */}
              {modalType === "driver" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input required name="name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">CNH</label><input name="cnh" value={form.cnh || ""} onChange={(e) => setForm({ ...form, cnh: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label><input name="cnhCategory" value={form.cnhCategory || ""} onChange={(e) => setForm({ ...form, cnhCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Vencimento CNH</label><input type="date" name="cnhExpiry" value={form.cnhExpiry || ""} onChange={(e) => setForm({ ...form, cnhExpiry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input name="phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={form.status || "ACTIVE"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(driverStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Fuel Form */}
              {modalType === "fuel" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
                    <select required value={form.vehicleId || ""} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data *</label><input required type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Litros *</label><input required type="number" step="0.01" value={form.liters || ""} onChange={(e) => setForm({ ...form, liters: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Total *</label><input required type="number" step="0.01" value={form.totalValue || ""} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Quilometragem *</label><input required type="number" value={form.mileage || ""} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo Combustível</label>
                    <select value={form.fuelType || "GASOLINA"} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(fuelTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Posto</label><input value={form.stationName || ""} onChange={(e) => setForm({ ...form, stationName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              )}

              {/* Maintenance Form */}
              {modalType === "maintenance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
                    <select required value={form.vehicleId || ""} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data *</label><input required type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={form.type || "PREVENTIVA"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(maintenanceTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label><input required value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Custo</label><input type="number" step="0.01" value={form.cost || ""} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Oficina</label><input value={form.workshop || ""} onChange={(e) => setForm({ ...form, workshop: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Próxima Km</label><input type="number" value={form.nextKm || ""} onChange={(e) => setForm({ ...form, nextKm: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Próxima Data</label><input type="date" value={form.nextDate || ""} onChange={(e) => setForm({ ...form, nextDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status || "COMPLETED"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(maintenanceStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              )}

              {/* Ticket Form */}
              {modalType === "ticket" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
                    <select required value={form.vehicleId || ""} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
                    <select value={form.driverId || ""} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione</option>
                      {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data *</label><input required type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Infração *</label><input required value={form.infraction || ""} onChange={(e) => setForm({ ...form, infraction: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Local</label><input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label><input required type="number" step="0.01" value={form.value || ""} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Pontos</label><input type="number" value={form.points || 0} onChange={(e) => setForm({ ...form, points: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label><input type="date" value={form.dueDate || ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status || "PENDING"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(ticketStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  {form.status === "PAID" && (
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Pagamento</label><input type="date" value={form.paidAt || ""} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  )}
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              )}

              {/* Document Form */}
              {modalType === "document" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
                    <select required value={form.vehicleId || ""} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                    <select required value={form.type || "IPVA"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(documentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Número</label><input value={form.number || ""} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Emissão</label><input type="date" value={form.issueDate || ""} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento</label><input type="date" value={form.expiryDate || ""} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status || "VALID"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(documentStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{formLoading ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
