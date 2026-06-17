/**
 * ForgeConvert — Home.tsx
 * Design: Industrial Brutalism with Mobile-First Responsive UX
 * - Auto-download after conversion completes
 * - Optimized for iOS, Android, iPad, and Desktop
 * - Touch-friendly targets (48px+ buttons)
 * - Adaptive layout and typography
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

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36" />
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
      }}
      role="status"
      aria-live="polite"
      aria-label="Converting file"
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            margin: "0 auto 24px",
            position: "relative",
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "3px solid transparent",
              borderTopColor: "#2563EB",
              borderRightColor: "#059669",
              borderRadius: "50%",
              animation: "spin 1.2s linear infinite",
            }}
          />
          {/* Inner dot */}
          <div
            style={{
              position: "absolute",
              inset: "50%",
              width: "8px",
              height: "8px",
              background: "#2563EB",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        <p style={{ color: "#E5E7EB", fontSize: "14px", margin: 0 }}>
          Converting... Processing your file
        </p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Success Toast Component ──────────────────────────────────────────────────
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        right: "20px",
        maxWidth: "400px",
        background: "#059669",
        color: "#F0FDF4",
        padding: "16px 20px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 9998,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        animation: "slideUp 0.3s ease-out",
      }}
      role="status"
      aria-live="polite"
    >
      <IconSuccess />
      <span style={{ fontSize: "14px", fontWeight: "500" }}>{message}</span>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const [fromFormat, setFromFormat] = useState<string>("png");
  const [toFormat, setToFormat] = useState<string>("jpg");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Get available target formats based on source format
  const availableTargets = CONVERSION_MAP[fromFormat] || [];

  // Update target format if current one becomes unavailable
  useEffect(() => {
    if (!availableTargets.includes(toFormat)) {
      setToFormat(availableTargets[0] || "jpg");
    }
  }, [fromFormat, toFormat, availableTargets]);

  // Handle file selection with validation
  const handleFileSelect = useCallback((file: File) => {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (file.size > maxSize) {
      setSuccessMessage("File too large. Max size is 100MB.");
      return;
    }
    
    if (ACCEPT_MAP[fromFormat]?.includes(fileExt) || ACCEPT_MAP[fromFormat]?.includes(file.type)) {
      setSelectedFile(file);
    } else {
      setSuccessMessage(`Invalid file type. Expected ${FORMAT_LABELS[fromFormat]}.`);
    }
  }, [fromFormat]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.borderColor = "#2563EB";
      dropZoneRef.current.style.background = "oklch(0.15 0.02 255)";
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.borderColor = "#2D3748";
      dropZoneRef.current.style.background = "transparent";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.borderColor = "#2D3748";
      dropZoneRef.current.style.background = "transparent";
    }
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle conversion with auto-download
  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    try {
      const result = await convertFile(selectedFile, fromFormat, toFormat);
      
      // Auto-download the file
      const link = document.createElement("a");
      link.href = result.objectUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(result.objectUrl);

      // Show success message
      setSuccessMessage(`Downloaded ${result.filename}`);
      
      // Reset after a short delay
      setTimeout(() => {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1500);
    } catch (error) {
      console.error("Conversion error:", error);
      setSuccessMessage("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  // Reset conversion
  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070A13", color: "#E5E7EB", WebkitTapHighlightColor: "transparent" }}>
      <LoadingOverlay isVisible={isConverting} />
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {/* Header */}
      <header
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #2D3748",
          background: "oklch(0.09 0.012 255)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#2563EB",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
<<<<<<< Updated upstream
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
=======
              🔨
            </div>
            <h1 style={{ fontSize: "clamp(18px, 5vw, 24px)", fontWeight: "700", margin: 0 }}>
              Forge<span style={{ color: "#2563EB" }}>Convert</span>
            </h1>
          </div>
          <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "#9CA3AF", margin: 0 }}>
            Client-side file conversion — files never leave your device.
>>>>>>> Stashed changes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(16px, 5vw, 24px)" }}>
        {/* Conversion Route Section */}
        <section style={{ marginBottom: "32px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Conversion Route
          </label>
          
          <div className="conversion-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "12px",
            alignItems: "center",
            marginTop: "12px",
          }}>
            {/* FROM Format */}
            <div>
              <label style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "6px", display: "block" }}>FROM</label>
              <select
                value={fromFormat}
                onChange={(e) => setFromFormat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "oklch(0.12 0.015 255)",
                  border: "1px solid #2D3748",
                  color: "#E5E7EB",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  minHeight: "48px",
                }}
              >
                {Object.entries(FORMAT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Arrow */}
            <div className="arrow-container" style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
              <IconArrowRight />
            </div>

            {/* TO Format */}
            <div>
              <label style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "6px", display: "block" }}>TO</label>
              <select
                value={toFormat}
                onChange={(e) => setToFormat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "oklch(0.12 0.015 255)",
                  border: "1px solid #2D3748",
                  color: "#E5E7EB",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  minHeight: "48px",
                }}
              >
                {availableTargets.map((fmt) => (
                  <option key={fmt} value={fmt}>{FORMAT_LABELS[fmt]}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section style={{ marginBottom: "32px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Upload File
          </label>

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Drop zone for file upload"
            style={{
              marginTop: "12px",
              padding: "32px 20px",
              border: "2px dashed #2D3748",
              borderRadius: "4px",
              background: "transparent",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s ease",
              minHeight: "160px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
            }}
          >
            {selectedFile ? (
              <>
                <IconFile />
                <p style={{ fontSize: "14px", fontWeight: "500", margin: "12px 0 0 0" }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0 0" }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <IconUpload />
                <p style={{ fontSize: "14px", fontWeight: "500", margin: "12px 0 0 0" }}>
                  Drop your {FORMAT_LABELS[fromFormat]} file here
                </p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0 0" }}>
                  or click to browse
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MAP[fromFormat]}
            onChange={handleFileInputChange}
            style={{ display: "none" }}
            aria-label="File input"
          />
        </section>

        {/* Action Buttons */}
        <section style={{ display: "flex", gap: "12px", flexDirection: "column", marginTop: "24px" }}>
          <button
            onClick={handleConvert}
            disabled={!selectedFile || isConverting}
            title={!selectedFile ? "Select a file first" : "Convert and download the file"}
            style={{
              padding: "14px 24px",
              background: selectedFile && !isConverting ? "#2563EB" : "#1F2937",
              color: "#FFFFFF",
              border: "1px solid #2D3748",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: selectedFile && !isConverting ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              minHeight: "48px",
              transition: "all 0.2s ease",
              opacity: selectedFile && !isConverting ? 1 : 0.5,
            }}
            onMouseDown={(e) => {
              if (selectedFile && !isConverting) {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            <IconDownload />
            Convert & Download
          </button>

          {selectedFile && (
            <button
              onClick={handleReset}
              title="Clear the selected file"
              style={{
                padding: "14px 24px",
                background: "transparent",
                color: "#9CA3AF",
                border: "1px solid #2D3748",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: "48px",
                transition: "all 0.2s ease",
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              <IconRefresh />
              Reset
            </button>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: "64px",
          padding: "clamp(16px, 5vw, 24px)",
          borderTop: "1px solid #2D3748",
          background: "oklch(0.09 0.012 255)",
          textAlign: "center",
          fontSize: "clamp(11px, 2vw, 12px)",
          color: "#9CA3AF",
        }}
      >
        <p style={{ margin: 0 }}>FORGECONVERT</p>
        <p style={{ margin: "4px 0 0 0" }}>100% client-side — zero server uploads</p>
      </footer>

<<<<<<< Updated upstream
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
=======
>>>>>>> Stashed changes
      <style>{`
        @media (max-width: 640px) {
          .conversion-grid {
            grid-template-columns: 1fr !important;
          }
          .arrow-container {
            transform: rotate(90deg);
            padding-top: 0 !important;
            padding-left: 12px;
          }
        }
      `}</style>
    </div>
  );
}
