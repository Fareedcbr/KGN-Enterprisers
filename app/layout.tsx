import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import { createSupabaseAuthClient } from '@/lib/supabaseServer';

export const metadata = {
  title: 'KGN Enterprises - EV Showroom',
  description: 'Premium Electric Vehicle Showroom Management System',
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