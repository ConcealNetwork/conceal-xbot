CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "transactions" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"block"	NUMERIC NOT NULL,
	"payment_id"	TEXT NOT NULL,
	"timestamp"	NUMERIC NOT NULL,
	"amount"	INTEGER NOT NULL,
	"tx_hash"	TEXT NOT NULL
);
CREATE UNIQUE INDEX "trs_payment_id" ON "transactions" (
	"tx_hash"	ASC
);
CREATE UNIQUE INDEX "trs_tx_hash" ON "transactions" (
	"tx_hash"	ASC
);
CREATE TABLE IF NOT EXISTS "wallets" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"address"	TEXT NOT NULL,
	"user_id"	TEXT NOT NULL,
	"user_name"	TEXT NOT NULL,
	"payment_id"	TEXT NOT NULL
);
CREATE UNIQUE INDEX "wlt_payment_id" ON "wallets" (
	"payment_id"	ASC
);
CREATE UNIQUE INDEX "wlt_user_id" ON "wallets" (
	"user_id"	ASC
);
CREATE INDEX "wlt_user_name" ON "wallets" (
	"user_name"	ASC
);
CREATE INDEX "wlt_address" ON "wallets" (
	"address"	ASC
);
CREATE TABLE IF NOT EXISTS "giveaways" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"user_id"	TEXT NOT NULL,
	"channel_id"	TEXT NOT NULL,
	"message_id"	TEXT NOT NULL,
	"creation_ts"	NUMERIC NOT NULL,
	"description"	TEXT NOT NULL,
	"timespan"	NUMERIC NOT NULL,
	"winners"	INTEGER NOT NULL,
	"amount"	NUMERIC NOT NULL,
	"is_active"	INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "user_activity" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"user_id"	TEXT NOT NULL,
	"timestamp"	NUMERIC NOT NULL,
	"msg_alltime"	NUMERIC NOT NULL,
	"msg_period"	NUMERIC NOT NULL
);
CREATE UNIQUE INDEX "ua_user_id" ON "user_activity" (
	"user_id"	ASC
);
