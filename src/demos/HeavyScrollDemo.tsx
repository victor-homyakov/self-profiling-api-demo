import type {CSSProperties} from "react";
import {useMemo, useState} from "react";
import {burnCPU} from "./LightHeavyRenderDemo";

const ROW_COUNT = 200;
const ROW_HEIGHT = 36;
const VIEWPORT = 320;

const boxStyle: CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    height: VIEWPORT,
    overflow: "auto",
    marginTop: 12,
};

/**
 * Тяжёлый скролл: на каждый видимый ряд — busy-loop (Scroll Scenario content).
 */
export function HeavyScrollDemo() {
    const rows = useMemo(() => Array.from({length: ROW_COUNT}, (_, i) => `Строка ${i + 1}`), []);
    const [scrollTop, setScrollTop] = useState(0);

    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
    const visibleCount = Math.ceil(VIEWPORT / ROW_HEIGHT) + 4;
    const end = Math.min(rows.length, start + visibleCount);

    return (
        <div onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} style={boxStyle}>
            <div style={{height: rows.length * ROW_HEIGHT, position: "relative"}}>
                {rows.slice(start, end).map((label, i) => {
                    const index = start + i;
                    burnCPU(8);
                    return (
                        <div
                            key={label}
                            style={{
                                position: "absolute",
                                top: index * ROW_HEIGHT,
                                left: 0,
                                right: 0,
                                height: ROW_HEIGHT,
                                padding: "8px 12px",
                                borderBottom: "1px solid #f1f5f9",
                                background: index % 2 ? "#f8fafc" : "#fff",
                            }}
                        >
                            {label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
