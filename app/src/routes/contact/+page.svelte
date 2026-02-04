<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  let formResult: { success?: boolean; message?: string; error?: string } = {};
  $: formResult = $page.form ?? {};

  let name = '';
  let email = '';
  let message = '';
  let contactMethod: string = '';
  let contactDetail: string = '';
  let isSubmitting = false;

  const handleEnhance = () => {
    isSubmitting = true;
    return async ({ update }) => {
      try {
        await update();
      } finally {
        isSubmitting = false;
      }
    };
  };

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

  {#if formResult.success}
    <div class="rounded-lg border border-green-300 bg-green-50 p-8 shadow-lg dark:border-green-700 dark:bg-green-900/30">
      <h2 class="text-2xl font-semibold text-green-900 dark:text-green-100">Message sent</h2>
      <p class="mt-2 text-sm text-green-800/90 dark:text-green-200/80">
        {formResult.message ?? 'Your message was sent successfully.'}
      </p>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href="/contact"
          class="inline-flex items-center justify-center rounded-md border border-green-600 bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-green-700"
        >
          Send another message
        </a>
        <a
          href="/"
          class="inline-flex items-center justify-center rounded-md border border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 dark:border-green-500 dark:text-green-200 dark:hover:bg-green-900/40"
        >
          Back to main page
        </a>
      </div>
    </div>
  {:else}
    <div class="relative">
      {#if isSubmitting}
        <div class="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50/95 p-8 shadow-lg dark:border-blue-900/60 dark:bg-blue-900/40" role="status" aria-live="polite">
          <div class="flex items-start gap-4">
            <span class="mt-1 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent dark:border-blue-300"></span>
            <div>
              <p class="text-lg font-semibold text-blue-900 dark:text-blue-100">Sending your message…</p>
              <p class="mt-1 text-sm text-blue-800/80 dark:text-blue-200/80">
                This can take a few seconds. Please keep this tab open.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <form
        method="POST"
        action="/contact"
        use:enhance={handleEnhance}
        aria-busy={isSubmitting}
        class="space-y-6 rounded-lg bg-white p-8 shadow-lg transition-colors duration-300 dark:bg-gray-800"
        class:opacity-60={isSubmitting}
        class:pointer-events-none={isSubmitting}
      >
      <div>
        <label for="name" class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Nick"
          bind:value={name}
          required
          class="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
          class="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
            class="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
            class="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
            class="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
          placeholder="Example: I just wanted to say Hi Nick!"
          required
          class="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        ></textarea>
      </div>

      <input type="text" name="subject" class="hidden" />

      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full rounded-md bg-blue-600 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {#if isSubmitting}Sending…{:else}Send Message{/if}
      </button>
      </form>
    </div>

    {#if formResult.error}
      <div class="mt-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200" role="alert">
        <p class="text-sm font-medium">{formResult.error}</p>
      </div>
    {/if}
  {/if}
</div>
