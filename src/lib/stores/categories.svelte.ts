import { getDB } from '$lib/db';
import type { Category } from '$lib/types';

class CategoryStore {
	items = $state<Category[]>([]);
	loading = $state(true);

	async load() {
		const db = await getDB();
		this.items = await db.getAll('categories');
		this.loading = false;
	}

	async add(cat: Omit<Category, 'id'>) {
		const db = await getDB();
		await db.add('categories', cat);
		await this.load();
	}

	async update(cat: Category) {
		const db = await getDB();
		await db.put('categories', cat);
		await this.load();
	}

	async remove(id: number) {
		const db = await getDB();
		await db.delete('categories', id);
		await this.load();
	}
}

export const categoryStore = new CategoryStore();
