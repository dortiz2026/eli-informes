import "@/app/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
    <html lang="es" className="dark h-full">
      <body className={`${plusJakartaSans.variable} bg-black text-white h-full antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
