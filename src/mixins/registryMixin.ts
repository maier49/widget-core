import WeakMap from '@dojo/shim/WeakMap';
import { includes } from '@dojo/shim/array';
import { PropertiesChangeEvent, PropertyChangeRecord, WidgetProperties } from './../interfaces';
import { Evented } from '@dojo/interfaces/bases';
import eventedMixin from '@dojo/compose/bases/eventedMixin';
import compose from '@dojo/compose/compose';
import FactoryRegistry from '../FactoryRegistry';
import createWidget from '../createWidgetBase';
/* tslint:disable */
import { ComposeCreatedMixin } from '@dojo/compose/compose';
import { Destroyable } from '@dojo/interfaces/bases';
import { WidgetMixin, WidgetOverloads } from '../interfaces';
/* tslint:enable */

/**
 * Properties required for the RegistryMixin
 */
export interface RegistryMixinProperties extends WidgetProperties {
	// TODO - Had to make this optional, seems like it should be anyways
	registry?: FactoryRegistry;
}

/**
 * RegistryMixin
 */
export interface RegistryMixin extends Evented {
	diffPropertyRegistry(previousProperty: FactoryRegistry, property: FactoryRegistry): PropertyChangeRecord;
}

/**
 * Registry
 */
export interface Registry extends RegistryMixin {
	readonly registry?: FactoryRegistry;
	readonly properties: RegistryMixinProperties;
}

const internalRegistryMap = new WeakMap<Registry, FactoryRegistry>();

const registryMixin = compose.createMixin(createWidget)
	.extend('RegistryMixin', {
		diffPropertyRegistry(this: Registry, previousValue: FactoryRegistry, value: FactoryRegistry): PropertyChangeRecord {
			return {
				changed: previousValue !== value,
				value: value
			};
		},
		get registry(this: Registry): FactoryRegistry {
			return internalRegistryMap.get(this);
		}
	})
	.mixin(eventedMixin)
	.init((instance) => {
		instance.own(instance.on('properties:changed', (evt: PropertiesChangeEvent<RegistryMixin, RegistryMixinProperties>) => {
			if (includes(evt.changedPropertyKeys, 'registry')) {
				internalRegistryMap.set(instance, evt.properties.registry);
			}
		}));
		const { properties: { registry } } = instance;
		if (registry) {
			internalRegistryMap.set(instance, registry);
		}
	});

export default registryMixin;
