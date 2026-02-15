export default function ScannerPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">QR Scanner</h2>
      <div className="rounded-2xl border-2 border-dashed border-brand-500 p-6 text-center">
        <p>Camera scanning area (webcam integration placeholder)</p>
        <p className="mt-4 text-sm text-slate-500">Offline cache mode enabled via service worker for last sync batch.</p>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-lg bg-green-600 p-3 text-white">VALID: Green response</div>
        <div className="rounded-lg bg-orange-500 p-3 text-white">USED: Orange response</div>
        <div className="rounded-lg bg-red-600 p-3 text-white">INVALID: Red response</div>
      </div>
    </div>
  );
}
