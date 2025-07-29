import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
	html: {
		template: './src/index.html'
	},	
	plugins: [pluginReact()],
	
    source: {
        entry: {
            index: './src/main.js'
        },
        tsconfigPath: './tsconfig.app.json',
        // Environment variables support
        define: {
            'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3001/api'),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }
    },
    server: {
        port: 4200
    },
    output: {
		copy: [
		{ from: './src/favicon.ico' },
		{ from: './src/assets' }],
	
        target: 'web',
        distPath: {
            root: 'dist',
        },
    }
});
