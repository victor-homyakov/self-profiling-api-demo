import type {ReactNode} from "react";
import {StrictMode} from "react";
import {BrowserRouter, Link, Route, Routes} from "react-router-dom";
import {BuildModeIndicator} from "./components/BuildModeIndicator";
import {FlamegraphPage} from "./pages/FlamegraphPage";
import {HomePage} from "./pages/HomePage";
import {InpPage} from "./pages/InpPage";
import {LoadPage} from "./pages/LoadPage";
import {ScrollPage} from "./pages/ScrollPage";

function AppRoutes() {
    return (
        <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<InpPage />} path="/inp" />
            <Route element={<LoadPage />} path="/load" />
            <Route element={<ScrollPage />} path="/scroll" />
            <Route element={<FlamegraphPage />} path="/flamegraph" />
        </Routes>
    );
}

const nav = [
    {path: "/", label: "Главная"},
    {path: "/inp", label: "INP"},
    {path: "/load", label: "Load"},
    {path: "/scroll", label: "Scroll"},
    {path: "/flamegraph", label: "Flamegraph"},
] as const;

function Layout({children}: {children: ReactNode}) {
    return (
        <div style={{display: "flex", minHeight: "100vh"}}>
            <aside
                style={{
                    background: "#fff",
                    borderRight: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 0",
                    width: 200,
                }}
            >
                <nav style={{display: "flex", flexDirection: "column", gap: 2, flex: 1}}>
                    {nav.map(({path, label}) => (
                        <Link key={path} style={{color: "inherit", padding: "8px 16px"}} to={path}>
                            {label}
                        </Link>
                    ))}
                </nav>
                <img alt="QR code" src="/qr-code.png" style={{width: 180, margin: "16px auto", display: "block"}} />
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
