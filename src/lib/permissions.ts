// Sistema de Permissões RBAC (Role-Based Access Control)
// Baseado em sistemas modernos: AWS IAM, Vercel, GitHub

export type Permission = 
  | "dashboard:view"
  | "clientes:view" | "clientes:create" | "clientes:edit" | "clientes:delete"
  | "fornecedores:view" | "fornecedores:create" | "fornecedores:edit" | "fornecedores:delete"
  | "mercadorias:view" | "mercadorias:create" | "mercadorias:edit" | "mercadorias:delete"
  | "servicos:view" | "servicos:create" | "servicos:edit" | "servicos:delete"
  | "carnes:view" | "carnes:create" | "carnes:edit" | "carnes:delete"
  | "financeiro:view" | "financeiro:create" | "financeiro:edit" | "financeiro:delete"
  | "mapa:view" | "mapa:edit"
  | "relatorios:view" | "relatorios:export"
  | "usuarios:view" | "usuarios:create" | "usuarios:edit" | "usuarios:delete"
  | "admin:access" | "admin:full";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault?: boolean;
  isSystem?: boolean; // Não pode ser deletado
}

// Roles pré-definidas do sistema
export const systemRoles: Role[] = [
  {
    id: "super_admin",
    name: "Super Administrador",
    description: "Acesso total ao sistema. Pode gerenciar usuários, configurações e todos os módulos.",
    permissions: [
      "dashboard:view",
      "clientes:view", "clientes:create", "clientes:edit", "clientes:delete",
      "fornecedores:view", "fornecedores:create", "fornecedores:edit", "fornecedores:delete",
      "mercadorias:view", "mercadorias:create", "mercadorias:edit", "mercadorias:delete",
      "servicos:view", "servicos:create", "servicos:edit", "servicos:delete",
      "carnes:view", "carnes:create", "carnes:edit", "carnes:delete",
      "financeiro:view", "financeiro:create", "financeiro:edit", "financeiro:delete",
      "mapa:view", "mapa:edit",
      "relatorios:view", "relatorios:export",
      "usuarios:view", "usuarios:create", "usuarios:edit", "usuarios:delete",
      "admin:access", "admin:full"
    ],
    isSystem: true
  },
  {
    id: "admin",
    name: "Administrador",
    description: "Gerencia o dia-a-dia da funerária. Acesso a clientes, carnês, financeiro e relatórios.",
    permissions: [
      "dashboard:view",
      "clientes:view", "clientes:create", "clientes:edit", "clientes:delete",
      "fornecedores:view", "fornecedores:create", "fornecedores:edit", "fornecedores:delete",
      "mercadorias:view", "mercadorias:create", "mercadorias:edit", "mercadorias:delete",
      "servicos:view", "servicos:create", "servicos:edit", "servicos:delete",
      "carnes:view", "carnes:create", "carnes:edit", "carnes:delete",
      "financeiro:view", "financeiro:create", "financeiro:edit",
      "mapa:view", "mapa:edit",
      "relatorios:view", "relatorios:export",
      "usuarios:view"
    ],
    isSystem: true
  },
  {
    id: "operador",
    name: "Operador",
    description: "Atendente que cadastra clientes e gerencia carnês. Sem acesso a relatórios financeiros sensíveis.",
    permissions: [
      "dashboard:view",
      "clientes:view", "clientes:create", "clientes:edit",
      "carnes:view", "carnes:create", "carnes:edit",
      "financeiro:view", "financeiro:create"
    ],
    isSystem: true
  },
  {
    id: "cobrador",
    name: "Cobrador",
    description: "Acesso apenas ao mapa de rotas e baixa de pagamentos em campo.",
    permissions: [
      "dashboard:view",
      "clientes:view",
      "carnes:view", "carnes:edit",
      "mapa:view", "mapa:edit",
      "financeiro:create"
    ],
    isSystem: true
  },
  {
    id: "financeiro",
    name: "Financeiro",
    description: "Acesso exclusivo ao módulo financeiro e relatórios.",
    permissions: [
      "dashboard:view",
      "financeiro:view", "financeiro:create", "financeiro:edit", "financeiro:delete",
      "relatorios:view", "relatorios:export",
      "carnes:view"
    ],
    isSystem: true
  },
  {
    id: "visualizador",
    name: "Visualizador",
    description: "Apenas visualização de dados. Não pode criar, editar ou excluir.",
    permissions: [
      "dashboard:view",
      "clientes:view",
      "fornecedores:view",
      "mercadorias:view",
      "servicos:view",
      "carnes:view",
      "financeiro:view",
      "mapa:view",
      "relatorios:view"
    ],
    isSystem: true
  }
];

