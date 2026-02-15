export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">CamTicket Booking Platform</h1>
      <p className="max-w-2xl text-slate-600 dark:text-slate-300">
        Mobile-first event discovery and secure ticket booking for Cameroon with MTN MoMo, Orange Money,
        and future global payment expansion.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {['Book in seconds', 'Encrypted QR verification', 'Organizer wallet + analytics'].map((feature) => (
          <article key={feature} className="rounded-xl bg-white p-4 shadow dark:bg-slate-800">{feature}</article>
        ))}
      </div>
    </div>
  );
}
