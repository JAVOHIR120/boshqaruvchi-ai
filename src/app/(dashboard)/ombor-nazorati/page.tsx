import { Metadata } from 'next';
import OmborNazoratClient from './components/OmborNazoratClient';

export const metadata: Metadata = {
  title: 'Ombor Nazorati | Boshqaruvchi AI',
  description: 'Mutlaq nazoratdagi ombor boshqaruv tizimi — Prihod, Ko\'chirish, Inventarizatsiya',
};

export default function OmborNazoratPage() {
  return (
    <div style={{ 
      height: 'calc(100vh - 72px)', 
      overflow: 'hidden',
      margin: '-2.5rem',
    }}>
      <OmborNazoratClient />
    </div>
  );
}
