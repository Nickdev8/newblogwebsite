<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  let formResult: { success?: boolean; message?: string; error?: string } = {};
  $: formResult = $page.form ?? {};

  let name = '';
  let email = '';
  let message = '';
  let contactMethod: string = '';
  let contactDetail: string = '';

  $: {
    const params = $page.url.searchParams;
    if (params.has('image')) {
      const reportreason = params.get('image');
      message = `I would like to report this image.\nImage URL: ${reportreason}\nReason:`;
    }
    else if (params.has('report')) {
      const reportreason = params.get('report');
      message = `I would like to report: ${reportreason}\nReason:`;
    }
    else if (params.has('project')) {
      const reportreason = params.get('project');
      message = `I would like to report this project on the Experiences page: ${reportreason}\nReason:`;
    }
    
  }
</script>

<div class="m-8 max-w-2xl mx-auto">
  <h1 class="text-center text-4xl font-bold text-gray-900 dark:text-gray-100">
    Contact Me
  </h1>

  <h4 class="mb-8 text-center text-xl font-bold text-gray-600 dark:text-gray-400">
    A Simple Hi is good eneugh
  </h4>

  <form method="POST" action="/contact" use:enhance class="space-y-6 rounded-lg bg-white shadow-lg p-8 transition-colors duration-300 dark:bg-gray-800">
    <div>
      <label for="name" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Name</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Nick"
        bind:value={name}
        required
        class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
    </div>

    <div>
      <label for="contactMethod" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">
        How should I get back to you?
      </label>
      <select
        id="contactMethod"
        name="contactMethod"
        bind:value={contactMethod}
        required
        class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      >
        <option value="" disabled selected>— Select an option —</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
        <option value="whatsapp">WhatsApp (Quickest)</option>
        <option value="Instagram">Instagram</option>
        <option value="phone">Phone Call (takes long)</option>
        <option value="none">Don't Contact Me</option>
      </select>
    </div>

    {#if contactMethod === 'email'}
      <div>
        <label for="email" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          bind:value={email}
          required
          class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>
    {:else if contactMethod === 'sms' || contactMethod === 'whatsapp' || contactMethod === 'phone'}
      <div>
        <label for="contactDetail" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">
          {#if contactMethod === 'phone'}Phone Number{:else if contactMethod === 'sms'}SMS Number{:else if contactMethod === 'whatsapp'}WhatsApp Number{:else if contactMethod === 'telegram'}Telegram Number{/if}
        </label>
        <input
          id="contactDetail"
          name="contactDetail"
          type="tel"
          bind:value={contactDetail}
          placeholder="+1234567890"
          required
          class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>
    {:else if contactMethod === 'Instagram'}
      <div>
        <label for="contactDetail" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">
          Instagram @
        </label>
        <input
          id="contactDetail"
          name="contactDetail"
          type="text"
          bind:value={contactDetail}
          placeholder="@nick.esselman"
          required
          class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>
    {/if}

    <div>
      <label for="message" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Message</label>
      <textarea
        id="message"
        name="message"
        rows="5"
        bind:value={message}
        placeholder='Example: I just wanted to say Hi Nick!'
        required
        class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      ></textarea>
    </div>

    <input type="text" name="subject" class="hidden" />

    <button
      type="submit"
      class="w-full py-3 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white shadow-md dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      Send Message
    </button>
  </form>

  {#if formResult.success}
    <div class="mt-6 flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 p-4 text-green-900 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200" role="alert">
      <p class="text-sm font-medium">{formResult.message}</p>
    </div>
  {/if}

  {#if formResult.error}
    <div class="mt-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200" role="alert">
      <p class="text-sm font-medium">{formResult.error}</p>
    </div>
  {/if}
</div>

