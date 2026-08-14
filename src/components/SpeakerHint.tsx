import type {ReactNode} from "react";

export function SpeakerHint({children}: {children: ReactNode}) {
    return (
        <aside
            style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 8,
                fontSize: "0.95em",
                marginTop: 24,
                padding: 16,
            }}
        >
            <strong style={{display: "block", marginBottom: 8, color: "#0369a1"}}>Подсказка</strong>
            {children}
        </aside>
    );
}
