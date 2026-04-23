import Header from '@/components/layout/Header';
import NestingTool from '@/components/nesting/NestingTool';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Nesting CNC' };

export default function NestingPage() {
  return (
    <div className="animate-slide-up">
      <Header
        title="Nesting CNC"
        description="Plano de corte inteligente — otimize chapas, exporte DXF e G-code"
      />
      <NestingTool />
    </div>
  );
}
