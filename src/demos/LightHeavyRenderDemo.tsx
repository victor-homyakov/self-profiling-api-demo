import type {CSSProperties} from "react";
import {useState} from "react";

/** Искусственная задержка в рендере (для «тяжёлого» сценария) */
export function burnCPU(ms: number): void {
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

/**
 * Лёгкий или тяжёлый рендер: искусственная задержка в рендере (INP Scenario content).
 */
export function LightOrHeavyRenderScenario({isHeavy}: {isHeavy: boolean}) {
    const [items, setItems] = useState(() => [...LIGHT_ITEMS]);
    const [selected, setSelected] = useState<string>(LIGHT_ITEMS[0]!);

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
            return items[next]!;
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

export function HeavyModeToggle({isHeavy, onChange}: {isHeavy: boolean; onChange: (heavy: boolean) => void}) {
    return (
        <section style={{marginBottom: 24}}>
            <h3 style={{margin: "0 0 8px", fontSize: "1.1em"}}>Режим рендера</h3>
            <div style={{display: "flex", gap: 8}}>
                <button
                    onClick={() => onChange(false)}
                    style={{...buttonStyle, background: !isHeavy ? "#dbeafe" : undefined}}
                    type="button"
                >
                    Лёгкий рендер
                </button>
                <button
                    onClick={() => onChange(true)}
                    style={{...buttonStyle, background: isHeavy ? "#dbeafe" : undefined}}
                    type="button"
                >
                    Тяжёлый рендер
                </button>
            </div>
        </section>
    );
}
