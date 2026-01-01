<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const formatDate = (value: number) => new Date(value).toLocaleString();
</script>

<svelte:head>
	<title>Reader Analytics</title>
</svelte:head>

{#if !data.loggedIn}
	<main class="analytics auth">
		<section class="panel">
			<h1>Reader Analytics</h1>
			<p>Log in to view analytics.</p>
			<a class="button" href="/admin">Go to admin login</a>
		</section>
	</main>
{:else}
	<main class="analytics shell">
		<header class="analytics__header">
			<div>
				<p class="eyebrow">Overview</p>
				<h1>Reader Analytics</h1>
			</div>
			<a class="button ghost" href="/admin">Back to editor</a>
		</header>

		<section class="grid">
			<div class="card">
				<p class="label">Total visits</p>
				<p class="value">{data.totals?.totalVisits ?? 0}</p>
			</div>
			<div class="card">
				<p class="label">Total post reads</p>
				<p class="value">{data.totals?.totalPostViews ?? 0}</p>
			</div>
			<div class="card">
				<p class="label">Unique readers</p>
				<p class="value">{data.totals?.uniqueReaders ?? 0}</p>
			</div>
			<div class="card">
				<p class="label">Named readers</p>
				<p class="value">{data.totals?.uniqueNamedReaders ?? 0}</p>
			</div>
		</section>

		<section class="section">
			<h2>Post performance</h2>
			{#if data.perPost.length === 0}
				<p class="muted">No post reads yet.</p>
			{:else}
				<div class="table">
					<div class="row head">
						<span>Post</span>
						<span>Reads</span>
						<span>Unique readers</span>
					</div>
					{#each data.perPost as post}
						<div class="row">
							<div>
								<p class="row-title">{post.title}</p>
								<p class="row-sub">{post.slug}</p>
							</div>
							<span>{post.totalViews}</span>
							<span>{post.uniqueReaders}</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="split">
			<div class="section">
				<h2>Devices</h2>
				{#if data.deviceCounts.length === 0}
					<p class="muted">No device data yet.</p>
				{:else}
					<ul>
						{#each data.deviceCounts as [device, count]}
							<li>
								<span class="row-title">{device}</span>
								<span class="pill">{count}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="section">
				<h2>Referrers</h2>
				{#if data.referrerCounts.length === 0}
					<p class="muted">No referrers yet.</p>
				{:else}
					<ul>
						{#each data.referrerCounts as [source, count]}
							<li>
								<span class="row-title">{source}</span>
								<span class="pill">{count}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="section">
				<h2>Language</h2>
				{#if data.languageCounts.length === 0}
					<p class="muted">No language choices yet.</p>
				{:else}
					<ul>
						{#each data.languageCounts as [language, count]}
							<li>
								<span class="row-title">{language === 'nl' ? 'Dutch' : 'Original'}</span>
								<span class="pill">{count}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>

		<section class="section">
			<h2>Readers</h2>
			{#if data.names.length === 0}
				<p class="muted">No names submitted yet.</p>
			{:else}
				<div class="table readers-table">
					<div class="row row--three head">
						<span>Name</span>
						<span>Last seen</span>
						<span>Posts visited</span>
					</div>
					{#each data.names as entry}
						{@const reader = data.readerBreakdown.find((item) => item.name === entry.name)}
						<div class="row row--three">
							<span class="row-title">{entry.name}</span>
							<span>{formatDate(entry.created_at)}</span>
							<div class="visited-tags">
								{#if reader && reader.posts.length > 0}
									{#each reader.posts as post}
										<span class="tag">{post.title}</span>
									{/each}
								{:else}
									<span class="muted">—</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</main>
{/if}

<style>
	:global(body.is-admin) {
		background: var(--app-bg, #050505);
	}

	.analytics {
		padding: clamp(1rem, 3vw, 2.5rem);
		color: #f3f4f6;
		background: #050505;
	}

	.analytics.auth {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel {
		width: min(420px, 100%);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 2rem;
		backdrop-filter: blur(20px);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
		text-align: center;
	}

	.analytics.shell {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.analytics__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.analytics h1 {
		margin: 0.35rem 0 0;
		font-size: clamp(1.8rem, 3vw, 2.4rem);
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.35em;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.5rem 1.25rem;
		font-weight: 600;
		background: #f8df72;
		color: #0d0d0d;
		text-decoration: none;
	}

	.button.ghost {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #f3f4f6;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1rem 1.25rem;
	}

	.label {
		margin: 0;
		color: rgba(255, 255, 255, 0.55);
		text-transform: uppercase;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
	}

	.value {
		margin: 0.4rem 0 0;
		font-size: 1.8rem;
		font-weight: 600;
	}

	.section h2 {
		margin: 0 0 0.75rem;
		font-size: 1.1rem;
	}

	.table {
		display: grid;
		gap: 0.5rem;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) 0.4fr 0.6fr;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 0.85rem;
	}

	.row.head {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.55);
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.row.row--two {
		grid-template-columns: minmax(0, 1.2fr) 0.8fr;
	}

	.row.row--three {
		grid-template-columns: minmax(0, 0.9fr) 0.7fr minmax(0, 1.4fr);
		align-items: start;
	}

	.row-title {
		font-weight: 600;
		margin: 0;
	}

	.row-sub {
		margin: 0.2rem 0 0;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.split {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.9rem;
		border-radius: 0.85rem;
		background: rgba(255, 255, 255, 0.04);
	}

	.pill {
		border-radius: 999px;
		padding: 0.2rem 0.6rem;
		background: rgba(255, 255, 255, 0.08);
		font-size: 0.8rem;
	}

	.names {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.name-pill {
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		font-size: 0.85rem;
	}

	.readers {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.reader-card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1rem;
		display: grid;
		gap: 0.6rem;
	}

	.visited-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.tag {
		border-radius: 999px;
		padding: 0.25rem 0.65rem;
		background: rgba(255, 255, 255, 0.08);
		font-size: 0.8rem;
	}

	.muted {
		color: rgba(255, 255, 255, 0.55);
	}

	@media (max-width: 600px) {
		.row {
			grid-template-columns: 1fr;
			gap: 0.35rem;
		}
	}
</style>
