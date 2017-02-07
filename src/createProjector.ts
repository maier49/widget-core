import { ComposeFactory } from '@dojo/compose/compose';
import createWidgetBase from './createWidgetBase';
import projectorMixin, { Projector, ProjectorOptions } from './mixins/projectorMixin';

export interface ProjectorFactory extends ComposeFactory<Projector, ProjectorOptions> { }

/**
 * Projector Factory
 */
const createProjector: ProjectorFactory = createWidgetBase
	.mixin(projectorMixin);

export default createProjector;

export * from './mixins/projectorMixin';
