CREATE TABLE `sales_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodMonth` varchar(7) NOT NULL,
	`targetRevenue` decimal(10,2) NOT NULL,
	`targetDozens` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_targets_periodMonth_unique` UNIQUE(`periodMonth`)
);
