/*
 * ForgeConvert — Home.tsx
 * Design: Industrial Brutalism
 * - Hard rectangular edges, steel-seam borders, electric blue accent
 * - Monospace metadata, corner-bracket drop zone
 * - All conversion runs 100% client-side
 * - Loading animation with dual-ring spinner
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPT_MAP,
  CONVERSION_MAP,
  ConversionResult,
  FORMAT_LABELS,
  convertFile,
} from "@/lib/converter";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconUpload() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconSuccess() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ─── Loading Overlay Component ────────────────────────────────────────────────
function LoadingOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0.09 0.012 255 / 0.85)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 200ms ease-out",
      }}
      aria-label="Converting file"
      role="status"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        {/* Animated dual-ring spinner */}
        <div
          style={{
            position: "relative",
            width: 60,
            height: 60,
          }}
        >
          {/* Outer rotating ring (blue) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "3px solid oklch(0.52 0.22 260 / 0.2)",
              borderTopColor: "oklch(0.52 0.22 260)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          {/* Inner rotating ring (green, opposite) */}
          <div
            style={{
              position: "absolute",
              inset: "8px",
              border: "2px solid oklch(0.50 0.16 162 / 0.2)",
              borderBottomColor: "oklch(0.50 0.16 162)",
              borderRadius: "50%",
              animation: "spin 1.5s linear infinite reverse",
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
              background: "oklch(0.52 0.22 260)",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Loading text */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "oklch(0.88 0.008 255)",
              letterSpacing: "0.02em",
            }}
          >
            Converting...
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "oklch(0.55 0.012 255)",
              letterSpacing: "0.01em",
            }}
          >
            Processing your file
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const allFormats = Object.keys(CONVERSION_MAP);

  const [sourceFormat, setSourceFormat] = useState<string>("png");
  const [targetFormat, setTargetFormat] = useState<string>("jpg");
  const [targetOptions, setTargetOptions] = useState<string[]>(CONVERSION_MAP["png"]);

  const [file, setFile]           = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult]             = useState<ConversionResult | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sync target options when source format changes ──────────────────────
  useEffect(() => {
    const options = CONVERSION_MAP[sourceFormat] ?? [];
    setTargetOptions(options);
    setTargetFormat(options[0] ?? "");
  }, [sourceFormat]);

  // ── Sync file input accept attribute ────────────────────────────────────
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ACCEPT_MAP[sourceFormat] ?? "*/*";
    }
  }, [sourceFormat]);

  // ── Revoke previous Object URL to prevent memory leaks ──────────────────
  const revokeResult = useCallback(() => {
    if (result?.objectUrl) {
      URL.revokeObjectURL(result.objectUrl);
    }
  }, [result]);

  // ── Reset all state ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    revokeResult();
    setFile(null);
    setResult(null);
    setError(null);
    setIsConverting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [revokeResult]);

  // ── File validation ──────────────────────────────────────────────────────
  const acceptFile = useCallback((incoming: File) => {
    const ext = getExtension(incoming.name);
    if (ext !== sourceFormat && !(ext === "jpeg" && sourceFormat === "jpg")) {
      setError(
        `Expected a .${sourceFormat.toUpperCase()} file, but received .${ext.toUpperCase()}. ` +
        `Please change "Convert From" or select the correct file.`
      );
      return;
    }
    revokeResult();
    setResult(null);
    setError(null);
    setFile(incoming);
  }, [sourceFormat, revokeResult]);

  // ── Drag-and-drop handlers ───────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) acceptFile(picked);
  };

  const handleDropZoneClick = () => {
    if (!file) fileInputRef.current?.click();
  };

  // ── Conversion ───────────────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!file || !targetFormat) return;
    revokeResult();
    setResult(null);
    setError(null);
    setIsConverting(true);

    try {
      const output = await convertFile(file, sourceFormat, targetFormat);
      setResult(output);
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred during conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  // ── Download trigger ─────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href     = result.objectUrl;
    a.download = result.filename;
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(result.objectUrl);
      setResult((prev) => prev ? { ...prev, objectUrl: "" } : null);
    }, 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "clamp(2rem, 6vh, 4rem)",
        paddingBottom: "3rem",
      }}
    >
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isConverting} />

      <div className="container" style={{ width: "100%", maxWidth: 640 }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
            {/* Forge logo mark */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="26" height="26" rx="2" stroke="oklch(0.52 0.22 260)" strokeWidth="1.5" />
              <path d="M7 20 L14 8 L21 20" stroke="oklch(0.52 0.22 260)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="9.5" y1="15.5" x2="18.5" y2="15.5" stroke="oklch(0.52 0.22 260)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h1
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: "clamp(1.4rem, 4vw, 1.75rem)",
                letterSpacing: "-0.02em",
                color: "oklch(0.92 0.008 255)",
                margin: 0,
                lineHeight: 1,
              }}
            >
              แปลง<span style={{ color: "oklch(0.52 0.22 260)" }}>ไฟล์</span>
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "oklch(0.55 0.012 255)",
              letterSpacing: "0.01em",
            }}
          >
            ของฟรีอย่าบ่นเยอะ
          </p>
          <div
            style={{
              marginTop: "0.875rem",
              height: "1px",
              background: "oklch(0.28 0.014 255)",
            }}
          />
        </header>

        {/* ── Routing Bar ─────────────────────────────────────────────────── */}
        <section style={{ marginBottom: "1.75rem" }}>
          <p className="section-label">Conversion Route</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
            className="routing-bar"
          >
            {/* Convert From */}
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label
                htmlFor="from-select"
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "oklch(0.50 0.012 255)",
                  marginBottom: "0.35rem",
                }}
              >
                From
              </label>
              <select
                id="from-select"
                className="forge-select"
                value={sourceFormat}
                onChange={(e) => {
                  handleReset();
                  setSourceFormat(e.target.value);
                }}
              >
                {allFormats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {FORMAT_LABELS[fmt] ?? fmt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow separator */}
            <div
              style={{
                color: "oklch(0.40 0.014 255)",
                flexShrink: 0,
                marginTop: "1.25rem",
                display: "flex",
                alignItems: "center",
              }}
              aria-hidden="true"
            >
              <IconArrowRight />
            </div>

            {/* Convert To */}
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label
                htmlFor="to-select"
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "oklch(0.50 0.012 255)",
                  marginBottom: "0.35rem",
                }}
              >
                To
              </label>
              <select
                id="to-select"
                className="forge-select"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
              >
                {targetOptions.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {FORMAT_LABELS[fmt] ?? fmt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Drop Zone (shown when no file selected) ──────────────────────── */}
        {!file && (
          <section style={{ marginBottom: "1.75rem" }}>
            <p className="section-label">Upload File</p>
            <div
              className={`drop-zone${isDragOver ? " drag-over" : ""}`}
              onClick={handleDropZoneClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label={`Drop a ${sourceFormat.toUpperCase()} file here or click to browse`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleDropZoneClick(); }}
            >
              <div className="drop-zone-inner" style={{ pointerEvents: "none" }}>
                <div
                  style={{
                    color: isDragOver ? "oklch(0.52 0.22 260)" : "oklch(0.40 0.014 255)",
                    marginBottom: "1rem",
                    transition: "color 180ms",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <IconUpload />
                </div>
                <p
                  style={{
                    margin: "0 0 0.375rem",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: isDragOver ? "oklch(0.75 0.18 260)" : "oklch(0.75 0.008 255)",
                    transition: "color 180ms",
                  }}
                >
                  Drop your {sourceFormat.toUpperCase()} file here
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "oklch(0.45 0.012 255)",
                  }}
                >
                  or click to browse
                </p>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MAP[sourceFormat] ?? "*/*"}
              onChange={handleFileInput}
              style={{ display: "none" }}
              aria-hidden="true"
            />
          </section>
        )}

        {/* ── Active Workspace (shown when file is selected) ───────────────── */}
        {file && (
          <section style={{ marginBottom: "1.75rem" }} className="animate-slide-up">
            <p className="section-label">Selected File</p>
            <div className="workspace-card">
              {/* File icon */}
              <div style={{ color: "oklch(0.52 0.22 260)", flexShrink: 0 }}>
                <IconFile />
              </div>

              {/* File info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "oklch(0.88 0.008 255)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={file.name}
                >
                  {file.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "0.75rem",
                      color: "oklch(0.55 0.012 255)",
                    }}
                  >
                    {formatBytes(file.size)}
                  </span>
                  <span className="ext-badge">
                    {getExtension(file.name) || sourceFormat}
                  </span>
                </div>
              </div>

              {/* Reset button */}
              <button
                className="forge-btn forge-btn-ghost"
                onClick={handleReset}
                aria-label="Remove file and reset"
                style={{ padding: "0 0.75rem", minHeight: 48, flexShrink: 0 }}
              >
                <IconClose />
              </button>
            </div>
          </section>
        )}

        {/* ── Error Message ────────────────────────────────────────────────── */}
        {error && (
          <div
            className="animate-slide-up"
            style={{
              marginBottom: "1.5rem",
              padding: "0.875rem 1.125rem",
              background: "oklch(0.58 0.22 27 / 0.1)",
              border: "1px solid oklch(0.58 0.22 27 / 0.4)",
              borderRadius: 2,
              fontSize: "0.875rem",
              color: "oklch(0.80 0.12 27)",
              lineHeight: 1.5,
            }}
            role="alert"
          >
            <strong style={{ fontWeight: 700 }}>Error: </strong>
            {error}
          </div>
        )}

        {/* ── Convert Button ───────────────────────────────────────────────── */}
        {file && !result && (
          <section style={{ marginBottom: "1.75rem" }}>
            <button
              className="forge-btn forge-btn-primary"
              onClick={handleConvert}
              disabled={isConverting || !targetFormat}
              style={{ width: "100%", fontSize: "1rem", minHeight: 52 }}
              aria-label={`Convert ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}`}
            >
              {isConverting ? (
                <>
                  <span className="forge-spinner" />
                  Converting…
                </>
              ) : (
                <>
                  Convert to {(FORMAT_LABELS[targetFormat] ?? targetFormat).toUpperCase()}
                </>
              )}
            </button>
          </section>
        )}

        {/* ── Result / Download Panel ──────────────────────────────────────── */}
        {result && (
          <section style={{ marginBottom: "1.75rem" }}>
            <p className="section-label">Conversion Complete</p>
            <div className="result-panel">
              {/* Success header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: "oklch(0.50 0.16 162 / 0.15)",
                    border: "1px solid oklch(0.50 0.16 162 / 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "oklch(0.65 0.18 162)",
                    flexShrink: 0,
                  }}
                >
                  <IconSuccess />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "oklch(0.75 0.14 162)",
                    }}
                  >
                    File converted successfully
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8125rem",
                      color: "oklch(0.55 0.012 255)",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {result.filename}
                  </p>
                </div>
              </div>

              {/* Download button */}
              <button
                className="forge-btn forge-btn-primary"
                onClick={handleDownload}
                style={{ width: "100%", minHeight: 48 }}
                aria-label={`Download ${result.filename}`}
              >
                <IconDownload />
                Download {result.filename}
              </button>

              {/* Convert another */}
              <button
                className="forge-btn forge-btn-ghost"
                onClick={handleReset}
                style={{ width: "100%", marginTop: "0.625rem", minHeight: 44 }}
              >
                Convert another file
              </button>
            </div>
          </section>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer
          style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid oklch(0.20 0.012 255)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "oklch(0.38 0.012 255)",
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: "0.04em",
            }}
          >
            made by ไอ้พี
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "oklch(0.38 0.012 255)",
            }}
          >
            สร้างขึ้นเพื่อการศึกษา
          </span>
        </footer>

      </div>

      {/* ── Responsive Routing Bar CSS ──────────────────────────────────────── */}
      <style>{`
        @media (max-width: 499px) {
          .routing-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .routing-bar > div:nth-child(2) {
            transform: rotate(90deg);
            margin-top: 0 !important;
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
}
