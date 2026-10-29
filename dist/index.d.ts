/**
 * lightweight-charts-drawing 0.2
 *
 * TradingView-style drawing tools for lightweight-charts v5, built on a shared
 * drawing core (src/core: tool model + TradingView factory defaults, hit tests,
 * placement / drag rules, renderer-neutral scenes) and a canvas runtime
 * (src/runtime: DrawingManager).
 *
 * @packageDocumentation
 */

import { CreatePriceLineOptions } from 'lightweight-charts';
import { IChartApi } from 'lightweight-charts';
import { IPriceLine } from 'lightweight-charts';
import { ISeriesApi } from 'lightweight-charts';
import { ISeriesPrimitiveAxisView } from 'lightweight-charts';
import { SeriesType } from 'lightweight-charts';
import { Time } from 'lightweight-charts';

export declare const ANCHORABLE_KINDS: Set<string>;

/** Direction-aware resize cursor for an anchor: the angle from the drawing's
 *  centroid to the anchor picks ew/ns/nesw/nwse (TV's anchorResizeCursorType).
 *  Single-anchor drawings keep the grab cursor. */
export declare function anchorCursor(p: Pt, pts: Pt[]): string;

export declare type AnchorStyle = {
    /** Chart background at a y (the anchor fill). */
    fillAt: (y: number) => string;
    /** The owner drawing is selected (TV: ring stroke 2, else 1). */
    selected: boolean;
    /** Index of the hovered anchor in its anchors item (TV 20% halo), or -1. */
    hovered?: number;
};

/** Given the current cursor + drag state, compute the updated drawing.
 *  `snap` is the price-axis snap fn used when magnet is on; pass the
 *  identity function (`(p) => p`) when off. */
export declare function applyDrag(state: DragState, cursor: Pt, coords: Coords, snap: (p: DataPoint) => DataPoint, constrain?: boolean): Drawing | null;

/** ---------- placement helpers ---------- */
export declare function buildNewDrawing(kind: DrawingKind, pts: DataPoint[]): NewDrawing | null;

/** Put an image the host just stored into the cache (no reload). */
export declare function cacheImage(name: string, img: LoadedImage): void;

export declare type CanvasSceneOptions = {
    /** Font family of scene text without its own family (the chart font). */
    fontFamily: string;
    anchors: AnchorStyle;
    /** Called when an image / glyph used by the scene finishes loading (the
     *  caller redraws). */
    onAsyncLoad?: () => void;
};

export declare type Coords = {
    priceToY: (p: number) => number | null;
    yToPrice: (y: number) => number | null;
    /** TRUE while the series' price scale is logarithmic — gates the fib tools'
     *  "levels based on log scale" option (TV applies it only on a log scale). */
    isLog: () => boolean;
    timeToX: (t: Time) => number | null;
    xToTime: (x: number) => Time | null;
    /** Bar nearest a given time, used by the magnet snap. Returns null if
     *  no data has loaded yet. */
    barAt: (t: Time) => OHLC | null;
    /** Integer bar index (logical position, 0 = first loaded bar) for a time —
     *  the "Bar" value shown in the drawing settings' Coordinates tab. Negative
     *  before the first bar, ≥ length in the future. Null with no data. */
    timeToBarIndex: (t: Time) => number | null;
    /** Inverse of timeToBarIndex: the time at an integer bar index (extrapolated
     *  with the median bar interval outside the loaded range). Null with no data. */
    barIndexToTime: (i: number) => Time | null;
    /** The full current OHLC(V) array — used by the data-driven drawings
     *  (regression-trend, anchored-vwap, volume-profile) to compute over the
     *  bars in their selected range. */
    bars: () => OHLC[];
    /** Times (epoch seconds) of the first and last bar in view, or null with no
     *  data. Lets data-driven drawings project only the visible slice. */
    visibleTimeRange: () => {
        from: number;
        to: number;
    } | null;
    /** Price-pane overlay-indicator values at a given bar time — extra snap
     *  candidates for the magnet's "Snap to indicator" mode. Empty when no
     *  overlay study is active (or the accessor wasn't wired). */
    indicatorValuesAt: (t: Time) => number[];
    /** Smallest price increment for the series (the series' `priceFormat.minMove`,
     *  e.g. 0.01 for cent-quoted stocks). Used to convert a price delta into pips
     *  for the line-family stats badge. Falls back to 0.01. */
    pipSize: () => number;
    /** Create a right-axis price pill (a lightweight-charts price line, body
     *  hidden) for drawings with `showPriceLabels`. Returns the handle so the
     *  caller can update (`applyOptions`) or remove it. */
    addPriceLine: (opts: CreatePriceLineOptions) => IPriceLine;
    removePriceLine: (line: IPriceLine) => void;
    /** Zoom the chart to a screen-space rectangle (the "Zoom in" drag tool):
     *  sets the visible time (logical) range and the price-scale range to the
     *  dragged box. Price-axis zoom switches the scale to manual (autoScale off). */
    zoomToScreenRect: (x1: number, x2: number, y1: number, y2: number) => void;
    /** The chart's own time label text for a bar time (the crosshair
     *  `localization.timeFormatter`: TV weekday / date format / time). */
    formatTime: (t: Time) => string;
    /** Time-axis strip metrics: height and width (px) and the axis font. */
    timeAxis: () => {
        height: number;
        width: number;
        fontSize: number;
        fontFamily: string;
    };
    /** The chart's display time zone and whether its interval is intraday
     *  (bar times are UTC epoch seconds shown in that zone). */
    timeInfo: () => {
        timeZone: string;
        intraday: boolean;
    };
    /** Lower-timeframe bars of the chart symbol (volume profile drawings); optional. */
    lowerTimeframe?: LowerTimeframe;
};

declare type Ctx = CanvasRenderingContext2D;

export declare type DataPoint = {
    time: Time;
    price: number;
};

export declare function decodeImage(url: string): Promise<LoadedImage>;

/** Universal fallback style — the TradingView factory base (its trend-line
 *  defaults: blue, 1px, solid). Per-tool overrides live in each spec's
 *  `defaults` (see specs.ts `defaultStyleFor`); a kind with no override gets
 *  this. Most tools inherit 1px; the heavier line/shape tools override to 2px. */
export declare const DEFAULT_STYLE: DrawingStyle;

/** Resolve a fresh drawing's style: DEFAULT_STYLE merged with the kind's
 *  per-tool overrides. Used both when committing a new drawing and when
 *  rendering the live placement preview, so the in-progress draw looks exactly
 *  like the finished one (TV behaviour). */
export declare function defaultStyleFor(kind: DrawingKind): DrawingStyle;

export declare type DragState = {
    id: string;
    start: Drawing;
    startCursor: Pt;
    /** Each stored point projected to screen at drag start (SVG-local). */
    startScreen: Pt[];
    mode: HitResult;
    active: boolean;
    /** Multi-select body drag: every selected drawing captured at drag start
     *  (the hit drawing included) — the whole group translates together. */
    group?: {
        start: Drawing;
        startScreen: Pt[];
    }[];
    /** Ctrl was held on a body press: a bare click (no drag) toggles selection
     *  membership on release; crossing the drag threshold clones instead. */
    pendingToggle?: boolean;
    /** Plain click on a member of a multi-selection: a bare click collapses the
     *  selection to just that drawing on release (a drag moves the group). */
    pendingCollapse?: boolean;
    /** Pane size at drag start (anchored drawings store pane fractions). */
    pane?: {
        w: number;
        h: number;
    };
};

export declare type Drawing = WithId<OnePoint | TwoPoint | ThreePoint | FourPoint | PolyPoint | GhostFeedPoint>;

export declare function drawingAxisLabels(d: Drawing, pts: Pt[], coords: Coords): {
    price: PriceAxisLabel[];
    time: TimeAxisLabel[];
};

