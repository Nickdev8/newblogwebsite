<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isDark } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import 'leaflet/dist/leaflet.css';

	export let locations: { lat: number; lng: number; title: string }[] = [];

	let map: any;
	let tileLayer: any;
	let container: HTMLDivElement;

	const handleResize = () => {
		setTimeout(() => map?.invalidateSize(), 200);
	};

	// Switch tile layers dynamically
	function updateMapTiles(dark: boolean, L: any) {
		const tileUrl = dark
			? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
			: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

		const attribution =
			'&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/">OSM</a>';

		if (tileLayer) {
			map.removeLayer(tileLayer);
		}

		const options: any = {
			className: 'map-tiles',
			attribution,
			maxZoom: 20,
			maxNativeZoom: 19,
			tileSize: 256,
			noWrap: true,
			detectRetina: true,
			errorTileUrl: 'https://tile.openstreetmap.org/10/511/340.png'
		};

		// Only provide subdomains if using {s} in the URL
		if (tileUrl.includes('{s}')) {
			options.subdomains = 'abc';
		}

		tileLayer = L.tileLayer(tileUrl, options);
		tileLayer.addTo(map);
	}

	onMount(async () => {
		const L = await import('leaflet');
		const dark = get(isDark);

		const width = container.clientWidth;
		const height = container.clientHeight;
		const maxDim = Math.max(width, height);
		const calculatedMinZoom = Math.ceil(Math.log2(maxDim / 256));

		map = L.map(container, {
			center: [52.5, -5.75],
			zoomSnap: 0,
			zoomDelta: 1,
			minZoom: calculatedMinZoom,
			maxZoom: 20,
			zoom: calculatedMinZoom - 1,
			maxBounds: [
				[-90, -180],
				[90, 180]
			],
			maxBoundsViscosity: 1.0
		});

		updateMapTiles(dark, L);

		const markerUrl = (await import('leaflet/dist/images/marker-icon.png')).default;
		const markerRetinaUrl = (await import('leaflet/dist/images/marker-icon-2x.png')).default;
		const shadowUrl = (await import('leaflet/dist/images/marker-shadow.png')).default;

		const defaultIcon = L.icon({
			iconUrl: markerUrl,
			iconRetinaUrl: markerRetinaUrl,
			shadowUrl,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});
		L.Marker.prototype.options.icon = defaultIcon;

		const valid = locations.filter(
			(loc) => typeof loc.lat === 'number' && typeof loc.lng === 'number'
		);

		valid.forEach(({ lat, lng, title }) => {
			L.marker([lat, lng]).addTo(map).bindPopup(title);
		});

		window.addEventListener('resize', handleResize);

		const unsubscribe = isDark.subscribe((value) => {
			updateMapTiles(value, L);
		});

		onDestroy(() => {
			window.removeEventListener('resize', handleResize);
			map?.remove();
			unsubscribe();
		});
	});
</script>

<div bind:this={container} class="h-[55vh] w-full sm:h-[60vh] lg:h-[520px]" />
