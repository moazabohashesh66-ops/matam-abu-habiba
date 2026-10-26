-- Safe, idempotent migration for existing order tables.
alter table public.orders
add column if not exists customer_name text not null default '';
