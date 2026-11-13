// External script bundle for Swagger UI initialization
// Eliminates inline <script> blocks to satisfy strict Content Security Policy (CSP)
window.addEventListener('DOMContentLoaded', () => {
    if (typeof SwaggerUIBundle !== 'undefined') {
        window.ui = SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            layout: 'BaseLayout',
            deepLinking: true,
            showExtensions: true,
            showCommonExtensions: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
        });
    }
});

