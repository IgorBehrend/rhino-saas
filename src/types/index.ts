// ============================================================
// RHINO MACHINES - Type Definitions
// ============================================================

export type MachineStatus = 'available' | 'production' | 'sold' | 'maintenance' | 'scrapped';
export type ProductionStatus = 'pending' | 'mechanical' | 'electrical' | 'checklist' | 'packaging' | 'ready' | 'shipped';
export type UserRole = 'admin' | 'user';
export type MachineType = 'ROUTER' | 'LASER' | 'COLADEIRA' | 'DOBRADEIRA' | 'OUTROS';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  company: string | null;
  created_at: string;
}

export interface Machine {
  id: string;
  user_id: string;
  code: string;
  name: string;
  machine_type: MachineType | null;
  status: MachineStatus;
  qty_system: number;
  qty_physical: number;
  contract: string | null;
  invoice_in: string | null;
  invoice_out: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  specs?: Spec[];
  production?: Production[];
  machine_notes?: MachineNote[];
}

export interface Spec {
  id: string;
  machine_id: string;
  vol1_length: number | null;
  vol1_width: number | null;
  vol1_height: number | null;
  vol1_weight: number | null;
  vol2_length: number | null;
  vol2_width: number | null;
  vol2_height: number | null;
  vol2_weight: number | null;
  power_kw: number | null;
  current_a: number | null;
  voltage: string | null;
  air_consumption: string | null;
  dust_collector_flow: string | null;
  max_speed: string | null;
  created_at: string;
}

export interface Production {
  id: string;
  machine_id: string;
  user_id: string;
  contract: string | null;
  status: ProductionStatus;
  responsible_mechanical: string | null;
  responsible_electrical: string | null;
  responsible_checklist: string | null;
  responsible_packaging: string | null;
  dt_mechanical: string | null;
  dt_electrical: string | null;
  dt_checklist: string | null;
  dt_packaging: string | null;
  planned_factory_date: string | null;
  actual_factory_date: string | null;
  planned_delivery_date: string | null;
  actual_delivery_date: string | null;
  delay_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  machine?: Machine;
}

export interface MachineNote {
  id: string;
  machine_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Relations
  profile?: Profile;
}

// Dashboard stats
export interface DashboardStats {
  total: number;
  available: number;
  production: number;
  sold: number;
  maintenance: number;
  scrapped: number;
}

// Form types
export type MachineFormData = Omit<Machine, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'specs' | 'production' | 'machine_notes'>;
export type SpecFormData = Omit<Spec, 'id' | 'machine_id' | 'created_at'>;
export type ProductionFormData = Omit<Production, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'delay_days' | 'machine'>;
