import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'WS Chat',
        short_name: 'WSChat',
        description: 'A production-ready real-time chat application',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/globe.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
            {
                src: '/window.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            }
        ],
    }
}
