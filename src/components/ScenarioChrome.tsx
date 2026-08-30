import type {CSSProperties, ReactNode} from "react";
import type {TProfilerSessionStatus} from "../profiler/useProfilerSession";

const buttonStyle: CSSProperties = {
    background: "#f1f5f9",
    border: "1px solid #94a3b8",
    borderRadius: 6,
    cursor: "pointer",
    padding: "8px 14px",
};

type TRecordingControlsProps = {
    onStart?: () => void;
    onStop?: () => void;
    status: TProfilerSessionStatus;
};

export function RecordingControls({onStart, onStop, status}: TRecordingControlsProps) {
    return (
        <section style={{marginBottom: 24}}>
            <h3 style={{margin: "0 0 8px", fontSize: "1.1em"}}>Self-profiling</h3>
            {onStart || onStop ? (
                <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
                    {onStart ? (
                        <button
                            disabled={
                                status.status === "recording" ||
                                status.status === "stopping" ||
                                status.status === "uploading"
                            }
                            onClick={onStart}
                            style={buttonStyle}
                            type="button"
                        >
                            Старт
                        </button>
                    ) : null}
                    {onStop ? (
                        <button
                            disabled={status.status !== "recording"}
                            onClick={onStop}
                            style={buttonStyle}
                            type="button"
                        >
                            Стоп + upload
                        </button>
                    ) : null}
                </div>
            ) : null}
            <p style={{margin: "8px 0 0", fontSize: "0.9em", color: "#64748b"}}>
                Статус: <strong>{status.status}</strong>
                {status.fileName ? (
                    <>
                        {" "}
                        → <code>{status.fileName}</code>
                    </>
                ) : null}
            </p>
            {status.error ? <p style={{color: "#dc2626", fontSize: "0.85em", marginTop: 8}}>{status.error}</p> : null}
        </section>
    );
}

export function ScenarioLayout({
    children,
    controls,
    description,
    hint,
    title,
}: {
    children: ReactNode;
    controls: ReactNode;
    description: string;
    hint: ReactNode;
    title: string;
}) {
    return (
        <div>
            <h1>{title}</h1>
            <p>{description}</p>
            {controls}
            <section>
                <h3 style={{margin: "0 0 8px", fontSize: "1.1em"}}>Контент</h3>
                {children}
            </section>
            {hint}
        </div>
    );
}

export {buttonStyle};
