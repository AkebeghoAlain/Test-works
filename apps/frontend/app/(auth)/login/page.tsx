export default function LoginPage() {
  return (
    <form className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 dark:bg-slate-800">
      <h1 className="text-xl font-semibold">Login</h1>
      <input className="w-full rounded border p-2" placeholder="Email" />
      <input className="w-full rounded border p-2" type="password" placeholder="Password" />
      <button className="w-full rounded bg-brand-500 p-2 text-white">Sign in</button>
    </form>
  );
}
