"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMetric = recordMetric;
exports.getMetrics = getMetrics;
const metrics = {
    totalRequests: 0,
    matches: 0,
    mismatches: 0,
    totalPrimaryTime: 0,
    totalShadowTime: 0,
};
function recordMetric(data) {
    metrics.totalRequests++;
    if (data.result === "MATCH") {
        metrics.matches++;
    }
    else {
        metrics.mismatches++;
    }
    metrics.totalPrimaryTime += data.primaryTimeMs;
    metrics.totalShadowTime += data.shadowTimeMs;
}
function getMetrics() {
    return {
        ...metrics,
        averagePrimaryTime: metrics.totalRequests
            ? metrics.totalPrimaryTime / metrics.totalRequests
            : 0,
        averageShadowTime: metrics.totalRequests
            ? metrics.totalShadowTime / metrics.totalRequests
            : 0,
    };
}
