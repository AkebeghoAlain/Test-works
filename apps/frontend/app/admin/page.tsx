export default function AdminPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Admin Control Panel</h2>
      <ul className="list-disc space-y-2 pl-4">
        <li>Approve organizers and monitor event compliance.</li>
        <li>Adjust commission percentage globally.</li>
        <li>Issue refunds and suspend suspicious accounts.</li>
      </ul>
    </div>
  );
}
