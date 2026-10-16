import {Composition} from 'remotion';
import {Demo, DEMO_TOTAL} from './Demo';
import {GW7, GW7_TOTAL} from './GW7';
import {FPS} from './kit/theme';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="GW7" component={GW7} durationInFrames={GW7_TOTAL} fps={FPS} width={1080} height={1920} />
		<Composition id="Demo" component={Demo} durationInFrames={DEMO_TOTAL} fps={FPS} width={1080} height={1920} />
	</>
);
