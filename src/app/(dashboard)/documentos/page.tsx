"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  Trash2,
  Download,
  Search,
  Filter,
  Paperclip,
} from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface DocumentFile {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  category: string;
  notes: string | null;
  uploadedAt: string;
  client: { name: string } | null;
  deathRecord: { deceasedName: string } | null;
  uploadedBy: { name: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTRATO: "Contrato",
  RG: "RG",
  CPF: "CPF",
  CERTIDAO: "Certidão",
  COMPROVANTE_RESIDENCIA: "Comprovante de Residência",
  COMPROVANTE_PAGAMENTO: "Comprovante de Pagamento",
  CERTIDAO_OBITO: "Certidão de Óbito",
  LAUDO_MEDICO: "Laudo Médico",
  AUTORIZACAO: "Autorização",
  OUTRO: "Outro",
};

export default function DocumentosPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: "",
    clientId: "",
    category: "OUTRO",
    notes: "",
  });

  useEffect(() => {
    loadDocuments();
    fetch("/api/clientes?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const clients = data.clients || data.data || [];
        setClientOptions(clients.map((c: any) => ({ value: c.id, label: c.name })));
      });
  }, [clientFilter, categoryFilter]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientFilter) params.set("clientId", clientFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/documentos?${params}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.name) {
      toastError("Arquivo e nome são obrigatórios");
      return;
    }

    setUploading(true);
    const toastId = toastLoading("Enviando arquivo...");

    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("clientId", uploadForm.clientId);
      formData.append("category", uploadForm.category);
      formData.append("notes", uploadForm.notes);

      const res = await fetch("/api/documentos", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        update(toastId, "Arquivo enviado!", "success");
        setShowUpload(false);
        setUploadForm({ file: null, name: "", clientId: "", category: "OUTRO", notes: "" });
        loadDocuments();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este documento?")) return;
    const toastId = toastLoading("Excluindo...");
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" });
      if (res.ok) {
        update(toastId, "Documento excluído!", "success");
        loadDocuments();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 mt-1">Gerencie anexos e arquivos dos clientes</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
        >
          <Upload size={18} /> Enviar Arquivo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchSelect
            options={clientOptions}
            value={clientFilter}
            onChange={(val) => setClientFilter(val)}
            placeholder="Filtrar por cliente..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as categorias</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Carregando...</div>
        ) : documents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Paperclip size={40} className="mx-auto mb-3 opacity-40" />
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="font-medium text-gray-900 truncate mb-1">{doc.name}</p>
              <p className="text-xs text-gray-500 mb-2">{CATEGORY_LABELS[doc.category] || doc.category}</p>

              {doc.client && (
                <p className="text-xs text-gray-600 mb-1">Cliente: {doc.client.name}</p>
              )}
              {doc.deathRecord && (
                <p className="text-xs text-gray-600 mb-1">Óbito: {doc.deathRecord.deceasedName}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                <span>{formatSize(doc.size)}</span>
                <span>{new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}</span>
              </div>

              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                <Download size={14} /> Baixar
              </a>
            </div>
          ))
        )}
      </div>

      {/* Modal: Upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Enviar Documento</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  required
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <SearchSelect
                  options={clientOptions}
                  value={uploadForm.clientId}
                  onChange={(val) => setUploadForm({ ...uploadForm, clientId: val })}
                  placeholder="Vincular a um cliente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {uploading ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
