const initialMigration = [
  `CREATE TABLE "blend_events" (
	"id" text PRIMARY KEY NOT NULL,
	"blend_id" text NOT NULL,
	"kind" text NOT NULL,
	"volume_ml" integer NOT NULL,
	"abv_bp" integer,
	"source_bottle_id" text,
	"note" text,
	"occurred_at" text NOT NULL,
	"created_at" text NOT NULL,
	"is_approximate" integer DEFAULT false NOT NULL
)`,
  '--> statement-breakpoint',
  `CREATE TABLE "blends" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"vessel_capacity_ml" integer,
	"started_at" text NOT NULL,
	"notes" text,
	"archived_at" text
)`,
  '--> statement-breakpoint',
  `CREATE TABLE "bottles" (
	"id" text PRIMARY KEY NOT NULL,
	"blend_id" text NOT NULL,
	"name" text NOT NULL,
	"distillery" text,
	"category" text,
	"region" text,
	"country" text,
	"abv_bp" integer,
	"volume_ml" integer,
	"barcode" text,
	"photo_uri" text,
	"notes" text,
	"source" text NOT NULL,
	"created_at" text NOT NULL
)`,
  '--> statement-breakpoint',
  `CREATE TABLE "catalog_cache" (
	"barcode" text PRIMARY KEY NOT NULL,
	"data_json" text NOT NULL,
	"cached_at" text NOT NULL
)`,
  '--> statement-breakpoint',
  `CREATE TABLE "meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
)`,
  '--> statement-breakpoint',
  `CREATE TABLE "predictions" (
	"blend_id" text PRIMARY KEY NOT NULL,
	"flavor_json" text NOT NULL,
	"cached_at" text NOT NULL
)`,
  '--> statement-breakpoint',
  `CREATE TABLE "tastings" (
	"id" text PRIMARY KEY NOT NULL,
	"blend_id" text NOT NULL,
	"note" text,
	"rating" integer,
	"tasted_at" text NOT NULL
)`,
].join('\n');

const migrations = {
  journal: {
    entries: [
      {
        idx: 0,
        version: '6',
        when: 1791463970748,
        tag: '0000_lying_whirlwind',
        breakpoints: true,
      },
      {
        idx: 1,
        version: '7',
        when: 1791566670000,
        tag: '0001_add_remaining_volume',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    m0000: initialMigration,
    m0001: `ALTER TABLE "bottles" ADD COLUMN "remaining_volume_ml" integer;`,
  },
};

export default migrations;
