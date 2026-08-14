const MODE = import.meta.env.MODE;

export function BuildModeIndicator() {
    return (
        <div
            style={{
                alignItems: "center",
                background: "#e2e8f0",
                borderBottom: "1px solid #cbd5e1",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                padding: "8px 12px",
            }}
        >
            <span>
                <strong>Сборка react-dom:</strong>{" "}
                <code style={{background: "#cbd5e1", padding: "2px 6px", borderRadius: 4}}>{MODE}</code>
            </span>
        </div>
    );
}
