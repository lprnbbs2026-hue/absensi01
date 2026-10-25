# Absensi ZIP

A static PWA for viewing attendance reports by month and year.

## Run locally

From this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publish online

This project is ready to be hosted as a static website. For GitHub Pages, enable Pages in the repository settings and use the workflow in `.github/workflows/pages.yml`.

A typical deployment flow is:

1. Push the project to a GitHub repository.
2. In GitHub, open Settings → Pages.
3. Select the `GitHub Actions` source.
4. Push to the `main` branch to trigger the deployment.

The site will be available at:

```text
https://<username>.github.io/<repository-name>/
```

It also works on Netlify, Vercel, or any static hosting provider.
