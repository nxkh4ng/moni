export interface Transaction {
	id?: number;
	amount: number;
	type: "income" | "expense";
	categoryId: number;
	note: string;
	date: string; // 'YYYY-MM-DD'
	createdAt: number;
}

export interface Category {
	id?: number;
	name: string;
	type: "income" | "expense";
	color: string;
}
