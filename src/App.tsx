import type {ReactNode} from "react";
import {StrictMode} from "react";
import {BrowserRouter, Link, Route, Routes} from "react-router-dom";
import {BuildModeIndicator} from "./components/BuildModeIndicator";
import {HomePage} from "./pages/HomePage";
import {ProfilerPage} from "./pages/ProfilerPage";

function AppRoutes() {
    return (
        <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<ProfilerPage />} path="/profiler" />
            {/*TODO <Route element={<FlamegraphPage />} path="/flamegraph" />*/}
        </Routes>
    );
}

const nav = [
    {path: "/", label: "Главная"},
    {path: "/profiler", label: "1. Self-profiling API"},
    {path: "/flamegraph", label: "2. Flame Graph"},
] as const;

function Layout({children}: {children: ReactNode}) {
    return (
        <div style={{display: "flex", minHeight: "100vh"}}>
            <aside
                style={{
                    background: "#fff",
                    borderRight: "1px solid #e2e8f0",
                    padding: "16px 0",
                    width: 200,
                }}
            >
                <nav style={{display: "flex", flexDirection: "column", gap: 2}}>
                    {nav.map(({path, label}) => (
                        <Link key={path} style={{color: "inherit", padding: "8px 16px"}} to={path}>
                            {label}
                        </Link>
                    ))}
                </nav>
                <img
                    alt="QR code"
                    src="/qr-code.png"
                    style={{width: 180, margin: "auto auto 16px", display: "block"}}
                />
            </aside>
            <main style={{flex: 1, padding: 24, overflow: "auto"}}>{children}</main>
        </div>
    );
}

export default function App() {
    return (
        <StrictMode>
            <BrowserRouter>
                <Layout>
                    <BuildModeIndicator />
                    <AppRoutes />
                </Layout>
            </BrowserRouter>
        </StrictMode>
    );
}
