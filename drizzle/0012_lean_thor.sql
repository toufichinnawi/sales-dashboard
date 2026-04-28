ALTER TABLE `leads` ADD `followUpPriority` enum('low','normal','high','urgent') DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE `leads` ADD `followUpNote` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `followUpStatus` enum('pending','done') DEFAULT 'pending';