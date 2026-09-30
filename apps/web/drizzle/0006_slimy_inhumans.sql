CREATE TABLE "graph_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"props" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "subject" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "document_type" text DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "access_level" text DEFAULT 'team' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "access_team_ids" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "label_status" text DEFAULT 'unlabelled' NOT NULL;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_from_id_graph_nodes_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."graph_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_to_id_graph_nodes_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."graph_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "graph_edges_from_id_idx" ON "graph_edges" USING btree ("from_id");--> statement-breakpoint
CREATE INDEX "graph_edges_to_id_idx" ON "graph_edges" USING btree ("to_id");--> statement-breakpoint
CREATE INDEX "graph_nodes_type_idx" ON "graph_nodes" USING btree ("type");