BEGIN TRANSACTION;
ALTER TABLE "public"."editor_collections" DROP CONSTRAINT "editor_collections_pkey";

ALTER TABLE "public"."editor_collections"
    ADD CONSTRAINT "editor_collections_pkey" PRIMARY KEY ("collection_id");
COMMIT TRANSACTION;