export declare type DrawingKind = "horizontal-line" | "horizontal-ray" | "vertical-line" | "cross-line" | "arrow-marker" | "arrow-mark-up" | "arrow-mark-down" | "price-label" | "flag-mark" | "trend-line" | "ray" | "extended-line" | "info-line" | "trend-angle" | "long-position" | "short-position" | "gann-fan" | "gann-box" | "fib-time-zone" | "fib-circles" | "fib-speed-resistance-fan" | "fib-speed-resistance-arcs" | "fib-spiral" | "fib-wedge" | "pitchfan" | "cyclic-lines" | "sine-line" | "time-cycles" | "arrow" | "rectangle" | "circle" | "ellipse" | "fib-retracement" | "price-range" | "date-range" | "date-and-price-range" | "position-forecast" | "bar-pattern" | "ghost-feed" | "triangle" | "parallel-channel" | "pitchfork" | "schiff-pitchfork" | "modified-schiff-pitchfork" | "inside-pitchfork" | "trend-based-fib-extension" | "trend-based-fib-time" | "gann-square-fixed" | "gann-square" | "sector" | "disjoint-channel" | "flat-top-bottom" | "fib-channel" | "rotated-rectangle" | "curve" | "arc" | "double-curve" | "abcd-pattern" | "xabcd-pattern" | "cypher-pattern" | "head-and-shoulders" | "triangle-pattern" | "three-drives-pattern" | "elliott-impulse" | "elliott-correction" | "elliott-triangle" | "elliott-double-combo" | "elliott-triple-combo" | "polyline" | "path" | "brush" | "highlighter" | "text" | "note" | "pin" | "comment" | "price-note" | "signpost" | "callout" | "font-icon" | "table" | "image" | "regression-trend" | "anchored-vwap" | "fixed-range-volume-profile" | "anchored-volume-profile";

export declare class DrawingManager {
    private readonly chart;
    private readonly series;
    private readonly opts;
    private readonly coords;
    private readonly primitive;
    private readonly el;
    private readonly listeners;
    private list;
    private selected;
    /** TV "Hide all drawings": off = nothing is drawn or hit (not saved). */
    private visible;
    private hovered;
    private spec;
    private glyph;
    private pending;
    private cursor;
    private gesture;
    /** TV table UI of the selected table: active cell, open editor, hovered
     *  resize edge. */
    private tableUi;
    /** Cursor over the hovered drawing (TV: pointer, move when selected,
     *  resize cursors on anchors and table edges), null = the chart's own. */
    private hoverCursor;
    private shift;
    private ctrl;
    private savedScroll;
    private readonly off;
    constructor(chart: IChartApi, series: ISeriesApi<SeriesType>, opts?: DrawingManagerOptions);
    on(event: "change", cb: DrawingManagerEvents["change"]): () => void;
    on(event: "add", cb: DrawingManagerEvents["add"]): () => void;
    on(event: "update", cb: DrawingManagerEvents["update"]): () => void;
    on(event: "remove", cb: DrawingManagerEvents["remove"]): () => void;
    on(event: "selection", cb: DrawingManagerEvents["selection"]): () => void;
    on(event: "tool", cb: DrawingManagerEvents["tool"]): () => void;
    on(event: "visibility", cb: DrawingManagerEvents["visibility"]): () => void;
    on(event: "textEdit", cb: DrawingManagerEvents["textEdit"]): () => void;
    on(event: "gestureEnd", cb: DrawingManagerEvents["gestureEnd"]): () => void;
    on(event: "tableEdit", cb: DrawingManagerEvents["tableEdit"]): () => void;
    /** Arm a tool (a DrawingKind of the core specs) or disarm (null). `glyph`:
     *  the font-icon glyph to place. */
    setTool(kind: DrawingKind | null, o?: {
        glyph?: string;
    }): void;
    tool(): DrawingKind | null;
    setMagnet(mode: MagnetMode): void;
    setInterval(interval: string | undefined): void;
    /** TV "Hide all drawings": hide / show every drawing without touching
     *  them (the drawings' own `hidden` flag and the saved JSON stay as they
     *  are). Hiding disarms the tool and clears the selection. */
    setDrawingsVisible(visible: boolean): void;
    drawingsVisible(): boolean;
    setStayInDrawingMode(on: boolean): void;
    drawings(): readonly Drawing[];
    get(id: string): Drawing | undefined;
    /** Add a drawing (default style of its kind when none); returns its id. */
    add(nd: NewDrawing | Drawing): string;
    update(d: Drawing): void;
    /** Hide / show one drawing (its `hidden` flag, saved with it): a hidden
     *  drawing is not drawn, hit or selected. */
    setHidden(id: string, hidden: boolean): void;
    remove(id: string): void;
    clear(): void;
    /** Z-order (TV Visual order): the list order is the draw order. */
    bringToFront(id: string): void;
    sendToBack(id: string): void;
    select(ids: readonly string[]): void;
    selection(): readonly string[];
    /** TV image: placed at the pane centre at its initial size (a quarter of
     *  the pane at most) and selected. The file must be known to the core
     *  image cache (cacheImage / setImageReader) under `name`. */
    addImage(img: {
        name: string;
        width: number;
        height: number;
        transparency?: number;
    }): string | null;
    /** TV "Anchor drawing" (text, pin, table): an anchored drawing keeps its
     *  pane position when the chart scrolls; toggling back turns it into a
     *  time / price point again. Returns whether the drawing changed. */
    toggleAnchored(id: string): boolean;
    /** The table UI state (active cell, editor open, hovered edge) or null. */
    tableState(): TableUi | null;
    setTableCellText(id: string, cell: TableCellRef, text: string): void;
    /** The cell editor closed (the cell stays active). */
    endTableEdit(): void;
    /** TV table context actions on the active cell (insert after it, or at the
     *  end without one; remove its row / column). */
    tableOp(id: string, op: TableOp): void;
    /** The drawings as JSON (the core Drawing model). */
    exportJSON(): string;
    /** Replace the drawings from JSON (string or parsed): entries are checked
     *  and migrated (core parseDrawings); returns how many were loaded. */
    importJSON(json: string | unknown): number;
    /** Redraw on the next frame (the chart repaints the primitive). */
    redraw(): void;
    destroy(): void;
    /** Every visible drawing, then the placement preview, as scenes in pane
     *  coordinates, with the anchor state of their drawing (TV ring stroke 2
     *  when selected, the hovered anchor's halo). */
    scenes(w: number, h: number): {
        scene: Scene;
        selected: boolean;
        hoveredAnchor: number;
    }[];
    /** Axis labels of the visible drawings (core drawingAxisLabels) as
     *  lightweight-charts axis views: prices formatted by the series, times by
     *  the chart's time formatter. */
    axisViews(): {
        price: ISeriesPrimitiveAxisView[];
        time: ISeriesPrimitiveAxisView[];
    };
    /** The cursor at a pane point, for the primitive hitTest (lightweight-
     *  charts shows it): crosshair while a tool is armed, the hovered
     *  drawing's cursor, else null (the chart's own). */
    hoveredId(): string | null;
    cursorAt(): string | null;
    fontFamily(): string;
    /** Chart background at a y (the anchor fill). */
    backgroundAt(y: number, h: number): string;
    private listen;
    private emit;
    private changed;
    private reorder;
    private shown;
    /** Drawings that are no longer shown leave the selection and the hover:
     *  Delete must not remove a drawing the user cannot see. */
    private dropHidden;
    private paneSize;
    /** Pointer position in pane coordinates. */
    private panePoint;
    private magnet;
    private snapFn;
    private dataAt;
    /** The magnet-snapped aim point of the preview (x and y lock onto the
     *  candle when the magnet engages). */
    private aimAt;
    private hitTopmost;
    private setHover;
    /** Take the pointer gesture from the chart: no pan / zoom until release. */
    private holdChart;
    private releaseChart;
    private onKey;
    private onHover;
    private onPointerDown;
    private onDoubleClick;
    private placementClick;
    private finishVariable;
    /** TV selects every new drawing once placed; text tools ask the host for
     *  their editor. */
    private placeNew;
    private afterPlacement;
    /** Brush / highlighter: press, drag (a vertex every FREEHAND_SAMPLE_PX),
     *  release commits (no magnet, like TV). */
    private startFreehand;
    private selectionDown;
    private dragMove;
    private endGesture;
    private openCell;
    private toggle;
    /** The live placement preview: the real tool with the cursor standing in
     *  for the unplaced points (TV), the real freehand stroke, or the segment
     *  rubber band (patterns, Elliott, variable-length tools). */
    private previewScene;
}

