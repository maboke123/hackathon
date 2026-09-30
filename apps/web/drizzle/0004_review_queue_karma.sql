CREATE TABLE "karma_events" (
	"id" text PRIMARY KEY NOT NULL,
	"colleague_id" text NOT NULL,
	"review_id" text,
	"kind" text NOT NULL,
	"item_id" text NOT NULL,
	"points" integer NOT NULL,
	"on_time" boolean NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "source" text DEFAULT 'schedule' NOT NULL;--> statement-breakpoint
ALTER TABLE "review_items" ALTER COLUMN "source" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "requested_by_id" text;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "due_at" date;--> statement-breakpoint
UPDATE "review_items" SET "due_at" = ("created_at"::date + 14);--> statement-breakpoint
ALTER TABLE "review_items" ALTER COLUMN "due_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "karma_events" ADD CONSTRAINT "karma_events_colleague_id_colleagues_id_fk" FOREIGN KEY ("colleague_id") REFERENCES "public"."colleagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "karma_events_colleague_id_idx" ON "karma_events" USING btree ("colleague_id");--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_requested_by_id_colleagues_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."colleagues"("id") ON DELETE no action ON UPDATE no action;