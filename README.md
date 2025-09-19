# MCBE Tools

## Skin Finder

A small tool to look up Minecraft Bedrock player skins using the GeyserMC API and download them as PNG or as a Bedrock-compatible `.mcpack` skin pack.

### Features
- Lookup player skins (uses GeyserMC + `textures.minecraft.net`)
- Download skin PNG
- Generate a `.mcpack` (skin pack) in the browser that can be imported into Minecraft Bedrock

### Live demo
https://procopio28.github.io/MCBETools/

### How it works
The site fetches player skin info from the GeyserMC API, pulls the texture from `textures.minecraft.net`, then builds a small skin pack client-side (manifest, skins.json, language file, and the skin PNG) and zips it as a `.mcpack` for download.

### License
MIT