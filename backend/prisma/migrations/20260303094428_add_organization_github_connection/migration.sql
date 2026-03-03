-- CreateTable
CREATE TABLE "organization_github_connection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_github_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_github_connection_organizationId_key" ON "organization_github_connection"("organizationId");

-- CreateIndex
CREATE INDEX "organization_github_connection_organizationId_idx" ON "organization_github_connection"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_github_connection" ADD CONSTRAINT "organization_github_connection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
