CREATE TABLE "agent_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"asked_at" timestamp with time zone NOT NULL,
	"asked_by" text NOT NULL,
	"asked_by_id" text,
	"question" text NOT NULL,
	"results" jsonb NOT NULL,
	"answer" text NOT NULL,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "colleagues" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"job_title" text NOT NULL,
	"team_id" text NOT NULL,
	"country" text,
	"location" text,
	"languages" text[] NOT NULL,
	"status" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"successor_id" text,
	CONSTRAINT "colleagues_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"segment" text NOT NULL,
	"since" text,
	"headquarters" text,
	"countries" text[] NOT NULL,
	"note" text,
	"contacts" jsonb NOT NULL,
	"entities" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"file_path" text NOT NULL,
	"pdf_path" text,
	"source_system" text NOT NULL,
	"location" text NOT NULL,
	"language" text NOT NULL,
	"country" text,
	"customer_id" text,
	"team_id" text,
	"product" text,
	"joint_committee" text,
	"keywords" text[] NOT NULL,
	"owner_id" text,
	"author_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"modified_at" timestamp with time zone NOT NULL,
	"modified_by_id" text,
	"last_checked_at" date,
	"next_review_at" date,
	"status" text NOT NULL,
	"usefulness" real,
	"usefulness_scored_at" timestamp with time zone,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(body, '')), 'B')) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_links" (
	"id" text PRIMARY KEY NOT NULL,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"evidence" text,
	"status" text NOT NULL,
	"origin" text NOT NULL,
	"confidence" real,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "knowledge_links_from_to_type_unique" UNIQUE("from_id","to_id","type")
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"item_ids" text[] NOT NULL,
	"link_id" text,
	"assignee_id" text,
	"assignee_team_id" text,
	"trigger" text NOT NULL,
	"payload" jsonb,
	"status" text NOT NULL,
	"outcome" text,
	"created_at" timestamp with time zone NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "colleague_id" text;--> statement-breakpoint
ALTER TABLE "colleagues" ADD CONSTRAINT "colleagues_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_owner_id_colleagues_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."colleagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_author_id_colleagues_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."colleagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_modified_by_id_colleagues_id_fk" FOREIGN KEY ("modified_by_id") REFERENCES "public"."colleagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_links" ADD CONSTRAINT "knowledge_links_from_id_knowledge_items_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_links" ADD CONSTRAINT "knowledge_links_to_id_knowledge_items_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_link_id_knowledge_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."knowledge_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_assignee_id_colleagues_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."colleagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_assignee_team_id_teams_id_fk" FOREIGN KEY ("assignee_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "colleagues_team_id_idx" ON "colleagues" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "knowledge_items_search_idx" ON "knowledge_items" USING gin ("search");--> statement-breakpoint
CREATE INDEX "knowledge_items_owner_id_idx" ON "knowledge_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "knowledge_items_customer_id_idx" ON "knowledge_items" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "knowledge_links_to_id_idx" ON "knowledge_links" USING btree ("to_id");--> statement-breakpoint
CREATE INDEX "review_items_assignee_id_idx" ON "review_items" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "review_items_status_idx" ON "review_items" USING btree ("status");