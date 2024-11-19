alter table "public"."editor_files" alter column "collection_id" drop not null;
alter table "public"."editor_files" add column "collection_id" int4;
