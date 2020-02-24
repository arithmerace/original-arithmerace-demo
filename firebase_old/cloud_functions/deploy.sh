# Build project and copy to functions dir for SSR
npm --prefix src run build
rm -rf cloud_functions/nuxt
cp -r src/.nuxt/ cloud_functions/nuxt/
cp src/nuxt.config.js cloud_functions/

# Move built assets into public directory for hosting
rm -rf public/*
mkdir -p public/_nuxt
cp -r src/.nuxt/dist/client/. public/_nuxt
cp -a src/static/. public/

# Deploy
firebase deploy