export declare type DrawingManagerEvents = {
    /** The drawing list changed (add / update / remove / import / clear). */
    change: (drawings: readonly Drawing[]) => void;
    add: (d: Drawing) => void;
    update: (d: Drawing, prev: Drawing) => void;
    remove: (d: Drawing) => void;
    selection: (ids: readonly string[]) => void;
    /** The armed tool changed (null = none). */
    tool: (kind: DrawingKind | null) => void;
    /** Every drawing was hidden or shown again (setDrawingsVisible, or a tool
     *  armed while they were hidden). */
    visibility: (visible: boolean) => void;
    /** A text tool was placed (or double-clicked): the host opens its editor
     *  at `screen` (pane coordinates) and calls update with the text. */
    textEdit: (d: Drawing, screen: Pt) => void;
    /** A drag / placement gesture ended (undo coalescing). */
    gestureEnd: () => void;
    /** A click on a cell of a selected table (TV in-place editing): the host
     *  opens its editor over `box` (pane coordinates) and calls
     *  setTableCellText; endTableEdit when it closes. */
    tableEdit: (d: Drawing, cell: TableCellRef, box: {
        left: number;
        top: number;
        width: number;
        height: number;
    }) => void;
};

export declare type DrawingManagerOptions = {
    /** The bars of the series (magnet, data-driven tools, positions). Default:
     *  the series data (OHLC series; line series use `value` for all four). */
    bars?: () => OHLC[];
    /** Chart font for the drawings' text. Default: the chart layout font. */
    fontFamily?: string;
    /** Magnet (TV weak / strong OHLC snap). Default "off". */
    magnet?: MagnetMode;
    /** Chart interval for the per-interval visibility of drawings (TV
     *  Visibility tab), e.g. "30", "1D". Unset = every drawing shown. */
    interval?: string;
    /** Time zone / intraday flag for dates in labels. Default UTC, intraday. */
    timeInfo?: () => {
        timeZone: string;
        intraday: boolean;
    };
    /** Keep the tool armed after a placement (TV "Keep drawing"). */
    stayInDrawingMode?: boolean;
};

