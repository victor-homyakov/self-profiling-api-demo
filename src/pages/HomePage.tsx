export function HomePage() {
    return (
        <div>
            <h1>Self-profiling API Demo</h1>
            <h2>Виктор Хомяков</h2>
            <p>Демо для доклада на HolyJS: Self-profiling API → Perfetto → агрегированный Flamegraph.</p>
            <p>
                Live Scenario — <strong>INP</strong>. Load и Scroll — короткий обзор с тем же auto-upload. После записи:
                CLI <code>traces</code>, затем <code>fold</code>, страница Flamegraph.
            </p>
        </div>
    );
}
