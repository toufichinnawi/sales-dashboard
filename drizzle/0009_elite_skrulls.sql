CREATE TABLE `pending_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`toName` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`attachments` text,
	`emailStatus` enum('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`leadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `pending_emails_id` PRIMARY KEY(`id`)
);
