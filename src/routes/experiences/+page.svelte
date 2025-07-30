<script lang="ts">
  import { slide } from 'svelte/transition';
  import { ExternalLink, Minimize, MessageCircleWarning } from 'lucide-svelte';

  type Skill = { name: string; years: number; projects: number };
  const skills: Skill[] = [
    { name: 'C# (Unity)', years: 8, projects: 67 },
    { name: 'TypeScript', years: 1, projects: 5 },
    { name: 'Svelte / SvelteKit', years: 1, projects: 5 },
    { name: 'HTML/CSS', years: 3, projects: 15 },
    { name: 'Python', years: 4, projects: 10 },
    { name: 'Arduino', years: 3, projects: 3 }
  ];

  interface Project {
    src: string;
    title: string;
    info?: string;
    repo?: string;
  }
  const projects: Project[] = [
    { src: '/whatidoimg/3dprinter.webp', title: 'Ender 3 V2', info: 'https://nickesselman.nl/?project=3dprinting' },
    { src: '/whatidoimg/laptop.webp', title: 'Arch Linux Laptop', info: 'https://nickesselman.nl/?project=stickers' },
    { src: '/whatidoimg/pcbfront.webp', title: 'Micro Pad', info: 'https://nickesselman.nl/?project=hackpad', repo: 'https://github.com/Nickdev8/macropad' }

  ];

  let modalProject: Project | null = null;

  function openModal(p: Project) {
    modalProject = p;
  }
  function closeModal() {
    modalProject = null;
  }

  const languagesHtml = `
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" alt="Visual Studio Code" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/visualstudio/visualstudio-original.svg" alt="Visual Studio" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jetbrains/jetbrains-original.svg" alt="JetBrains IDEs" width="45" height="45">

    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original-wordmark.svg" alt="Python" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" alt="C#" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" alt="C++" width="45" height="45">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="JavaScript" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" alt="PHP" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/lua/lua-original.svg" alt="Lua" width="45" height="45">

    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dot-net/dot-net-original.svg" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" width="45" height="45" class="dark:bg-white dark:rounded-full">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opengl/opengl-original.svg" width="45" height="45" class="dark:filter dark:brightness-[400]">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" width="45" height="45">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" alt="CSS3" width="45" height="45">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mysql/mysql-original-wordmark.svg" alt="MySQL" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg" alt="Node.js" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/npm/npm-original-wordmark.svg" alt="NPM" width="45" height="45">

    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" alt="Git" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-plain.svg" alt="Bash" width="45" height="45" class="dark:filter dark:brightness-[400]">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" alt="Linux" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/archlinux/archlinux-original.svg" alt="Arch Linux" width="45" height="45">

    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" alt="Figma" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/blender/blender-original.svg" alt="Blender" width="45" height="45">


    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/arduino/arduino-original.svg" alt="Arduino" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/raspberrypi/raspberrypi-original.svg" alt="raspberrypi" width="45" height="45">

    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg" alt="Ubuntu" width="45" height="45">

    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ifttt/ifttt-original.svg" alt="IFTTT" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/markdown/markdown-original.svg" alt="Markdown" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg" alt="NumPy" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opengl/opengl-original.svg" alt="OpenGL" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-original.svg" alt="WordPress" width="45" height="45" class="dark:filter dark:brightness-[400]">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/godot/godot-original.svg" alt="YAML" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg" alt="Unity" width="45" height="45" class="dark:filter dark:brightness-150">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unrealengine/unrealengine-original.svg" alt="Unreal Engine" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/yaml/yaml-original.svg" alt="YAML" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/xml/xml-original.svg" alt="XML" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/json/json-original.svg" alt="JSON" width="45" height="45" class="dark:filter dark:invert">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/slack/slack-original.svg" alt="Slack" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/trello/trello-original.svg" alt="Trello" width="45" height="45">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/devicon/devicon-original.svg" alt="Devicon" width="45" height="45">
  `;
</script>

