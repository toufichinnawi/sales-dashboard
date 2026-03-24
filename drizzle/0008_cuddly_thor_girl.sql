CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notifType` enum('new_lead','tasting_request','new_order','order_status','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
