// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://luisfelipepoma.github.io',
	output: 'static',
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger', 'three'] },
	},
	devToolbar: { enabled: false },
	trailingSlash: 'always',
	i18n: {
		defaultLocale: 'es',
		locales: ['es', 'en'],
		routing: { prefixDefaultLocale: false }
	}
});
