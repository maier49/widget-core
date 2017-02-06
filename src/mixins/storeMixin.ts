import { Handle } from '@dojo/interfaces/core';
import { ObservablePatchableStore } from '@dojo/interfaces/abilities';
import WeakMap from '@dojo/shim/WeakMap';
import { includes } from '@dojo/shim/array';
import Observable from '@dojo/core/Observable';
import { assign } from '@dojo/core/lang';
import { PropertiesChangeEvent } from './../interfaces';
import { State, StatefulMixin } from '@dojo/interfaces/bases';
import eventedMixin from '@dojo/compose/bases/eventedMixin';
import compose from '@dojo/compose/compose';
import createWidget from '../createWidgetBase';
/* tslint:disable */
import { ComposeCreatedMixin } from '@dojo/compose/compose';
import { Destroyable, Evented } from '@dojo/interfaces/bases';
import { WidgetMixin, WidgetOverloads, WidgetProperties } from '../interfaces';
/* tslint:enable */

export type ExtendedObservablePatchableStore<S extends State> = ObservablePatchableStore<S> & {
	/**
	 * A method that allows the return of an `Observable` interface for the store
	 */
	observe(): Observable<State>;
	/**
	 * fetch all the items
	 */
	fetch(): Promise<State[]>;
}

/**
 * Properties required for the store state mixin
 */
export interface StoreMixinProperties {
	id?: string;
	// TODO - had to make this optional, seems like it should be anyways
	store?: ExtendedObservablePatchableStore<State>;
}

/**
 * Store Mixin
 */
export interface StoreMixinApi extends StatefulMixin<State> {
	/**
	 * Observe the state using the id and stateFrom in the instances properties
	 */
	observe(): void;
}

/**
 * Store
 */
export interface StoreMixin extends StoreMixinApi {
	readonly properties: StoreMixinProperties;
}

/**
 * internal state for the `StoreMixin`
 */
interface InternalState {
	id?: string;
	handle: Handle;
}

/**
 * Private map for store mixin.
 */
const internalStateMap = new WeakMap<StoreMixinApi, InternalState>();

const stateMap = new WeakMap<StoreMixin, { state: State }>();

/**
 * state changed event type
 */
const stateChangedEventType = 'state:changed';

function replaceState(instance: StoreMixin, state: State) {
	const internalState = stateMap.get(instance);
	internalState.state = state;
	const eventObject = {
		type: stateChangedEventType,
		state,
		target: instance
	};
	instance.emit(eventObject);
}

function onPropertiesChanged(instance: StoreMixin, properties: StoreMixinProperties, changedPropertyKeys: string[]) {
	const internalState = internalStateMap.get(instance);
	if (internalState) {
		if (includes(changedPropertyKeys, 'store') || includes(changedPropertyKeys, 'id')) {
			internalState.handle.destroy();
		}
	}
	instance.observe();
}

/**
 * Store Mixin Factory
 */
const storeMixin = compose.createMixin(createWidget)
	.mixin(eventedMixin)
	.extend('StoreMixin', {
		get state(this: StoreMixin) {
			return stateMap.get(this).state;
		},
		observe(this: StoreMixin): void {
			const internalState = internalStateMap.get(this);
			const { properties: { id, store } } = this;
			if (!store) {
				throw new Error('store is required to observe state');
			}

			if (internalState) {
				if (internalState.id === id) {
					return;
				}
				throw new Error('Unable to observe state for a different id');
			}

			const observer = id ? store.observe(id) : store.observe();
			const subscription = observer.subscribe(
				(state) => {
					replaceState(this, state['afterAll'] ? { data: state['afterAll'] } : state);
				},
				(err) => {
					throw err;
				}
			);

			const handle = {
				destroy: () => {
					subscription.unsubscribe();
					internalStateMap.delete(this);
				}
			};
			internalStateMap.set(this, { id, handle });
			this.own(handle);
		},
		setState(this: StoreMixin, newState: Partial<State>): void {
			const { properties: { store, id } } = this;
			if (!store) {
				throw new Error('store is required to set state');
			}

			if (id || newState['id']) {
				store.patch(assign( { id }, newState))
					.then(() => id ? store.get(id) : store.fetch())
					.then((state: State) => {
						replaceState(this, state);
					});
			}
			else {
				throw new Error('Unable to set state without a specified `id`');
			}

		}
	})
	.init((instance) => {
		instance.own(instance.on('properties:changed', (evt: PropertiesChangeEvent<StoreMixin, StoreMixinProperties>) => {
			onPropertiesChanged(instance, evt.properties, evt.changedPropertyKeys);
		}));
		instance.own(instance.on(stateChangedEventType, () => {
			instance.invalidate();
		}));
		stateMap.set(instance, { state: Object.create(null) });
		instance.observe();
	});

export default storeMixin;
