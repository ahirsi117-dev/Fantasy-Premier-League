import {Composition} from 'remotion';
import {Clasico, CLASICO_TOTAL} from './Clasico';
import {FPS} from './kit/theme';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="Clasico" component={Clasico} durationInFrames={CLASICO_TOTAL} fps={FPS} width={1080} height={1920} />
	</>
);
