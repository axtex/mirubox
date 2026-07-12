-- CreateTable
CREATE TABLE "BrowseShelf" (
    "key" TEXT NOT NULL,
    "mediaIds" INTEGER[],
    "meta" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowseShelf_pkey" PRIMARY KEY ("key")
);
