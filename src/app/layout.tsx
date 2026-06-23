import "@/app/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/_components/ThemeProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eli informes diarios",
    template: "%s | Eli informes diarios"
  },
  description: "Dashboard de monitoreo y reportes de pedidos en tiempo real - Grupo Pash",
  openGraph: {
    title: "Eli informes diarios",
    description: "Dashboard de monitoreo y reportes de pedidos en tiempo real - Grupo Pash",
    type: "website"
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" data-theme="dark" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} h-full antialiased font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
