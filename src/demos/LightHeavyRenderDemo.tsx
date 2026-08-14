import type {CSSProperties} from "react";
import {useRef, useState} from "react";
import {Profiler as NativeProfiler} from "../profiler/profiler";

/** Искусственная задержка в рендере (для «тяжёлого» сценария) */
function burnCPU(ms: number): void {
    const end = performance.now() + ms;
    while (performance.now() < end) {
        // busy loop
    }
}

const LIGHT_ITEMS = ["Яблоко", "Банан", "Вишня", "Дыня", "Ежевика", "Инжир"];

function shuffleArray<T>(array: T[]): T[] {
    const length = array.length;
    if (length === 0) {
        return [];
    }

    const result = [...array];
    let index = length;

    while (index) {
        const random = Math.floor(Math.random() * index);
        index--;
        const temp = result[index]!;
        result[index] = result[random]!;
        result[random] = temp;
    }

    return result;
}

export const HEAVY_MS = 50;

/**
 * Лёгкий или тяжёлый рендер: искусственная задержка в рендере.
 * Экспортируется для страницы демо DevTools Performance.
 */
export function LightOrHeavyRenderScenario({isHeavy}: {isHeavy: boolean}) {
    const [items, setItems] = useState(() => [...LIGHT_ITEMS]);
    const [selected, setSelected] = useState<string>(LIGHT_ITEMS[0]);

    if (isHeavy) {
        burnCPU(HEAVY_MS);
    }

    const shuffle = () => {
        setItems((prev) => shuffleArray(prev));
    };

    const selectNext = () => {
        setSelected((prev) => {
            const idx = items.indexOf(prev);
            const next = (idx + 1) % items.length;
            return items[next];
        });
    };

    return (
        <div style={blockStyle}>
            <p style={pStyle}>{isHeavy ? "Тяжёлый рендер" : "Лёгкий рендер"}</p>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12}}>
                <button onClick={shuffle} style={buttonStyle} type="button">
                    Перемешать список
                </button>
                <button onClick={selectNext} style={buttonStyle} type="button">
                    Выбрать следующий
                </button>
            </div>
            <ul style={{listStyle: "none", padding: 0, margin: 0}}>
                {items.map((item) => (
                    <ListItem isHeavy={isHeavy} isSelected={item === selected} item={item} key={item} />
                ))}
            </ul>
        </div>
    );
}

const itemStyle: CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    marginTop: 4,
    padding: "8px 12px",
};

function ListItem({item, isSelected, isHeavy}: {item: string; isSelected: boolean; isHeavy?: boolean}) {
    if (isHeavy) {
        burnCPU(HEAVY_MS);
    }

    return <li style={{...itemStyle, background: isSelected ? "#dbeafe" : "#f8fafc"}}>{item}</li>;
}

const blockStyle: CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
};
const pStyle: CSSProperties = {margin: "0 0 12px", fontSize: "0.9em", color: "#64748b"};
const buttonStyle: CSSProperties = {
    padding: "8px 14px",
    borderRadius: 6,
    border: "1px solid #94a3b8",
    background: "#f1f5f9",
    cursor: "pointer",
};

export function LightHeavyRenderDemo() {
    const [isHeavy, setIsHeavy] = useState(false);
    const [selfProfilingRecording, setSelfProfilingRecording] = useState(false);
    const [selfProfilingError, setSelfProfilingError] = useState<string | null>(null);
    const nativeProfiler = useRef<NativeProfiler | null>(null);

    function startSelfProfiling() {
        setSelfProfilingError(null);
        nativeProfiler.current = new NativeProfiler();
        const started = nativeProfiler.current.start();
        if (!started) {
            setSelfProfilingError(
                "Self-profiling API недоступен. Проверь заголовок Document-Policy: js-profiling " +
                    "(работает только в dev/profiling сборке через npm run dev или npm run preview:profiling).",
            );
            return;
        }
        setSelfProfilingRecording(true);
    }

    function stopSelfProfilingAndDownload() {
        const profile = nativeProfiler.current?.stop();
        setSelfProfilingRecording(false);

        profile
            ?.then((profile) => {
                console.log("[Native Profiler] Профиль:", profile);
                if (!profile) {
                    return;
                }

                const blob = new Blob([profile], {type: "text/plain"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `native-profiler-${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch((error) => {
                console.error("[Native Profiler] Ошибка:", error);
            });
    }

    return (
        <div style={{marginTop: 16}}>
            <section style={{marginBottom: 24}}>
                <h3 style={{margin: "0 0 8px", fontSize: "1.1em"}}>Режим рендера</h3>
                <div style={{display: "flex", gap: 8}}>
                    <button
                        onClick={() => setIsHeavy(false)}
                        style={{...buttonStyle, background: !isHeavy ? "#dbeafe" : undefined}}
                        type="button"
                    >
                        Лёгкий рендер
                    </button>
                    <button
                        onClick={() => setIsHeavy(true)}
                        style={{...buttonStyle, background: isHeavy ? "#dbeafe" : undefined}}
                        type="button"
                    >
                        Тяжёлый рендер
                    </button>
                </div>
            </section>

            <section style={{marginBottom: 24}}>
                <h3 style={{margin: "0 0 8px", fontSize: "1.1em"}}>Self-profiling (экспорт в JSON)</h3>
                <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
                    <button
                        disabled={selfProfilingRecording}
                        onClick={startSelfProfiling}
                        style={buttonStyle}
                        type="button"
                    >
                        Старт Self-profiling
                    </button>
                    <button
                        disabled={!selfProfilingRecording}
                        onClick={stopSelfProfilingAndDownload}
                        style={buttonStyle}
                        type="button"
                    >
                        Стоп и скачать
                    </button>
                    {!!selfProfilingRecording && <span style={{color: "#dc2626", fontWeight: 500}}>Идёт запись…</span>}
                </div>
                {!!selfProfilingError && (
                    <p style={{color: "#dc2626", fontSize: "0.85em", marginTop: 8}}>{selfProfilingError}</p>
                )}
            </section>

            <section>
                <h3 style={{margin: "0 0 8px", fontSize: "1.1em"}}>Контент</h3>
                <LightOrHeavyRenderScenario isHeavy={isHeavy} />
            </section>
        </div>
    );
}