export declare type DrawingStyle = {
    color: string;
    width: number;
    lineStyle: LineStyle;
    /** Colour for text labels (price/time labels, on-line text). Mirrors TV's
     *  `textColor`. Optional so existing drawings & non-text kinds are
     *  unaffected; renderers fall back to `color` when unset. */
    textColor?: string;
    /** Extend the line past p1/p2 to the pane edge. Mirrors TV `extendLeft`/
     *  `extendRight`. Ray defaults to right-only, extended-line to both; when a
     *  flag is unset the renderer uses the kind's intrinsic default (renderKind). */
    extendLeft?: boolean;
    extendRight?: boolean;
    /** Small filled dot at the segment midpoint. TV `showMiddlePoint`. */
    showMiddlePoint?: boolean;
    /** Endpoint caps: 0 = none, 1 = arrowhead. TV `leftEnd` / `rightEnd`. */
    leftEnd?: number;
    rightEnd?: number;
    /** On-line text label + its font styling. TV `text`/`fontsize`/`bold`/
     *  `italic`. Empty text renders nothing. */
    text?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    /** Label anchor. TV `horzLabelsAlign` / `vertLabelsAlign`. */
    horzLabelsAlign?: "left" | "center" | "right";
    vertLabelsAlign?: "top" | "middle" | "bottom";
    /** Floating stats badge near the midpoint (price/percent/pips · bars/
     *  duration/distance · angle), each row gated by a granular flag. TV
     *  `alwaysShowStats` + the `show*` flags. */
    showStats?: boolean;
    /** TV statsPosition: 0 Left (p0), 1 Center (middle), 2 Right (p1), 3 Auto
     *  (middle, kept in the pane and off the line). Unset = the TV factory
     *  value of the kind (info line 1, other line tools 2). */
    statsPosition?: 0 | 1 | 2 | 3;
    showPriceRange?: boolean;
    showPercentPriceRange?: boolean;
    showPipsPriceRange?: boolean;
    showBarsRange?: boolean;
    showDateTimeRange?: boolean;
    showDistance?: boolean;
    showAngle?: boolean;
    /** Fib level tools (TV): level texts on / their alignment (retracement,
     *  extension; factory on, centre / middle), full circles (speed arcs),
     *  counterclockwise (spiral), pitchfork lines extended backwards
     *  (extendLines). */
    showText?: boolean;
    horzTextAlign?: "left" | "center" | "right";
    vertTextAlign?: "top" | "middle" | "bottom";
    fullCircles?: boolean;
    counterclockwise?: boolean;
    extendLines?: boolean;
    /** Range tools (TV): extend top / bottom (date range), volume stat,
     *  label background (fillLabelBackground / labelBackgroundColor), border
     *  width (date and price range border). */
    extendTop?: boolean;
    extendBottom?: boolean;
    showVolume?: boolean;
    fillLabelBackground?: boolean;
    labelBackgroundColor?: string;
    borderWidth?: number;
    /** Text tools (TV drawBorder / wordWrap / wordWrapWidth): a border around
     *  the text box, and wrapping at a fixed width (text, callout). */
    drawBorder?: boolean;
    wordWrap?: boolean;
    wordWrapWidth?: number;
    /** Signpost (TV showImage / plateColor / position): the emoji pin and its
     *  colour; `signpostPosition` = the label's vertical place in the pane in
     *  percent (TV `position`, factory 50). */
    showImage?: boolean;
    plateColor?: string;
    signpostPosition?: number;
    /** Vertical line "Extend" (extendLine, factory on): the line runs
     *  through every pane of the chart; off = its own pane only. */
    extendLine?: boolean;
    /** TV vertical line text orientation (factory vertical). */
    textOrientation?: "vertical" | "horizontal";
    /** TV Elliott waves "Wave" (showWave, factory on): the wave lines; off =
     *  the labels only. */
    showWave?: boolean;
    /** Right-axis price pill at each endpoint (rendered via the chart's price
     *  scale, not SVG). TV `showPriceLabels`. */
    showPriceLabels?: boolean;
    /** Time-axis label at the foot of a vertical-line / cross-line. TV `showTime`. */
    showTime?: boolean;
    /** Whether the shape interior is filled. TV `fillBackground`. */
    fillBackground?: boolean;
    /** Fill colour, independent of the stroke `color`. TV `backgroundColor`.
     *  Falls back to `color` when unset. */
    backgroundColor?: string;
    /** Fill transparency on TV's 0-100 scale (higher = more transparent).
     *  Rendered opacity = (100 - transparency) / 100. Unset → legacy 0.08. */
    transparency?: number;
    levels?: LevelDef[];
    /** Mirror the level ladder (TV `reverse`, fib retracement/extension). */
    reverse?: boolean;
    /** Fib retracement: label levels as percentages ("61.8%" instead of
     *  "0.618"). Settings "Levels as percents" checkbox. */
    fibLevelsAsPercents?: boolean;
    /** Fib retracement / trend-based extension: interpolate the level PRICES in
     *  ln(price) space (TV `fibLevelsBasedOnLogScale`). Like TV's `isLog()`
     *  gate, only in effect while the chart's price scale is logarithmic. */
    fibLevelsBasedOnLogScale?: boolean;
    stopLevel?: number;
    profitLevel?: number;
    /** Risk inputs driving the Qty readout: qty = accountSize·risk% / (stop ·
     *  lotSize). Mirrors TV's accountSize / risk / lotSize (factory 1000/25/1). */
    accountSize?: number;
    riskPercent?: number;
    lotSize?: number;
    /** TV riskDisplayMode: risk as a percent of the account (factory) or as a
     *  money amount (`riskAmount`, capped at the account size). */
    riskDisplayMode?: "percents" | "money";
    riskAmount?: number;
    /** TV leverage (factory 10000): qty is capped at leverage · account / entry. */
    leverage?: number;
    /** TV qtyPrecision: "default" (stocks: floor) or "0".."10" decimals. */
    qtyPrecision?: string;
    /** Position colours (TV stopBackground / profitBackground + their
     *  transparency, factory #F23645 / #089981 at 80): zones and stop /
     *  target lines at (100 − transparency)%, labels opaque. */
    stopColor?: string;
    stopTransparency?: number;
    targetColor?: string;
    targetTransparency?: number;
    /** TV infoBlocks (Stats): the parts shown in the target / middle / stop
     *  labels; unset keys = the TV factory (all on except TP PL / SL PL). */
    positionStats?: Partial<Record<PositionStatKey, boolean>>;
    /** TV compact stats mode. */
    compactStats?: boolean;
    tableCells?: string[][];
    tableColWidths?: number[];
    tableRowHeights?: number[];
    /** Parallel channel: the dashed middle line (TV shows it by default). */
    middleLine?: boolean;
    /** Rectangle middle line (TV `middleLine`: showLine / lineColor /
     *  lineWidth / lineStyle; factory off, the rectangle colour, 1px, dashed). */
    rectMiddleLine?: RegressionLine;
    /** Fib channel labels (TV showPrices / showCoeffs / labelFontSize, factory
     *  on / on / 12); level values as percents = `fibLevelsAsPercents`. */
    showPrices?: boolean;
    showCoeffs?: boolean;
    /** Fib time zone level labels (TV showLabels, factory on). */
    showLabels?: boolean;
    /** Fib speed resistance fan (TV): time levels (`vlevel*`; `levels` = the
     *  price levels), coefficient labels per side (factory all on) and the
     *  grid (factory on, rgba(21, 56, 153, 0.8), 1px, solid). */
    vLevels?: LevelDef[];
    /** Trend-based fib time: the p0-p1-p2 trend lines (TV `trendline`,
     *  factory on, #808080, 2px, dashed). */
    fibTrendLine?: RegressionLine;
    /** Gann square / Gann square fixed (TV levels / fanlines / arcs; the arcs
     *  fill = fillBackground + transparency). */
    gannLevels?: GannLine[];
    gannFans?: GannRatioLine[];
    gannArcs?: GannRatioLine[];
    /** Sector (TV projection): background gradient colours color1 → color2
     *  (factory tv-blue-500 → grapes-purple-500 at 80 transparency). */
    sectorColor1?: string;
    sectorColor2?: string;
    /** Gann box (TV): time-levels background (fillVertBackground /
     *  vertTransparency; the price levels use fillBackground / transparency)
     *  and the angle lines (fans: visible / color, factory off, #9C9C9C). */
    fillVertBackground?: boolean;
    vertTransparency?: number;
    fans?: {
        visible: boolean;
        color: string;
    };
    showLeftLabels?: boolean;
    showRightLabels?: boolean;
    showTopLabels?: boolean;
    showBottomLabels?: boolean;
    fanGrid?: RegressionLine;
    labelFontSize?: number;
    /** Price note price label (TV priceLabel*: text colour / size / bold /
     *  italic, background, border; factory white, 12px, tv-blue-500 x2). The
     *  line colour is `color`. */
    /** Position forecast (TV line-tool-prediction): balloon colours; the
     *  backgrounds, borders and status banners are drawn at `transparency`
     *  (factory 10). */
    sourceTextColor?: string;
    sourceBackColor?: string;
    sourceStrokeColor?: string;
    targetTextColor?: string;
    targetBackColor?: string;
    targetStrokeColor?: string;
    successTextColor?: string;
    successBackground?: string;
    failureTextColor?: string;
    failureBackground?: string;
    priceLabelTextColor?: string;
    priceLabelFontSize?: number;
    priceLabelBold?: boolean;
    priceLabelItalic?: boolean;
    priceLabelBackgroundColor?: string;
    priceLabelBorderColor?: string;
    /** Trend-angle: the displayed angle in degrees, frozen in SCREEN space at
     *  placement / anchor-drag end (TV stores `angle` + `distance` and derives
     *  the second point, so zooming never changes the readout). */
    angle?: number;
    /** Bar-pattern display model (TV `mode` / `mirrored` / `flipped`):
     *  "line" draws a close-price polyline instead of candles; mirrored
     *  reverses the bar order; flipped inverts prices around the pattern base. */
    patternMode?: "bars" | "oc" | "line" | "line-open" | "line-high" | "line-low" | "line-hl2";
    /** Ghost feed candle style (TV candleStyle): body up / down colours,
     *  borders (on + up / down colours), wick (on + colour). */
    ghostCandle?: GhostCandleStyle;
    mirrored?: boolean;
    flipped?: boolean;
    /** Ghost-feed candle randomness on TV's 0-100 scale (factory 50): 0 = every
     *  bar spans exactly the frozen amplitude, 100 = maximum jitter. */
    variance?: number;
    /** Range tools custom text style (TV `customText`: colour, size, bold,
     *  italic; the string itself is `text`). Factory #2962FF, 12px. */
    customTextColor?: string;
    customTextSize?: number;
    customTextBold?: boolean;
    customTextItalic?: boolean;
    /** Callout border colour (TV `bordercolor`); unset = the bubble colour. */
    borderColor?: string;
    /** Elliott wave degree (TV `degree`): 0 Supermillennium … 14 Minuscule,
     *  factory 7 (Intermediate). Drives the label set, size and decoration. */
    elliottDegree?: number;
    upperDeviation?: number;
    lowerDeviation?: number;
    /** TV "Use Upper / Lower Deviation" (factory on). Off: the line sits at the
     *  largest bar high above (low below) the base line instead of dev·σ. */
    useUpperDeviation?: boolean;
    useLowerDeviation?: boolean;
    /** TV study `source` (factory close): the series the base line, σ and
     *  Pearson's R are computed on. */
    regressionSource?: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    showPearsons?: boolean;
    /** TV styles.baseLine / upLine / downLine: visibility, colour, width, style
     *  per line (the fills take the line colour at `transparency`). */
    regressionLines?: {
        base: RegressionLine;
        up: RegressionLine;
        down: RegressionLine;
    };
    /** Anchored VWAP source series (TV study `source` input; the classic VWAP
     *  typical price hlc3 is the fallback). The ±σ band ladder rides `levels`
     *  (coeff = the band's multiplier). */
    vwapSource?: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    /** Anchored VWAP (TV study): band distance unit ("Bands Calculation
     *  Mode": Standard Deviation, or Percentage where multiplier 1 = 1% of the
     *  VWAP), the upper / lower line of each band (UpperBand / LowerBand
     *  styles: visible, colour, width) and the VWAP price-scale label
     *  (axisLabelVisible, factory on). */
    vwapBandsMode?: "stdev" | "percent";
    vwapUpper?: RegressionLine[];
    vwapLower?: RegressionLine[];
    vwapPriceLabel?: boolean;
    /** Fixed range / anchored volume profile settings (the reference VbP
     *  study: Inputs + Style tab). Unset = the kind's factory settings
     *  (`volumeProfileDefaults` in specs). */
    vp?: VolumeProfileStyle;
};

