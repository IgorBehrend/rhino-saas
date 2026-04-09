import { getPurchaseNeeds } from '@/lib/actions/reservations';
import { getMachines } from '@/lib/actions/machines';
import Header from '@/components/layout/Header';
import PurchaseNeedsList from '@/components/purchases/PurchaseNeedsList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Compras' };

export default async function PurchasesPage() {
  const [needs, machines] = await Promise.all([
    getPurchaseNeeds(),
    getMachines(),
  ]);
  const open = needs.filter((n: any) => n.status === 'open').length;

  return (
    <div className="animate-slide-up">
      <Header
        title="Necessidades de Compra"
        description={`${open} em aberto`}
      />
      <PurchaseNeedsList needs={needs} machines={machines} />
    </div>
  );
}
