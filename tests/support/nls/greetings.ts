import has from '@dojo/has/has';

// The default loader attempts to use the native Node.js `require` when running on Node. However, the Intern
// suite uses the @dojo/loader, in which case the context for requires is the location of the loader module; or in
// this case, `node_modules/@dojo/loader/loader.min.js'.
const hasHostNode = has('host-node');
const pathSeparator = hasHostNode ? require('path').sep : '/';
const basePath =  hasHostNode ? `..${pathSeparator}..${pathSeparator}_build${pathSeparator}` : '';
const bundlePath = `${basePath}tests${pathSeparator}support${pathSeparator}nls${pathSeparator}greetings`;
const locales = [ 'fr' ];

const messages = {
	hello: 'Hello',
	goodbye: 'Goodbye',
	welcome: 'Welcome, {name}!'
};

export default { bundlePath, locales, messages };
