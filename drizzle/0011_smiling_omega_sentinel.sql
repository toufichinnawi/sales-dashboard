CREATE TABLE `lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`activityType` enum('lead_created','status_changed','note_added','phone_call','email_sent','follow_up_scheduled','tasting_scheduled','quote_sent','marked_won','marked_lost') NOT NULL,
	`note` text,
	`userId` int,
	`userName` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_activities_id` PRIMARY KEY(`id`)
);
