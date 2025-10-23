import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export const metadata = {
  title: 'criar.AI anúncios - Conteúdo de marketing com IA',
  description: 'Crie anúncios profissionais com inteligência artificial',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Container de notificações que aparecerão no topo e centro */}
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </body>
    </html>
  );
}