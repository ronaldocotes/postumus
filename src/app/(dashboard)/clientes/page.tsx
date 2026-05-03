"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Eye, Users, MapPin, FileText, CreditCard, IdCard, Shield } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/components/ui/Toast";
import { estados, cidadesPorEstado, bairrosPorCidade, estadosCivis, getCidades, getBairros } from "@/lib/location-data";
import PaymentModal from "@/components/carnes/PaymentModal";
import ClientCard from "@/components/clientes/ClientCard";

interface Client {
  id: string;
  code?: string;
  name: string;
  cpf?: string;
  phone?: string;
  cellphone?: string;
  city?: string;
  neighborhood?: string;
  status: string;
  dueDay?: number;
  paymentLocation?: string;
  isAssured?: boolean;
  _count?: { dependents: number };
  hasActiveCarne?: boolean;
}

const statusLabels: Record<string, string> = { ACTIVE: "Ativo", CANCELLED: "Cancelado", SUSPENDED: "Suspenso" };
const statusColors: Record<string, string> = { ACTIVE: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-100 text-red-800", SUSPENDED: "bg-amber-100 text-amber-800" };

const emptyForm: any = {
  name: "", cpf: "", rg: "", phone: "", cellphone: "", email: "",
  address: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
  civilStatus: "", profession: "", workplace: "", fatherName: "", motherName: "", spouseName: "",
  dueDay: "10", paymentLocation: "RESIDENCIA", notes: "", isAssured: false,
  billingAddressSame: true, billingAddress: "", billingNumber: "", billingComplement: "",
  billingNeighborhood: "", billingCity: "", billingState: "", billingZipCode: "", billingReference: "",
  dependents: [],
};

export default function ClientesPage() {
  const { success, error, loading: toastLoading, update, dismiss } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showDependents, setShowDependents] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [dependents, setDependents] = useState<any[]>([]);
  const [newDependent, setNewDependent] = useState({ name: "", relationship: "OUTRO", cpf: "", phone: "", birthDate: "" });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [selectedCarne, setSelectedCarne] = useState<any>(null);
  const [pixData, setPixData] = useState<any>(null);
  
  // Client card state
  const [showCard, setShowCard] = useState(false);
  const [cardClient, setCardClient] = useState<any>(null);
  
  // Geolocalização
  const { cidade: geoCidade, estado: geoEstado, loading: geoLoading } = useGeolocation();
  
  // Estados para dropdowns
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);
  
  // Atualizar cidades quando estado mudar
  useEffect(() => {
    if (form.state) {
      const cidades = getCidades(form.state);
      setCidadesDisponiveis(cidades);
      // Se a cidade atual não estiver na lista, limpar
      if (form.city && !cidades.includes(form.city)) {
        setForm((prev: any) => ({ ...prev, city: "", neighborhood: "" }));
        setBairrosDisponiveis([]);
      }
    } else {
      setCidadesDisponiveis([]);
    }
  }, [form.state]);
  
  // Atualizar bairros quando cidade mudar
  useEffect(() => {
    if (form.city) {
      const bairros = getBairros(form.city);
      setBairrosDisponiveis(bairros);
      // Se o bairro atual não estiver na lista, limpar
      if (form.neighborhood && !bairros.includes(form.neighborhood)) {
        setForm((prev: any) => ({ ...prev, neighborhood: "" }));
      }
    } else {
      setBairrosDisponiveis([]);
    }
  }, [form.city]);
  
  // Preencher cidade via geolocalização quando disponível
  useEffect(() => {
    if (geoCidade && !form.city && !editId) {
      // Verificar se a cidade está na lista de cidades do estado
      const estadoSigla = geoEstado === "Amapá" ? "AP" : geoEstado === "Pará" ? "PA" : "AP";
      setForm((prev: any) => ({ ...prev, city: geoCidade, state: estadoSigla }));
    }
  }, [geoCidade, geoEstado, editId]);

  async function loadClients() {
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/clientes?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      const data = await res.json();
      setClients(data.clients || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setClients([]);
      setTotal(0);
      setPages(1);
    }
  }

  useEffect(() => { loadClients(); }, [search, statusFilter, page]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    let maskedValue = value;
    
    // Aplicar máscaras
    if (name === 'cpf') {
      maskedValue = maskCPF(value);
    } else if (name === 'cellphone') {
      maskedValue = maskCelular(value);
    } else if (name === 'phone') {
      maskedValue = maskTelefone(value);
    } else if (name === 'zipCode') {
      maskedValue = maskCEP(value);
    }
    
    setForm({ ...form, [name]: maskedValue });
  }
  
  // Máscaras
  function maskCPF(v: string): string {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return v;
  }
  
  function maskCelular(v: string): string {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) return v.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    return v;
  }
  
  function maskTelefone(v: string): string {
    v = v.replace(/\D/g, '').slice(0, 10);
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/(\d{2})(\d{1,4})/, '($1) $2');
    return v;
  }
  
  function maskCEP(v: string): string {
    v = v.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) return v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    return v;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const toastId = toastLoading(editId ? "Atualizando cliente..." : "Criando cliente...");
    
    const url = editId ? `/api/clientes/${editId}` : "/api/clientes";
    const method = editId ? "PUT" : "POST";
    const payload = { ...form, dueDay: parseInt(form.dueDay) || 10 };
    // Remover máscaras antes de enviar
    if (payload.cpf) payload.cpf = payload.cpf.replace(/\D/g, '');
    if (payload.cellphone) payload.cellphone = payload.cellphone.replace(/\D/g, '');
    if (payload.phone) payload.phone = payload.phone.replace(/\D/g, '');
    if (payload.zipCode) payload.zipCode = payload.zipCode.replace(/\D/g, '');
    if (!payload.cpf) delete payload.cpf;
    
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { 
        setShowForm(false); 
        setEditId(null); 
        setForm(emptyForm); 
        loadClients();
        update(toastId, editId ? "Cliente atualizado com sucesso! ✅" : "Cliente criado com sucesso! ✅", "success");
      }
      else { 
        const err = await res.json(); 
        update(toastId, err.error || "Erro ao salvar cliente", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
    setFormLoading(false);
  }

  async function handleEdit(id: string) {
    const res = await fetch(`/api/clientes/${id}`);
    const c = await res.json();
    const f: any = {};
    Object.keys(emptyForm).forEach(k => { f[k] = c[k] || emptyForm[k]; });
    f.dueDay = String(c.dueDay || 10);
    f.paymentLocation = c.paymentLocation || "RESIDENCIA";
    f.billingAddressSame = c.billingAddressSame !== false;
    f.isAssured = c.isAssured || false;
    // Aplicar máscaras nos dados carregados
    if (f.cpf) f.cpf = maskCPF(f.cpf);
    if (f.cellphone) f.cellphone = maskCelular(f.cellphone);
    if (f.phone) f.phone = maskTelefone(f.phone);
    if (f.zipCode) f.zipCode = maskCEP(f.zipCode);
    setForm(f);
    setDependents(c.dependents || []);
    setEditId(id);
    setShowForm(true);
  }

  async function handleDetail(id: string) {
    const [clientRes, planRes] = await Promise.all([
      fetch(`/api/clientes/${id}`),
      fetch(`/api/planos/cliente/${id}`),
    ]);
    const data = await clientRes.json();
    const planData = planRes.ok ? await planRes.json() : null;
    setShowDetail({ ...data, assuredPlan: planData });
    // Load PIX data for payment modal
    if (!pixData) {
      try {
        const pixRes = await fetch("/api/empresa");
        if (pixRes.ok) {
          const pixD = await pixRes.json();
          const company = pixD.companies?.[0];
          if (company) {
            setPixData({ keyType: company.pixKeyType, key: company.pixKey, name: company.pixName, city: company.pixCity });
          }
        }
      } catch {}
    }
  }

  async function handleShowCard(id: string) {
    const res = await fetch(`/api/clientes/${id}`);
    const data = await res.json();
    setCardClient(data);
    setShowCard(true);
  }

  async function handlePayFromClient(clientData: any) {
    // Find first pending installment from active carne
    const activeCarne = clientData.carnes?.find((c: any) => {
      const hasPending = c.installments?.some((i: any) => !i.payment || i.status === "PENDING");
      return hasPending;
    });
    if (!activeCarne) {
      error("Nenhuma parcela pendente encontrada");
      return;
    }
    const nextInstallment = activeCarne.installments.find((i: any) => !i.payment || i.status === "PENDING");
    if (!nextInstallment) {
      error("Nenhuma parcela pendente encontrada");
      return;
    }
    setSelectedCarne(activeCarne);
    setSelectedInstallment(nextInstallment);
    setShowPaymentModal(true);
  }

  async function handlePaymentFromClientModal(method: string) {
    if (!selectedInstallment || !showDetail) return;
    const toastId = toastLoading("Registrando pagamento...");
    try {
      const res = await fetch(`/api/carnes/${selectedInstallment.id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: selectedInstallment.valor, paymentMethod: method, skipFinancial: true }),
      });
      if (res.ok) {
        // Auto-create financial transaction
        try {
          await fetch("/api/financeiro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "INCOME",
              description: `Pagamento carnê ${selectedCarne?.year} - parcela ${selectedInstallment.numero}`,
              amount: selectedInstallment.valor,
              date: new Date(),
              category: "Carnê",
              status: "PAID",
              clientId: showDetail.id,
            }),
          });
        } catch {}
        // Reload client detail
        const updatedRes = await fetch(`/api/clientes/${showDetail.id}`);
        const updated = await updatedRes.json();
        setShowDetail(updated);
        loadClients();
        update(toastId, "Pagamento registrado com sucesso! ✅", "success");
        setShowPaymentModal(false);
        setSelectedInstallment(null);
        setSelectedCarne(null);
      } else {
        update(toastId, "Erro ao registrar pagamento", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja cancelar este cliente?")) return;
    const toastId = toastLoading("Removendo cliente...");
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadClients();
        update(toastId, "Cliente removido com sucesso! ✅", "success");
      } else {
        update(toastId, "Erro ao remover cliente", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function addDependent() {
    if (!newDependent.name.trim()) {
      alert("Nome do dependente é obrigatório");
      return;
    }
    if (!editId) {
      setDependents([...dependents, { ...newDependent, id: Date.now().toString() }]);
    } else {
      const res = await fetch(`/api/dependents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: editId, ...newDependent }),
      });
      if (res.ok) {
        const dependent = await res.json();
        setDependents([...dependents, dependent]);
      }
    }
    setNewDependent({ name: "", relationship: "OUTRO", cpf: "", phone: "", birthDate: "" });
  }

  async function deleteDependent(depId: string) {
    if (!confirm("Deseja remover este dependente?")) return;
    if (depId.length > 10) {
      await fetch(`/api/dependents/${depId}`, { method: "DELETE" });
    }
    setDependents(dependents.filter(d => d.id !== depId));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-600">{total} clientes encontrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, CPF, código ou celular..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
          <option value="">Todos</option>
          <option value="ACTIVE">Ativos</option>
          <option value="CANCELLED">Cancelados</option>
          <option value="SUSPENDED">Suspensos</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Cód</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Bairro</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Local Pgto</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase">Dep.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase">Assegurado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-[#d4e4f7]">
                <td className="px-4 py-3 text-sm text-gray-600">{c.code || "-"}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <span className="flex items-center gap-2">
                    {c.name}
                    {c.hasActiveCarne && (
                      <span title="Possui carnê ativo" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                        <FileText size={10} /> Carnê
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.cellphone || c.phone || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.neighborhood || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {c.paymentLocation === "LOJA" ? "Loja" : "Residência"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {(c._count?.dependents || 0) > 0 && (
                    <span className="flex items-center justify-center gap-1 text-blue-600">
                      <Users size={12} /> {c._count?.dependents}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {c.isAssured ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300">✓ Sim</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Não</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-gray-200 text-gray-600"}`}>
                    {statusLabels[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => handleDetail(c.id)} className="text-emerald-600 hover:text-emerald-800" title="Visualizar"><Eye size={16} /></button>
                  <button onClick={() => handleShowCard(c.id)} className="text-violet-600 hover:text-violet-800" title="Carteirinha"><IdCard size={16} /></button>
                  {c.hasActiveCarne && (
                    <a href="/carnes" className="text-blue-600 hover:text-blue-800 inline-block" title="Ver Carnê"><FileText size={16} /></a>
                  )}
                  <button onClick={() => handleEdit(c.id)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum cliente encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${p === page ? "bg-[#4a6fa5] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{p}</button>
          ))}
          {pages > 10 && <span className="px-2 py-1 text-gray-500">...</span>}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#4a6fa5]">{showDetail.name}</h2>
                <p className="text-sm text-gray-600">Código: {showDetail.code || "-"} | CPF: {showDetail.cpf || "-"}</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="text-[#4a6fa5] font-medium">Endereço:</span> <span className="text-gray-900">{showDetail.address || "-"}, {showDetail.neighborhood || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Cidade:</span> <span className="text-gray-900">{showDetail.city || "-"}/{showDetail.state || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Celular:</span> <span className="text-gray-900">{showDetail.cellphone || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Telefone:</span> <span className="text-gray-900">{showDetail.phone || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Estado Civil:</span> <span className="text-gray-900">{showDetail.civilStatus || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Profissão:</span> <span className="text-gray-900">{showDetail.profession || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Cônjuge:</span> <span className="text-gray-900">{showDetail.spouseName || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Dia Vencimento:</span> <span className="text-gray-900">{showDetail.dueDay || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Local Pagamento:</span> <span className="text-gray-900">{showDetail.paymentLocation === "LOJA" ? "Loja" : "Residência"}</span></div>
              <div>
                <span className="text-[#4a6fa5] font-medium">Cliente Assegurado:</span>
                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium" style={{
                  backgroundColor: showDetail.isAssured ? '#d1fae5' : '#f3f4f6',
                  color: showDetail.isAssured ? '#065f46' : '#6b7280'
                }}>
                  {showDetail.isAssured ? "✓ Sim" : "Não"}
                </span>
              </div>

              {/* Plano vinculado */}
              {showDetail.assuredPlan && (
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-blue-800 flex items-center gap-2">
                      <Shield size={16} /> Plano Funerário
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      showDetail.assuredPlan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      showDetail.assuredPlan.status === 'EXPIRED' ? 'bg-gray-100 text-gray-600' :
                      showDetail.assuredPlan.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {showDetail.assuredPlan.status === 'ACTIVE' ? 'Ativo' :
                       showDetail.assuredPlan.status === 'EXPIRED' ? 'Expirado' :
                       showDetail.assuredPlan.status === 'CANCELLED' ? 'Cancelado' :
                       showDetail.assuredPlan.status === 'SUSPENDED' ? 'Suspenso' : 'Renovação Pendente'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-blue-600 font-medium">Tipo:</span> {showDetail.assuredPlan.type === 'INDIVIDUAL' ? 'Individual' : showDetail.assuredPlan.type === 'FAMILIAR' ? 'Familiar' : 'Pet'}</div>
                    <div><span className="text-blue-600 font-medium">Valor Mensal:</span> {parseFloat(showDetail.assuredPlan.monthlyValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    <div><span className="text-blue-600 font-medium">Início:</span> {new Date(showDetail.assuredPlan.startDate).toLocaleDateString('pt-BR')}</div>
                    {showDetail.assuredPlan.endDate && <div><span className="text-blue-600 font-medium">Término:</span> {new Date(showDetail.assuredPlan.endDate).toLocaleDateString('pt-BR')}</div>}
                    <div><span className="text-blue-600 font-medium">Dependentes:</span> {showDetail.assuredPlan.maxDependents}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {showDetail.assuredPlan.coverageUrn && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Urna</span>}
                    {showDetail.assuredPlan.coverageCoffin && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Caixão</span>}
                    {showDetail.assuredPlan.coverageService && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Serviço</span>}
                    {showDetail.assuredPlan.coverageTransport && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Transporte</span>}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={`/planos`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver todos os planos →
                    </a>
                  </div>
                </div>
              )}

              <div><span className="text-[#4a6fa5] font-medium">Pai:</span> <span className="text-gray-900">{showDetail.fatherName || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Mãe:</span> <span className="text-gray-900">{showDetail.motherName || "-"}</span></div>
            </div>

            {/* Endereço de Cobrança */}
            {showDetail.billingAddressSame === false && showDetail.billingAddress && (
              <div className="bg-[#d4e4f7] border border-[#4a6fa5] rounded-lg p-4 mb-6">
                <h3 className="font-bold text-[#4a6fa5] mb-2 flex items-center gap-2"><MapPin size={16} /> Endereço de Cobrança (diferente do residencial)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[#4a6fa5] font-medium">Endereço:</span> <span className="text-gray-900">{showDetail.billingAddress}{showDetail.billingNumber ? `, ${showDetail.billingNumber}` : ""}</span></div>
                  {showDetail.billingComplement && <div><span className="text-[#4a6fa5] font-medium">Complemento:</span> <span className="text-gray-900">{showDetail.billingComplement}</span></div>}
                  <div><span className="text-[#4a6fa5] font-medium">Bairro:</span> <span className="text-gray-900">{showDetail.billingNeighborhood || "-"}</span></div>
                  <div><span className="text-[#4a6fa5] font-medium">Cidade:</span> <span className="text-gray-900">{showDetail.billingCity || showDetail.city || "-"}/{showDetail.billingState || showDetail.state || "-"}</span></div>
                  {showDetail.billingReference && <div className="col-span-2"><span className="text-[#4a6fa5] font-medium">Referência:</span> <span className="text-gray-900">{showDetail.billingReference}</span></div>}
                </div>
              </div>
            )}

            {/* Dependents */}
            {showDetail.dependents?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-[#4a6fa5] mb-2 flex items-center gap-2"><Users size={16} /> Dependentes ({showDetail.dependents.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {showDetail.dependents.map((d: any) => (
                    <div key={d.id} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                      <span className="text-sm text-gray-900">{d.name}</span>
                      <span className="text-xs text-gray-600">{d.relationship}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carnês */}
            {showDetail.carnes?.length > 0 ? (
              <div className="mb-4">
                <h3 className="font-bold text-[#4a6fa5] mb-3 flex items-center gap-2"><FileText size={16} /> Carnês</h3>
                {showDetail.carnes.slice(0, 3).map((c: any) => {
                  const paid = c.installments.filter((i: any) => i.payment || i.status === "PAID").length;
                  const total = c.installments.length;
                  const nextPending = c.installments.find((i: any) => !i.payment && i.status !== "PAID");
                  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
                  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));
                  return (
                    <div key={c.id} className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-gray-900">Carnê {c.year}</span>
                          <span className="ml-2 text-sm text-emerald-700 font-medium">{paid}/{total} pagos</span>
                        </div>
                        {nextPending && (
                          <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-medium">
                            Próxima: {fmt(nextPending.valor)} • vence {fmtDate(nextPending.dueDate)}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}></div>
                      </div>
                      {nextPending && (
                        <button
                          onClick={() => handlePayFromClient(showDetail)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                        >
                          <CreditCard size={16} /> Registrar Pagamento da Parcela {nextPending.numero}/{total}
                        </button>
                      )}
                      {!nextPending && (
                        <p className="text-sm text-center text-emerald-700 font-medium">Todas as parcelas pagas ✓</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-500 mb-2">Nenhum carnê gerado para este cliente</p>
                <a href="/carnes" className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline">
                  <FileText size={14} /> Gerar Carnê
                </a>
              </div>
            )}

            {showDetail.notes && <p className="text-sm text-gray-600 mt-4"><strong className="text-[#4a6fa5]">Obs:</strong> {showDetail.notes}</p>}
          </div>
        </div>
      )}

      {/* Payment Modal (from client detail) */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedInstallment(null);
          setSelectedCarne(null);
        }}
        onPayment={handlePaymentFromClientModal}
        installmentValue={selectedInstallment?.valor || 0}
        clientName={showDetail?.name || ""}
        pixData={pixData}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{editId ? "Editar Cliente" : "Novo Cliente"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength={14} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">RG</label><input name="rg" value={form.rg} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Celular</label><input name="cellphone" value={form.cellphone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="(00) 0000-0000" maxLength={14} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><input name="address" value={form.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                
                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select 
                    name="state" 
                    value={form.state} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {estados.map(e => (
                      <option key={e.sigla} value={e.sigla}>{e.nome}</option>
                    ))}
                  </select>
                </div>
                
                {/* Cidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade {geoLoading && <span className="text-xs text-blue-500">(detectando...)</span>}</label>
                  <select 
                    name="city" 
                    value={form.city} 
                    onChange={handleChange} 
                    disabled={!form.state}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{form.state ? "Selecione" : "Selecione o estado primeiro"}</option>
                    {cidadesDisponiveis.map(cidade => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))}
                  </select>
                </div>
                
                {/* Bairro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <select 
                    name="neighborhood" 
                    value={form.neighborhood} 
                    onChange={handleChange} 
                    disabled={!form.city}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{form.city ? "Selecione" : "Selecione a cidade primeiro"}</option>
                    {bairrosDisponiveis.map(bairro => (
                      <option key={bairro} value={bairro}>{bairro}</option>
                    ))}
                    <option value="OUTRO">Outro (digitar manualmente)</option>
                  </select>
                  {form.neighborhood === "OUTRO" && (
                    <input
                      type="text"
                      placeholder="Digite o bairro"
                      value={form.neighborhood === "OUTRO" ? "" : form.neighborhood}
                      onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CEP</label><input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="00000-000" maxLength={9} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                
                {/* Estado Civil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                  <select 
                    name="civilStatus" 
                    value={form.civilStatus} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {estadosCivis.map(ec => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label><input name="profession" value={form.profession} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Cônjuge</label><input name="spouseName" value={form.spouseName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Pai</label><input name="fatherName" value={form.fatherName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Mãe</label><input name="motherName" value={form.motherName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                  <input name="dueDay" type="number" min="1" max="31" value={form.dueDay} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local de Pagamento</label>
                  <select name="paymentLocation" value={form.paymentLocation} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="RESIDENCIA">Residência</option>
                    <option value="LOJA">Loja</option>
                  </select>
                </div>

                {/* Cliente Assegurado */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isAssured || false}
                      onChange={e => setForm({ ...form, isAssured: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">✓ Cliente Assegurado</span>
                  </label>
                </div>

                {/* Endereço de Cobrança */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin size={18} className="text-blue-600" />
                    <h3 className="font-bold text-gray-900">Endereço de Cobrança</h3>
                  </div>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" checked={form.billingAddressSame}
                      onChange={e => setForm({ ...form, billingAddressSame: e.target.checked })}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Mesmo endereço residencial</span>
                  </label>
                </div>

                {!form.billingAddressSame && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de Cobrança</label>
                      <input name="billingAddress" value={form.billingAddress} onChange={handleChange} placeholder="Rua, Av..." className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input name="billingNumber" value={form.billingNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                      <input name="billingComplement" value={form.billingComplement} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                      <input name="billingNeighborhood" value={form.billingNeighborhood} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input name="billingCity" value={form.billingCity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <input name="billingState" value={form.billingState} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                      <input name="billingZipCode" value={form.billingZipCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência</label>
                      <input name="billingReference" value={form.billingReference} onChange={handleChange} placeholder="Próximo a..." className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                )}

                {/* Dependentes - ÚLTIMO NO FORMULÁRIO */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-blue-600" />
                      <h3 className="font-bold text-gray-900">Dependentes</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, dependents: [...(form.dependents || []), { name: "", relationship: "", birthDate: "" }] })}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                  
                  {form.dependents?.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Nenhum dependente cadastrado</p>
                  )}
                  
                  {form.dependents?.map((dep: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                        <input
                          value={dep.name}
                          onChange={e => {
                            const newDeps = [...form.dependents];
                            newDeps[index].name = e.target.value;
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome do dependente"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Parentesco</label>
                        <select
                          value={dep.relationship}
                          onChange={e => {
                            const newDeps = [...form.dependents];
                            newDeps[index].relationship = e.target.value;
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Pai">Pai</option>
                          <option value="Mãe">Mãe</option>
                          <option value="Irmão(ã)">Irmão(ã)</option>
                          <option value="Neto(a)">Neto(a)</option>
                          <option value="Sobrinho(a)">Sobrinho(a)</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                        <input
                          value={dep.cpf || ""}
                          onChange={e => {
                            const newDeps = [...form.dependents];
                            newDeps[index].cpf = e.target.value;
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nascimento</label>
                          <input
                            type="date"
                            value={dep.birthDate}
                            onChange={e => {
                              const newDeps = [...form.dependents];
                              newDeps[index].birthDate = e.target.value;
                              setForm({ ...form, dependents: newDeps });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newDeps = form.dependents.filter((_: any, i: number) => i !== index);
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="self-end p-1 text-red-500 hover:text-red-700"
                          title="Remover"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{formLoading ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Client Card Modal */}
      {showCard && cardClient && (
        <ClientCard
          client={cardClient}
          onClose={() => { setShowCard(false); setCardClient(null); }}
        />
      )}
    </div>
  );
}
