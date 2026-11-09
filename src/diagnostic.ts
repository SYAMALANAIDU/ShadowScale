import { getMetrics } from "./metrics/metrics.js";

export function diagnoseIncident() {
  const metrics = getMetrics();

  const matchRate = metrics.totalRequests
    ? (metrics.matches / metrics.totalRequests) * 100
    : 0;

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (metrics.totalRequests === 0) {
    issues.push("No API requests recorded yet.");
    recommendations.push("Send test requests through ShadowScale proxy.");
  }

  if (metrics.mismatches > 0) {
    issues.push(`${metrics.mismatches} API response mismatches detected.`);
    recommendations.push("Inspect primary and shadow response differences.");
  }

  if (metrics.averageShadowTime > metrics.averagePrimaryTime) {
    issues.push("Shadow backend is responding slower than primary.");
    recommendations.push("Investigate shadow backend latency.");
  }

  if (matchRate < 90 && metrics.totalRequests > 0) {
    issues.push("API response match rate is below 90%.");
    recommendations.push("Review response consistency and backend behavior.");
  }

  if (issues.length === 0) {
    issues.push("No major reliability issues detected.");
    recommendations.push("Continue monitoring API performance.");
  }

  return {
    status: issues.some((issue) => issue.includes("mismatch") || issue.includes("below 90%"))
      ? "WARNING"
      : "HEALTHY",
    matchRate: Number(matchRate.toFixed(2)),
    metrics,
    issues,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}