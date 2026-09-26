import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), version:integer('version').notNull().default(1), data:text('data').notNull(), updatedAt:text('updated_at').notNull()
}, t=>[index('orders_owner_updated').on(t.owner,t.updatedAt)]);
export const files = sqliteTable('files', {id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),key:text('key').notNull()});
