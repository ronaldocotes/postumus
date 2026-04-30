"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, Users, Shield, ChevronDown, ChevronRight, Check, Eye, EyeOff } from "lucide-react";
import { systemRoles, modules, moduleActions, Permission, Role } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// Componente Toggle Switch moderno
function ToggleSwitch({ 
  checked, 
  onChange, 
  label, 
  description 
}: { 
  checked: boolean; 
  onChange: () => void; 
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 rounded-lg transition-colors">
      <div className="flex-1">
        <span className={`text-sm font-medium ${checked ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Componente Accordion de Módulo
function ModuleAccordion({
  module,
  permissions,
  editablePermissions,
  onToggle,
  isExpanded,
  onToggleExpand
}: {
  module: { id: string; name: string; icon: string };
  permissions: { id: string; name: string; description: string }[];
  editablePermissions: Permission[];
  onToggle: (permission: Permission) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const activeCount = permissions.filter(p => 
    editablePermissions.includes(`${module.id}:${p.id}` as Permission)
  ).length;
  const totalCount = permissions.length;
  const allActive = activeCount === totalCount;
  const someActive = activeCount > 0 && activeCount < totalCount;

  const handleToggleAll = () => {
    if (allActive) {
      permissions.forEach(p => {
        const perm = `${module.id}:${p.id}` as Permission;
        if (editablePermissions.includes(perm)) {
          onToggle(perm);
        }
      });
    } else {
      permissions.forEach(p => {
        const perm = `${module.id}:${p.id}` as Permission;
        if (!editablePermissions.includes(perm)) {
          onToggle(perm);
        }
      });
    }
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
      isExpanded ? 'border-blue-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Header do Accordion - div em vez de button para permitir botões aninhados */}
      <div className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            allActive ? 'bg-blue-100 text-blue-600' : someActive ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {allActive ? (
              <Check size={20} />
            ) : (
              <span className="text-sm font-bold">{module.name.charAt(0)}</span>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900">{module.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {allActive ? (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Acesso Total</span>
              ) : someActive ? (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{activeCount}/{totalCount} ativas</span>
              ) : (
                <span className="text-xs text-slate-400">Sem acesso</span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {/* Botão Ativar Tudo (visível no hover ou quando expandido) */}
          {(isExpanded || someActive) && (
            <button
              type="button"
              onClick={handleToggleAll}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                allActive 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              {allActive ? 'Desativar Tudo' : 'Ativar Tudo'}
            </button>
          )}
          
          <button
            type="button"
            onClick={onToggleExpand}
            className={`text-slate-400 hover:text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="p-2 space-y-1">
            {permissions.map((action) => {
              const permission = `${module.id}:${action.id}` as Permission;
              const isChecked = editablePermissions.includes(permission);
              
              return (
                <ToggleSwitch
                  key={action.id}
                  checked={isChecked}
                  onChange={() => onToggle(permission)}
                  label={action.name}
                  description={action.description}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"usuarios" | "permissoes">("usuarios");
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"usuario" | "permissao">("usuario");
  const [form, setForm] = useState({ estado: "", cidade: "", bairro: "", nome: "", email: "", senha: "", role: "", confirmarSenha: "" });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para edição de permissões
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [editablePermissions, setEditablePermissions] = useState<Permission[]>([]);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.users || data.data || []);
      } else {
        setUsers([
          { id: "1", name: "Administrador", email: "admin@posthumous.com", role: "super_admin", isActive: true, createdAt: "2024-01-01" },
          { id: "2", name: "João Silva", email: "joao@posthumous.com", role: "admin", isActive: true, createdAt: "2024-02-15" },
          { id: "3", name: "Maria Santos", email: "maria@posthumous.com", role: "operador", isActive: true, createdAt: "2024-03-10" },
        ]);
      }
    } catch {
      setUsers([
        { id: "1", name: "Administrador", email: "admin@posthumous.com", role: "super_admin", isActive: true, createdAt: "2024-01-01" },
        { id: "2", name: "João Silva", email: "joao@posthumous.com", role: "admin", isActive: true, createdAt: "2024-02-15" },
        { id: "3", name: "Maria Santos", email: "maria@posthumous.com", role: "operador", isActive: true, createdAt: "2024-03-10" },
      ]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    if (form.nome && form.email && form.senha && form.role) {
      if (form.senha !== form.confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
      }
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
  };

  const handleEditPermissions = (role: Role) => {
    setSelectedRole(role);
    setEditablePermissions([...role.permissions]);
    setIsEditingPermissions(true);
    // Expandir todos os módulos ao iniciar edição
    setExpandedModules(new Set(modules.map(m => m.id)));
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

  const handleToggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
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
      setExpandedModules(new Set());
    }
  };

  const handleCancelEditPermissions = () => {
    setIsEditingPermissions(false);
    setEditablePermissions([]);
    setSelectedRole(null);
    setExpandedModules(new Set());
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
          <h1 className="text-2xl font-bold text-slate-900">Administração</h1>
          <p className="text-slate-500">Gerencie usuários e permissões do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: "usuarios", label: "Usuários", icon: Users },
          { id: "permissoes", label: "Perfis & Permissões", icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "usuarios" | "permissoes")}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        
        {/* ABA USUÁRIOS */}
        {activeTab === "usuarios" && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Usuários do Sistema</h2>
                <p className="text-sm text-slate-500">Gerencie quem tem acesso ao sistema</p>
              </div>
              <button
                onClick={() => { setModalType("usuario"); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
              >
                <Plus size={18} /> Novo Usuário
              </button>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Perfil</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{user.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA PERMISSÕES - NOVO DESIGN MODERNO */}
        {activeTab === "permissoes" && (
          <div className="p-6 space-y-6">
            {!isEditingPermissions ? (
              // Visualização dos Perfis
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Perfis de Acesso</h2>
                    <p className="text-sm text-slate-500">Escolha um perfil para editar suas permissões</p>
                  </div>
                  <button
                    onClick={handleCreateCustomRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors shadow-sm"
                  >
                    <Plus size={18} /> Criar Perfil
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allRoles.map((role) => (
                    <div
                      key={role.id}
                      className="group p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
                      onClick={() => handleEditPermissions(role)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          role.isSystem ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Shield size={20} />
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPermissions(role);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          {!role.isSystem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomRoles(customRoles.filter(r => r.id !== role.id));
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-semibold text-slate-900 mb-1">{role.name}</h3>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{role.description}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs font-medium text-slate-500">
                          {role.permissions.length} permissões
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          role.isSystem 
                            ? 'bg-slate-100 text-slate-600' 
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {role.isSystem ? 'Sistema' : 'Custom'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Modo de Edição com Accordions
              <div className="space-y-6">
                {/* Header do Modo Edição */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancelEditPermissions}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Editando: {selectedRole?.name}</h2>
                      <p className="text-sm text-slate-500">{editablePermissions.length} permissões ativas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancelEditPermissions}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>

                {/* Lista de Módulos com Accordion */}
                <div className="space-y-3">
                  {modules.map((module) => {
                    const actions = moduleActions[module.id] || [];
                    if (actions.length === 0) return null;
                    
                    return (
                      <ModuleAccordion
                        key={module.id}
                        module={module}
                        permissions={actions}
                        editablePermissions={editablePermissions}
                        onToggle={handleTogglePermission}
                        isExpanded={expandedModules.has(module.id)}
                        onToggleExpand={() => handleToggleModuleExpand(module.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Modal Novo Usuário */}
      {showModal && modalType === "usuario" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Usuário</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@posthumous.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Perfil de Acesso</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione um perfil</option>
                  {systemRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {form.role && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    {systemRoles.find(r => r.id === form.role)?.description}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Senha</label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    form.senha && form.confirmarSenha && form.senha !== form.confirmarSenha
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-slate-200'
                  }`}
                />
                {form.senha && form.confirmarSenha && form.senha !== form.confirmarSenha && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!form.nome || !form.email || !form.senha || !form.role || form.senha !== form.confirmarSenha}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
