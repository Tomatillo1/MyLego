-- =====================================================================
-- 1_auth_and_design — migration manuelle SANS perte de données
-- Tout s'exécute dans une transaction : en cas d'erreur, rien n'est appliqué.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- LEGO : prix en centimes, date de retrait typée, année / âge, index
-- ---------------------------------------------------------------------
ALTER TABLE "Lego" RENAME COLUMN "startingPrice" TO "priceCents";
UPDATE "Lego" SET "priceCents" = "priceCents" * 100;

-- Texte ISO 8601 -> timestamp (échoue proprement si une valeur n'est pas une date)
ALTER TABLE "Lego"
  ALTER COLUMN "removedFromStoreOn" TYPE TIMESTAMP(3)
  USING NULLIF("removedFromStoreOn", '')::timestamptz AT TIME ZONE 'UTC';

ALTER TABLE "Lego"
  ADD COLUMN "year"   INTEGER,
  ADD COLUMN "minAge" INTEGER;

CREATE UNIQUE INDEX "Lego_setNumber_key" ON "Lego"("setNumber");
CREATE INDEX "Lego_theme_idx" ON "Lego"("theme");
CREATE INDEX "Lego_name_idx"  ON "Lego"("name");

-- ---------------------------------------------------------------------
-- USER : pseudo, mot de passe haché, avatar, CGU
-- ---------------------------------------------------------------------
-- Renommage (la valeur est conservée ; les mots de passe en clair existants
-- sont ensuite hachés par scripts/rehash-legacy-passwords.ts)
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";

ALTER TABLE "User"
  ADD COLUMN "username"        TEXT,
  ADD COLUMN "avatar"          BYTEA,
  ADD COLUMN "avatarMime"      TEXT,
  ADD COLUMN "avatarUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- Pseudo provisoire = partie locale de l'email (caractères autorisés), suffixée si doublon
WITH base AS (
  SELECT "id",
         COALESCE(NULLIF(LEFT(regexp_replace(split_part("email", '@', 1), '[^A-Za-z0-9_]', '', 'g'), 16), ''), 'brick') AS b
  FROM "User"
), numbered AS (
  SELECT "id", b, ROW_NUMBER() OVER (PARTITION BY lower(b) ORDER BY "id") AS n FROM base
)
UPDATE "User" u
SET "username" = CASE WHEN n.n = 1 THEN n.b ELSE n.b || n.n::text END
FROM numbered n
WHERE u."id" = n."id";

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_username_lower_key" ON "User"(lower("username"));
-- Emails : unicité insensible à la casse (les emails sont stockés en minuscules par l'app)
UPDATE "User" SET "email" = lower(trim("email"));

-- ---------------------------------------------------------------------
-- SESSIONS & JETONS DE RÉINITIALISATION
-- ---------------------------------------------------------------------
CREATE TABLE "Session" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PasswordResetToken" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_createdAt_idx" ON "PasswordResetToken"("userId", "createdAt");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- COLLECTION : relation implicite -> table explicite (copie puis suppression)
-- Dans "_UserCollection" : A = Lego.id, B = User.id
-- ---------------------------------------------------------------------
CREATE TABLE "CollectionItem" (
    "userId"  TEXT         NOT NULL,
    "legoId"  TEXT         NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("userId", "legoId")
);
CREATE INDEX "CollectionItem_legoId_idx" ON "CollectionItem"("legoId");
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_legoId_fkey"
  FOREIGN KEY ("legoId") REFERENCES "Lego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CollectionItem" ("userId", "legoId", "addedAt")
SELECT "B", "A", CURRENT_TIMESTAMP FROM "_UserCollection";

-- Garde-fou : la copie doit être complète avant de supprimer l'ancienne table
DO $$
BEGIN
  IF (SELECT count(*) FROM "CollectionItem") <> (SELECT count(*) FROM "_UserCollection") THEN
    RAISE EXCEPTION 'Copie de la collection incomplète, migration annulée';
  END IF;
END $$;

DROP TABLE "_UserCollection";

-- ---------------------------------------------------------------------
-- WISHLIST : updatedAt + exclusivité (la collection l'emporte — validé)
-- ---------------------------------------------------------------------
ALTER TABLE "WishlistItem" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DELETE FROM "WishlistItem" w
USING "CollectionItem" c
WHERE c."userId" = w."userId" AND c."legoId" = w."legoId";

COMMIT;
