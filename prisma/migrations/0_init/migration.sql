-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."WishlistPriority" AS ENUM ('MANDATORY', 'IF_POSSIBLE', 'IF_MONEY');

-- CreateTable
CREATE TABLE "public"."Lego" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setNumber" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "startingPrice" INTEGER NOT NULL,
    "removedFromStoreOn" TEXT,
    "imageUrl" TEXT NOT NULL DEFAULT 'https://assets.lego.com/logos/v4.5.0/brand-lego.svg',

    CONSTRAINT "Lego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legoId" TEXT NOT NULL,
    "priority" "public"."WishlistPriority" NOT NULL DEFAULT 'MANDATORY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_legoId_key" ON "public"."WishlistItem"("userId" ASC, "legoId" ASC);

-- CreateIndex
CREATE INDEX "_UserCollection_B_index" ON "public"."_UserCollection"("B" ASC);

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_legoId_fkey" FOREIGN KEY ("legoId") REFERENCES "public"."Lego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserCollection" ADD CONSTRAINT "_UserCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Lego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserCollection" ADD CONSTRAINT "_UserCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
