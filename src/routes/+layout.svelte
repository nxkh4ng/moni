<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<div class="nav-inner">
		<a href={resolve('/')} class="brand">Moni</a>
		<div class="links">
			<a href={resolve('/transactions')}>Giao dịch</a>
			<a href={resolve('/categories')}>Danh mục</a>
		</div>
	</div>
</nav>

<main>
	{@render children()}
</main>

<style>
	nav {
		background: #1e293b;
		color: #fff;
		padding: 0 1rem;
	}

	.nav-inner {
		max-width: 48rem;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 3rem;
	}

	.brand {
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		font-size: 1.2rem;
	}

	.links {
		display: flex;
		gap: 1rem;
	}

	.links a {
		color: #cbd5e1;
		text-decoration: none;
		font-size: 0.9rem;
	}

	.links a:hover {
		color: #fff;
	}

	main {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1rem;
	}
</style>
