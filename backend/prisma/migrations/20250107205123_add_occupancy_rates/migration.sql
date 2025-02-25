-- CreateTable
CREATE TABLE "OccupancyRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occupancy" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OccupancyRate_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OccupancyRate_roomId_occupancy_key" ON "OccupancyRate"("roomId", "occupancy");
