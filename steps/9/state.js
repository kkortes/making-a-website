export default {
  pages: [
    { href: '/', title: 'Home' },
    { href: '/about-me', title: 'About me' },
  ],
  projects: [
    { title: 'Vibe', text: 'A runtime-first reactive framework for building UI frontends.', href: 'https://vibe.korte.kim', label: 'vibe.korte.kim' },
    { title: 'Stylecheat', text: 'A CSS component library that styles plain HTML through attributes and custom elements.', href: 'https://stylecheat.korte.kim', label: 'stylecheat.korte.kim' },
    { title: 'Making a website', text: 'This journey, from a single HTML file to a fully fledged website.', href: 'https://github.com/kkortes/making-a-website', label: 'github.com' },
  ],
  reading: [
    { href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules', title: 'JavaScript modules', source: 'MDN' },
    { href: 'https://vibe.korte.kim/tutorial/dynamic-html.html', title: 'Dynamic HTML', source: 'Vibe' },
    { href: 'https://vibe.korte.kim/tutorial/bind-element.html', title: 'Bind Element', source: 'Vibe' },
  ],
  guest: { name: '', rating: 3 },
  guestbook: [
    { name: 'Jodie', rating: 5 },
  ],
}
