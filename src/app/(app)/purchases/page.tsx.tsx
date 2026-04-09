import { getPurchaseNeeds } from '@/lib/actions/reservations';
import Header from '@/components/layout/Header';
import PurchaseNeedsList from '@/components/purchases/PurchaseNeedsList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Necessidades de Compra' };

export default async function PurchasesPage() {
  const needs = await getPurchaseNeeds();
  const open  = needs.filter((n: any) => n.status === 'open').length;

  return (
    <div className="animate-slide-up">
      <Header
        title="Necessidades de Compra"
        description={`${open} necessidade${open !== 1 ? 's' : ''} em aberto`}
      />
      <PurchaseNeedsList needs={needs} />
    </div>
  );
}
