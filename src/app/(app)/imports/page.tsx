import { getImports } from '@/lib/actions/imports';
import Header from '@/components/layout/Header';
import ImportList from '@/components/imports/ImportList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Importações' };

export default async function ImportsPage() {
  const records = await getImports();

  return (
    <div className="animate-slide-up">
      <Header
        title="Importações"
        description={`${records.length} registros de importação`}
      />
      <ImportList records={records} />
    </div>
  );
}
