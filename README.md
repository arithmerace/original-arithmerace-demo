# Arithmerace

This is the original Arithmerace prototype (created for the Congressional App Challenge 2020). The latest version can be found at [arithmerace.com](https://arithmerace.com/)


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
