"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, MapPin, Building2, Users, Settings, Shield, Check, Eye, EyeOff } from "lucide-react";
import { estados, cidadesPorEstado, bairrosPorCidade, adicionarCidade } from "@/lib/location-data";
import { systemRoles, modules, moduleActions, Permission, hasPermission, Role } from "@/lib/permissions";

interface CidadeConfig {
  nome: string;
  estado: string;
  bairros: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"cidades" | "bairros" | "usuarios" | "permissoes" | "config">("usuarios");
  const [cidades, setCidades] = useState<CidadeConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"cidade" | "bairro" | "usuario" | "permissao">("usuario");
  const [form, setForm] = useState({ estado: "", cidade: "", bairro: "", nome: "", email: "", senha: "", role: "", confirmarSenha: "" });
  const [selectedCidade, setSelectedCidade] = useState("");
  const [bairrosList, setBairrosList] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para edição de permissões
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [editablePermissions, setEditablePermissions] = useState<Permission[]>([]);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);

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
    
    // Carregar usuários (mock - depois virá da API)
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        // Garantir que é sempre um array
        setUsers(Array.isArray(data) ? data : data.users || data.data || []);
      } else {
        // Se API falhar, usar mock
        setUsers([
          { id: "1", name: "Administrador", email: "admin@posthumous.com", role: "super_admin", isActive: true, createdAt: "2024-01-01" },
          { id: "2", name: "João Silva", email: "joao@posthumous.com", role: "admin", isActive: true, createdAt: "2024-02-15" },
          { id: "3", name: "Maria Santos", email: "maria@posthumous.com", role: "operador", isActive: true, createdAt: "2024-03-10" },
        ]);
      }
    } catch (err) {
      // Dados mock para demonstração
      setUsers([
        { id: "1", name: "Administrador", email: "admin@posthumous.com", role: "super_admin", isActive: true, createdAt: "2024-01-01" },
        { id: "2", name: "João Silva", email: "joao@posthumous.com", role: "admin", isActive: true, createdAt: "2024-02-15" },
        { id: "3", name: "Maria Santos", email: "maria@posthumous.com", role: "operador", isActive: true, createdAt: "2024-03-10" },
      ]);
    }
  };

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
      bairrosPorCidade[selectedCidade] = novosBairros;
      setForm({ ...form, bairro: "" });
    }
  };

  const handleRemoveBairro = (index: number) => {
    const novos = bairrosList.filter((_, i) => i !== index);
    setBairrosList(novos);
    bairrosPorCidade[selectedCidade] = novos;
  };

  // Funções para gerenciar permissões
  const handleEditPermissions = (role: Role) => {
    setSelectedRole(role);
    setEditablePermissions([...role.permissions]);
    setIsEditingPermissions(true);
  };

  const handleTogglePermission = (permission: Permission) => {
    setEditablePermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      // Se for um perfil do sistema, criar uma cópia customizada
      if (selectedRole.isSystem) {
        const updatedRole: Role = {
          ...selectedRole,
          id: `${selectedRole.id}_custom_${Date.now()}`,
          name: `${selectedRole.name} (Personalizado)`,
          permissions: editablePermissions,
          isSystem: false
        };
        setCustomRoles([...customRoles, updatedRole]);
      } else {
        // Atualizar perfil customizado existente
        const updatedRoles = customRoles.map(r => 
          r.id === selectedRole.id 
            ? { ...r, permissions: editablePermissions }
            : r
        );
        setCustomRoles(updatedRoles);
      }
      setIsEditingPermissions(false);
      setSelectedRole(null);
      setEditablePermissions([]);
    }
  };

  const handleCancelEditPermissions = () => {
    setIsEditingPermissions(false);
    setEditablePermissions([]);
  };

  const handleCreateCustomRole = () => {
    const newRole: Role = {
      id: `custom_${Date.now()}`,
      name: "Novo Perfil",
      description: "Perfil personalizado",
      permissions: [],
      isSystem: false
    };
    setCustomRoles([...customRoles, newRole]);
    handleEditPermissions(newRole);
  };

  const allRoles = [...systemRoles, ...customRoles];

  const handleAddUser = async () => {
    if (form.nome && form.email && form.senha && form.role) {
      if (form.senha !== form.confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
      }
      
      try {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.nome,
            email: form.email,
            password: form.senha,
            role: form.role
          })
        });
        
        if (res.ok) {
          loadUsers();
          setShowModal(false);
          setForm({ ...form, nome: "", email: "", senha: "", confirmarSenha: "", role: "" });
        }
      } catch (err) {
        // Mock: adicionar localmente
        const newUser: User = {
          id: String(Date.now()),
          name: form.nome,
          email: form.email,
          role: form.role,
          isActive: true,
          createdAt: new Date().toISOString().split("T")[0]
        };
        setUsers([...users, newUser]);
        setShowModal(false);
        setForm({ ...form, nome: "", email: "", senha: "", confirmarSenha: "", role: "" });
      }
    }
  };

  const getRoleName = (roleId: string) => {
    return systemRoles.find(r => r.id === roleId)?.name || roleId;
  };

  const getRoleColor = (roleId: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      operador: "bg-green-100 text-green-800",
      cobrador: "bg-orange-100 text-orange-800",
      financeiro: "bg-yellow-100 text-yellow-800",
      visualizador: "bg-gray-100 text-gray-800"
    };
    return colors[roleId] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários, permissões, cidades e configurações</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
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
          onClick={() => setActiveTab("permissoes")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "permissoes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Shield size={16} className="inline mr-2" />
          Perfis & Permissões
        </button>
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
        
        {/* ABA USUÁRIOS */}
        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Usuários do Sistema</h2>
              <button
                onClick={() => { setModalType("usuario"); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} /> Novo Usuário
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Perfil</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800">Criado em</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.createdAt}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA PERMISSÕES */}
        {activeTab === "permissoes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Perfis de Acesso</h2>
                <p className="text-sm text-gray-600">Gerencie grupos de permissões predefinidos</p>
              </div>
              <button
                onClick={handleCreateCustomRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} /> Novo Perfil
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allRoles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole?.id === role.id && !isEditingPermissions
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => !isEditingPermissions && setSelectedRole(selectedRole?.id === role.id ? null : role)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {role.isSystem ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Sistema</span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">Custom</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Editando perfil:", role.name);
                          handleEditPermissions(role);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar permissões"
                      >
                        <Edit size={16} />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomRoles(customRoles.filter(r => r.id !== role.id));
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Excluir perfil"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">{role.permissions.length} permissões</span>
                  </div>
                </div>
              ))}
            </div>

            {isEditingPermissions && selectedRole && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Editando: {selectedRole.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEditPermissions}
                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Salvar ({editablePermissions.length} permissões)
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {modules.map((mod) => {
                    const actions = moduleActions[mod.id] || [];
                    
                    return (
                      <div key={mod.id} className="bg-white p-3 rounded border">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-medium text-gray-900">{mod.name}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {actions.map((action) => {
                            const permission = `${mod.id}:${action.id}` as Permission;
                            const isChecked = editablePermissions.includes(permission);
                            
                            return (
                              <label
                                key={action.id}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                  isChecked 
                                    ? "bg-green-50 border border-green-200" 
                                    : "bg-gray-50 border border-gray-200"
                                }`}
                                title={action.description}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(permission)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className={`text-sm ${isChecked ? "text-green-800 font-medium" : "text-gray-600"}`}>
                                  {action.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRole && !isEditingPermissions && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Permissões do perfil: {selectedRole.name}
                  </h3>
                  <button
                    onClick={() => handleEditPermissions(selectedRole)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Edit size={14} /> Editar
                  </button>
                </div>
                
                <div className="space-y-4">
                  {modules.map((mod) => {
                    const actions = moduleActions[mod.id] || [];
                    const hasAnyPermission = actions.some(a => 
                      selectedRole.permissions.includes(`${mod.id}:${a.id}` as Permission)
                    );
                    
                    return (
                      <div key={mod.id} className="bg-white p-3 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{mod.name}</span>
                          {hasAnyPermission && (
                            <Check size={14} className="text-green-600" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {actions.map((action) => {
                            const hasPerm = selectedRole.permissions.includes(
                              `${mod.id}:${action.id}` as Permission
                            );
                            return (
                              <span
                                key={action.id}
                                className={`px-2 py-1 text-xs rounded ${
                                  hasPerm
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                                title={action.description}
                              >
                                {action.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA CIDADES */}
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

        {/* ABA BAIRROS */}
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

        {/* ABA CONFIGURAÇÕES */}
        {activeTab === "config" && (
          <div className="text-center py-8 text-gray-500">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Configurações do sistema em desenvolvimento</p>
          </div>
        )}
      </div>

      {/* Modal Novo Usuário */}
      {showModal && modalType === "usuario" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Novo Usuário</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@posthumous.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione um perfil</option>
                  {systemRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {form.role && (
                  <p className="text-xs text-gray-500 mt-1">
                    {systemRoles.find(r => r.id === form.role)?.description}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {form.senha && form.confirmarSenha && form.senha !== form.confirmarSenha && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!form.nome || !form.email || !form.senha || !form.role || form.senha !== form.confirmarSenha}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
