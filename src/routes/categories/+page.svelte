<script lang="ts">
	import { onMount } from 'svelte';
	import { categoryStore } from '$lib/stores/categories.svelte';
	import type { Category } from '$lib/types';

	let name = $state('');
	let type: 'income' | 'expense' = $state('expense');
	let color = $state('#6b7280');
	let showColorInput = $state(false);
	let editingCategory = $state<Category | null>(null);

	function resetForm() {
		name = '';
		type = 'expense';
		color = '#6b7280';
		editingCategory = null;
	}

	function startEdit(cat: Category) {
		editingCategory = cat;
		name = cat.name;
		type = cat.type;
		color = cat.color || '#6b7280';
	}

	async function handleSubmit() {
		if (!name.trim()) return;

		const data = { name: name.trim(), type, color };

		if (editingCategory) {
			await categoryStore.update({ ...editingCategory, ...data });
		} else {
			await categoryStore.add(data);
		}

		resetForm();
	}

	async function handleDelete(id: number) {
		if (confirm('Xoá danh mục này?')) {
			await categoryStore.remove(id);
		}
	}

	let incomeCategories = $derived(
		categoryStore.items.filter((c) => c.type === 'income')
	);

	let expenseCategories = $derived(
		categoryStore.items.filter((c) => c.type === 'expense')
	);

	onMount(() => {
		categoryStore.load();
		showColorInput = true;
	});
</script>

<h1>Danh mục</h1>

<!-- Form -->
<div class="form-card">
	<h2>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div class="form-row">
			<div class="field">
				<label for="cat-name">Tên danh mục</label>
				<input
					id="cat-name"
					type="text"
					placeholder="VD: Ăn uống"
					bind:value={name}
					required
				/>
			</div>

			<div class="field">
				<span class="field-label">Loại</span>
				<div class="radio-group">
					<label class="radio-label">
						<input
							type="radio"
							name="cat-type"
							value="expense"
							bind:group={type}
						/>
						Chi
					</label>
					<label class="radio-label">
						<input
							type="radio"
							name="cat-type"
							value="income"
							bind:group={type}
						/>
						Thu
					</label>
				</div>
			</div>

		{#if showColorInput}
			<div class="field field-color">
				<label for="cat-color">Màu</label>
				<input id="cat-color" type="color" bind:value={color} />
			</div>
		{/if}
		</div>

		<div class="form-actions">
			<button type="submit" class="btn btn-primary">
				{editingCategory ? 'Cập nhật' : 'Thêm danh mục'}
			</button>
			{#if editingCategory}
				<button type="button" class="btn btn-secondary" onclick={resetForm}
					>Huỷ</button
				>
			{/if}
		</div>
	</form>
</div>

<!-- List -->
{#if categoryStore.loading}
	<p class="loading">Đang tải...</p>
{:else if categoryStore.items.length === 0}
	<p class="empty">Chưa có danh mục nào.</p>
{:else}
	<section>
		<h2 class="group-title">Thu nhập</h2>
		<div class="cat-list">
			{#each incomeCategories as cat (cat.id)}
				<div class="cat-row">
					<span class="cat-color" style="background: {cat.color}"></span>
					<span class="cat-name">{cat.name}</span>
					<span class="cat-type-label income">Thu</span>
					<div class="cat-actions">
						<button class="btn btn-sm" onclick={() => startEdit(cat)}
							>Sửa</button
						>
						<button
							class="btn btn-sm btn-danger"
							onclick={() => handleDelete(cat.id!)}>Xoá</button
						>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="group-title">Chi tiêu</h2>
		<div class="cat-list">
			{#each expenseCategories as cat (cat.id)}
				<div class="cat-row">
					<span class="cat-color" style="background: {cat.color}"></span>
					<span class="cat-name">{cat.name}</span>
					<span class="cat-type-label expense">Chi</span>
					<div class="cat-actions">
						<button class="btn btn-sm" onclick={() => startEdit(cat)}
							>Sửa</button
						>
						<button
							class="btn btn-sm btn-danger"
							onclick={() => handleDelete(cat.id!)}>Xoá</button
						>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	h1 {
		font-size: 1.3rem;
		margin: 0 0 1rem;
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
		flex-wrap: wrap;
	}

	.field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 8rem;
	}

	.field-color {
		flex: 0 0 auto;
		min-width: auto;
	}

	.field label,
	.field-label {
		font-size: 0.8rem;
		color: #64748b;
	}

	.field input {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.3rem;
		font-size: 0.9rem;
	}

	.field input[type='color'] {
		width: 3rem;
		height: 2.2rem;
		padding: 0.2rem;
		cursor: pointer;
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

	.group-title {
		font-size: 1rem;
		margin: 1.5rem 0 0.5rem;
		color: #334155;
	}

	.cat-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.cat-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.4rem;
	}

	.cat-color {
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.cat-name {
		flex: 1;
		font-size: 0.9rem;
	}

	.cat-type-label {
		font-size: 0.75rem;
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.cat-type-label.income {
		background: #dcfce7;
		color: #15803d;
	}

	.cat-type-label.expense {
		background: #fee2e2;
		color: #b91c1c;
	}

	.cat-actions {
		display: flex;
		gap: 0.3rem;
	}
</style>
