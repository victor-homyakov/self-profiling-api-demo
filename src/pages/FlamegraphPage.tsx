import {useCallback, useEffect, useState} from "react";
import {SpeakerHint} from "../components/SpeakerHint";

interface FlamegraphInfo {
    name: string;
    url: string;
    mtimeMs: number;
}

export function FlamegraphPage() {
    const [items, setItems] = useState<FlamegraphInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/flamegraphs");
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = (await response.json()) as {flamegraphs: FlamegraphInfo[]};
            setItems(data.flamegraphs);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = window.setTimeout(() => {
            void refresh();
        }, 0);
        return () => window.clearTimeout(id);
    }, [refresh]);

    return (
        <div>
            <h1>Flamegraph</h1>
            <p>
                Свежие SVG из последнего прогона <code>fold</code> (не галерея overview со слайдов).
            </p>
            <button
                onClick={() => void refresh()}
                style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "1px solid #94a3b8",
                    background: "#f1f5f9",
                    cursor: "pointer",
                    marginBottom: 16,
                }}
                type="button"
            >
                {loading ? "Обновляю…" : "Обновить"}
            </button>
            {!!error && <p style={{color: "#dc2626"}}>{error}</p>}
            {!items.length && !error && !loading && (
                <p style={{color: "#64748b"}}>
                    Пока нет SVG. После Perfetto: <code>npm run process-profile -- fold profiles</code>
                </p>
            )}
            <div style={{display: "flex", flexDirection: "column", gap: 24}}>
                {items.map((item) => (
                    <figure key={item.name} style={{margin: 0}}>
                        <figcaption style={{marginBottom: 8, fontFamily: "monospace", fontSize: "0.85em"}}>
                            {item.name}
                        </figcaption>
                        <img alt={item.name} src={item.url} style={{maxWidth: "100%", border: "1px solid #e2e8f0"}} />
                    </figure>
                ))}
            </div>
            <SpeakerHint>
                Сначала один трейс в Perfetto, потом агрегация → fold → эта страница. Fallback SVG — на слайдах.
            </SpeakerHint>
        </div>
    );
}
