# ShadowScale Dashboard

A System Metrics and Performance Monitoring Dashboard that compares Primary and Shadow API responses.

## Features
- Primary and Shadow API comparison
- Match and mismatch detection
- Automatic Primary fallback when Shadow fails
- Response time tracking
- Live metrics dashboard
- Automatic dashboard refresh

## Architecture
- Primary Server: Port 3001
- Shadow Server: Port 3002
- Proxy Server: Port 3003

## Dashboard
Open: http://127.0.0.1:3003/

## API Endpoints
- GET / – Dashboard UI
- GET /products – Compare API responses
- GET /metrics – Performance metrics

## Metrics
- Total Requests
- Matches
- Mismatches
- Match Rate
- Primary Total Time
- Shadow Total Time
- Average Primary Time
- Average Shadow Time

## Technologies
- Node.js
- TypeScript
- JavaScript
- Fastify
- HTML
- CSS

## Project Status
Core API comparison, fallback handling, and live metrics dashboard implemented.
