import type {CSSProperties} from "react";

const MODE = import.meta.env.MODE;

const barStyle: CSSProperties = {
    alignItems: "center",
    background: "#e2e8f0",
    borderBottom: "1px solid #cbd5e1",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    padding: "8px 12px",
};

export function BuildModeIndicator() {
    return (
        <div style={barStyle}>
            <span>
                <strong>Vite mode:</strong>{" "}
                <code style={{background: "#cbd5e1", padding: "2px 6px", borderRadius: 4}}>{MODE}</code>
                {MODE === "profiling" ? " (react-dom/profiling alias)" : " (обычный production-like бандл)"}
            </span>
        </div>
    );
}
