# MCBE Tools – Skin Finder

This project provides a Minecraft Bedrock Edition skin finder using the [GeyserMC API](https://geysermc.org/).  
It fetches player skin data from `minecraft.net` and allows exporting the skin as a **.mcpack** (Bedrock-compatible skin pack).

## Features
- Look up Minecraft Bedrock player skins using the GeyserMC API.
- Fetch the actual skin texture from `minecraft.net`.
- Download the skin as a `.mcpack` file (works in Minecraft Bedrock).

## How It Works
1. Enter a valid Minecraft username/UUID.  
2. The site queries the GeyserMC API to fetch skin data.  
3. The skin texture is retrieved from Minecraft.net.  
4. A `.mcpack` is generated in the browser (via [JSZip](https://stuk.github.io/jszip/)) and downloaded.

## Live Demo
👉 [MCBE Tools – Skin Finder](https://procopio28.github.io/MCBETools/)

## Status
- ✅ Skin fetching works.  
- 🚧 `.mcpack` export in progress.  

## License
This project is open source under the MIT License.