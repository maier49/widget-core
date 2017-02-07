import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import i18n, { invalidate, switchLocale, systemLocale } from '@dojo/i18n/i18n';
import * as sinon from 'sinon';
import i18nMixin, { I18nWidget, I18nProperties } from '../../../src/mixins/i18nMixin';
import { Widget, WidgetProperties } from './../../../src/interfaces';
import createWidgetBase from '../../../src/createWidgetBase';
import { w, isHNode, isWNode } from './../../../src/d';
import bundle from '../../support/nls/greetings';

const createLocalized = createWidgetBase.mixin(i18nMixin);
let localized: Widget<WidgetProperties & I18nProperties> & I18nWidget<any, I18nProperties>;

registerSuite({
	name: 'mixins/i18nMixin',

	afterEach() {
		return switchLocale(systemLocale).then(() => {
			invalidate();

			if (localized) {
				localized.destroy();
				localized = <any> null;
			}
		});
	},

	api() {
		const localized = createLocalized();
		assert(localized);
		assert.isFunction(localized.localizeBundle);
	},

	'.localizeBundle()': {
		'Returns default messages when locale bundle not loaded'() {
			return switchLocale('fr').then(() => {
				localized = createLocalized();
				const messages = localized.localizeBundle(bundle);

				assert.strictEqual(messages.hello, 'Hello');
				assert.strictEqual(messages.goodbye, 'Goodbye');
			});
		},

		'test out API by itself'() {
			const thinger = createLocalized();
			thinger.localizeBundle(bundle);
			const local = thinger.properties.locale;
			assert.isUndefined(local, 'Should be defined');
		},

		'Uses `properties.locale` when available'() {
			localized = createLocalized({
				properties: {
					locale: 'fr'
				}
			});
			return i18n(bundle, 'fr').then(() => {
				const messages = localized.localizeBundle(bundle);
				assert.strictEqual(messages.hello, 'Bonjour');
				assert.strictEqual(messages.goodbye, 'Au revoir');
			});
		},

		'Uses default locale when no locale is set'() {
			return switchLocale('fr').then(() => {
				localized = createLocalized();
				return i18n(bundle, 'fr').then(() => {
					const messages = localized.localizeBundle(bundle);
					assert.strictEqual(messages.hello, 'Bonjour');
					assert.strictEqual(messages.goodbye, 'Au revoir');
				});
			});
		},

		'Returns an object with a `format` method'() {
			localized = createLocalized();
			let messages = localized.localizeBundle(bundle);

			assert.isFunction(messages.format);
			assert.strictEqual(messages.format('welcome', { name: 'Bill' }), 'Welcome, Bill!');

			return switchLocale('fr').then(() => {
				return i18n(bundle, 'fr');
			}).then(() => {
				messages = localized.localizeBundle(bundle);
				assert.strictEqual(messages.format('welcome', { name: 'Jean' }), 'Bienvenue, Jean!');
			});
		}
	},

	'root locale switching': {
		'Updates when no `locale` property is set'() {
			localized = createLocalized();
			sinon.spy(localized, 'invalidate');

			return switchLocale('fr').then(() => {
				assert.isTrue((<any> localized).invalidate.called, 'Widget invalidated.');
			});
		},

		'Does not update when `locale` property is set'() {
			localized = createLocalized({
				properties: {
					locale: 'en'
				}
			});
			sinon.spy(localized, 'invalidate');

			return switchLocale('fr').then(() => {
				assert.isFalse((<any> localized).invalidate.called, 'Widget not invalidated.');
			});
		}
	},
	'does not decorate properties for wNode'() {
		const createExtendedLocalized = createLocalized.override({
			render() {
				return w(createLocalized, {});
			}
		});

		localized = createExtendedLocalized({
			properties: { locale: 'ar-JO' }
		});

		const result = localized.render();
		assert.isOk(result);
		assert.isTrue(isWNode(result));
		if (isWNode(result)) {
			assert.isUndefined(result.properties['data-locale']);
		}
	},
	'`properties.locale` updates the widget node\'s `data-locale` property': {
		'when non-empty'() {
			localized = createLocalized({
				properties: { locale: 'ar-JO' }
			});

			const result = localized.render();
			assert.isOk(result);
			assert.isTrue(isHNode(result));
			if (isHNode(result)) {
				assert.strictEqual(result.properties['data-locale'], 'ar-JO');
			}
		},

		'when empty'() {
			localized = createLocalized();

			const result = localized.render();
			assert.isOk(result);
			assert.isTrue(isHNode(result));
			if (isHNode(result)) {
				assert.isNull(result.properties['data-locale']);
			}
		}
	},

	'`properties.rtl`': {
		'The `dir` attribute is "rtl" when true'() {
			localized = createLocalized({
				properties: { rtl: true }
			});

			const result = localized.render();
			assert.isOk(result);
			assert.isTrue(isHNode(result));
			if (isHNode(result)) {
				assert.strictEqual(result.properties['dir'], 'rtl');
			}
		},

		'The `dir` attribute is "ltr" when false'() {
			localized = createLocalized({
				properties: { rtl: false }
			});

			const result = localized.render();
			assert.isOk(result);
			assert.isTrue(isHNode(result));
			if (isHNode(result)) {
				assert.strictEqual(result.properties['dir'], 'ltr');
			}
		},

		'The `dir` attribute is not set when not a boolean.'() {
			localized = createLocalized();

			const result = localized.render();
			assert.isOk(result);
			assert.isTrue(isHNode(result));
			if (isHNode(result)) {
				assert.isNull(result.properties['dir']);
			}
		}
	}
});
