CREATE TABLE `qb_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`realmId` varchar(50) NOT NULL,
	`companyName` varchar(255),
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`accessTokenExpiresAt` timestamp NOT NULL,
	`refreshTokenExpiresAt` timestamp NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qb_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `qb_connections_realmId_unique` UNIQUE(`realmId`)
);
--> statement-breakpoint
CREATE TABLE `qb_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`syncType` enum('full','incremental','customers','invoices','payments') NOT NULL,
	`syncStatus` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`customersCreated` int DEFAULT 0,
	`customersUpdated` int DEFAULT 0,
	`ordersCreated` int DEFAULT 0,
	`ordersUpdated` int DEFAULT 0,
	`paymentsProcessed` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `qb_sync_log_id` PRIMARY KEY(`id`)
);
