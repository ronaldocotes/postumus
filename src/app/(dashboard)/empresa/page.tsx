"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Upload, Trash2, Building2, Phone, Mail, MapPin, Key } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Company {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
  pixKeyType?: string;
  pixKey?: string;
  pixName?: string;
  pixCity?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmpresaPage() {
  const { success, error, loading: toastLoading, update } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoaded = useRef(false);

  const [form, setForm] = useState({
    name: "",
    tradeName: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    pixKeyType: "ALEATORIA",
    pixKey: "",
    pixName: "",
    pixCity: "",
    logo: null as File | null,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/empresa");
      if (!res.ok) return;
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      load();
    }
  }, [load]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, logo: file });
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      tradeName: "",
      cnpj: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      pixKeyType: "ALEATORIA",
      pixKey: "",
      pixName: "",
      pixCity: "",
      logo: null,
    });
    setLogoPreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name) {
      error("Nome da empresa é obrigatório");
      return;
    }

    setFormLoading(true);
    const toastId = toastLoading(editingId ? "Atualizando empresa..." : "Criando empresa...");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("tradeName", form.tradeName);
      formData.append("cnpj", form.cnpj);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      formData.append("address", form.address);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("zipCode", form.zipCode);
      formData.append("pixKeyType", form.pixKeyType);
      formData.append("pixKey", form.pixKey);
      formData.append("pixName", form.pixName);
      formData.append("pixCity", form.pixCity);

      if (form.logo) {
        formData.append("logo", form.logo);
      }

      if (editingId) {
        formData.append("id", editingId);
        const res = await fetch("/api/empresa", {
          method: "PUT",
          body: formData,
        });

        if (res.ok) {
          update(toastId, "Empresa atualizada com sucesso! ✅", "success");
          load();
          resetForm();
        } else {
          update(toastId, "Erro ao atualizar empresa", "error");
        }
      } else {
        const res = await fetch("/api/empresa", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          update(toastId, "Empresa criada com sucesso! ✅", "success");
          load();
          resetForm();
        } else {
          update(toastId, "Erro ao criar empresa", "error");
        }
      }
    } catch (err: any) {
      update(toastId, "Erro de conexão", "error");
      console.error("Erro:", err);
    } finally {
      setFormLoading(false);
    }
  }

  const handleEdit = (company: Company) => {
    setForm({
      name: company.name,
      tradeName: company.tradeName || "",
      cnpj: company.cnpj || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      pixKeyType: company.pixKeyType || "ALEATORIA",
      pixKey: company.pixKey || "",
      pixName: company.pixName || "",
      pixCity: company.pixCity || "",
      logo: null,
    });
    setLogoPreview(company.logo || null);
    setEditingId(company.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cadastro de Empresa</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Nova Empresa
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all"
          >
            {company.logo && (
              <div className="mb-4 flex justify-center">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-20 h-20 object-contain"
                />
              </div>
            )}
            <h3 className="font-bold text-gray-900 text-center mb-1">{company.name}</h3>
            {company.tradeName && (
              <p className="text-sm text-gray-500 text-center mb-3">{company.tradeName}</p>
            )}

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {company.cnpj && (
                <div className="flex items-center gap-2">
                  <Building2 size={14} />
                  <span>{company.cnpj}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{company.email}</span>
                </div>
              )}
              {company.city && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{company.city}, {company.state}</span>
                </div>
              )}
            </div>

            {company.pixKey && (
              <div className="bg-cyan-50 rounded p-3 mb-4 text-sm">
                <div className="flex items-center gap-1 text-cyan-700 font-semibold mb-1">
                  <Key size={14} /> PIX
                </div>
                <div className="text-xs text-cyan-600">
                  <div>{company.pixKeyType}</div>
                  <div className="truncate">{company.pixKey}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(company)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Editar Empresa" : "Nova Empresa"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Logomarca
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ ...form, logo: null });
                          setLogoPreview(null);
                        }}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} /> Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Clique para fazer upload da logomarca
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG (máx 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={form.tradeName}
                    onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* PIX Section */}
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <h3 className="font-semibold text-cyan-900 mb-4 flex items-center gap-2">
                  <Key size={18} /> Dados PIX
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Chave
                    </label>
                    <select
                      value={form.pixKeyType}
                      onChange={(e) => setForm({ ...form, pixKeyType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALEATORIA">Aleatória</option>
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">Email</option>
                      <option value="TELEFONE">Telefone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={form.pixKey}
                      onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Beneficiário
                    </label>
                    <input
                      type="text"
                      value={form.pixName}
                      onChange={(e) => setForm({ ...form, pixName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade Beneficiário
                    </label>
                    <input
                      type="text"
                      value={form.pixCity}
                      onChange={(e) => setForm({ ...form, pixCity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {formLoading ? "Salvando..." : editingId ? "Atualizar" : "Criar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
