# ImageScaler

ImageScaler is a privacy-first, locally-running AI image upscaler built for the web.

## Features
- **Local Execution:** Uses Transformers.js to run the Swin2SR AI model directly inside your browser. Your images never leave your device.
- **Modern UI:** Clean, responsive design mimicking high-end native apps with light and dark mode support.
- **Privacy First:** 100% offline-capable (after initial model load), zero uploads.

## Usage
Simply drag and drop your image, wait for the AI model to load (only takes a moment on the first run), and download your 2x upscaled result.

## Development
To run this locally, you can use any standard static web server.
```bash
python -m http.server
```
or
```bash
npx serve .
```

## Credits
- Built with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by [Transformers.js](https://huggingface.co/docs/transformers.js/) and `Xenova/swin2SR-classical-sr-x2-64`
