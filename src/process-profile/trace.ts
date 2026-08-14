/**
 * Формат trace: https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU
 *
 * https://perfetto.dev/docs/faq#why-does-perfetto-not-support-lt-some-obscure-json-format-feature-gt-
 *
 * [
 * {"name": "someFn", "cat": "PERF", "ph": "b", "pid": 1, "tid": 2, "ts": 29},
 * {"name": "someFn", "cat": "PERF", "ph": "e", "pid": 1, "tid": 2, "ts": 33},
 * ]
 *
 * Пример:
 *
 * const critPath = new Trace();
 * critPath.setProcessMetadata(1, 'Widget processor', 1);
 * critPath.setProcessMetadata(2, 'Awaits in processor', 2);
 * critPath.setProcessMetadata(3, 'Render', 3);
 * critPath.setThreadMetadata(3, 'render');
 * critPath.setProcessMetadata(4, 'Write', 4);
 * critPath.setProcessMetadata(5, 'Delays render→write', 5);
 * for (const widget of widgets) {
 *     critPath.setThreadMetadata(1, widget.id);
 *     critPath.completeEvent(widget.id, 'await widget.create', 'writeBegin→writeWidgetCreated', timings.writeBegin, timings.writeWidgetCreated);
 *     critPath.asyncEvent(widget.id, 'write not rendered', 'writeBegin→renderStarted||rendered', timings.writeBegin, timings.renderStarted, 2);
 *     critPath.completeEvent('render', widget.id, 'renderStarted→rendered', timings.renderStarted, timings.rendered, 3);
 *     critPath.asyncEvent(widget.id, '', 'renderStarted→rendered', timings.renderStarted, timings.rendered, 3);
 *     critPath.asyncEvent('render', widget.id, 'renderStarted→rendered', timings.renderStarted, timings.rendered, 3);
 * }
 * fs.writeFileSync(critPathFileName, critPath.toJSON());
 *
 * В браузере открываем https://ui.perfetto.dev/ и загружаем туда полученный файл json
 */

export interface ITraceEventArgs {
    [key: string]: number | string;
}

/**
 * Метаданные для процесса.
 */
interface ITraceEventMP {
    name: "process_name" | "process_sort_index";
    ph: "M";
    pid: number;
    args?: ITraceEventArgs & {sort_index?: number};
}

/**
 * Метаданные для потока.
 */
interface ITraceEventMT {
    name: "thread_name" | "thread_sort_index";
    ph: "M";
    pid: number;
    tid: number;
    args?: ITraceEventArgs;
}

/**
 * Начало или конец асинхронного события.
 */
interface ITraceEventBE {
    /** Имя события, например, 'someFn' */
    name: string;
    /** Категория события, например, 'PERF' */
    cat: string;
    ph: "b" | "e";
    /** ID процесса, например, 1 */
    pid: number;
    /** ID потока, например, 2 */
    id: number;
    /** Время события, например, 29 */
    ts: number;
    /** Аргументы события, например, { name: 'someFn' } */
    args?: ITraceEventArgs;
}

/**
 * Событие
 */
interface ITraceEventX {
    /** Имя события, например, 'someFn' */
    name: string;
    /** Категория события, например, 'PERF' */
    cat: string;
    ph: "X";
    /** ID процесса, например, 1 */
    pid: number;
    /** ID потока, например, 2 */
    tid: number;
    /** Длительность события, например, 10 */
    dur: number;
    /** Время события, например, 29 */
    ts: number;
    args?: ITraceEventArgs;
}

export class Trace {
    threadIds: Map<string, number> = new Map();
    trace: (ITraceEventBE | ITraceEventMP | ITraceEventMT | ITraceEventX)[] = [];

    /**
     * Thread ID должен быть уникальным в пределах одного trace.
     * Один и тот же thread ID не может находиться в нескольких pid.
     */
    getThreadId(pid: number, threadName: string): number {
        const threadIds = this.threadIds;
        const key = `${pid}:${threadName}`;

        if (threadIds.has(key)) {
            return threadIds.get(key) as number;
        }

        const nextId = threadIds.size + 1;

        threadIds.set(key, nextId);

        return nextId;
    }

