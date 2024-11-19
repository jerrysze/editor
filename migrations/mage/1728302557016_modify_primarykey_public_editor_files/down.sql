alter table "public"."editor_files" drop constraint "editor_files_pkey";
alter table "public"."editor_files"
    add constraint "editor_files_pkey"
    primary key ("collection_id");
