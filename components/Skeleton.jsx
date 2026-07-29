export function SkeletonBlock({ width = "100%", height = 14, style = {} }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonKpiCard() {
  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
      <SkeletonBlock width={28} height={28} style={{ borderRadius: 8, marginBottom: 10 }} />
      <SkeletonBlock width={50} height={20} style={{ marginBottom: 8 }} />
      <SkeletonBlock width={90} height={11} />
    </div>
  );
}

export function SkeletonTableRows({ cols = 5, rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} style={{ borderBottom: "1px solid #f8fafc" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} style={{ padding: "10px 12px" }}>
              <SkeletonBlock height={12} width={c === 0 ? "80%" : "50%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