<div class="container mx-auto p-6 space-y-12">
  <!-- Core Skills & Technologies -->
  <section>
    <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Core Skills & Technologies</h2>
    <!-- Bars -->
    <div class="space-y-6">
      {#each skills as skill}
        <div>
          <div class="flex mb-1">
            <span class="font-medium text-gray-800 dark:text-gray-200">{skill.name}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full mb-2">
            <div
              class="h-3 rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
              style="width: {Math.round((skill.years / Math.max(...skills.map(s => s.years))) * 100)}%"
            ></div>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full">
            <div
              class="h-3 rounded-full bg-green-500 dark:bg-green-400 transition-all"
              style="width: {Math.round((skill.projects / Math.max(...skills.map(s => s.projects))) * 100)}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Languages & Tools -->
    <div class="mt-8">
      <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Languages & Tools</h3>
      <div class="grid gap-4" style="grid-template-columns: repeat(16, auto);">
        {@html languagesHtml}
      </div>
    </div>
  </section>

  <!-- Experience Snapshot -->
  <section>
    <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Experience Snapshot</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each projects as proj}
        <button
          type="button"
          class="cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition flex flex-col"
          on:click={() => openModal(proj)}
        >
          <img src={proj.src} alt={proj.title} class="w-full h-48 object-cover" />
          <div class="flex items-center justify-between p-2 bg-white dark:bg-gray-800">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{proj.title}</span>
          </div>
        </button>
      {/each}
    </div>
  </section>

	<!-- Modal -->
	{#if modalProject}
		<section
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
			tabindex="0"
			role="dialog"
			aria-modal="true"
			aria-label="Fullscreen media viewer"
			on:click={closeModal}
			on:keydown={(e) => e.key === 'Escape' && closeModal()}
		>
			<div
				class="relative max-h-full w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-800"
				on:click|stopPropagation
				transition:slide
			>
				<!-- Header with close and report -->
				<div class="mb-4 flex justify-end space-x-2">
					<button
						aria-label="Close fullscreen"
						class="rounded-full bg-gray-200 p-2 transition hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
						on:click={closeModal}
					>
						<Minimize class="text-gray-800 dark:text-gray-200" />
					</button>
					<a
						href={`/contact?project=${encodeURIComponent(modalProject.title)}`}
						aria-label="Report this project"
						class="rounded-full bg-red-200 p-2 transition hover:bg-red-300 dark:bg-red-700 dark:hover:bg-red-600"
						on:click|stopPropagation
					>
						<MessageCircleWarning class="text-red-600 dark:text-red-300" />
					</a>
				</div>

				<!-- Media -->
				<img
					src={modalProject.src}
					alt={modalProject.title}
					class="mx-auto max-h-[70vh] w-auto rounded-lg"
				/>

				<!-- Title under image -->
				<h3 class="mt-4 text-center text-xl font-bold text-gray-900 dark:text-gray-100">
					{modalProject.title}
				</h3>

				<!-- Links -->
				<div class="mt-2 flex justify-center space-x-4">
					{#if modalProject.info}
						<a
							href={modalProject.info}
							target="_blank"
							class="flex items-center space-x-1 text-blue-600 hover:underline dark:text-blue-400"
						>
							<ExternalLink size={16} />
							<span>Info</span>
						</a>
					{/if}
					{#if modalProject.repo}
						<a
							href={modalProject.repo}
							target="_blank"
							class="flex items-center space-x-1 text-green-600 hover:underline dark:text-green-400"
						>
							<ExternalLink size={16} />
							<span>Repo</span>
						</a>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<!-- Contact & Social Links -->
	<footer class="mt-12 text-center">
		<h2 class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Contact & Social Links</h2>
		<div
			class="flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-x-6 sm:space-y-0"
		>
			<a
				href="/contact"
				class="flex items-center space-x-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
			>
				<MessageCircleWarning />
				<span>Contact Me</span>
			</a>
			<a
				href="https://github.com/NickDev8"
				target="_blank"
				class="flex items-center space-x-1 hover:text-gray-600 dark:hover:text-gray-300"
			>
				<ExternalLink />
				<span>GitHub</span>
			</a>
			<a
				href="https://linkedin.com/in/nick-esselman"
				target="_blank"
				class="flex items-center space-x-1 hover:text-gray-600 dark:hover:text-gray-300"
			>
				<ExternalLink />
				<span>LinkedIn</span>
			</a>
		</div>
	</footer>
</div>

<style>
	:global(video:focus),
	:global(button:focus) {
		outline: none !important;
		box-shadow: none !important;
	}
</style>
