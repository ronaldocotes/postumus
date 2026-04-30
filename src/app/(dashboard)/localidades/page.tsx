"use client";

import { useState } from "react";
import { Plus, Trash2, X, MapPin } from "lucide-react";
import { estados, cidadesPorEstado, bairrosPorCidade } from "@/lib/location-data";

interface CidadeConfig {
  nome: string;
  estado: string;
  bairros: string[];
}

export default function LocalidadesPage() {
  const [cidades, setCidades] = useState<CidadeConfig[]>(() => {
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
    return lista;
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"cidade" | "bairro" | "">(""); 
  const [form, setForm] = useState({ estado: "", cidade: "", bairro: "" });
  const [selectedCidade, setSelectedCidade] = useState("");
  const [bairrosList, setBairrosList] = useState<string[]>([]);

  const handleAddCidade = () => {
    if (form.estado && form.cidade) {
      setCidades([...cidades, { nome: form.cidade, estado: form.estado, bairros: [] }]);
      setForm({ ...form, cidade: "" });
      setShowModal(false);
    }
  };

  const handleAddBairro = () => {
    if (selectedCidade && form.bairro) {
      const novosBairros = [...bairrosList, form.bairro];
      setBairrosList(novosBairros);
      // eslint-disable-next-line react-hooks/immutability
      bairrosPorCidade[selectedCidade] = novosBairros;
      setForm({ ...form, bairro: "" });
    }
  };

  const handleRemoveBairro = (index: number) => {
    const novos = bairrosList.filter((_, i) => i !== index);
    setBairrosList(novos);
    if (selectedCidade) {
      // eslint-disable-next-line react-hooks/immutability
      bairrosPorCidade[selectedCidade] = novos;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Localidades</h1>
          <p className="text-slate-500">Gerencie as cidades e seus bairros</p>
        </div>
      </div>

      {/* Seção de Cidades */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Cidades Cadastradas</h2>
            <p className="text-sm text-slate-500">Gerencie as cidades e seus bairros</p>
          </div>
          <button
            onClick={() => { setModalType("cidade"); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
          >
            <Plus size={18} /> Nova Cidade
          </button>
        </div>
        
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cidade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Bairros</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cidades.map((cidade) => (
                <tr key={`${cidade.estado}-${cidade.nome}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600">{cidade.estado}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{cidade.nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{cidade.bairros.length} bairros</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedCidade(cidade.nome);
                        setBairrosList(cidade.bairros);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Gerenciar Bairros
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Seção de Bairros - aparece quando uma cidade está selecionada */}
        {selectedCidade && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Bairros de {selectedCidade}</h3>
                <p className="text-sm text-slate-500">Gerencie os bairros desta cidade</p>
              </div>
              <button
                onClick={() => setSelectedCidade("")}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                Fechar
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Nome do novo bairro"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleAddBairro()}
              />
              <button
                onClick={handleAddBairro}
                disabled={!form.bairro}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                <Plus size={18} /> Adicionar
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              {bairrosList.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MapPin size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>Nenhum bairro cadastrado para esta cidade</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {bairrosList.map((bairro, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <span className="text-sm text-slate-700 font-medium truncate">{bairro}</span>
                      <button
                        onClick={() => handleRemoveBairro(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Cidade */}
      {showModal && modalType === "cidade" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Nova Cidade</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione</option>
                  {estados.map(e => (
                    <option key={e.sigla} value={e.sigla}>{e.nome} ({e.sigla})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Cidade</label>
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="Ex: Macapá"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCidade}
                  disabled={!form.estado || !form.cidade}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium transition-colors"
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
