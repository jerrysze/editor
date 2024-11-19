alter table "public"."editor_files"
  add constraint "editor_files_collection_id_fkey"
  foreign key ("collection_id")
  references "public"."editor_collections"
  ("collection_id") on update restrict on delete restrict;
