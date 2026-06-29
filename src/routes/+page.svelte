<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { transactionStore } from '$lib/stores/transactions.svelte';
	import { categoryStore } from '$lib/stores/categories.svelte';
	import { exportData, importData } from '$lib/db';

	onMount(() => {
		transactionStore.load();
		categoryStore.load();
	});

	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let selectedCategoryId = $state(0);

	const monthTransactions = $derived(
		transactionStore.items.filter((tx) => {
			if (!tx.date.startsWith(selectedMonth)) return false;
			if (selectedCategoryId > 0 && tx.categoryId !== selectedCategoryId)
				return false;
			return true;
		})
	);

	const monthIncome = $derived(
		monthTransactions
			.filter((tx) => tx.type === 'income')
			.reduce((sum, tx) => sum + tx.amount, 0)
	);

	const monthExpense = $derived(
		monthTransactions
			.filter((tx) => tx.type === 'expense')
			.reduce((sum, tx) => sum + tx.amount, 0)
	);

	const balance = $derived(monthIncome - monthExpense);

	interface CategoryTotal {
		categoryId: number;
		name: string;
		color: string;
		amount: number;
	}

	const categoryTotals = $derived.by<CategoryTotal[]>(() => {
		const map = new SvelteMap<number, CategoryTotal>();

		for (const tx of monthTransactions) {
			if (tx.type !== 'expense') continue;
			const cat = categoryStore.items.find((c) => c.id === tx.categoryId);
			if (!cat) continue;

			const existing = map.get(tx.categoryId);
			if (existing) {
				existing.amount += tx.amount;
			} else {
				map.set(tx.categoryId, {
					categoryId: tx.categoryId,
					name: cat.name,
					color: cat.color,
					amount: tx.amount
				});
			}
		}

		return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
	});

	const totalCategoryExpense = $derived(
		categoryTotals.reduce((sum, cat) => sum + cat.amount, 0)
	);

	const recentTransactions = $derived(monthTransactions.slice(0, 5));

	function formatAmount(amount: number): string {
		return amount.toLocaleString('vi-VN') + '₫';
	}

	// --- Export / Import ---

	let importMessage = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	async function handleExport() {
		try {
			const data = await exportData();
			const blob = new Blob([JSON.stringify(data, null, 2)], {
				type: 'application/json'
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const today = new Date().toISOString().slice(0, 10);
			a.download = `moni-backup-${today}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			alert('Xuất dữ liệu thất bại: ' + (err as Error).message);
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const text = e.target?.result as string;
				const parsed = JSON.parse(text);

				if (
					!parsed ||
					!Array.isArray(parsed.transactions) ||
					!Array.isArray(parsed.categories)
				) {
					throw new Error(
						'File JSON không chứa "transactions" và "categories".'
					);
				}

				await importData(parsed);
				await Promise.all([transactionStore.load(), categoryStore.load()]);

				importMessage = 'Nhập dữ liệu thành công!';
				setTimeout(() => {
					importMessage = '';
				}, 3000);
			} catch (err) {
				alert('Nhập dữ liệu thất bại: ' + (err as Error).message);
			}
		};
		reader.readAsText(file);

		// Reset file input so the same file can be selected again
		input.value = '';
	}

	function triggerImport() {
		fileInput?.click();
	}
</script>

<div class="dashboard">
	<!-- Filter Bar -->
	<div class="filter-bar">
		<div class="filter-field">
			<label for="month-filter">Tháng</label>
			<input id="month-filter" type="month" bind:value={selectedMonth} />
		</div>
		<div class="filter-field">
			<label for="category-filter">Danh mục</label>
			<select id="category-filter" bind:value={selectedCategoryId}>
				<option value={0}>Tất cả</option>
				{#each categoryStore.items as cat (cat.id)}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="cards">
		<div class="card card-balance">
			<div class="card-label">Số dư</div>
			<div class="card-amount balance-amount">{formatAmount(balance)}</div>
		</div>
		<div class="card card-income">
			<div class="card-label">Tổng thu</div>
			<div class="card-amount income-amount">{formatAmount(monthIncome)}</div>
		</div>
		<div class="card card-expense">
			<div class="card-label">Tổng chi</div>
			<div class="card-amount expense-amount">{formatAmount(monthExpense)}</div>
		</div>
	</div>

	<!-- Category Breakdown -->
	<section class="section">
		<h2>Chi tiêu theo danh mục</h2>
		{#if categoryTotals.length > 0}
			<div class="category-list">
				{#each categoryTotals as cat (cat.categoryId)}
					<div class="category-row">
						<div class="category-header">
							<span class="color-dot" style="background: {cat.color}"></span>
							<span class="category-name">{cat.name}</span>
							<span class="category-amount">{formatAmount(cat.amount)}</span>
							<span class="category-pct">
								{Math.round((cat.amount / totalCategoryExpense) * 100)}%
							</span>
						</div>
						<div class="bar-track">
							<div
								class="bar-fill"
								style="width: {(cat.amount / totalCategoryExpense) *
									100}%; background: {cat.color}"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if !transactionStore.loading}
			<p class="empty-text">Chưa có chi tiêu trong tháng này</p>
		{/if}
	</section>

	<!-- Recent Transactions -->
	<section class="section">
		<h2>Giao dịch gần đây</h2>
		{#if recentTransactions.length > 0}
			<div class="tx-list">
				{#each recentTransactions as tx (tx.id)}
					{@const cat = categoryStore.items.find((c) => c.id === tx.categoryId)}
					<div class="tx-row">
						<div class="tx-left">
							<span
								class="color-dot"
								style="background: {cat?.color ?? '#6b7280'}"
							></span>
							<div>
								<div class="tx-name">{cat?.name ?? 'Khác'}</div>
								<div class="tx-date">{tx.date}</div>
							</div>
						</div>
						<div class="tx-right">
							<div class="tx-note">{tx.note}</div>
							<div
								class="tx-amount {tx.type === 'income' ? 'income' : 'expense'}"
							>
								{tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if !transactionStore.loading}
			<p class="empty-text">Chưa có giao dịch nào</p>
		{/if}
	</section>

	<!-- Export / Import -->
	<section class="section backup-section">
		<h2>Sao lưu dữ liệu</h2>
		<p class="backup-warning">
			Nhập JSON sẽ ghi đè toàn bộ dữ liệu hiện tại. Bạn nên xuất backup trước
			khi nhập.
		</p>
		<div class="backup-actions">
			<button class="btn btn-outline" onclick={handleExport}>Xuất JSON</button>
			<button class="btn btn-outline" onclick={triggerImport}>Nhập JSON</button>
		</div>
		{#if importMessage}
			<p class="backup-success">{importMessage}</p>
		{/if}
	</section>

	<input
		type="file"
		accept=".json"
		class="file-input-hidden"
		bind:this={fileInput}
		onchange={handleFileSelect}
	/>
</div>

{#if transactionStore.loading || categoryStore.loading}
	<div class="loading-overlay">
		<p>Đang tải...</p>
	</div>
{/if}

<style>
	.dashboard {
		position: relative;
	}

	/* Cards */
	.cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.cards {
			grid-template-columns: 1fr 1fr;
		}

		.card-balance {
			grid-column: 1 / -1;
		}
	}

	.card {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.card-label {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.card-amount {
		font-family: 'Courier New', Courier, monospace;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.balance-amount {
		color: #111827;
	}

	.income-amount {
		color: #16a34a;
	}

	.expense-amount {
		color: #dc2626;
	}

	/* Sections */
	.section {
		margin-bottom: 2rem;
	}

	.section h2 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: #1f2937;
	}

	/* Category breakdown */
	.category-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.category-row {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.category-name {
		flex: 1;
		color: #374151;
	}

	.category-amount {
		font-family: 'Courier New', Courier, monospace;
		font-weight: 600;
		color: #374151;
	}

	.category-pct {
		font-size: 0.8rem;
		color: #9ca3af;
		min-width: 2.5rem;
		text-align: right;
	}

	.bar-track {
		background: #f3f4f6;
		border-radius: 0.375rem;
		height: 1.5rem;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 0.375rem;
		transition: width 0.3s ease;
	}

	/* Transaction list */
	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tx-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #fff;
		border: 1px solid #f3f4f6;
		border-radius: 0.5rem;
	}

	.tx-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tx-name {
		font-weight: 500;
		font-size: 0.9rem;
		color: #1f2937;
	}

	.tx-date {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.tx-right {
		text-align: right;
	}

	.tx-note {
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 0.125rem;
	}

	.tx-amount {
		font-family: 'Courier New', Courier, monospace;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.income {
		color: #16a34a;
	}

	.expense {
		color: #dc2626;
	}

	/* Backup section */
	.backup-section {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.backup-warning {
		font-size: 0.85rem;
		color: #dc2626;
		margin: 0 0 1rem;
	}

	.backup-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.btn-outline {
		background: transparent;
		border-color: #d1d5db;
		color: #374151;
	}

	.btn-outline:hover {
		background: #f3f4f6;
	}

	.file-input-hidden {
		display: none;
	}

	.backup-success {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: #16a34a;
		font-weight: 500;
	}

	/* Empty state */
	.empty-text {
		color: #9ca3af;
		font-size: 0.9rem;
	}

	/* Filter Bar */
	.filter-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-field label {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.filter-field input,
	.filter-field select {
		padding: 0.4rem 0.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.3rem;
		font-size: 0.9rem;
	}

	/* Loading */
	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 0.75rem;
		font-size: 1rem;
		color: #6b7280;
	}
</style>
