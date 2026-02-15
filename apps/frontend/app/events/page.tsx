const demoEvents = [
  { title: 'Douala Night Festival', city: 'Douala', price: '5,000 XAF' },
  { title: 'Yaoundé Startup Summit', city: 'Yaoundé', price: '15,000 XAF' }
];

export default function EventsPage() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Published Events</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {demoEvents.map((event) => (
          <div key={event.title} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <p>{event.city}</p>
            <p className="font-medium text-brand-600">From {event.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
