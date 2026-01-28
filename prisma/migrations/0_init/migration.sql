-- CreateTable
CREATE TABLE `QARecord` (
    `id` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `departmentName` VARCHAR(191) NOT NULL,
    `fiscalYear` INTEGER NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `qa_dept_year_idx`(`departmentId`, `fiscalYear`),
    UNIQUE INDEX `qa_unique_index`(`departmentId`, `fiscalYear`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
