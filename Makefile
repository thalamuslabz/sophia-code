# Thalamus AI - Makefile
# Convenience commands for development

.PHONY: help install dev build test clean docker-up docker-down logs

# Default target
help:
	@echo "Thalamus AI Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install      - Install dependencies and build"
	@echo "  make install-dev  - Install with dev dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start all services in dev mode"
	@echo "  make dev-cli      - Start CLI in watch mode"
	@echo "  make dev-dashboard - Start dashboard dev server"
	@echo "  make dev-orchestrator - Start orchestrator dev server"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Build all packages"
	@echo "  make build-shared - Build shared package"
	@echo "  make build-cli    - Build CLI package"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-cli     - Run CLI tests"
	@echo "  make test-e2e     - Run E2E tests"
	@echo "  make test-coverage - Run tests with coverage"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Start Docker infrastructure"
	@echo "  make docker-down  - Stop Docker infrastructure"
	@echo "  make docker-logs  - View Docker logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make lint         - Run linter"
	@echo "  make format       - Format code"
	@echo "  make reset        - Full reset (clean + reinstall)"

# Setup
install:
	./install.sh

install-dev:
	./install.sh --dev

install-minimal:
	./install.sh --minimal

# Development
dev:
	npm run dev

dev-cli:
	cd packages/cli && npm run dev

dev-dashboard:
	cd packages/dashboard && npm run dev

dev-orchestrator:
	cd packages/orchestrator && npm run dev

# Build
build:
	npm run build

build-shared:
	cd packages/shared && npm run build

build-cli: build-shared
	cd packages/cli && npm run build

build-dashboard: build-shared
	cd packages/dashboard && npm run build

build-orchestrator: build-shared
	cd packages/orchestrator && npm run build

# Testing
test:
	npm test

test-cli:
	cd packages/cli && npm test

test-shared:
	cd packages/shared && npm test

test-dashboard:
	cd packages/dashboard && npm test

test-orchestrator:
	cd packages/orchestrator && npm test

test-e2e:
	npm run test:e2e

test-coverage:
	npm run test:coverage

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-build:
	docker compose build

docker-clean:
	docker compose down -v

# Utilities
clean:
	rm -rf packages/*/dist
	rm -rf packages/*/node_modules/.cache
	rm -rf .sophia
	find . -name "*.log" -type f -delete

lint:
	npm run lint

lint-fix:
	npm run lint -- --fix

format:
	npm run format

typecheck:
	cd packages/shared && npm run typecheck
	cd packages/cli && npm run typecheck
	cd packages/dashboard && npm run typecheck
	cd packages/orchestrator && npm run typecheck

reset: clean
	rm -rf node_modules
	rm -rf packages/*/node_modules
	npm ci
	npm run build

# Release helpers
version-patch:
	npm version patch

version-minor:
	npm version minor

version-major:
	npm version major

# Quick commands
sophia:
	./packages/cli/dist/index.js

status:
	./packages/cli/dist/index.js status

dashboard:
	./packages/cli/dist/index.js dashboard

quick-test:
	cd packages/cli && npm test -- --run
