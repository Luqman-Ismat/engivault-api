# Changelog

All notable changes to the EngiVault project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive roadmap for package distribution and cross-platform installers
- NPM/JavaScript SDK with full TypeScript support
- Python SDK CLI tool with rich formatting
- Automated GitHub Actions workflows for package publishing
- Cross-platform installer development plan

### Changed
- Reorganized repository structure to support multiple packages
- Enhanced Python SDK with modern packaging standards
- Updated documentation for new package structure

## [2.0.0] - 2025-09-20

### Added
- Core TypeScript API with Fastify framework
- PostgreSQL database with Prisma ORM
- SaaS authentication and subscription tiers
- Python SDK for easy integration
- Excel VBA integration modules
- Railway deployment configuration
- Comprehensive API documentation with Swagger
- Health check and monitoring endpoints

### Features
- **Fluid Mechanics Calculations**:
  - Open channel flow using Manning's equation
  - Compressible flow properties with isentropic relations
  - Boundary layer analysis for flat plates
  - External flow drag and lift calculations
  - Normal shock wave properties
  - Choked flow analysis

- **Heat Transfer Calculations**:
  - Heat exchanger area calculation using LMTD
  - Log Mean Temperature Difference (LMTD)
  - Effectiveness-NTU method
  - Convective heat transfer coefficients
  - Fin analysis (efficiency, effectiveness)
  - Thermal resistance networks
  - Overall heat transfer coefficient for cylindrical systems

- **Authentication & Authorization**:
  - JWT-based authentication
  - API key management
  - Subscription-based rate limiting
  - Usage analytics and tracking

- **Infrastructure**:
  - High-performance Fastify server
  - Type-safe development with TypeScript and Zod
  - Automated error handling and logging
  - Railway deployment optimization

### Security
- bcrypt password hashing
- JWT token authentication
- Input validation with Zod schemas
- Rate limiting per user and API key
- Secure error responses

## [1.0.0] - 2024-12-01

### Added
- Initial release of EngiVault API
- Basic hydraulics calculations
- Simple authentication system
- REST API endpoints
- Basic documentation

---

## Package-Specific Changelogs

### NPM Package (`packages/engivault-js/`)
See [NPM Package Changelog](packages/engivault-js/CHANGELOG.md)

### Python SDK (`python-sdk/`)
See [Python SDK Changelog](python-sdk/CHANGELOG.md)

### Excel Integration (`excel-integration/`)
See [Excel Integration Changelog](excel-integration/CHANGELOG.md)

---

## Migration Guide

### Upgrading from v1.x to v2.x

#### Breaking Changes
- API endpoints have been reorganized under `/api/v1/`
- Authentication now requires API keys instead of basic auth
- Response format has been standardized with `success`, `data`, and `timestamp` fields

#### New Features
- Subscription tiers with usage limits
- Enhanced error handling and validation
- Comprehensive heat transfer calculations
- Advanced fluid mechanics calculations

#### Migration Steps
1. Update your API endpoints to include `/api/v1/` prefix
2. Obtain new API key from the dashboard
3. Update authentication headers to use `Authorization: Bearer <api-key>`
4. Update response parsing to handle new standardized format

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed future plans including:
- Cross-platform installers for Windows, macOS, and Linux
- `npm install engivault` and `pip install engivault` support
- VS Code and JetBrains IDE plugins
- Mobile applications
- Additional language bindings (R, MATLAB, Julia, Go, Rust)
