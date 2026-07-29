import POSTerminalClient from "./components/POSTerminalClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POS Terminal | Boshqaruvchi AI",
  description: "Professional Point of Sale terminal - Regos-grade POS system",
};

export default function POSTerminalPage() {
  return (
    <div style={{ 
      height: 'calc(100vh - 72px)', 
      overflow: 'hidden',
      margin: '-2.5rem',
    }}>
      <POSTerminalClient />
    </div>
  );
}