    /**
     * Async event в терминологии trace format. Важно: у async event отсутствует thread id.
     * Поэтому задать читабельный thread_name через meta info не получится.
     *
     * @param threadName имя потока
     * @param eventName имя события
     * @param args аргументы события
     * @param b начало события
     * @param e конец события
     * @param pid
     */
    asyncEvent(threadName: string, eventName: string, args: ITraceEventArgs, b: number, e: number, pid = 1) {
        const trace = this.trace;
        const id = this.getThreadId(pid, threadName);
        let name = eventName;
        const hasBegin = typeof b !== "undefined";
        const hasEnd = typeof e !== "undefined";

        if (hasBegin && hasEnd) {
            if (b > e) {
                console.info(`${name} - begin ${b} is greater than end ${e}`);
            }

            trace.push({name, cat: "PERF", ph: "b", ts: b * 1000, pid, id, args});
            trace.push({name, cat: "PERF", ph: "e", ts: e * 1000, pid, id, args});
        } else if (hasBegin) {
            console.info(`${name} - missing end timing`);
            name = `${name} (missing end timing)`;
            trace.push({name, cat: "PERF", ph: "b", ts: b * 1000, pid, id, args});
            trace.push({name, cat: "PERF", ph: "e", ts: (b + 10) * 1000, pid, id, args});
        } else if (hasEnd) {
            console.info(`${name} - missing begin timing`);
            name = `${name} (missing begin timing)`;
            trace.push({name, cat: "PERF", ph: "b", ts: (e - 10) * 1000, pid, id, args});
            trace.push({name, cat: "PERF", ph: "e", ts: e * 1000, pid, id, args});
        } else {
            // console.info(`${name} - missing timings`);
        }
    }

    /**
     * @param threadName имя потока
     * @param eventName имя события
     * @param args аргументы события
     * @param b начало события
     * @param e конец события
     * @param pid
     */
    completeEvent(threadName: string, eventName: string, args: ITraceEventArgs, b: number, e: number, pid = 1) {
        const trace = this.trace;
        const tid = this.getThreadId(pid, threadName);
        const name = eventName;
        const hasBegin = typeof b !== "undefined";
        const hasEnd = typeof e !== "undefined";

        if (hasBegin && hasEnd && b < e) {
            trace.push({name, cat: "PERF", ph: "X", ts: b * 1000 + 1, dur: (e - b) * 1000 - 2, pid, tid, args});
        }
    }

    /**
     * There are currently 5 possible metadata items that can be provided:
     * - process_name: Sets the display name for the provided pid. The name is provided in a `name` argument.
     * - process_labels: Sets the extra process labels for the provided pid. The label is provided in a `labels` argument.
     * - process_sort_index: Sets the process sort order position. The sort index is provided in a `sort_index` argument.
     * - thread_name: Sets the name for the given tid. The name is provided in a `name` argument.
     * - thread_sort_index: Sets the thread sort order position. The sort index is provided in a `sort_index` argument.
     *
     * https://github.com/google/perfetto/blob/7ea611630251eadccba644ab23e2f59369905f2a/src/trace_processor/importers/json/json_trace_parser.cc#L326
     *
     * Perfetto UI обрабатывает только process_name и thread_name.
     *
     * @param {number} pid
     * @param {string} processName
     * @param {number} sortIndex
     */
    setProcessMetadata(pid: number, processName: string, sortIndex: number) {
        this.trace.push({name: "process_name", ph: "M", pid, args: {name: processName}});
        this.trace.push({name: "process_sort_index", ph: "M", pid, args: {sort_index: sortIndex}});
    }

    setThreadMetadata(pid: number, threadName: string) {
        const tid = this.getThreadId(pid, threadName);

        this.trace.push({name: "thread_name", ph: "M", pid, tid, args: {name: threadName}});
    }

    toJSON() {
        return JSON.stringify({traceEvents: this.trace});
    }
}
