ALTER TABLE `order_items` ADD `productName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `quantity` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `unit` varchar(50) DEFAULT 'dozen' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `unitPrice` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_order_items` ADD `recurringProductName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_order_items` ADD `quantity` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_order_items` ADD `unit` varchar(50) DEFAULT 'dozen' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_order_items` ADD `unitPrice` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` DROP COLUMN `product`;--> statement-breakpoint
ALTER TABLE `order_items` DROP COLUMN `quantityDozens`;--> statement-breakpoint
ALTER TABLE `order_items` DROP COLUMN `pricePerDozen`;--> statement-breakpoint
ALTER TABLE `recurring_order_items` DROP COLUMN `recurringProduct`;--> statement-breakpoint
ALTER TABLE `recurring_order_items` DROP COLUMN `quantityDozens`;--> statement-breakpoint
ALTER TABLE `recurring_order_items` DROP COLUMN `pricePerDozen`;