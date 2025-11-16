-- CreateIndex
CREATE INDEX "Communityquiz_uploadId_userId_idx" ON "Communityquiz"("uploadId", "userId");

-- CreateIndex
CREATE INDEX "Communityquiz_id_userId_uploadId_idx" ON "Communityquiz"("id", "userId", "uploadId");

-- CreateIndex
CREATE INDEX "Game_userId_uploadId_timeStarted_idx" ON "Game"("userId", "uploadId", "timeStarted");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Upload_userId_private_isDeleted_timeStarted_idx" ON "Upload"("userId", "private", "isDeleted", "timeStarted");

-- CreateIndex
CREATE INDEX "Upload_private_isDeleted_timeStarted_idx" ON "Upload"("private", "isDeleted", "timeStarted");

-- CreateIndex
CREATE INDEX "Upload_id_userId_isDeleted_idx" ON "Upload"("id", "userId", "isDeleted");

-- CreateIndex
CREATE INDEX "Upload_id_private_idx" ON "Upload"("id", "private");
