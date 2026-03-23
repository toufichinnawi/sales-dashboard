CREATE TABLE `tasting_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`business` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`address` text,
	`preferredDate` varchar(100),
	`bagelPreferences` text,
	`message` text,
	`tastingStatus` enum('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasting_requests_id` PRIMARY KEY(`id`)
);
