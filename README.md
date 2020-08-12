# Arithmerace

This is the [original Arithmerace prototype](https://alpha.arithmerace.com/), created for the Congressional App Challenge 2020. It's no longer in development. The latest version can be found at [arithmerace.com](https://arithmerace.com/)

This project provides an example of a simple online multiplayer game that uses Firebase functions, realtime database, hosting, and authentication. The front end uses Vue, Nuxt.js, Buefy, and Pixi.js for the game. 

I realized that in order to create the best user experience for Arithmerace, I needed to recreate Arithmerace from scratch using our own implementation of Node.js, websockets, and a database such as MongoDB, as well as custom CSS and a better game on the frontend. That production version will be published at [arithmerace.com](https://arithmerace.com/). But I decided to open-source my first prototype here, just in case it's useful for anyone :smile:. And you can find it live at [arithmerace.web.app](https://alpha.arithmerace.com/)

## Random stuff

### How to create a new robot
1. Design 50x80 pixel robot in Piskel
2. (Names EVERYWHERE must be the same)
3. Save robot, export as pixi.js movie export
4. unzip, rename to spritesheet.json and spritesheet.png
5. Export first frame as PNG, rename to thumbnail.PNG
6. Put all three files in a folder NAMED THE SAME AS THE ROBOT in static/robotassets
7. Add entry to robots in assets/robotList.json and cloud_functions/api/robotList.json.
8. Modify spritesheet.json: add animations list with name of robot; change image in meta section to spritesheet.png.
