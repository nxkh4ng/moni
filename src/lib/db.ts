import { openDB, type IDBPDatabase } from "idb";
import type { Transaction, Category } from "./types";

const DB_NAME = "moni";
const DB_VERSION = 1;

let db: IDBPDatabase;

export async function getDB() {
	if (db) return db;

	db = await openDB(DB_NAME, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains("transactions")) {
				const txStore = db.createObjectStore("transactions", {
					keyPath: "id",
					autoIncrement: true
				});
				txStore.createIndex("date", "date");
			}

			if (!db.objectStoreNames.contains("categories")) {
				const catStore = db.createObjectStore("categories", {
					keyPath: "id",
					autoIncrement: true
				});

				const defaultCategories: Category[] = [
					{ name: "Lương", type: "income", color: "#22c55e" },
					{ name: "Freelance", type: "income", color: "#16a34a" },
					{ name: "Đầu tư", type: "income", color: "#15803d" },
					{ name: "Khác (thu)", type: "income", color: "#6b7280" },
					{ name: "Ăn uống", type: "expense", color: "#ef4444" },
					{ name: "Di chuyển", type: "expense", color: "#f97316" },
					{ name: "Hoá đơn", type: "expense", color: "#eab308" },
					{ name: "Giải trí", type: "expense", color: "#a855f7" },
					{ name: "Sức khoẻ", type: "expense", color: "#06b6d4" },
					{ name: "Mua sắm", type: "expense", color: "#ec4899" },
					{ name: "Giáo dục", type: "expense", color: "#6366f1" },
					{ name: "Khác (chi)", type: "expense", color: "#6b7280" }
				];

				for (const cat of defaultCategories) {
					catStore.put(cat);
				}
			}
		}
	});

	return db;
}

export async function exportData(): Promise<{
	transactions: Transaction[];
	categories: Category[];
}> {
	const database = await getDB();
	const transactions = await database.getAll("transactions");
	const categories = await database.getAll("categories");
	return { transactions, categories };
}

export async function importData(data: {
	transactions?: Transaction[];
	categories?: Category[];
}): Promise<void> {
	if (
		!data ||
		!Array.isArray(data.transactions) ||
		!Array.isArray(data.categories)
	) {
		throw new Error(
			"Dữ liệu không hợp lệ: cần có 'transactions' và 'categories' là mảng."
		);
	}

	const database = await getDB();

	const txTxn = database.transaction(["transactions", "categories"], "readwrite");

	await txTxn.objectStore("transactions").clear();
	await txTxn.objectStore("categories").clear();

	for (const tx of data.transactions) {
		await txTxn.objectStore("transactions").put(tx);
	}

	for (const cat of data.categories) {
		await txTxn.objectStore("categories").put(cat);
	}

	await txTxn.done;
}
