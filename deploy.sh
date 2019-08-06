# Build project and copy to functions dir for SSR
npm --prefix src run build
rm -rf functions/nuxt
cp -r src/.nuxt/ functions/nuxt/
cp src/nuxt.config.js functions/

# Move built assets into public directory for hosting
rm -rf public/*
mkdir -p public/_nuxt
cp -r src/.nuxt/dist/client/. public/_nuxt
cp -a src/static/. public/

# Deploy
firebase deploy

