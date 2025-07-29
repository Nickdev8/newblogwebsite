<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  // Store for form action result (success or error)
  let formResult: { success?: boolean; message?: string; error?: string } = {};

  // Sync formResult with SvelteKit's $page.form data
  $: formResult = $page.form ?? {};
</script>

<div class="m-8 max-w-2xl mx-auto">
  <h1 class="mb-8 text-center text-4xl font-bold text-gray-900 dark:text-gray-100">
    Contact Me
  </h1>

  <!-- Contact form card -->
  <form
    method="POST"
    action="/contact"
    use:enhance
    class="space-y-6 rounded-lg bg-white shadow-lg p-8 transition-colors duration-300 dark:bg-gray-800"
  >
    <!-- Name field -->
    <div>
      <label for="name" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">
        Name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        required
        class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
               dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
    </div>

    <!-- Email field -->
    <div>
      <label for="email" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
               dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
    </div>

    <!-- Message field -->
    <div>
      <label for="message" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">
        Message
      </label>
      <textarea
        id="message"
        name="message"
        rows="5"
        required
        class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
               dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      ></textarea>
    </div>

    <!-- Honeypot for spam prevention -->
    <input type="text" name="subject" class="hidden" />

    <!-- Submit button -->
    <button
      type="submit"
      class="w-full py-3 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white 
             shadow-md dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      Send Message
    </button>
  </form>

  <!-- Success banner -->
  {#if formResult.success}
    <div
      class="mt-6 flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 p-4 text-green-900
             dark:border-green-700 dark:bg-gray-800 dark:bg-green-900/30 dark:text-green-200"
      role="alert"
    >
      <!-- Heroicon: check-circle -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2l4 -4" />
      </svg>
      <p class="text-sm font-medium">{formResult.message}</p>
    </div>
  {/if}

  <!-- Error banner -->
  {#if formResult.error}
    <div
      class="mt-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900
             dark:border-red-700 dark:bg-gray-800 dark:bg-red-900/30 dark:text-red-200"
      role="alert"
    >
      <!-- Heroicon: exclamation-circle -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
      </svg>
      <p class="text-sm font-medium">{formResult.error}</p>
    </div>
  {/if}
</div>
