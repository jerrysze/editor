BEGIN TRANSACTION;
ALTER TABLE "public"."editor_files" DROP CONSTRAINT "editor_files_pkey";

ALTER TABLE "public"."editor_files"
    ADD CONSTRAINT "editor_files_pkey" PRIMARY KEY ("file_id");
COMMIT TRANSACTION;
