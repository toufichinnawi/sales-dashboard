CREATE TABLE `recurring_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recurringOrderId` int NOT NULL,
	`recurringProduct` enum('plain','sesame','everything') NOT NULL,
	`quantityDozens` decimal(10,1) NOT NULL,
	`pricePerDozen` decimal(10,2) NOT NULL,
	`lineTotal` decimal(10,2) NOT NULL,
	CONSTRAINT `recurring_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`dayOfWeek` enum('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`deliveryAddress` text,
	`notes` text,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`recurringStatus` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`nextDelivery` timestamp,
	`lastGenerated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `recurringOrderId` int;