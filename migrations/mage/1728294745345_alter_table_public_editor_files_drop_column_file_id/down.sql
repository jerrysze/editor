alter table "public"."editor_files" add constraint "editor_files_file_id_key" unique (file_id);
alter table "public"."editor_files" alter column "file_id" drop not null;
alter table "public"."editor_files" add column "file_id" int4;
