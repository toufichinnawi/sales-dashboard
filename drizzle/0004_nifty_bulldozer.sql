CREATE TABLE `customer_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`inviteStatus` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `userId` int;