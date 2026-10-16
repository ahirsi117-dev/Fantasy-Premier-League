import {Composition} from 'remotion';
import {Clasico, CLASICO_TOTAL} from './Clasico';
import {ClasicoCine, CINE_TOTAL} from './ClasicoCine';
import {FPS} from './kit/theme';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="ClasicoCine" component={ClasicoCine} durationInFrames={CINE_TOTAL} fps={FPS} width={1080} height={1920} />
		<Composition id="Clasico" component={Clasico} durationInFrames={CLASICO_TOTAL} fps={FPS} width={1080} height={1920} />
	</>
);
