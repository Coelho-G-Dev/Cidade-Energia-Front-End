"use client";

// Só aparece se o próprio layout raiz quebrar: sem os estilos do app, então as cores vão aqui mesmo.
export default function ErroGeral({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box", background: "#F5F8FC", color: "#0F2240", fontFamily: "system-ui, sans-serif" }}>
        <title>Algo deu errado · Cidade Energia</title>
        <main style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.5rem" }}>Algo deu errado</h1>
          <p style={{ color: "#4B5A72", lineHeight: 1.5 }}>O Cidade Energia não conseguiu abrir. Tente de novo em alguns segundos.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ minHeight: 52, padding: "0 24px", marginTop: "1rem", border: "2px solid #0F2240", borderRadius: 8, background: "#F2B705", color: "#0F2240", font: "inherit", fontWeight: 700, boxShadow: "3px 3px 0 #0F2240", cursor: "pointer" }}
          >
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
