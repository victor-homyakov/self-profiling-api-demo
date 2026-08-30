import {useMemo} from "react";
import {HardLoadPage, isHardLoadCaptureActive} from "./HardLoadPage";
import {SoftLoadPage} from "./SoftLoadPage";

export function LoadPage() {
    const mode = useMemo(() => (isHardLoadCaptureActive() ? "hard" : "soft"), []);

    return mode === "hard" ? <HardLoadPage /> : <SoftLoadPage />;
}
