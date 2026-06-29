<script lang="ts">
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/stores/transactions.svelte';
	import { categoryStore } from '$lib/stores/categories.svelte';

	let amount = $state(0);
	let type: 'income' | 'expense' = $state('expense');
	let categoryId = $state(0);
	let date = $state(new Date().toISOString().slice(0, 10));
	let note = $state('');
	let editingTransaction = $state<Transaction | null>(null);

	let filterMonth = $state(new Date().toISOString().slice(0, 7));
	let filterCategoryId = $state(0);

	const filteredTransactions = $derived(
		transactionStore.items.filter((tx) => {
			if (!tx.date.startsWith(filterMonth)) return false;
			if (filterCategoryId > 0 && tx.categoryId !== filterCategoryId) return false;
			return true;
		})
	);

	function getToday(): string {
		return new Date().toISOString().slice(0, 10);
	}

	function resetForm() {
		amount = 0;
		type = 'expense';
		categoryId = 0;
		date = getToday();
		note = '';
		editingTransaction = null;
	}

	function startEdit(tx: Transaction) {
		editingTransaction = tx;
		amount = tx.amount;
		type = tx.type;
		categoryId = tx.categoryId;
		date = tx.date;
		note = tx.note;
	}

	async function handleSubmit() {
		if (!amount || amount <= 0) return;
		if (!categoryId) return;

		const data = {
			amount,
			type,
			categoryId,
			date,
			note
		};

		if (editingTransaction) {
			await transactionStore.update({ ...editingTransaction, ...data });
		} else {
			await transactionStore.add(data);
		}

		resetForm();
	}

	async function handleDelete(id: number) {
		if (confirm('Xoá giao dịch này?')) {
			await transactionStore.remove(id);
		}
	}

	function getCategoryName(id: number): string {
		return categoryStore.items.find((c) => c.id === id)?.name ?? '—';
	}

	let filteredCategories = $derived(
		categoryStore.items.filter((c) => c.type === type)
	);

	onMount(() => {
		transactionStore.load();
		categoryStore.load();
	});

	import type { Transaction } from '$lib/types';
</script>

<h1>Giao dịch</h1>

<!-- Filter Bar -->
<div class="filter-bar">
	<div class="filter-field">
		<label for="filter-month">Tháng</label>
		<input id="filter-month" type="month" bind:value={filterMonth} />
	</div>
	<div class="filter-field">
		<label for="filter-category">Danh mục</label>
		<select id="filter-category" bind:value={filterCategoryId}>
			<option value={0}>Tất cả</option>
			{#each categoryStore.items as cat (cat.id)}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
	</div>
</div>

<!-- Form -->
<div class="form-card">
	<h2>{editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div class="form-row">
			<div class="field">
				<label for="amount">Số tiền</label>
				<input
					id="amount"
					type="number"
					step="1000"
					min="0"
					bind:value={amount}
					required
				/>
			</div>

			<div class="field">
				<span class="field-label">Loại</span>
				<div class="radio-group">
					<label class="radio-label">
						<input
							id="tx-type-expense"
							type="radio"
							name="type"
							value="expense"
							bind:group={type}
						/>
						Chi
					</label>
					<label class="radio-label">
						<input
							id="tx-type-income"
							type="radio"
							name="type"
							value="income"
							bind:group={type}
						/>
						Thu
					</label>
				</div>
			</div>
		</div>

		<div class="form-row">
			<div class="field">
				<label for="category">Danh mục</label>
				<select id="category" bind:value={categoryId} required>
					<option value={0} disabled>Chọn danh mục</option>
					{#each filteredCategories as cat (cat.id)}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="date">Ngày</label>
				<input id="date" type="date" bind:value={date} required />
			</div>
		</div>

		<div class="field">
			<label for="note">Ghi chú</label>
			<input
				id="note"
				type="text"
				placeholder="Ghi chú (không bắt buộc)"
				bind:value={note}
			/>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn btn-primary">
				{editingTransaction ? 'Cập nhật' : 'Thêm'}
			</button>
			{#if editingTransaction}
				<button type="button" class="btn btn-secondary" onclick={resetForm}
					>Huỷ</button
				>
			{/if}
		</div>
	</form>
</div>

<!-- List -->
{#if transactionStore.loading}
	<p class="loading">Đang tải...</p>
{:else if filteredTransactions.length === 0}
	<p class="empty">Chưa có giao dịch nào.</p>
{:else}
	<div class="tx-list">
		{#each filteredTransactions as tx (tx.id)}
			<div class="tx-row">
				<span class="tx-date">{tx.date}</span>
				<span class="tx-category">{getCategoryName(tx.categoryId)}</span>
				<span class="tx-amount {tx.type === 'income' ? 'income' : 'expense'}">
					{tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}₫
				</span>
				<span class="tx-badge {tx.type}">
					{tx.type === 'income' ? 'Thu' : 'Chi'}
				</span>
				<div class="tx-actions">
					<button class="btn btn-sm" onclick={() => startEdit(tx)}>Sửa</button>
					<button
						class="btn btn-sm btn-danger"
						onclick={() => handleDelete(tx.id!)}>Xoá</button
					>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	h1 {
		font-size: 1.3rem;
		margin: 0 0 1rem;
	}

	.filter-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-field label {
		font-size: 0.8rem;
		color: #64748b;
	}

	.filter-field input,
	.filter-field select {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.3rem;
		font-size: 0.9rem;
	}

	.form-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.form-card h2 {
		font-size: 1rem;
		margin: 0 0 0.75rem;
	}

	.form-row {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label,
	.field-label {
		font-size: 0.8rem;
		color: #64748b;
	}

	.field input,
	.field select {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.3rem;
		font-size: 0.9rem;
	}

	.radio-group {
		display: flex;
		gap: 1rem;
		padding-top: 0.25rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.btn {
		padding: 0.4rem 1rem;
		border: none;
		border-radius: 0.3rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.btn-primary {
		background: #2563eb;
		color: #fff;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #334155;
	}

	.btn-danger {
		background: transparent;
		color: #ef4444;
		border: 1px solid #ef4444;
	}

	.btn-sm {
		padding: 0.25rem 0.6rem;
		font-size: 0.8rem;
	}

	.loading,
	.empty {
		color: #94a3b8;
		text-align: center;
		padding: 2rem;
	}

	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tx-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.4rem;
	}

	.tx-date {
		font-size: 0.8rem;
		color: #64748b;
		min-width: 5.5rem;
	}

	.tx-category {
		flex: 1;
		font-size: 0.9rem;
	}

	.tx-amount {
		font-family: monospace;
		font-weight: 600;
		font-size: 0.95rem;
		min-width: 8rem;
		text-align: right;
	}

	.tx-amount.income {
		color: #16a34a;
	}

	.tx-amount.expense {
		color: #dc2626;
	}

	.tx-badge {
		font-size: 0.75rem;
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.tx-badge.income {
		background: #dcfce7;
		color: #15803d;
	}

	.tx-badge.expense {
		background: #fee2e2;
		color: #b91c1c;
	}

	.tx-actions {
		display: flex;
		gap: 0.3rem;
	}
</style>
