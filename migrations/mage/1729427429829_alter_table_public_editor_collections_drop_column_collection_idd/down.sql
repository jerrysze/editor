alter table "public"."editor_collections" alter column "collection_idd" drop not null;
alter table "public"."editor_collections" add column "collection_idd" text;