/** Draws `items` on `ctx` (current transform = CSS pixels). */
export declare function drawScene(ctx: Ctx, items: SceneItem[], o: CanvasSceneOptions): void;

/** Factory style of a tool: base + per-spec defaults, WITHOUT the user's
 *  saved default (TV restoreFactoryDefaults / "Apply defaults"). */
export declare function factoryStyleFor(kind: DrawingKind): DrawingStyle;

/** The fib retracement / trend-based extension level line under `cursor`
 *  (within 6 px, inside the levels' x-range): its index in the drawing's
 *  level list (`style.levels` or the factory list), y, x-range and the
 *  position of its level text (the Text alignment). Null elsewhere. Used by
 *  hosts to edit a level's text on the chart. */
export declare function fibLevelAt(d: Drawing, pts: Pt[], cursor: Pt, w: number, coords: Coords | null): {
    index: number;
    y: number;
    left: number;
    right: number;
    textX: number;
} | null;

export declare function findOverlaySpec(toolId: string | null): OverlaySpec | undefined;

/** A finished placement: the clicked points -> the new drawing with the data
 *  TV computes at placement (position box, curve controls, Gann square,
 *  bar-pattern snapshot, trend angle, ghost-feed seed; polyline `closed`,
 *  font-icon glyph). `pane` = the pane size in px. */
export declare function finishPlacement(kind: DrawingKind, pts: DataPoint[], coords: Coords | null, pane: {
    w: number;
    h: number;
}, opts?: {
    glyph?: string;
    closed?: boolean;
}): NewDrawing | null;

declare type FourPoint = {
    kind: "double-curve";
    points: [DataPoint, DataPoint, DataPoint, DataPoint];
};

/** Freehand family — variable-length polylines placed click-per-vertex and
 *  finalized with a double-click (the spec carries `variableLength: true`). */
declare type FreehandKind = "polyline" | "path" | "brush" | "highlighter";

/** The symbol's trading calendar around the loaded bars (the host knows the sessions). The time scale continues
 *  after the last bar with the bars the symbol would open: the rest of the session, then the next sessions (nights,
 *  weekends and holidays skipped); before the first loaded bar it counts the bars the symbol had. Times are epoch
 *  seconds. A time is drawn on the bar that holds it (the last bar opening at or before it). */
export declare type FutureAxis = {
    /** Future bars that open after `lastTime` and at or before `time` (0 = still on the last bar). */
    slots: (time: number, lastTime: number) => number;
    /** Open time of the k-th future bar (k >= 1), null past the host's range. */
    time: (k: number, lastTime: number) => number | null;
    /** Bars from the bar that holds `time` to the first loaded bar (opening at `firstTime`), that bar counted
     *  (>= 1 for a time before the first bar). Absent = calendar time with the median bar interval. */
    pastSlots?: (time: number, firstTime: number) => number;
    /** Open time of the k-th bar before the first loaded bar (k >= 1), null past the host's range. Give it with
     *  `pastSlots`. */
    pastTime?: (k: number, firstTime: number) => number | null;
    /** Where a time sits when the bar that holds it is looked for, non-decreasing over the bar times. The host maps a
     *  daily bar time to its session open (the reference opens a daily bar there: a pre-market time belongs to the
     *  previous daily bar, a point drawn on a daily bar goes to the first intraday bar of its day). Identity when
     *  absent. */
    timeKey?: (time: number) => number;
};

/** One regression trend line (TV study plot style). */
/** Gann level line (TV levels.N: color, width, visible). */
declare type GannLine = {
    color: string;
    width: number;
    visible: boolean;
};

/** Gann fan / arc line with its x·y ratio (TV fanlines.N / arcs.N). */
declare type GannRatioLine = GannLine & {
    x: number;
    y: number;
};

/** One configurable level of a levels-based tool. `label` overrides the
 *  coefficient text (gann-fan's "1/8".."8/1"); `width`/`style` override the
 *  drawing's stroke per level (TV's per-level linewidth/linestyle). */
/** Ghost feed candle style (TV `candleStyle`). */
declare type GhostCandleStyle = {
    upColor: string;
    downColor: string;
    drawBorder: boolean;
    borderUpColor: string;
    borderDownColor: string;
    drawWick: boolean;
    wickColor: string;
};

/** Ghost feed — variable-length (TV pointsCount −1): every click after the
 *  first appends another drift-segment vertex; candles generate along each
 *  leg. Stored 2-point feeds are just 2-vertex polylines — no migration. */
declare type GhostFeedPoint = {
    kind: "ghost-feed";
    points: DataPoint[];
};

export declare type HitResult = {
    hit: "handle";
    handleIndex: number;
} | {
    hit: "body";
    cell?: [number, number];
};

/** Dispatch entry point — projected screen points + the pane size (width/
 *  height are needed by full-extent kinds like horizontal-line). */
export declare function hitTestKind(drawing: Drawing, pts: Pt[], cursor: Pt, width: number, height: number, coords: Coords | null, 
/** The drawing is selected (table: its row / column edges resize). */
selected?: boolean): HitResult | null;

/** TV limits (line-tool-image module 117820): JPG, PNG or WEBP; 2 MB; images
 *  larger than 2000 x 2000 are not drawn. */
export declare const IMAGE_MAX_BYTES = 2000000;

export declare const IMAGE_MAX_SIDE = 2000;

export declare const IMAGE_TYPES: Record<string, string>;

declare type IntervalVisibility = {
    ticks: boolean;
    seconds: UnitVisibility;
    minutes: UnitVisibility;
    hours: UnitVisibility;
    days: UnitVisibility;
    weeks: UnitVisibility;
    months: UnitVisibility;
    ranges: boolean;
};

export declare function isAnchorable(kind: string): boolean;

/** TRUE when a drawing with visibility `v` should render on `interval`.
 *  Interval strings follow the app's TV-style format: bare number = minutes
 *  ("1", "5", "240"; multiples of 60 read as hours), "NS" seconds, "NT" ticks,
 *  "NR" ranges, "ND" days, "NW" weeks, "NM" months. Unknown formats stay
 *  visible (fail open). */
export declare function isVisibleOnInterval(v: IntervalVisibility | undefined, interval: string | undefined): boolean;

/** Fields every drawn item can carry. */
declare type ItemBase = {
    /** Name of a `clip` item: the item is drawn minus its cut-out polygons. */
    clip?: string;
    /** Not a pointer target (SVG pointer-events="none"). */
    inert?: boolean;
};

export declare type LevelDef = {
    coeff: number;
    color: string;
    visible: boolean;
    label?: string;
    width?: number;
    style?: LineStyle;
    /** TV fib level text (levelN.text), shown with `showText`. */
    text?: string;
};

declare type LineStyle = "solid" | "dashed" | "dotted";

export declare type LoadedImage = {
    url: string;
    width: number;
    height: number;
};

/** Bars of the chart symbol on a lower timeframe (the volume profiles are built from them, as the reference
 *  app's volume profile study). Optional: without it the profiles use the chart bars. */
declare type LowerTimeframe = {
    /** Bars on `resolution` ("1", "5", "15", "30", "60", "240", "1D", "1S") from `from` (epoch seconds) on;
     *  undefined while they load (the host redraws the drawings when they arrive). */
    bars: (resolution: string, from: number) => OHLC[] | undefined;
    /** End (epoch seconds) of the chart bar starting at `time`: its interval, a daily bar's session close. */
    barEnd: (time: number) => number;
    /** The chart interval is in seconds (its profiles use 1-second bars). */
    seconds: boolean;
};

