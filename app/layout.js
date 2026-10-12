import "./globals.css";

export const metadata = {
  title: "Repertório",
  description: "Lista de músicas da banda, com novas sugestões destacadas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
