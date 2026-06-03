CREATE TABLE `product_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productName` varchar(255) NOT NULL,
	`unitCost` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL DEFAULT 'dozen',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_costs_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_costs_productName_unique` UNIQUE(`productName`)
);
