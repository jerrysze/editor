alter table "public"."editor_collections" drop constraint "editor_collections_pkey";
alter table "public"."editor_collections"
    add constraint "editor_collections_pkey"
    primary key ("collection_idd");
