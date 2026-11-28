export const metadata = { title: "BISON" };

export default function Home() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>BISON is workspace-specific</h1>
        <p style={{ color: "#64748b" }}>Use the link your organisation gave you — it looks like /your-company/.</p>
      </div>
    </div>
  );
}