export declare type MagnetMode = "off" | "weak" | "strong";

export declare function makeCoords(chart: IChartApi, series: ISeriesApi<SeriesType>, getRaw: () => OHLC[], 
/** Resolves overlay-indicator values at an epoch-seconds bar time. Injected
 *  by ChartView (reads the live IndicatorController); defaults to none. */
getIndicatorValues?: (sec: number | null) => number[], getTimeInfo?: () => {
    timeZone: string;
    intraday: boolean;
}, 
/** Future bars on the trading calendar; null (or absent) = calendar time extrapolated with the bar interval. */
getFuture?: () => FutureAxis | null): Coords;

/** Point-count migration (10/07/2026): several kinds moved to TV's point
 *  models. Old saved drawings are padded/synthesized best-effort so they keep
 *  rendering; a drag then normalises them.
 *   - fib-wedge / pitchfan: 2 → 3 (mirror the second edge across p0's price)
 *   - ellipse: 2 (bbox corners) → 3 (major axis + half-height point)
 *   - price-note: 1 → 2 (degenerate line at the anchor)
 *   - head-and-shoulders: 5 → 7 (duplicate the two outer points)
 *   - elliott impulse/triangle/triple: 5 → 6; correction/double: 3 → 4
 *     (prepend the "0" origin as a copy of the first point) */
export declare function migrateDrawing(d: Drawing): Drawing;

/** Payload accepted by App.addDrawing — caller doesn't supply the id. The
 *  optional `text` rides along so text-family placements can carry their
 *  typed content through addDrawing's `...d` spread; `style`, when present,
 *  replaces the kind's default style (position placement freezes its
 *  stop/profit offsets into it). */
export declare type NewDrawing = (OnePoint | TwoPoint | ThreePoint | FourPoint | PolyPoint | GhostFeedPoint) & {
    text?: string;
    glyph?: string;
    image?: {
        name: string;
        cssWidth: number;
        cssHeight: number;
    };
    style?: DrawingStyle;
    pattern?: {
        base: number;
        bars: [number, number, number, number][];
    };
    ghost?: {
        seed: number;
        amplitude: number;
    };
    closed?: boolean;
    fmt?: number;
    owner?: string;
};

export declare type OHLC = {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
    /** Bar volume — only populated for the daily/intraday history path;
     *  drives the volume-candle body sizing. Absent on live-tick updates
     *  (those chart types don't take incremental updates). */
    volume?: number;
};

declare type OnePoint = {
    kind: "horizontal-line";
    points: [DataPoint];
} | {
    kind: "horizontal-ray";
    points: [DataPoint];
} | {
    kind: "vertical-line";
    points: [DataPoint];
} | {
    kind: "cross-line";
    points: [DataPoint];
} | {
    kind: "arrow-mark-up";
    points: [DataPoint];
} | {
    kind: "arrow-mark-down";
    points: [DataPoint];
} | {
    kind: "price-label";
    points: [DataPoint];
} | {
    kind: "flag-mark";
    points: [DataPoint];
} | {
    kind: "text";
    points: [DataPoint];
} | {
    kind: "note";
    points: [DataPoint, DataPoint];
} | {
    kind: "pin";
    points: [DataPoint];
} | {
    kind: "comment";
    points: [DataPoint];
} | {
    kind: "signpost";
    points: [DataPoint];
} | {
    kind: "font-icon";
    points: [DataPoint];
} | {
    kind: "table";
    points: [DataPoint];
} | {
    kind: "image";
    points: [DataPoint];
} | {
    kind: "anchored-vwap";
    points: [DataPoint];
};

export declare function onImagesChanged(fn: () => void): () => void;

export declare const OVERLAY_SPECS: Record<DrawingKind, OverlaySpec>;

export declare type OverlaySpec = {
    kind: DrawingKind;
    /** Clicks needed to place the drawing. 1–3 for the geometric kinds; 4 for
     *  double-curve; 3–7 for the pattern/Elliott polylines. */
    pointCount: number;
    /** Rubber-band shown while placing. 1-point and 3-point kinds use
     *  "none"; trend-line / arrow use "line"; all bbox kinds use "rect". */
    preview: PreviewKind;
    /** Bbox-style 4-handle remap on drag (otherwise per-point drag). */
    isBbox: boolean;
    /** Freehand tools (path/polyline/brush/highlighter): clicks keep appending
     *  vertices and the user double-clicks to finalize, rather than auto-
     *  finalizing once `pointCount` points are placed. `pointCount` is the
     *  minimum needed to commit. */
    variableLength?: boolean;
    /** Freehand tools (brush/highlighter): the path is drawn while the mouse
     *  button is held — sampled from pointer-move and committed on button-up —
     *  rather than placed point-by-point. (TV's `isLineDrawnWithPressedButton`;
     *  source of truth: tradingview-agent docs/drawing_placement.md §1.) */
    freehand?: boolean;
    /** Text-family kinds: opens the inline text editor on placement and on
     *  double-click, writing the typed string to the drawing's `text` field. */
    textEditable?: boolean;
    hotkey?: string;
    /** Per-tool style overrides on top of DEFAULT_STYLE, applied at creation and
     *  in the placement preview (see `defaultStyleFor`). Mirrors the mock's
     *  per-spec `defaults`. Values sourced from the TradingView factory defaults
     *  captured in tradingview-agent (docs/drawing_tools.md). Tools without an
     *  entry use DEFAULT_STYLE unchanged. */
    defaults?: Partial<DrawingStyle>;
};

/** Stroke / fill of a shape (SVG presentation attributes). */
export declare type Paint = {
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    /** SVG dash list ("4 2"); undefined = solid. */
    dash?: string;
    cap?: "round" | "butt" | "square";
    join?: "round" | "miter" | "bevel";
    fill?: string;
    fillOpacity?: number;
    fillRule?: "evenodd" | "nonzero";
    /** Name of a `radialGradient` item used as the fill (instead of `fill`). */
    fillRef?: string;
    /** Drop shadow under the shape (rect, path, circle). */
    shadow?: Shadow;
};

/** Saved drawings (parsed JSON) -> the entries that match the current
 *  schema: id + kind + a points array of DataPoints, style backfilled, point
 *  models migrated (migrateDrawing). Anything else is dropped: e.g. pre-5c
 *  horizontal-line entries (`{price}` instead of `{points}`) — losing one or
 *  two test lines is the cost of avoiding a complicated migrator. */
export declare function parseDrawings(parsed: unknown): Drawing[];

/** Pattern / Elliott-wave family — rendered as a single labeled polyline/polygon
 *  through a variable number of vertices (see DrawingsOverlay renderLabeledPolyline). */
declare type PatternKind = "abcd-pattern" | "xabcd-pattern" | "cypher-pattern" | "head-and-shoulders" | "triangle-pattern" | "three-drives-pattern" | "elliott-impulse" | "elliott-correction" | "elliott-triangle" | "elliott-double-combo" | "elliott-triple-combo";

/** Variable-length labeled polyline/polygon — one variant covers the pattern/
 *  Elliott family plus the freehand tools. Fixed patterns enforce their vertex
 *  count via the spec's pointCount; freehand tools place until a double-click. */
declare type PolyPoint = {
    kind: PatternKind | FreehandKind;
    points: DataPoint[];
};

/** TV risk / reward infoBlocks keys. */
declare type PositionStatKey = "tpPriceOffset" | "tpPercentOffset" | "tpTickOffset" | "tpAmount" | "tpPL" | "openClosePL" | "qty" | "riskRewardRatio" | "slPriceOffset" | "slPercentOffset" | "slTickOffset" | "slAmount" | "slPL";

declare type PreviewKind = "none" | "line" | "rect";

