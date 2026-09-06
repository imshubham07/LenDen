/*
  Warnings:

  - A unique constraint covering the columns `[adminId,mobile]` on the table `Borrower` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Borrower_adminId_mobile_key" ON "Borrower"("adminId", "mobile");
