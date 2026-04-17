CREATE TABLE `quiz_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `quiz_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `quiz_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`socialHandle` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(320) NOT NULL,
	`resultType` enum('A','B','C') NOT NULL,
	`resultName` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_submissions_id` PRIMARY KEY(`id`)
);
