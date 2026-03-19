<script>
  import { onMount } from 'svelte';

  const jokes = [
    "Oops—looks like you fell into the void 🕳️",
    "This isn’t the page you’re looking for… (★_★)",
    "404: Page abducted by aliens 👽",
    "Well, this is awkward… 🤭",
    "We sent a search party. No luck. 🚁",
    "Even the dog can’t find this one. 🐶",
    "Looks like our server took a day off. ☀️",
    "This page is on vacation. 🍹",
    "I swear it was here a second ago… ⏳",
    "Error 404: Humor not found. 😜"
  ];

  let joke = '';

  onMount(() => {
    joke = jokes[Math.floor(Math.random() * jokes.length)];
  });

  function goHome() {
    window.location.href = '/';
  }
</script>

<main class="relative flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
      style="min-height: calc(100vh - 4rem);">
  <div class="text-center max-w-md w-full">
    <div class="font-extrabold text-indigo-600 dark:text-indigo-400 text-5xl sm:text-7xl lg:text-9xl leading-tight">
      404
    </div>

    <p class="mt-4 text-gray-700 dark:text-gray-300 text-base sm:text-lg">
      {joke}
    </p>

    <button
      class="mt-6 inline-block px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
      on:click={goHome}
    >
      Take me home 🏠
    </button>
  </div>


  
  <div class="absolute bottom-2 right-2 text-gray-500 dark:text-gray-400 text-xs">
    yes. chatgpt made this 404 page
  </div>
</main>

<style>
  .font-extrabold {
    animation: bounce 1s ease-out;
  }

  @keyframes bounce {
    0% { transform: translateY(-10%); opacity: 0; }
    60% { transform: translateY(3%); opacity: 1; }
    100% { transform: translateY(0); }
  }
</style>
