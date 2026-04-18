"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const API_BASE = "https://midnight-api-production.up.railway.app";
const CHECK_INTERVAL_MS = 30_000;
const MAX_HISTORY = 30;

interface ServiceCheck {
  status: "operational" | "degraded" | "down";
  latency: number;
  timestamp: string;
}

interface ServiceState {
  name: string;
  endpoint: string;
  current: ServiceCheck | null;
  history: ServiceCheck[];
}

const STATUS_COLORS = {
  operational: "#00D4AA",
  degraded: "#F5A623",
  down: "#E60000",
} as const;

const SERVICES_CONFIG = [
  { name: "API Server", endpoint: "/api/v1/health" },
];

async function checkService(endpoint: string): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { cache: "no-store" });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { status: "down", latency, timestamp: new Date().toISOString() };
    }
    const status = latency > 2000 ? "degraded" : "operational";
    return { status, latency, timestamp: new Date().toISOString() };
  } catch {
    const latency = Math.round(performance.now() - start);
    return { status: "down", latency, timestamp: new Date().toISOString() };
  }
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceState[]>(
    SERVICES_CONFIG.map((s) => ({
      ...s,
      current: null,
      history: [],
    }))
  );

  const runChecks = useCallback(async () => {
    const results = await Promise.all(
      SERVICES_CONFIG.map((s) => checkService(s.endpoint))
    );
    setServices((prev) =>
      prev.map((svc, i) => {
        const check = results[i] ?? svc.current;
        if (!check) return svc;
        return {
          ...svc,
          current: check,
          history: [...svc.history, check].slice(-MAX_HISTORY),
        };
      })
    );
  }, []);

  useEffect(() => {
    runChecks();
    const interval = setInterval(runChecks, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [runChecks]);

  const overallStatus = services.every((s) => s.current?.status === "operational")
    ? "operational"
    : services.some((s) => s.current?.status === "down")
      ? "down"
      : services.some((s) => s.current)
        ? "degraded"
        : "operational";

  const overallLabel = {
    operational: "All systems operational",
    degraded: "Some services degraded",
    down: "Service disruption detected",
  }[overallStatus];

  return (
    <>
      <nav className="w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-xl z-50 sticky top-0">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Midnight"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-base font-brand font-medium tracking-tight text-[#f4f4f5]">
              Midnight
            </span>
          </Link>
          <Link
            href="/"
            className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#555555] hover:text-[#f4f4f5] transition-colors"
          >
            &larr; Back
          </Link>
        </div>
      </nav>

      <main className="w-full bg-[#030303] min-h-screen">
        <div className="max-w-2xl mx-auto px-6 md:px-8 py-16">
          {/* Overall status */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[overallStatus] }}
            />
            <h1 className="text-3xl font-brand tracking-tight text-[#f4f4f5]">
              System Status
            </h1>
          </div>
          <p className="text-sm text-[#888] mb-12 ml-6">
            {overallLabel}
          </p>

          {/* Service cards */}
          <div className="space-y-4">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: svc.current
                          ? STATUS_COLORS[svc.current.status]
                          : "#333",
                      }}
                    />
                    <span className="text-sm font-brand text-[#f4f4f5]">
                      {svc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {svc.current && (
                      <>
                        <span className="font-mono text-[10px] text-[#666] tabular-nums">
                          {svc.current.latency}ms
                        </span>
                        <span
                          className="font-mono text-[10px] uppercase tracking-wider"
                          style={{
                            color: STATUS_COLORS[svc.current.status],
                          }}
                        >
                          {svc.current.status}
                        </span>
                      </>
                    )}
                    {!svc.current && (
                      <span className="font-mono text-[10px] text-[#444]">
                        Checking...
                      </span>
                    )}
                  </div>
                </div>

                {/* Uptime history dots */}
                <div className="flex gap-1">
                  {Array.from({ length: MAX_HISTORY }).map((_, i) => {
                    const check = svc.history[i];
                    return (
                      <div
                        key={i}
                        className="flex-1 h-6 rounded-sm"
                        style={{
                          backgroundColor: check
                            ? STATUS_COLORS[check.status]
                            : "#1a1a1a",
                          opacity: check ? 1 : 0.3,
                        }}
                        title={
                          check
                            ? `${check.status} - ${check.latency}ms - ${new Date(check.timestamp).toLocaleTimeString()}`
                            : "No data"
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-12 flex flex-col items-center gap-2">
            <p className="font-mono text-[9px] text-[#444] uppercase tracking-[0.2em]">
              Checks every 30 seconds
            </p>
            {services[0]?.current && (
              <p className="font-mono text-[9px] text-[#333] uppercase tracking-[0.2em]">
                Last checked: {new Date(services[0].current.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
