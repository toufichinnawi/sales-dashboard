CREATE TABLE `portal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`documentType` enum('brochure','spec_sheet','client_summary','pricing','other') NOT NULL DEFAULT 'other',
	`visibility` enum('admin_only','client_portal') NOT NULL DEFAULT 'admin_only',
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL DEFAULT 0,
	`uploadedBy` int,
	`uploadedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portal_documents_id` PRIMARY KEY(`id`)
);
