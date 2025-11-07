<script lang="ts">
  import { ExternalLink, MessageCircleWarning } from 'lucide-svelte';

  type Skill = { name: string; duration: string };
  const skills: Skill[] = [
    { name: 'C# (Unity)', duration: '8 years, 67 projects' },
    { name: 'TypeScript', duration: '1 year, 5 projects' },
    { name: 'Svelte / SvelteKit', duration: '1 year, 5 projects' },
    { name: 'HTML/CSS', duration: '3 years, 15 projects' },
    { name: 'Python', duration: '4 years, 10 projects' },
    { name: 'Arduino', duration: '3 years, 15 projects' }
  ];

  

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
    <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Core Skills & Technologies</h2>
    <!-- <div class="flex justify-center mb-6">
      <img src="https://github-readme-stats.hackclub.dev/api/wakatime?username=1160&api_domain=hackatime.hackclub.com&&custom_title=Hackatime+Stats&layout=compact&cache_seconds=0&langs_count=8&theme=transparent" alt="Hackatime Stats" class="w-full max-w-md" />
    </div> -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each skills as skill}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div class="flex justify-center items-baseline gap-2">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{skill.name}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{skill.duration}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Languages & Tools -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Languages & Tools</h2>
    <div class="flex flex-wrap justify-center items-center gap-x-4 gap-y-6">
      {@html languagesHtml}
    </div>
  </section>

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