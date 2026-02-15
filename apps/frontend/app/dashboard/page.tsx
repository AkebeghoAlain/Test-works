import { RevenueChart } from '../../components/charts/revenue-chart';

const data = [
  { day: 'Mon', revenue: 120000 },
  { day: 'Tue', revenue: 180000 },
  { day: 'Wed', revenue: 240000 },
  { day: 'Thu', revenue: 210000 },
  { day: 'Fri', revenue: 350000 }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Organizer Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Revenue', '2,900,000 XAF'],
          ['Tickets Sold', '842'],
          ['Remaining', '318'],
          ['Used Ratio', '66%']
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <RevenueChart data={data} />
    </div>
  );
}
