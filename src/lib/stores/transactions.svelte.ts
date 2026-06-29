import { getDB } from "$lib/db";
import type { Transaction } from "$lib/types";

class TransactionStore {
	items = $state<Transaction[]>([]);
	loading = $state(true);

	totalIncome = $derived(
		this.items
			.filter((tx) => tx.type === "income")
			.reduce((sum, tx) => sum + tx.amount, 0)
	);

	totalExpense = $derived(
		this.items
			.filter((tx) => tx.type === "expense")
			.reduce((sum, tx) => sum + tx.amount, 0)
	);

	balance = $derived(this.totalIncome - this.totalExpense);

	async load(month?: string) {
		const db = await getDB();
		if (month) {
			const [year, mon] = month.split("-");
			const start = `${year}-${mon}-01`;
			const end = new Date(+year, +mon, 0).toISOString().slice(0, 10);
			const range = IDBKeyRange.bound(start, end);
			this.items = await db.getAllFromIndex("transactions", "date", range);
		} else {
			this.items = await db.getAll("transactions");
		}
		this.items.sort((a, b) => b.date.localeCompare(a.date));
		this.loading = false;
	}

	async add(tx: Omit<Transaction, "id" | "createdAt">) {
		const db = await getDB();
		await db.add("transactions", { ...tx, createdAt: Date.now() });
		await this.load();
	}

	async update(tx: Transaction) {
		const db = await getDB();
		await db.put("transactions", tx);
		await this.load();
	}

	async remove(id: number) {
		const db = await getDB();
		await db.delete("transactions", id);
		await this.load();
	}
}

export const transactionStore = new TransactionStore();
