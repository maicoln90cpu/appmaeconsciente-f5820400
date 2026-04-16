export interface UserData {
  id: string;
  email: string;
  perfil_completo: boolean | null;
  created_at: string;
  updated_at: string;
  user_roles: { id: string; role: string }[];
  lastActivity: Date | null;
  hasUsedTools: boolean;
}

export interface ProductData {
  id: string;
  title: string;
  access_duration_days: number | null;
}

export interface ProductAccessData {
  product_id: string;
  product_title: string;
  expires_at: string | null;
}

export interface UserFiltersState {
  searchTerm: string;
  roleFilter: 'all' | 'admin' | 'user';
  sortBy: 'date' | 'email';
  sortOrder: 'asc' | 'desc';
}

export interface AccessGrantState {
  selectedUser: string | null;
  selectedProduct: string;
  accessDuration: number;
  lifetimeAccess: boolean;
}
