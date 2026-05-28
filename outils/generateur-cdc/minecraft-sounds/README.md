# Minecraft Sounds

Place tes fichiers `.ogg` Minecraft dans ce dossier pour permettre l'ecoute locale hors ligne.

Convention recommandee :
- utilise le nom de l'evenement Minecraft comme chemin de fichier
- remplace les `.` par des `/`

Exemples :
- `entity.player.levelup` -> `minecraft-sounds/entity/player/levelup.ogg`
- `block.chest.open` -> `minecraft-sounds/block/chest/open.ogg`
- `ui.button.click` -> `minecraft-sounds/ui/button/click.ogg`

Le generateur essaie d'abord de lire les sons depuis ce dossier.
Si le fichier n'existe pas localement, il tente ensuite une source en ligne si disponible.
