import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import { createSupabaseAuthClient } from '@/lib/supabaseServer';

export const metadata = {
  title: 'KGN Enterprises | Electric Scooters & EV Showroom in Basavakalyan',
  description:
    'Visit KGN Enterprises on Bus Stand Road, opposite Goke Mastan Scrap Shop, Basavakalyan, Karnataka. Explore electric scooters, discover the latest offers, and book a test ride.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase: supabaseClient } = await createSupabaseAuthClient();

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}