CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`address` text,
	`segment` enum('cafe','restaurant','hotel','grocery','catering','university','other') NOT NULL DEFAULT 'cafe',
	`notes` text,
	`customerStatus` enum('active','inactive','prospect') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`product` enum('plain','sesame','everything') NOT NULL,
	`quantityDozens` decimal(10,1) NOT NULL,
	`pricePerDozen` decimal(10,2) NOT NULL,
	`lineTotal` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`orderNumber` varchar(20) NOT NULL,
	`orderStatus` enum('pending','confirmed','preparing','delivered','paid','cancelled') NOT NULL DEFAULT 'pending',
	`deliveryDate` timestamp NOT NULL,
	`deliveryAddress` text,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
