// ── Reservation ───────────────────────────────────────────────
export type ReservationSource = 'stock' | 'import';
export type ReservationStatus = 'active' | 'fulfilled' | 'cancelled';

export interface Reservation {
  id: string;
  user_id: string;
  machine_code: string;
  machine_name: string | null;
  contract: string;
  production_id: string | null;
  import_id: string | null;
  import_po_prosyst: string | null;
  source: ReservationSource;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Purchase Need ─────────────────────────────────────────────
export type PurchaseNeedUrgency = 'urgent' | 'normal' | 'low';
export type PurchaseNeedStatus  = 'open' | 'in_progress' | 'fulfilled' | 'cancelled';

export interface PurchaseNeed {
  id: string;
  user_id: string;
  machine_code: string;
  machine_name: string | null;
  contract: string;
  production_id: string | null;
  quantity: number;
  urgency: PurchaseNeedUrgency;
  status: PurchaseNeedStatus;
  import_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Import Item (multiple machines per PO) ────────────────────
export interface ImportItem {
  id: string;
  import_id: string;
  machine_code: string;
  machine_name: string | null;
  quantity: number;
  reference: string | null;
  description: string | null;
  reserved_contract: string | null;
  created_at: string;
}
