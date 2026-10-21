CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`student_id` text NOT NULL,
	`partner_id` text NOT NULL,
	`offer_id` text NOT NULL,
	`title` text NOT NULL,
	`cost` integer NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`request_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`used_at` text,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "valid_coupon_status" CHECK("coupons"."status" IN ('available','used'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_request_key_unique` ON `coupons` (`request_key`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`transaction_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_emails_user` ON `emails` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`photo` text NOT NULL,
	`cost` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_cost" CHECK("offers"."cost">0)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`from_id` text,
	`to_id` text,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`coupon_id` text,
	`semester` text,
	`request_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`from_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_amount" CHECK("transactions"."amount">0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_coupon_id_unique` ON `transactions` (`coupon_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_request_key_unique` ON `transactions` (`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `semester_once` ON `transactions` (`to_id`,`semester`);--> statement-breakpoint
CREATE INDEX `ix_transactions_from` ON `transactions` (`from_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_transactions_to` ON `transactions` (`to_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`cpf` text,
	`rg` text,
	`address` text,
	`institution_id` text,
	`course` text,
	`department` text,
	`balance` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "balance_nonnegative" CHECK("users"."balance">=0),
	CONSTRAINT "valid_role" CHECK("users"."role" IN ('student','teacher','partner'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_cpf_unique` ON `users` (`cpf`);
--> statement-breakpoint
CREATE TRIGGER prevent_overdraft BEFORE INSERT ON transactions WHEN NEW.from_id IS NOT NULL AND (SELECT balance FROM users WHERE id=NEW.from_id)<NEW.amount BEGIN SELECT RAISE(ABORT,'Saldo insuficiente'); END;
--> statement-breakpoint
CREATE TRIGGER apply_debit AFTER INSERT ON transactions WHEN NEW.from_id IS NOT NULL BEGIN UPDATE users SET balance=balance-NEW.amount WHERE id=NEW.from_id; END;
--> statement-breakpoint
CREATE TRIGGER apply_credit AFTER INSERT ON transactions WHEN NEW.to_id IS NOT NULL BEGIN UPDATE users SET balance=balance+NEW.amount WHERE id=NEW.to_id; END;
