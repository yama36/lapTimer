CREATE TABLE `laps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runnerId` int NOT NULL,
	`lapNumber` int NOT NULL,
	`lapSec` float NOT NULL,
	`lapPaceSecPerKm` float NOT NULL,
	`diffSecPerKm` float NOT NULL,
	`timestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `laps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `runners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`targetPaceMinPerKm` float NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `runners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`distanceMeters` int NOT NULL DEFAULT 400,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