export declare type PriceAxisLabel = {
    price: number;
    back: string;
    color: string;
};

export declare type Pt = {
    x: number;
    y: number;
};

declare type RegressionLine = {
    visible: boolean;
    color: string;
    width: number;
    style: LineStyle;
};

export declare type Scene = SceneItem[];

export declare type SceneContext = {
    /** Pane size in px. */
    w: number;
    h: number;
    coords: Coords | null;
    /** Anchors shown (selected, or hovered for the tools TV shows them on). */
    selected: boolean;
    hovered?: boolean;
    /** Text tool: selected state for its outline / wrap anchor (default
     *  `selected`). */
    textSelected?: boolean;
    /** Table: the host's UI state for this table (active cell, edge, editor). */
    tableUi?: TableUi | null;
};

export declare type SceneItem = ({
    t: "line";
    a: Pt;
    b: Pt;
} & Paint & ItemBase) | ({
    t: "polyline";
    pts: Pt[];
} & Paint & ItemBase) | ({
    t: "polygon";
    pts: Pt[];
} & Paint & ItemBase)
/** `crisp`: pixel-aligned edges, no anti-aliasing (SVG crispEdges). */
| ({
    t: "path";
    d: string;
    transform?: string;
    crisp?: boolean;
} & Paint & ItemBase) | ({
    t: "rect";
    x: number;
    y: number;
    w: number;
    h: number;
    rx?: number;
    ry?: number;
} & Paint & ItemBase)
/** `cursor`: pointer cursor over the circle (a DOM host sets it). */
| ({
    t: "circle";
    cx: number;
    cy: number;
    r: number;
    cursor?: string;
} & Paint & ItemBase) | ({
    t: "ellipse";
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    transform?: string;
} & Paint & ItemBase) | ({
    t: "text";
    x: number;
    y: number;
    text: string;
    size: number;
    /** Undefined = the host default (black). */
    fill?: string;
    opacity?: number;
    anchor?: "start" | "middle" | "end";
    baseline?: "central" | "hanging" | "middle" | "alphabetic";
    weight?: number | "bold";
    fontStyle?: "normal" | "italic";
    family?: string;
    /** Keep spaces (white-space: pre). */
    pre?: boolean;
} & ItemBase)
/** `stretch`: fill the box, aspect ratio not kept. */
| ({
    t: "image";
    href: string;
    x: number;
    y: number;
    w: number;
    h: number;
    opacity?: number;
    stretch?: boolean;
} & ItemBase)
/** Items drawn together (a rotation / translation, a clip, an opacity, not
*  a pointer target). */
| ({
    t: "group";
    items: SceneItem[];
    transform?: string;
    opacity?: number;
} & ItemBase)
/** Icon glyph (an emoji / font character, or raw `<svg>` markup) in a
*  size x size box at (x, y), painted in `color`. */
| ({
    t: "glyph";
    x: number;
    y: number;
    size: number;
    glyph: string;
    color: string;
} & ItemBase)
/** Cut-out region: every item naming it is drawn outside the polygons
*  (TV addExclusionArea, even-odd). Draws nothing itself. */
| {
    t: "clip";
    name: string;
    polys: Pt[][];
}
/** Keep-inside clip: every item naming it is drawn inside the rectangle
*  (e.g. Gann square arcs cut at the box). `idPrefix` names the host's
*  clip id. Draws nothing itself. */
| {
    t: "clipRect";
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    idPrefix?: string;
}
/** Radial gradient in screen units: every item naming it in `fillRef` is
*  filled with it. `idPrefix` names the host's gradient id. Draws nothing
*  itself. */
| {
    t: "radialGradient";
    name: string;
    cx: number;
    cy: number;
    r: number;
    stops: {
        offset: number;
        color: string;
        opacity: number;
    }[];
    idPrefix?: string;
}
/** Invisible pointer target (a host with DOM hit testing draws it
*  transparent; a canvas host skips it). */
| {
    t: "hit";
    a: Pt;
    b: Pt;
    width: number;
}
/** Invisible curved pointer target (SVG path syntax). */
| {
    t: "hitPath";
    d: string;
    width: number;
}
/** Anchor handles (TV LineAnchorRenderer; the host draws them). `squares`
*  = indexes of one-axis anchors drawn as rounded squares. */
| {
    t: "anchors";
    pts: Pt[];
    squares?: readonly number[];
};

/** Locked-selection anchors (TV): a padlock glyph on each anchor point in
 *  place of the grab handles (moved from OpenTrader renderLockedAnchors). */
export declare function sceneLockedAnchors(pts: Pt[], color: string): Scene;

/** Screen scene of drawing `d` at the screen points `pts`. */
export declare function sceneOf(d: Drawing, pts: Pt[], c: SceneContext): Scene;

export declare function setDefaultStyleOverride(fn: (kind: string) => DrawingStyle | undefined): void;

export declare function setImageReader(fn: (name: string) => Promise<Blob>): void;

/** Drop shadow (CSS drop-shadow / canvas shadow*): offset, blur in px. */
export declare type Shadow = {
    dx: number;
    dy: number;
    blur: number;
    color: string;
};

export declare type TableCellRef = [row: number, col: number];

declare type TableEdge = {
    row: number | null;
    col: number | null;
};

export declare type TableOp = "insert-column" | "insert-row" | "remove-row" | "remove-column";

/** The active cell of the selected table (blue 2px border), whether its text
 *  editor is open, and the hovered resize edge (host UI state; one table at
 *  a time, like TV). */
export declare type TableUi = {
    id: string;
    cell: TableCellRef | null;
    editing: boolean;
    edge: TableEdge | null;
};

declare type ThreePoint = {
    kind: "triangle";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "fib-wedge";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "pitchfan";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "ellipse";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "parallel-channel";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "pitchfork";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "trend-based-fib-extension";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "trend-based-fib-time";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "gann-square-fixed";
    points: [DataPoint, DataPoint];
} | {
    kind: "gann-square";
    points: [DataPoint, DataPoint];
} | {
    kind: "sector";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "disjoint-channel";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "flat-top-bottom";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "schiff-pitchfork";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "modified-schiff-pitchfork";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "inside-pitchfork";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "fib-channel";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "rotated-rectangle";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "curve";
    points: [DataPoint, DataPoint, DataPoint];
} | {
    kind: "arc";
    points: [DataPoint, DataPoint, DataPoint];
};

export declare type TimeAxisLabel = {
    time: Time;
    back: string;
    color: string;
};

/** Shared time→x with the off-bar fallback, for non-drawing renderers (event
 *  markers, etc.) that paint at arbitrary times. Mirrors the `timeToX` method:
 *  try lightweight-charts' exact mapping first, then the bar that holds the
 *  time (off the loaded bars: the host's calendar `future` when given).
 *  `sec` is UNIX seconds. Returns null with no data. */
export declare function timeToXFallback(chart: IChartApi, sec: number, bars: OHLC[], future?: FutureAxis | null): number | null;

/** TV _onAnchoredChange: anchoring stores the current screen point as pane
 *  fractions; unanchoring turns the fixed point back into a data point (bar
 *  at or left of it, as TV setPoint). Null when not anchorable / not
 *  projectable. */
export declare function toggleAnchored(d: Drawing, coords: Coords, pane: {
    w: number;
    h: number;
}): Drawing | null;

/** TV anchor ring colour (colorsPalette "color-tv-blue-600"), the same for
 *  every drawing. */
export declare const TV_ANCHOR_COLOR = "#1e53e5";

