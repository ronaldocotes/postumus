"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, MapPin, Building2, Users, Settings } from "lucide-react";
import { estados, cidadesPorEstado, bairrosPorCidade, adicionarCidade } from "@/lib/location-data";

interface CidadeConfig {
  nome: string;
  estado: string;
  bairros: string[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"cidades" | "bairros" | "usuarios" | "config">("cidades");
  const [cidades, setCidades] = useState<CidadeConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"cidade" | "bairro">("cidade");
  const [form, setForm] = useState({ estado: "", cidade: "", bairro: "" });
  const [selectedCidade, setSelectedCidade] = useState("");
  const [bairrosList, setBairrosList] = useState<string[]>([]);

  useEffect(() => {
    // Carregar cidades da base
    const lista: CidadeConfig[] = [];
    Object.entries(cidadesPorEstado).forEach(([estado, cids]) => {
      cids.forEach(cidade => {
        lista.push({
          nome: cidade,
          estado,
          bairros: bairrosPorCidade[cidade] || []
        });
      });
    });
    setCidades(lista);
  }, []);

  const handleAddCidade = () => {
    if (form.estado && form.cidade) {
      adicionarCidade(form.estado, form.cidade, []);
      setCidades([...cidades, { nome: form.cidade, estado: form.estado, bairros: [] }]);
      setForm({ ...form, cidade: "" });
      setShowModal(false);
    }
  };

  const handleAddBairro = () => {
    if (selectedCidade && form.bairro) {
      const novosBairros = [...bairrosList, form.bairro];
      setBairrosList(novosBairros);
      // Atualizar na base
      bairrosPorCidade[selectedCidade] = novosBairros;
      setForm({ ...form, bairro: "" });
    }
  };

  const handleRemoveBairro = (index: number) => {
    const novos = bairrosList.filter((_, i) => i !== index);
    setBairrosList(novos);
    bairrosPorCidade[selectedCidade] = novos;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie cidades, bairros e configurações do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("cidades")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "cidades"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Building2 size={16} className="inline mr-2" />
          Cidades
        </button>
        <button
          onClick={() => setActiveTab("bairros")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "bairros"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <MapPin size={16} className="inline mr-2" />
          Bairros
        </button>
        <button
          onClick={() => setActiveTab("usuarios")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "usuarios"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "config"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Configurações
        </button>
      </div>

      {/* Conteúdo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === "cidades" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Cidades Cadastradas</h2>
              <button
                onClick={() => { setModalType("cidade"); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} /> Nova Cidade
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Cidade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Bairros</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cidades.map((cidade) => (
                    <tr key={`${cidade.estado}-${cidade.nome}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{cidade.estado}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cidade.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cidade.bairros.length} bairros</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCidade(cidade.nome);
                            setBairrosList(cidade.bairros);
                            setActiveTab("bairros");
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Gerenciar Bairros
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bairros" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gerenciar Bairros</h2>
                {selectedCidade && (
                  <p className="text-sm text-gray-600">Cidade: <span className="font-medium">{selectedCidade}</span></p>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCidade}
                  onChange={(e) => {
                    setSelectedCidade(e.target.value);
                    setBairrosList(bairrosPorCidade[e.target.value] || []);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione uma cidade</option>
                  {cidades.map(c => (
                    <option key={c.nome} value={c.nome}>{c.nome} ({c.estado})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCidade && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    placeholder="Nome do novo bairro"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => e.key === "Enter" && handleAddBairro()}
                  />
                  <button
                    onClick={handleAddBairro}
                    disabled={!form.bairro}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                  >
                    <Plus size={18} /> Adicionar
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {bairrosList.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum bairro cadastrado</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {bairrosList.map((bairro, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 bg-white rounded border border-gray-200"
                        >
                          <span className="text-sm text-gray-700">{bairro}</span>
                          <button
                            onClick={() => handleRemoveBairro(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedCidade && (
              <div className="text-center py-8 text-gray-500">
                Selecione uma cidade para gerenciar seus bairros
              </div>
            )}
          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Gerenciamento de usuários em desenvolvimento</p>
            <p className="text-sm">Use a página de Usuários no menu lateral</p>
          </div>
        )}

        {activeTab === "config" && (
          <div className="text-center py-8 text-gray-500">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Configurações do sistema em desenvolvimento</p>
          </div>
        )}
      </div>

      {/* Modal Nova Cidade */}
      {showModal && modalType === "cidade" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Nova Cidade</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione</option>
                  {estados.map(e => (
                    <option key={e.sigla} value={e.sigla}>{e.nome} ({e.sigla})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Cidade</label>
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="Ex: Macapá"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCidade}
                  disabled={!form.estado || !form.cidade}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
