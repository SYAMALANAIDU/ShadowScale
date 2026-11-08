interface RequestMetric {
  result: "MATCH" | "MISMATCH";
  primaryTimeMs: number;
  shadowTimeMs: number;
}

const metrics = {
  totalRequests: 0,
  matches: 0,
  mismatches: 0,
  totalPrimaryTime: 0,
  totalShadowTime: 0,
};

export function recordMetric(data: RequestMetric) {
  metrics.totalRequests++;

  if (data.result === "MATCH") {
    metrics.matches++;
  } else {
    metrics.mismatches++;
  }

  metrics.totalPrimaryTime += data.primaryTimeMs;
  metrics.totalShadowTime += data.shadowTimeMs;
}

export function getMetrics() {
  return {
    ...metrics,
    averagePrimaryTime:
      metrics.totalRequests
        ? metrics.totalPrimaryTime / metrics.totalRequests
        : 0,
    averageShadowTime:
      metrics.totalRequests
        ? metrics.totalShadowTime / metrics.totalRequests
        : 0,
  };
}