// Módulos do sistema para organização de permissões
export const modules = [
  { id: "dashboard", name: "Dashboard", icon: "LayoutDashboard" },
  { id: "clientes", name: "Clientes", icon: "Users" },
  { id: "fornecedores", name: "Fornecedores", icon: "Truck" },
  { id: "mercadorias", name: "Mercadorias", icon: "Package" },
  { id: "servicos", name: "Serviços", icon: "Wrench" },
  { id: "carnes", name: "Carnês", icon: "FileText" },
  { id: "financeiro", name: "Financeiro", icon: "DollarSign" },
  { id: "mapa", name: "Mapa / Rotas", icon: "MapPin" },
  { id: "relatorios", name: "Relatórios", icon: "BarChart3" },
  { id: "usuarios", name: "Usuários", icon: "Shield" },
  { id: "admin", name: "Administração", icon: "Settings" },
];

// Ações disponíveis por módulo
export const moduleActions: Record<string, { id: string; name: string; description: string }[]> = {
  dashboard: [
    { id: "view", name: "Visualizar", description: "Acessar o dashboard" }
  ],
  clientes: [
    { id: "view", name: "Visualizar", description: "Ver lista e detalhes de clientes" },
    { id: "create", name: "Criar", description: "Cadastrar novos clientes" },
    { id: "edit", name: "Editar", description: "Modificar dados de clientes" },
    { id: "delete", name: "Excluir", description: "Remover clientes do sistema" }
  ],
  fornecedores: [
    { id: "view", name: "Visualizar", description: "Ver fornecedores" },
    { id: "create", name: "Criar", description: "Cadastrar fornecedores" },
    { id: "edit", name: "Editar", description: "Editar fornecedores" },
    { id: "delete", name: "Excluir", description: "Remover fornecedores" }
  ],
  mercadorias: [
    { id: "view", name: "Visualizar", description: "Ver mercadorias" },
    { id: "create", name: "Criar", description: "Cadastrar mercadorias" },
    { id: "edit", name: "Editar", description: "Editar mercadorias" },
    { id: "delete", name: "Excluir", description: "Remover mercadorias" }
  ],
  servicos: [
    { id: "view", name: "Visualizar", description: "Ver serviços" },
    { id: "create", name: "Criar", description: "Cadastrar serviços" },
    { id: "edit", name: "Editar", description: "Editar serviços" },
    { id: "delete", name: "Excluir", description: "Remover serviços" }
  ],
  carnes: [
    { id: "view", name: "Visualizar", description: "Ver carnês" },
    { id: "create", name: "Criar", description: "Gerar novos carnês" },
    { id: "edit", name: "Editar", description: "Editar carnês e dar baixa" },
    { id: "delete", name: "Excluir", description: "Remover carnês" }
  ],
  financeiro: [
    { id: "view", name: "Visualizar", description: "Ver transações financeiras" },
    { id: "create", name: "Criar", description: "Registrar receitas/despesas" },
    { id: "edit", name: "Editar", description: "Editar lançamentos" },
    { id: "delete", name: "Excluir", description: "Excluir lançamentos" }
  ],
  mapa: [
    { id: "view", name: "Visualizar", description: "Ver mapa e rotas" },
    { id: "edit", name: "Editar", description: "Marcar visitas e otimizar rotas" }
  ],
  relatorios: [
    { id: "view", name: "Visualizar", description: "Gerar e visualizar relatórios" },
    { id: "export", name: "Exportar", description: "Exportar relatórios (PDF/Excel)" }
  ],
  usuarios: [
    { id: "view", name: "Visualizar", description: "Ver usuários" },
    { id: "create", name: "Criar", description: "Criar novos usuários" },
    { id: "edit", name: "Editar", description: "Editar usuários e permissões" },
    { id: "delete", name: "Excluir", description: "Desativar usuários" }
  ],
  admin: [
    { id: "access", name: "Acessar", description: "Acessar painel administrativo" },
    { id: "full", name: "Controle Total", description: "Gerenciar cidades, bairros e configurações" }
  ]
};

// Funções auxiliares
export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required) || userPermissions.includes("admin:full");
}

export function hasAnyPermission(userPermissions: Permission[], required: Permission[]): boolean {
  return required.some(p => hasPermission(userPermissions, p));
}

export function hasModuleAccess(userPermissions: Permission[], moduleId: string): boolean {
  return userPermissions.some(p => p.startsWith(`${moduleId}:`));
}

export function getRoleById(roleId: string): Role | undefined {
  return systemRoles.find(r => r.id === roleId);
}

export function getPermissionsForRole(roleId: string): Permission[] {
  const role = getRoleById(roleId);
  return role?.permissions || [];
}
