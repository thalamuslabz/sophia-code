# Multi-Tenant Architecture

## What Is Multi-Tenancy?
A single application serving multiple customers (tenants), each with
isolated data and potentially different configurations.

## Common Patterns
1. **Database per tenant**: Complete isolation, higher cost
2. **Schema per tenant**: Good isolation, moderate cost
3. **Row-level security**: Shared tables with tenant_id column
4. **Hybrid**: Critical data isolated, shared data in common tables

## Settings Hierarchy
The most common pattern for multi-tenant settings:
1. System defaults (hardcoded)
2. Global settings (all tenants)
3. Tenant settings (per customer)
4. User settings (per individual)

Each level overrides the previous. This is the "settings hierarchy" pattern.

## Key Considerations
- Always filter queries by tenant_id
- Never expose one tenant's data to another
- Test with multiple tenants, not just one
- Consider tenant-specific feature flags
