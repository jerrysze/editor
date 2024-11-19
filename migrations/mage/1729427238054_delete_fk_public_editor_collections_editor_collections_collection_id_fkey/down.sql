alter table "public"."editor_collections"
  add constraint "editor_collections_collection_id_fkey"
  foreign key ("collection_id")
  references "public"."editor_files"
  ("collection_id") on update restrict on delete restrict;
