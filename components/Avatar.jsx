"use client";
import { useState } from "react";

export default function Avatar({ id, name, size = 26, fontSize = 10 }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const baseStyle = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", background: "#dbeafe", color: "#1d4ed8",
    fontSize, fontWeight: 700,
  };

  if (failed || !id) {
    return <div style={baseStyle}>{initials}</div>;
  }

  return (
    <div style={baseStyle}>
      <img
        src={`/api/bamboo/photo/${id}`}
        alt={name}
        width={size}
        height={size}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