declare type TwoPoint = {
    kind: "arrow-marker";
    points: [DataPoint, DataPoint];
} | {
    kind: "price-note";
    points: [DataPoint, DataPoint];
} | {
    kind: "trend-line";
    points: [DataPoint, DataPoint];
} | {
    kind: "ray";
    points: [DataPoint, DataPoint];
} | {
    kind: "extended-line";
    points: [DataPoint, DataPoint];
} | {
    kind: "info-line";
    points: [DataPoint, DataPoint];
} | {
    kind: "trend-angle";
    points: [DataPoint, DataPoint];
} | {
    kind: "long-position";
    points: [DataPoint, DataPoint];
} | {
    kind: "short-position";
    points: [DataPoint, DataPoint];
} | {
    kind: "gann-fan";
    points: [DataPoint, DataPoint];
} | {
    kind: "gann-box";
    points: [DataPoint, DataPoint];
} | {
    kind: "fib-time-zone";
    points: [DataPoint, DataPoint];
} | {
    kind: "fib-circles";
    points: [DataPoint, DataPoint];
} | {
    kind: "fib-speed-resistance-fan";
    points: [DataPoint, DataPoint];
} | {
    kind: "fib-speed-resistance-arcs";
    points: [DataPoint, DataPoint];
} | {
    kind: "fib-spiral";
    points: [DataPoint, DataPoint];
} | {
    kind: "cyclic-lines";
    points: [DataPoint, DataPoint];
} | {
    kind: "sine-line";
    points: [DataPoint, DataPoint];
} | {
    kind: "time-cycles";
    points: [DataPoint, DataPoint];
} | {
    kind: "arrow";
    points: [DataPoint, DataPoint];
} | {
    kind: "rectangle";
    points: [DataPoint, DataPoint];
} | {
    kind: "circle";
    points: [DataPoint, DataPoint];
} | {
    kind: "fib-retracement";
    points: [DataPoint, DataPoint];
} | {
    kind: "price-range";
    points: [DataPoint, DataPoint];
} | {
    kind: "date-range";
    points: [DataPoint, DataPoint];
} | {
    kind: "date-and-price-range";
    points: [DataPoint, DataPoint];
} | {
    kind: "position-forecast";
    points: [DataPoint, DataPoint];
} | {
    kind: "bar-pattern";
    points: [DataPoint, DataPoint];
} | {
    kind: "callout";
    points: [DataPoint, DataPoint];
} | {
    kind: "regression-trend";
    points: [DataPoint, DataPoint];
} | {
    kind: "fixed-range-volume-profile";
    points: [DataPoint, DataPoint];
} | {
    kind: "anchored-volume-profile";
    points: [DataPoint];
};

declare type UnitVisibility = {
    on: boolean;
    from: number;
    to: number;
};

export declare const VERSION: string;

/** Volume profile tools: the reference VbPFixed / VbPAnchored study
 *  defaults (24 rows, Up/Down, 70% value area, histogram 30% of the box,
 *  POC 2 px on, VAH / VAL 2 px off, developing plots 1 px off) with the
 *  dark-theme colours of its themed colour list (cold gray 200 lines and
 *  values, sky blue 400 at 50 / 75 % up, berry pink 400 at 50 / 75 % down,
 *  sky blue 500 developing VA, sky blue 400 at 5 % box). Fixed range draws
 *  from the left edge, anchored from the right. */
export declare function volumeProfileDefaults(kind: DrawingKind): VolumeProfileStyle;

/** Volume profile tool settings (reference VbPFixed / VbPAnchored study).
 *  Inputs: rows layout (number of rows or ticks per row) and row size,
 *  volume (Up/Down, Total, Delta), value area volume (%), extend right
 *  (fixed range only). Style: the histogram (visible, values, width % of
 *  the box, placement, up / down and value area up / down colours), the
 *  VAH / VAL / POC lines, the developing POC and VA plots and the
 *  histogram box colour. */
export declare type VolumeProfileStyle = {
    rowsLayout: "rows" | "ticks";
    rows: number;
    volume: "upDown" | "total" | "delta";
    vaVolume: number;
    extendRight: boolean;
    visible: boolean;
    showValues: boolean;
    valuesColor: string;
    percentWidth: number;
    placement: "left" | "right";
    upColor: string;
    downColor: string;
    vaUpColor: string;
    vaDownColor: string;
    vah: RegressionLine;
    val: RegressionLine;
    poc: RegressionLine;
    developingPoc: RegressionLine;
    developingVah: RegressionLine;
    developingVal: RegressionLine;
    boxColor: string;
};

/** The drawing's volume profile settings over the factory ones. */
export declare function volumeProfileStyle(kind: DrawingKind, s: DrawingStyle): VolumeProfileStyle;

declare type WithId<T> = T & {
    id: string;
    style: DrawingStyle;
    /** User-editable display name (the input under the settings-dialog title;
     *  TV defaults it to the tool's label). Shown in listings when set. */
    name?: string;
    /** Editable annotation text for the text family (text/note/comment/price-note/
     *  signpost/callout). Empty/undefined renders a faint placeholder. */
    text?: string;
    /** Glyph payload for the `font-icon` kind — a Unicode emoji char OR raw
     *  `<svg>` markup (icon/sticker). Rendered at the placement point. */
    glyph?: string;
    /** Bar-pattern frozen snapshot (TV model): the OHLC rows captured at
     *  placement + the first bar's open as the anchor base. Rendered at
     *  consecutive bar indices from p0, offset by (p0.price − base) — real
     *  price scale, never renormalised into the box. */
    pattern?: {
        base: number;
        bars: [number, number, number, number][];
    };
    /** Ghost-feed generation params (TV model): a stable seed + the ATR-based
     *  candle amplitude (price units) captured at placement, so the simulated
     *  candles survive moves/reloads and resize with the drift line. */
    ghost?: {
        seed: number;
        amplitude: number;
    };
    /** Image tool (TV line-tool-image): the stored file name (app data
     *  `drawing-images/`) and the drawn size in screen px (TV cssWidth /
     *  cssHeight). The point is the image centre. Not a style field: TV keeps
     *  the url out of templates. `dx` = transient x offset of the centre
     *  during a corner drag (TV dOffsetX), dropped when the drag ends. */
    image?: {
        name: string;
        cssWidth: number;
        cssHeight: number;
        dx?: number;
    };
    /** TV "Anchor drawing" (property `anchored`; text, pin, table -
     *  interact/anchor.ts): the drawing is fixed
     *  to the screen at these pane fractions (TV positionPercents: x / time
     *  scale width, y / pane height) and does not move with the chart. The
     *  data point is kept for when it is unanchored. */
    anchored?: {
        x: number;
        y: number;
    };
    /** Polyline closed into a shape (TV `filled`): set when the drawing is
     *  finished on its first point or an end point is dragged onto the other
     *  end. Only a closed polyline draws its closing side and its fill. */
    closed?: boolean;
    /** Locked drawings can be selected but not dragged or deleted via Delete-key. */
    locked?: boolean;
    /** Hidden drawings are not rendered, hit-tested or selected; the flag is
     *  saved with the drawing (DrawingManager.setHidden). */
    hidden?: boolean;
    /** Per-interval visibility matrix (Settings → Visibility). Absent = always
     *  visible (the default for drawings saved before this field existed). */
    visibility?: IntervalVisibility;
    /** Point-model format version for kinds whose stored-point MEANING changed
     *  without a count change (circle: bbox corners → center + radius point;
     *  arc: [start, control, end] → [chord start, chord end, bulge]). Absent =
     *  pre-change entry that migrateDrawing converts once; 2 = current model. */
    fmt?: number;
    /** ObjectTree group tag — drawings sharing a tag render under one group
     *  header in the panel (set/cleared by its Manage mode). */
    group?: string;
    /** Owner of the drawing's pane: the id of the study whose pane it was
     *  drawn in (its price scale maps the points). Absent = the main series
     *  pane. A drawing is drawn and clipped in its owner's pane. */
    owner?: string;
};

export { }
