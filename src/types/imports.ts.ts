export type ImportStatus = 'pending' | 'ordered' | 'shipped' | 'port' | 'customs' | 'received';

export interface Import {
  id: string;
  user_id: string;
  order_date: string | null;
  po_prosyst: string | null;
  po_rhino: string | null;
  supplier: string | null;
  po_date: string | null;
  code: string | null;
  quantity: number | null;
  description: string | null;
  reference: string | null;
  estimated_shipment: string | null;
  estimated_arrival: string | null;
  status: ImportStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ImportFormData = Omit<Import, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
