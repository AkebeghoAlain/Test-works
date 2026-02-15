import './globals.css';
import { Navigation } from '../components/layout/nav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-7xl">
          <Navigation />
          <section className="w-full p-4 pb-24 md:pb-4">{children}</section>
        </main>
      </body>
    </html>
  );
}
