release: pnpm install && pnpm run build
web: gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 api.app:app
