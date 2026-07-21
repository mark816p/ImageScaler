import { pipeline, env, RawImage } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineSingleton {
    static task = 'image-to-image';
    static model = 'Xenova/swin2SR-classical-sr-x2-64';
    static instance: any = null;

    static async getInstance(progress_callback?: Function) {
        if (this.instance === null) {
            this.instance = pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { action, imageUrl } = event.data;
    if (action !== 'upscale') return;

    try {
        // Post back loading state
        self.postMessage({ status: 'loading' });

        const upscaler = await PipelineSingleton.getInstance((info: any) => {
            if (info.status === 'progress') {
                self.postMessage({ status: 'progress', progress: info.progress });
            }
        });

        self.postMessage({ status: 'processing' });
        
        // Ensure image is loaded properly
        const image = await RawImage.fromURL(imageUrl);

        // Run inference
        const result = await upscaler(image);

        let outImage = result;
        if (Array.isArray(result)) outImage = result[0];

        // Instead of returning blob directly which might fail or be slow, we return the RawImage data
        // which can be drawn to a canvas on the main thread.
        self.postMessage({
            status: 'complete',
            result: {
                data: outImage.data,
                width: outImage.width,
                height: outImage.height,
            }
        });
    } catch (error: any) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
