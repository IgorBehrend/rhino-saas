'use client';

export default function NestingTool() {
  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200"
      style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}
    >
      <iframe
        src="/nesting/cortemaster.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="CorteMaster Nesting CNC"
      />
    </div>
  );
}
