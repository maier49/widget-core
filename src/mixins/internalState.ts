import { State, Stateful, StatefulOptions } from '@dojo/interfaces/bases';
import statefulMixin from '@dojo/compose/bases/statefulMixin';
import compose, { ComposeCreatedMixin } from '@dojo/compose/compose';
import createWidget from '../createWidgetBase';

export interface InternalStateMixin extends ComposeCreatedMixin<{}, Stateful<State>, StatefulOptions<State>, {}> {}

const internalStateMixin: InternalStateMixin = compose.createMixin(createWidget)
	.mixin(statefulMixin)
	.init(
		(instance) => {
			instance.own(instance.on('state:changed', () => {
				instance.invalidate();
			}));
		}
	);

export default internalStateMixin;
